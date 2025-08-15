import { fetchWithLimits } from '../utils/http.js';
import { XMLParser } from 'fast-xml-parser';

export async function wikiSearch(q: string, lang = 'vi', top = 5) {
  const url = `https://${lang}.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(q)}&limit=${top}`;
  const res = await fetchWithLimits(url, 8000, 1024*1024);
  if (!res.body) return [];
  const data = JSON.parse(res.body.toString('utf-8'));
  return (data.pages || []).map((p: any) => ({
    title: p.title,
    url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.key)}`,
    snippet: p.description || '',
    source: 'wikipedia'
  }));
}

export async function wikiGet(title: string, lang = 'vi') {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetchWithLimits(url, 8000, 1024*1024);
  if (!res.body) return null;
  const data = JSON.parse(res.body.toString('utf-8'));
  return {
    title: data.title,
    url: data.content_urls?.desktop?.page || data.canonical || '',
    abstract: data.extract || '',
    source: 'wikipedia',
    updatedAt: data.timestamp || new Date().toISOString()
  };
}

export async function crossrefSearch(q: string, top = 5) {
  const url = `https://api.crossref.org/works?query=${encodeURIComponent(q)}&rows=${top}`;
  const res = await fetchWithLimits(url, 8000, 1024*1024);
  if (!res.body) return [];
  const data = JSON.parse(res.body.toString('utf-8'));
  return (data.message.items || []).map((it: any) => ({
    title: (it.title && it.title[0]) || '',
    authors: (it.author || []).map((a:any) => [a.given, a.family].filter(Boolean).join(' ')),
    year: (it.created?.['date-parts']?.[0]?.[0]) || (it.issued?.['date-parts']?.[0]?.[0]) || '',
    doi: it.DOI || '',
    url: it.URL || '',
    source: 'crossref'
  }));
}

export async function arxivSearch(q: string, top = 5) {
  const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(q)}&start=0&max_results=${top}`;
  const res = await fetchWithLimits(url, 10000, 1024*1024);
  if (!res.body) return [];
  const xml = res.body.toString('utf-8');
  const parser = new XMLParser({ ignoreAttributes: false });
  const data: any = parser.parse(xml);
  const entries = Array.isArray(data.feed?.entry) ? data.feed.entry : (data.feed?.entry ? [data.feed.entry] : []);
  return entries.map((e: any) => {
    const id = (e.id || '').split('/abs/')[1] || e.id || '';
    const links = Array.isArray(e.link) ? e.link : [e.link];
    const pdf = links.find((l:any) => l['@_type'] === 'application/pdf')?.['@_href'] || '';
    return {
      title: (e.title || '').trim(),
      authors: (Array.isArray(e.author) ? e.author : [e.author]).map((a:any) => a.name),
      year: (e.published || '').slice(0,4),
      arxivId: id,
      pdfUrl: pdf,
      url: `https://arxiv.org/abs/${id}`,
      source: 'arxiv'
    };
  });
}

export async function schSearch(q: string, top = 5) {
  const [ax, cr, wiki] = await Promise.all([
    arxivSearch(q, top),
    crossrefSearch(q, top),
    wikiSearch(q, 'en', top)
  ]);
  return [...ax, ...cr, ...wiki].slice(0, top * 2);
}

export async function schGet(args: { doi?: string, arxivId?: string, url?: string }) {
  if (args.doi) {
    const url = `https://api.crossref.org/works/${encodeURIComponent(args.doi)}`;
    const res = await fetchWithLimits(url, 8000, 1024*1024);
    if (res.body) {
      const it = JSON.parse(res.body.toString('utf-8')).message;
      return {
        title: (it.title && it.title[0]) || '',
        authors: (it.author || []).map((a:any) => [a.given, a.family].filter(Boolean).join(' ')),
        year: (it.created?.['date-parts']?.[0]?.[0]) || '',
        doi: it.DOI || '',
        url: it.URL || '',
        abstract: (it.abstract || '').replace(/<[^>]+>/g, ''),
        source: 'crossref'
      };
    }
  }
  if (args.arxivId) {
    const items = await arxivSearch(`id:${args.arxivId}`, 1);
    return items[0] || null;
  }
  if (args.url) {
    const m = args.url.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
    if (m) return schGet({ doi: m[0] });
  }
  return null;
}
