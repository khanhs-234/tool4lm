# TOOL4LM — Multi-Tool MCP Server for Local LMs

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **All-in-one tools to supercharge your local or remote LLMs.**  
> Search smarter. Calculate faster. Summarize better.

**TOOL4LM** là một **MCP (Model Context Protocol) server** viết bằng **Node.js/TypeScript** giúp bổ sung công cụ cho các mô hình ngôn ngữ chạy cục bộ (LM Studio/Ollama/…): **web search**, **đọc & tóm tắt trang**, **tìm & đọc tài liệu nội bộ**, **tra cứu học thuật**, và **máy tính**. Không cần API key mặc định.

---

## ✨ Tính năng
- 🔎 **Web Search**: tìm nhiều nguồn (SearXNG + DuckDuckGo HTML), khử trùng lặp, trả về tiêu đề + URL + snippet.
- 🌐 **Web Fetch/Read**: tải trang có giới hạn kích thước/thời gian (chống SSRF) và trích văn bản “đọc được” để tóm tắt.
- 📂 **Doc Search/Read**: tìm & đọc tài liệu trong thư mục sandbox (txt/md/html/pdf). PDF dùng `pdf-parse` (lazy-load).
- 📚 **Scholar Search/Get**: tra cứu học thuật (arXiv + Crossref + Wikipedia) và lấy metadata theo DOI/arXivId.
- 🧮 **Calculator**: đánh giá biểu thức với `mathjs`, hỗ trợ `precision` (làm tròn).

---

## 🧰 Tool & tham số (tên chính ⇄ alias gạch dưới)

| Tool | Khi nào dùng | Tham số (shape) |
|---|---|---|
| `calc.eval` ⇄ `calc_eval` | Tính toán cục bộ | `{ expr: string, precision?: number }` |
| `web.search` ⇄ `web_search` | Tìm web đa engine | `{ q: string, max?: number, lang?: string, site?: string, engines?: string[], k?: number, limit?: number }` |
| `web.fetch` ⇄ `web_fetch` | Tải 1 URL (HTML/binary) | `{ url: string, timeout?: number, max_bytes?: number, headers?: Record<string,string> }` |
| `web.read` ⇄ `web_read` | Trích văn bản “đọc được” | `{ url: string, html?: string }` |
| `doc.find` ⇄ `doc_find` | Tìm trong thư mục sandbox | `{ q: string, top?: number, limit?: number }` |
| `doc.read` ⇄ `doc_read` | Đọc 1 file trong sandbox | `{ path: string }` |
| `index.build` ⇄ `index_build` | Build chỉ mục tài liệu | `{ root?: string }` |
| `sch.search` ⇄ `sch_search` | Tìm bài/paper/DOI | `{ q: string, top?: number, limit?: number }` |
| `sch.get` ⇄ `sch_get` | Lấy metadata paper | `{ doi?: string, arxivId?: string, url?: string }` |
| `wiki.search` ⇄ `wiki_search` | Tìm tiêu đề Wikipedia | `{ q: string, lang?: string }` |
| `wiki.get` ⇄ `wiki_get` | Lấy summary Wikipedia | `{ title: string, lang?: string }` |

> Đã bật **`openWorldHint`** nên nếu model lỡ thêm field lạ host vẫn chấp nhận; nhưng khuyến nghị dùng đúng tham số như bảng để ổn định.

---

## 🔧 Cài đặt & chạy
```bash
npm install
npm run build
npm start
```
Khi chạy thành công sẽ in:  
`[TOOL4LM] started. Sandbox: <đường_dẫn_sandbox>`

---

## ⚙️ Cấu hình MCP (LM Studio)
Thêm vào `mcp.json` của LM Studio:
```jsonc
{
  "mcpServers": {
    "TOOL4LM": {
      "command": "node",
      "args": ["--enable-source-maps", "C:/path/to/tool4lm/dist/server.js"],
      "type": "mcp",
      "env": {
        "SANDBOX_DIR": "C:/path/to/your_docs",
        "SEARXNG_ENDPOINTS": "https://searx.be/search,https://searx.tiekoetter.com/search",
        "ENGINE_ORDER": "searxng,duckduckgo",
        "LANG_DEFAULT": "vi",
        "REGION_DEFAULT": "vn",
        "MAX_FETCH_BYTES": "1048576",
        "FETCH_TIMEOUT_MS": "8000"
      }
    }
  }
}
```
> Trên Windows, nên dùng `/` trong JSON để tránh escape `\`.

---

## 📝 Ví dụ luồng sử dụng
**Tra cứu web có trích dẫn** → `web.search` → `web.fetch` → `web.read` → tóm tắt + đính kèm URL.  
**Tài liệu nội bộ** → `doc.find` → `doc.read` → tóm tắt + trích đoạn (ghi kèm `path`).  
**Học thuật** → `sch.search` → `sch.get` theo DOI/arXivId.  
**Tính toán** → `calc.eval` với `^`/`pow(a,b)` (hoặc đã normalize `**`).

---

## 🌍 Biến môi trường
- `SANDBOX_DIR` — thư mục tài liệu (mặc định: `./sandbox`).
- `SEARXNG_ENDPOINTS` — danh sách endpoint `/search` của SearXNG, cách nhau dấu phẩy.
- `ENGINE_ORDER` — ví dụ `searxng,duckduckgo`.
- `LANG_DEFAULT`, `REGION_DEFAULT` — gợi ý ngôn ngữ/khu vực khi tìm web.
- `MAX_FETCH_BYTES` — giới hạn dung lượng tải trang.
- `FETCH_TIMEOUT_MS` — timeout tải trang (ms).

---

## 🤝 Đóng góp
Issues/PRs rất hoan nghênh! Nếu thấy bug/đề xuất, mở issue giúp mình nhé.

---

## 📜 Giấy phép
[MIT](LICENSE)

---

## ☕ Ủng hộ

Nếu bạn thấy dự án hữu ích, có thể ủng hộ mình qua PayPal:

[![Donate with PayPal](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://www.paypal.com/paypalme/pooseart)

hoặc bấm nút bên dưới:

<a href="https://www.paypal.com/paypalme/pooseart" target="_blank">
  <img src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" alt="Donate via PayPal">
</a>
