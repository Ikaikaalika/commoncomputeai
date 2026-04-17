interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
}

export async function verifyTurnstile(token: string | undefined, ipAddress: string | null, secret: string, appEnv: string): Promise<boolean> {
  if (appEnv === "dev") {
    return true;
  }

  if (!token) {
    return false;
  }

  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token);
  if (ipAddress) form.set("remoteip", ipAddress);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form
  });

  if (!res.ok) {
    return false;
  }

  const body = (await res.json()) as TurnstileResponse;
  return body.success;
}
