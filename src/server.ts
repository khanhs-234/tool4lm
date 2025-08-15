import pino from 'pino';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { CONFIG } from './config.js';
import { calcEval } from './tools/calc.js';
import { webSearch } from './tools/webSearch.js';
import { webFetch } from './tools/webFetch.js';
import { webRead } from './tools/webRead.js';
import { docFind, docRead, indexBuild } from './tools/doc.js';
import { schSearch, schGet, wikiSearch, wikiGet } from './tools/scholar.js';

const log = pino({ name: 'tool4lm', level: process.env.LOG_LEVEL || 'info' });

const server = new McpServer({ name: 'tool4lm', version: '0.2.6' });

const OPEN = { openWorldHint: true } as const;

// ===== calc.eval + alias =====
server.tool('calc.eval', 'Evaluate math expression (no external calls).',
  { expr: z.string(), precision: z.number().int().min(0).max(64).optional() },
  OPEN,
  async ({ expr, precision }) => {
    const res = await calcEval(expr, precision);
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);
server.tool('calc_eval', 'Alias of calc.eval',
  { expr: z.string(), precision: z.number().int().min(0).max(64).optional() },
  OPEN,
  async ({ expr, precision }) => {
    const res = await calcEval(expr, precision);
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);

// ===== web.search + alias =====
const webSearchShape = {
  q: z.string(),
  max: z.number().int().optional(),
  lang: z.string().optional(),
  site: z.string().optional(),
  engines: z.array(z.string()).optional(),
  // extra names model may invent
  k: z.number().int().optional(),
  limit: z.number().int().optional()
};
server.tool('web.search', 'Multi-engine web search (SearXNG + DuckDuckGo HTML).',
  webSearchShape, OPEN,
  async ({ q, max, lang, site, engines, k, limit }) => {
    const res = await webSearch({ q, max: max ?? k ?? limit, lang, site, engines });
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);
server.tool('web_search', 'Alias of web.search',
  webSearchShape, OPEN,
  async ({ q, max, lang, site, engines, k, limit }) => {
    const res = await webSearch({ q, max: max ?? k ?? limit, lang, site, engines });
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);

// ===== web.fetch + alias =====
const webFetchShape = {
  url: z.string().url(),
  timeout: z.number().int().optional(),
  max_bytes: z.number().int().optional(),
  headers: z.record(z.string()).optional()
};
server.tool('web.fetch', 'Fetch a URL with size/time limits and anti-SSRF.',
  webFetchShape, OPEN,
  async ({ url, timeout, max_bytes }) => {
    const res = await webFetch(url);
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);
server.tool('web_fetch', 'Alias of web.fetch',
  webFetchShape, OPEN,
  async ({ url, timeout, max_bytes }) => {
    const res = await webFetch(url);
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);

// ===== web.read + alias =====
const webReadShape = { url: z.string(), html: z.string().optional() };
server.tool('web.read', 'Extract readable content from given HTML (or pass html from web.fetch).',
  webReadShape, OPEN,
  async ({ url, html }) => {
    const res = webRead({ url, html });
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);
server.tool('web_read', 'Alias of web.read',
  webReadShape, OPEN,
  async ({ url, html }) => {
    const res = webRead({ url, html });
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);

// ===== doc.find + alias =====
const docFindShape = {
  q: z.string(),
  top: z.number().int().optional(),
  limit: z.number().int().optional()
};
server.tool('doc.find', 'Search local documents within sandbox directory. Builds index if missing.',
  docFindShape, OPEN,
  async ({ q, top, limit }) => {
    const res = await docFind(q, top ?? limit ?? 5);
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);
server.tool('doc_find', 'Alias of doc.find',
  docFindShape, OPEN,
  async ({ q, top, limit }) => {
    const res = await docFind(q, top ?? limit ?? 5);
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);

// ===== doc.read + alias =====
const docReadShape = { path: z.string() };
server.tool('doc.read', 'Read a file from sandbox directory (text or pdf).',
  docReadShape, OPEN,
  async ({ path }) => {
    const res = await docRead(path);
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);
server.tool('doc_read', 'Alias of doc.read',
  docReadShape, OPEN,
  async ({ path }) => {
    const res = await docRead(path);
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);

// ===== index.build + alias =====
const indexBuildShape = { root: z.string().optional() };
server.tool('index.build', 'Build MiniSearch index for documents in sandbox directory.',
  indexBuildShape, OPEN,
  async ({ root }) => {
    const res = await indexBuild(root);
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);
server.tool('index_build', 'Alias of index.build',
  indexBuildShape, OPEN,
  async ({ root }) => {
    const res = await indexBuild(root);
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);

// ===== sch.search + alias =====
const schSearchShape = { q: z.string(), top: z.number().int().optional(), limit: z.number().int().optional() };
server.tool('sch.search', 'Academic-first search (arXiv + Crossref + Wikipedia).',
  schSearchShape, OPEN,
  async ({ q, top, limit }) => {
    const res = await schSearch(q, top ?? limit ?? 5);
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);
server.tool('sch_search', 'Alias of sch.search',
  schSearchShape, OPEN,
  async ({ q, top, limit }) => {
    const res = await schSearch(q, top ?? limit ?? 5);
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);

// ===== sch.get + alias =====
const schGetShape = { doi: z.string().optional(), arxivId: z.string().optional(), url: z.string().optional() };
server.tool('sch.get', 'Get scholarly metadata by DOI/arXivId/URL.',
  schGetShape, OPEN,
  async ({ doi, arxivId, url }) => {
    const res = await schGet({ doi, arxivId, url });
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);
server.tool('sch_get', 'Alias of sch.get',
  schGetShape, OPEN,
  async ({ doi, arxivId, url }) => {
    const res = await schGet({ doi, arxivId, url });
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);

// ===== wiki.search + alias =====
const wikiSearchShape = { q: z.string(), lang: z.string().optional() };
server.tool('wiki.search', 'Wikipedia title search (public API).',
  wikiSearchShape, OPEN,
  async ({ q, lang }) => {
    const res = await wikiSearch(q, lang || 'vi');
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);
server.tool('wiki_search', 'Alias of wiki.search',
  wikiSearchShape, OPEN,
  async ({ q, lang }) => {
    const res = await wikiSearch(q, lang || 'vi');
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);

// ===== wiki.get + alias =====
const wikiGetShape = { title: z.string(), lang: z.string().optional() };
server.tool('wiki.get', 'Wikipedia summary by title.',
  wikiGetShape, OPEN,
  async ({ title, lang }) => {
    const res = await wikiGet(title, lang || 'vi');
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);
server.tool('wiki_get', 'Alias of wiki.get',
  wikiGetShape, OPEN,
  async ({ title, lang }) => {
    const res = await wikiGet(title, lang || 'vi');
    return { content: [{ type: 'text', text: JSON.stringify(res) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.log('[tool4lm] started. Sandbox:', CONFIG.sandboxDir);
