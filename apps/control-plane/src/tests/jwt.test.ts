import { describe, expect, it } from "vitest";
import { issueJwt, verifyJwt } from "../lib/jwt";

describe("jwt", () => {
  it("issues and verifies token", async () => {
    const token = await issueJwt(
      {
        sub: "user-123",
        role: "customer"
      },
      "commoncomputeai",
      "secret",
      3600
    );

    const claims = await verifyJwt(token, "commoncomputeai", "secret");
    expect(claims).not.toBeNull();
    expect(claims?.sub).toBe("user-123");
    expect(claims?.role).toBe("customer");
  });

  it("rejects token signed with wrong secret", async () => {
    const token = await issueJwt(
      {
        sub: "user-123",
        role: "customer"
      },
      "commoncomputeai",
      "secret-a",
      3600
    );

    const claims = await verifyJwt(token, "commoncomputeai", "secret-b");
    expect(claims).toBeNull();
  });
});
