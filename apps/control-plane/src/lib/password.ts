import { sha256Hex } from "./crypto";

export async function hashPassword(password: string): Promise<string> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = Array.from(saltBytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const hash = await sha256Hex(`${salt}:${password}`);
  return `${salt}$${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, expectedHash] = stored.split("$");
  if (!salt || !expectedHash) return false;
  const actual = await sha256Hex(`${salt}:${password}`);
  return actual === expectedHash;
}
