import path from 'node:path';

export const CONFIG = {
  engineOrder: (process.env.ENGINE_ORDER || 'searxng,duckduckgo')
    .split(',').map(s => s.trim()).filter(Boolean),
  searxngEndpoints: (process.env.SEARXNG_ENDPOINTS || '')
    .split(',').map(s => s.trim()).filter(Boolean),
  langDefault: process.env.LANG_DEFAULT || 'vi',
  regionDefault: process.env.REGION_DEFAULT || 'vn',
  sandboxDir: path.resolve(process.env.SANDBOX_DIR || path.resolve(process.cwd(), 'sandbox')),
  maxFetchBytes: Number(process.env.MAX_FETCH_BYTES || 5 * 1024 * 1024),
  fetchTimeoutMs: Number(process.env.FETCH_TIMEOUT_MS || 12000)
};
