import { fetchWithLimits } from '../utils/http.js';
import { load as cheerioLoad } from 'cheerio';
import { CONFIG } from '../config.js';

export interface SearchResult {
  title: string; url: string; snippet: string; source: string; rank: number;
}

function dedupeAndRank(all: SearchResult[], max: number): SearchResult[] {
  const seen = new Set<string>(); const out: SearchResult[] = [];
  for (const item of all) {
    const key = item.url.replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/$/,'').toLowerCase();
    if (seen.has(key)) continue; seen.add(key); out.push(item);
    if (out.length >= max) break;
  }
  return out.map((it, i) => ({ ...it, rank: i+1 }));
}

async function searchDuckDuckGo(query: string, lang?: string, site?: string, max = 10): Promise<SearchResult[]> {
  const q = encodeURIComponent((site ? `site:${site} ` : '') + query);
  const url = `https://html.duckduckgo.com/html/?q=${q}&kl=${lang || ''}`;
  const res = await fetchWithLimits(url, 8000, 512*1024);
  if (!res.body) return [];
  const html = res.body.toString('utf-8');
  const $ = cheerioLoad(html);
  const items: SearchResult[] = [];
  $('a.result__a').each((i, el) => {
    const a = $(el);
    const title = a.text().trim();
    const href = a.attr('href') || '';
    const snippet = a.closest('.result').find('.result__snippet').text().trim() || '';
    if (href && title) {
      items.push({ title, url: href, snippet, source: 'duckduckgo', rank: i+1 });
    }
  });
  return items.slice(0, max);
}

async function searchSearxng(query: string, lang?: string, site?: string, max = 10): Promise<SearchResult[]> {
  const endpoints = CONFIG.searxngEndpoints; if (!endpoints.length) return [];
  const q = (site ? `site:${site} ` : '') + query;
  const endpoint = endpoints[Math.floor(Math.random()*endpoints.length)];
  const url = `${endpoint}?q=${encodeURIComponent(q)}&format=json&language=${encodeURIComponent(lang || CONFIG.langDefault)}&safesearch=1`;
  const res = await fetchWithLimits(url, 8000, 1024*1024);
  if (!res.body) return [];
  try {
    const data = JSON.parse(res.body.toString('utf-8'));
    const results = data?.results || [];
    return results.slice(0, max).map((r: any, i: number) => ({
      title: r.title || r.pretty_url || r.url,
      url: r.url, snippet: r.content || r.snippet || '',
      source: 'searxng', rank: i+1
    }));
  } catch { return []; }
}

export async function webSearch(args: { q: string, max?: number, lang?: string, site?: string, engines?: string[] }): Promise<SearchResult[]> {
  const { q, max = 10, lang = CONFIG.langDefault, site, engines } = args;
  const order = (engines && engines.length ? engines : CONFIG.engineOrder).filter(Boolean);
  const tasks: Promise<SearchResult[]>[] = [];
  for (const eng of order) {
    if (eng === 'searxng') tasks.push(searchSearxng(q, lang, site, max));
    if (eng === 'duckduckgo') tasks.push(searchDuckDuckGo(q, lang, site, max));
  }
  const settled = await Promise.allSettled(tasks);
  const all: SearchResult[] = [];
  for (const s of settled) if (s.status === 'fulfilled') all.push(...s.value);
  if (!all.length) return [];
  return dedupeAndRank(all, max);
}
