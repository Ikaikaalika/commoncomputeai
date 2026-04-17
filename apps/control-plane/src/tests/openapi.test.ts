import { describe, expect, it } from "vitest";
import { buildOpenApiDocument } from "../meta/openapi";

describe("openapi", () => {
  it("contains key paths", () => {
    const doc = buildOpenApiDocument({
      title: "CommonCompute Control Plane API",
      version: "0.2.0",
      baseUrl: "https://api.commoncompute.ai"
    }) as {
      openapi: string;
      servers: Array<{ url: string }>;
      paths: Record<string, unknown>;
    };

    expect(doc.openapi).toBe("3.1.0");
    expect(doc.servers[0].url).toBe("https://api.commoncompute.ai");
    expect(doc.paths["/v1/market/providers"]).toBeDefined();
    expect(doc.paths["/v1/account/me"]).toBeDefined();
    expect(doc.paths["/v1/admin/overview"]).toBeDefined();
    expect(doc.paths["/v1/meta/openapi"]).toBeDefined();
  });
});
