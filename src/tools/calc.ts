import { create, all } from 'mathjs';
const math = create(all, { number: 'number' });

// chuẩn hoá phép mũ: **, "mũ", "lũy thừa" -> ^
function normalizeExponent(s: string): string {
  let t = s;

  // Python style
  t = t.replace(/\*\*/g, '^');

  // "mũ", "mu" (viết không dấu), "lũy thừa"
  // ví dụ: "5 mũ 10" -> "5 ^ 10"
  t = t.replace(/\s*(m[ũu]|lu[ũu]y\s*thừa)\s*/gi, ' ^ ');

  // tuỳ chọn: gom nhiều khoảng trắng
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

export async function calcEval(expr: string, precision?: number) {
  try {
    const norm = normalizeExponent(expr);
    const res = math.evaluate(norm);
    let out = String(res);
    if (typeof res === 'number' && Number.isFinite(res) && typeof precision === 'number') {
      const p = Math.max(0, Math.min(precision, 20));
      out = res.toFixed(p);
    }
    return { ok: true, result: out };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'calc error' };
  }
}
