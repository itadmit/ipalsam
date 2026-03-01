import { createHmac, randomBytes } from "crypto";

const SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";
const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

export function createRequestToken(userId: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${userId}:${exp}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 16);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyRequestToken(token: string): { userId: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [userId, expStr, sig] = decoded.split(":");
    if (!userId || !expStr || !sig) return null;
    const exp = parseInt(expStr, 10);
    if (Date.now() > exp) return null;
    const payload = `${userId}:${expStr}`;
    const expectedSig = createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 16);
    if (sig !== expectedSig) return null;
    return { userId };
  } catch {
    return null;
  }
}
