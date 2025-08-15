# TOOL4LM — MCP server for local LMs

All-in-one **Model Context Protocol** server to power local models (Qwen, Llama, …) with:
- Web search (SearXNG + DuckDuckGo HTML)
- Page fetch (size/time limits + anti-SSRF)
- Readable extraction (Readability)
- Local doc search+read (txt/md/html/pdf via MiniSearch + lazy `pdf-parse`)
- Scholar search (arXiv + Crossref + Wikipedia)
- Calculator (mathjs) with optional `precision`

No API keys required by default.

## Install / Run (dev)
```bash
npm i
npm run build
npm start
```

## Install globally (dev link)
```bash
npm run build
npm link
tool4lm
```

> Once published to npm, you can run: `npx tool4lm`

## Environment
- `SANDBOX_DIR` — dir for local docs (default: `./sandbox`)
- `SEARXNG_ENDPOINTS` — comma list of `/search` endpoints
- `ENGINE_ORDER` — e.g. `searxng,duckduckgo`
- `LANG_DEFAULT`, `REGION_DEFAULT`
- `MAX_FETCH_BYTES`, `FETCH_TIMEOUT_MS`

## LM Studio mcp.json
```json
{
  "mcpServers": {
    "tool4lm": {
      "command": "node",
      "args": ["--enable-source-maps", "C:/path/to/tool4lm/dist/server.js"],
      "type": "mcp",
      "env": {
        "SEARXNG_ENDPOINTS": "https://searx.be/search,https://searx.tiekoetter.com/search",
        "ENGINE_ORDER": "searxng,duckduckgo",
        "LANG_DEFAULT": "vi",
        "REGION_DEFAULT": "vn",
        "SANDBOX_DIR": "C:/path/to/my_docs"
      }
    }
  }
}
```

## Tools
See `TOOLS.md` for full list & schemas.

## License
MIT © 2025
