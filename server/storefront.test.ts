import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function anonymousContext(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("storefront", () => {
  it("returns seeded products with prices and images", async () => {
    const products = await appRouter.createCaller(anonymousContext()).products.list();
    expect(products.length).toBeGreaterThanOrEqual(3);
    expect(products.every((product) => Number(product.price) > 0 && product.imageUrl.length > 0)).toBe(true);
  });

  it("protects admin statistics from anonymous users", async () => {
    await expect(appRouter.createCaller(anonymousContext()).admin.stats()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
