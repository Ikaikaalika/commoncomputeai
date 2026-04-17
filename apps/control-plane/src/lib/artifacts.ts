import { decodeBase64UrlText, encodeBase64UrlText, hmacSha256Base64Url } from "./crypto";
import type { WorkerEnv } from "../env";

interface SignedArtifactRef {
  artifact_id: string;
  key: string;
  expires_at: number;
  url: string;
}

export async function signArtifactUrl(jobId: string, key: string, ttlSeconds: number, secret: string): Promise<SignedArtifactRef> {
  const artifactId = encodeBase64UrlText(key);
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${jobId}:${artifactId}:${expiresAt}`;
  const signature = await hmacSha256Base64Url(payload, secret);
  return {
    artifact_id: artifactId,
    key,
    expires_at: expiresAt,
    url: `/v1/jobs/${jobId}/artifacts/${artifactId}/download?exp=${expiresAt}&sig=${signature}`
  };
}

export async function verifyArtifactSignature(jobId: string, artifactId: string, exp: string, sig: string, secret: string): Promise<boolean> {
  const expiresAt = Number(exp);
  if (!Number.isFinite(expiresAt)) return false;
  if (expiresAt < Math.floor(Date.now() / 1000)) return false;

  const payload = `${jobId}:${artifactId}:${expiresAt}`;
  const expected = await hmacSha256Base64Url(payload, secret);
  return expected === sig;
}

export function decodeArtifactKey(artifactId: string): string | null {
  try {
    return decodeBase64UrlText(artifactId);
  } catch {
    return null;
  }
}

export async function listArtifactUrls(env: WorkerEnv, jobId: string): Promise<SignedArtifactRef[]> {
  const listing = await env.ARTIFACTS.list({ prefix: `jobs/${jobId}/artifacts/` });
  const urls: SignedArtifactRef[] = [];

  for (const object of listing.objects) {
    urls.push(await signArtifactUrl(jobId, object.key, 10 * 60, env.JWT_SECRET));
  }

  return urls;
}
