import { fetchWithLimits } from '../utils/http.js';
import { CONFIG } from '../config.js';

export async function webFetch(url: string) {
  const res = await fetchWithLimits(url, CONFIG.fetchTimeoutMs, CONFIG.maxFetchBytes);
  if (!res || !res.body) {
    return {
      finalUrl: url, status: res?.status || 0,
      contentType: res?.contentType || 'application/octet-stream',
      bodyText: null, bytesB64: null, fetchedAt: new Date().toISOString()
    };
  }
  const ct = (res.contentType || '').toLowerCase();
  const isText = ct.startsWith('text/') || ct.includes('html') || ct.includes('xml') || ct.includes('json');
  return {
    finalUrl: res.finalUrl || url, status: res.status,
    contentType: res.contentType,
    bodyText: isText ? res.body.toString('utf-8') : null,
    bytesB64: isText ? null : res.body.toString('base64'),
    fetchedAt: new Date().toISOString()
  };
}
