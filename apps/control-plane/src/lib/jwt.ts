import type { AuthClaims } from "../env";
import { decodeBase64UrlText, encodeBase64UrlText, hmacSha256Base64Url } from "./crypto";

const header = {
  alg: "HS256",
  typ: "JWT"
};

export async function issueJwt(claims: Omit<AuthClaims, "iat" | "exp" | "iss">, issuer: string, secret: string, ttlSeconds = 60 * 60 * 12): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: AuthClaims = {
    ...claims,
    iss: issuer,
    iat: now,
    exp: now + ttlSeconds
  };

  const encodedHeader = encodeBase64UrlText(JSON.stringify(header));
  const encodedPayload = encodeBase64UrlText(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmacSha256Base64Url(signingInput, secret);
  return `${signingInput}.${signature}`;
}

export async function verifyJwt(token: string, issuer: string, secret: string): Promise<AuthClaims | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expected = await hmacSha256Base64Url(signingInput, secret);
  if (expected !== signature) return null;

  try {
    const payload = JSON.parse(decodeBase64UrlText(encodedPayload)) as AuthClaims;
    const now = Math.floor(Date.now() / 1000);
    if (payload.iss !== issuer || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}
