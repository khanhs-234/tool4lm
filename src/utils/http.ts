import { request } from 'undici';
import dns from 'node:dns/promises';
import net from 'node:net';
import ipaddr from 'ipaddr.js';
import { CONFIG } from '../config.js';

const BLOCKEDv4 = ['127.0.0.0/8','10.0.0.0/8','172.16.0.0/12','192.168.0.0/16','169.254.0.0/16'];
const BLOCKEDv6 = ['::1/128','fc00::/7'];

function ipInRanges(ip: string, ranges: string[]) {
  try {
    const addr = ipaddr.parse(ip);
    return ranges.some(cidr => {
      const [range, lenStr] = cidr.split('/');
      const len = parseInt(lenStr, 10);
      return addr.kind() === ipaddr.parse(range).kind() && addr.match(ipaddr.parse(range), len);
    });
  } catch {
    return false;
  }
}

async function assertNotPrivate(url: URL) {
  const host = url.hostname;
  if (net.isIP(host)) {
    if (ipInRanges(host, BLOCKEDv4) || ipInRanges(host, BLOCKEDv6)) {
      throw new Error('Blocked private IP (SSRF)');
    }
    return;
  }
  const addrs = await dns.lookup(host, { all: true });
  for (const a of addrs) {
    if ((a.family === 4 && ipInRanges(a.address, BLOCKEDv4)) ||
        (a.family === 6 && ipInRanges(a.address, BLOCKEDv6))) {
      throw new Error('Blocked private IP (SSRF)');
    }
  }
}

export async function fetchWithLimits(urlStr: string, timeoutMs = CONFIG.fetchTimeoutMs, maxBytes = CONFIG.maxFetchBytes) {
  const u = new URL(urlStr);
  await assertNotPrivate(u);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await request(urlStr, {
      method: 'GET',
      headers: { 'user-agent': 'mcp-multitool/0.2', 'accept': '*/*' },
      signal: controller.signal,
      maxRedirections: 3
    });

    const status = res.statusCode;
    const headersRec: Record<string, string> = {};
    for (const [k, v] of Object.entries(res.headers)) {
      headersRec[k] = Array.isArray(v) ? v.join(', ') : String(v ?? '');
    }

    if (status >= 400) {
      return { status, headers: headersRec, body: null as any };
    }

    const chunks: Buffer[] = [];
    let total = 0;
    for await (const chunk of res.body) {
      const b: Buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as any);
      total += b.length;
      if (total > maxBytes) break;
      chunks.push(b);
    }
    const buf = Buffer.concat(chunks);
    const contentType = headersRec['content-type'] || 'application/octet-stream';
    const finalUrl = headersRec['content-location'] || urlStr;
    return { status, headers: headersRec, body: buf, finalUrl, contentType };
  } finally {
    clearTimeout(timer);
  }
}
