# Tool Reference

This document describes each tool, parameters (shape), and typical usage.
(Identical to what was provided in chat.)

## calc.eval (alias: calc_eval)
- input: { expr: string, precision?: number }
- output: { ok: boolean, result?: string, error?: string }

## web.search (alias: web_search)
- input: { q: string, max?: number, lang?: string, site?: string, engines?: string[], k?: number, limit?: number }
- output: SearchResult[]

## web.fetch (alias: web_fetch)
- input: { url: string, timeout?: number, max_bytes?: number, headers?: Record<string,string> }
- output: { finalUrl, status, contentType, bodyText|null, bytesB64|null, fetchedAt }

## web.read (alias: web_read)
- input: { url: string, html?: string }
- output: { title, byline, lang, text, wordCount, links[], meta }

## doc.find (alias: doc_find)
- input: { q: string, top?: number, limit?: number }
- output: { path, score, snippet }[]

## doc.read (alias: doc_read)
- input: { path: string }
- output: { path, text }

## index.build (alias: index_build)
- input: { root?: string }
- output: { ok: true, indexed: number }

## sch.search (alias: sch_search)
- input: { q: string, top?: number, limit?: number }
- output: mixed array of arXiv/Crossref/Wikipedia records

## sch.get (alias: sch_get)
- input: { doi?: string, arxivId?: string, url?: string }
- output: metadata record

## wiki.search (alias: wiki_search)
- input: { q: string, lang?: string }
- output: { title, url, snippet, source: 'wikipedia' }[]

## wiki.get (alias: wiki_get)
- input: { title: string, lang?: string }
- output: { title, url, abstract, source: 'wikipedia', updatedAt }
