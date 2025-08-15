import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import MiniSearch from 'minisearch';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { CONFIG } from '../config.js';

let _pdfParse: any | null = null;
async function pdfParseLazy(buf: Buffer): Promise<{ text: string }> {
  try {
    if (!_pdfParse) {
      const mod = await import('pdf-parse');
      _pdfParse = (mod as any).default || (mod as any);
    }
    const out = await _pdfParse(buf);
    return { text: String(out.text || '') };
  } catch {
    return { text: '' };
  }
}


type DocRecord = { id: string, path: string, title: string, text: string };
const INDEX_PATH = path.resolve('.cache/index.json');

async function collectFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string) {
    const ents = await fs.readdir(dir, { withFileTypes: true });
    for (const e of ents) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (/(\.txt|\.md|\.html?|\.pdf)$/i.test(e.name)) out.push(p);
    }
  }
  await walk(root);
  return out;
}

async function fileToText(p: string): Promise<{ title: string, text: string }> {
  const buf = await fs.readFile(p);
  const name = path.basename(p);
  if (/\.pdf$/i.test(p)) {
    try { const parsed = await pdfParseLazy(buf as unknown as Buffer); return { title: name, text: parsed.text || '' }; }
    catch { return { title: name, text: '' }; }
  }
  const s = buf.toString('utf-8');
  if (/\.html?$/i.test(p)) {
    const dom = new JSDOM(s, { url: 'file://' + p });
    const reader = new Readability(dom.window.document);
    const art = reader.parse();
    return { title: art?.title || name, text: art?.textContent || dom.window.document.body.textContent || s };
  }
  return { title: name, text: s };
}

export async function indexBuild(root?: string) {
  const base = root ? path.resolve(root) : CONFIG.sandboxDir;
  const files = await collectFiles(base);
  const docs: DocRecord[] = [];
  for (const p of files) {
    const { title, text } = await fileToText(p);
    docs.push({ id: p, path: p, title, text });
  }
  const mini = new MiniSearch({
    fields: ['title','text'],
    storeFields: ['path','title'],
    searchOptions: { boost: { title: 2 } }
  });
  mini.addAll(docs);
  const payload = { docs, index: mini.toJSON() };
  await fs.mkdir(path.dirname(INDEX_PATH), { recursive: true }).catch(()=>{});
  await fs.writeFile(INDEX_PATH, JSON.stringify(payload));
  return { ok: true, indexed: docs.length };
}

function loadIndex() {
  if (!fssync.existsSync(INDEX_PATH)) return null;
  const payload = JSON.parse(fssync.readFileSync(INDEX_PATH, 'utf-8'));
  const mini = MiniSearch.loadJSON(payload.index, { fields: ['title','text'], storeFields: ['path','title'] });
  return { mini, docs: payload.docs as DocRecord[] };
}

export async function docFind(q: string, top = 5) {
  let idx = loadIndex();
  if (!idx) { await indexBuild(CONFIG.sandboxDir); idx = loadIndex(); }
  if (!idx) return [];
  const res = idx.mini.search(q, { prefix: true, fuzzy: 0.2, boost: { title: 2 } }).slice(0, top);
  return res.map((r: any) => {
    const doc = idx.docs.find(d => d.id === r.id)!;
    const text = doc.text || '';
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    const start = Math.max(0, i - 80);
    const end = Math.min(text.length, i + 80);
    const snippet = text.slice(start, end).replace(/\s+/g, ' ');
    return { path: doc.path, score: r.score, snippet };
  });
}

export async function docRead(p: string) {
  const full = path.resolve(p);
  if (!full.startsWith(CONFIG.sandboxDir)) throw new Error('Access outside sandbox is not allowed');
  const buf = await fs.readFile(full);
  let text = '';
  if (/\.pdf$/i.test(full)) {
    try { const parsed = await pdfParseLazy(buf as unknown as Buffer); text = parsed.text || ''; } catch { text = ''; }
  } else { text = buf.toString('utf-8'); }
  return { path: full, text };
}
