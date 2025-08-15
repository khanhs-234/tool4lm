import { URL } from 'node:url';
export function normalizeUrl(u: string): string {
  try {
    const url = new URL(u);
    const host = url.host.replace(/^www\./i, '');
    let pathname = url.pathname || '/';
    if (pathname !== '/' && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
    return `${url.protocol}//${host}${pathname}${url.search ? url.search : ''}`;
  } catch {
    return u;
  }
}
