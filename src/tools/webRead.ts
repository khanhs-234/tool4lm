import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export function webRead(args: { url: string, html?: string }) {
  const { url, html } = args;
  const doc = new JSDOM(html || '', { url });
  const reader = new Readability(doc.window.document);
  const art = reader.parse();
  if (!art) return { title: '', byline: '', lang: '', text: '', wordCount: 0, links: [], meta: {} };
  const links: Array<{text: string, url: string}> = [];
  const anchorEls = doc.window.document.querySelectorAll('a[href]');
  anchorEls.forEach(a => {
    const href = (a as HTMLAnchorElement).href;
    const text = (a as HTMLElement).textContent?.trim() || '';
    if (href) links.push({ text, url: href });
  });
  const meta: Record<string,string> = {};
  const metas = doc.window.document.querySelectorAll('meta[name], meta[property]');
  metas.forEach((m:any) => {
    const key = m.getAttribute('name') || m.getAttribute('property');
    const val = m.getAttribute('content');
    if (key && val) meta[key] = val;
  });
  return {
    title: art.title || '', byline: art.byline || '',
    lang: (doc.window.document.documentElement.getAttribute('lang') || '').toLowerCase(),
    text: art.textContent || '', wordCount: (art.textContent || '').split(/\s+/).filter(Boolean).length,
    links, meta
  };
}
