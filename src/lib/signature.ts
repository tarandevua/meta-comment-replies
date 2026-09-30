import { createHmac, timingSafeEqual } from "node:crypto";
export function verifyMetaSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const a=Buffer.from(header), b=Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a,b);
}
