import type { Context, Next } from "hono";
import type { AppBindings, AppRole, AuthClaims } from "../env";
import { verifyJwt } from "./jwt";

interface AppContext {
  Bindings: AppBindings;
  Variables: {
    auth: AuthClaims;
  };
}

export function requireAuth(allowedRoles?: AppRole[]) {
  return async (c: Context<AppContext>, next: Next) => {
    const header = c.req.header("authorization");
    if (!header?.startsWith("Bearer ")) {
      return c.json({ error: "Missing bearer token", code: "UNAUTHORIZED" }, 401);
    }

    const token = header.slice("Bearer ".length);
    const claims = await verifyJwt(token, c.env.JWT_ISSUER, c.env.JWT_SECRET);
    if (!claims) {
      return c.json({ error: "Invalid token", code: "UNAUTHORIZED" }, 401);
    }

    if (allowedRoles && !allowedRoles.includes(claims.role)) {
      return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
    }

    c.set("auth", claims);
    await next();
  };
}
