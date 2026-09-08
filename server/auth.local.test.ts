import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined, cookie: () => undefined } as TrpcContext["res"],
  };
}

describe("local authentication", () => {
  it("returns no user for a public anonymous auth check", async () => {
    const caller = appRouter.createCaller(context());
    expect(await caller.auth.me()).toBeNull();
  });

  it("rejects weak passwords before touching the database", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.auth.register({ name: "Sara", email: "sara@example.com", password: "123" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
