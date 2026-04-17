import { z } from "zod";

export function jsonError(message: string, code: string, status: number, details?: unknown): Response {
  return Response.json(
    {
      error: message,
      code,
      details
    },
    { status }
  );
}

export async function parseJson<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema
): Promise<{ ok: true; data: z.infer<TSchema> } | { ok: false; response: Response }> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return {
      ok: false,
      response: jsonError("Invalid JSON payload", "INVALID_JSON", 400)
    };
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    return {
      ok: false,
      response: jsonError("Payload validation failed", "VALIDATION_ERROR", 400, result.error.flatten())
    };
  }

  return {
    ok: true,
    data: result.data
  };
}
