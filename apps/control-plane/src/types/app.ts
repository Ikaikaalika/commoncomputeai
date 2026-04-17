import type { AppBindings, AuthClaims } from "../env";

export interface AppContext {
  Bindings: AppBindings;
  Variables: {
    auth: AuthClaims;
  };
}
