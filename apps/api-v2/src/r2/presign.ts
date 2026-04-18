// R2 presigned URL helpers.
// Workers R2 doesn't have native presigned URL support like S3; we generate
// short-lived signed tokens instead, redeemed via a /v1/artifacts/... endpoint.

export function r2InputKey(taskId: string, filename: string): string {
  return `inputs/${taskId}/${filename}`;
}

export function r2ResultKey(taskId: string, filename: string): string {
  return `results/${taskId}/${filename}`;
}

// Sign a token granting PUT access to a specific R2 key for `ttlSeconds`.
export async function signR2PutToken(
  r2Key: string,
  jwtSecret: string,
  ttlSeconds = 3600
): Promise<string> {
  const payload = { r2Key, exp: Math.floor(Date.now() / 1000) + ttlSeconds, op: 'put' };
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(jwtSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const data = enc.encode(JSON.stringify(payload));
  const sig = await crypto.subtle.sign('HMAC', key, data);
  const sigHex = Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
  return btoa(JSON.stringify({ payload, sig: sigHex }));
}

export async function verifyR2PutToken(
  token: string,
  jwtSecret: string
): Promise<{ r2Key: string } | null> {
  try {
    const { payload, sig: sigHex } = JSON.parse(atob(token)) as { payload: { r2Key: string; exp: number; op: string }; sig: string };
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.op !== 'put') return null;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(jwtSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const data = enc.encode(JSON.stringify(payload));
    const sigBuf = Uint8Array.from(sigHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
    const valid = await crypto.subtle.verify('HMAC', key, sigBuf, data);
    if (!valid) return null;

    return { r2Key: payload.r2Key };
  } catch {
    return null;
  }
}
