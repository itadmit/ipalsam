/** משתמש ב-Web Crypto API – תואם ל-Edge Runtime */

const SECRET =
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";
const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const IMPERSONATE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  return new TextDecoder().decode(
    new Uint8Array([...binary].map((c) => c.charCodeAt(0)))
  );
}

async function signHmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

export async function createRequestToken(userId: string): Promise<string> {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${userId}:${exp}`;
  const sig = await signHmac(payload);
  return base64UrlEncode(`${payload}:${sig}`);
}

export async function verifyRequestToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const decoded = base64UrlDecode(token);
    const [userId, expStr, sig] = decoded.split(":");
    if (!userId || !expStr || !sig) return null;
    const exp = parseInt(expStr, 10);
    if (Date.now() > exp) return null;
    const payload = `${userId}:${expStr}`;
    const expectedSig = await signHmac(payload);
    if (sig !== expectedSig) return null;
    return { userId };
  } catch {
    return null;
  }
}

export async function createImpersonateToken(userId: string): Promise<string> {
  const exp = Date.now() + IMPERSONATE_TTL_MS;
  const payload = `impersonate:${userId}:${exp}`;
  const sig = await signHmac(payload);
  return base64UrlEncode(`${payload}:${sig}`);
}

export async function verifyImpersonateToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const decoded = base64UrlDecode(token);
    const parts = decoded.split(":");
    if (parts[0] !== "impersonate" || parts.length < 4) return null;
    const [, userId, expStr, sig] = parts;
    if (!userId || !expStr || !sig) return null;
    const exp = parseInt(expStr, 10);
    if (Date.now() > exp) return null;
    const payload = `impersonate:${userId}:${expStr}`;
    const expectedSig = await signHmac(payload);
    if (sig !== expectedSig) return null;
    return { userId };
  } catch {
    return null;
  }
}
