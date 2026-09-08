import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, inArray, sql, sum } from "drizzle-orm";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { orderItems, orders, products, users } from "../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb, getUserByEmail, getUserByOpenId, upsertUser } from "./db";
import { sdk } from "./_core/sdk";

const localAuthInput = z.object({
  email: z.string().email().max(320),
  password: z.string().min(6).max(120),
});

const demoProducts = [
  {
    slug: "classic",
    name: "كلاسيك بالعسل",
    shortDescription: "شوفان محمّص، عسل عماني ولوز مقرمش.",
    description: "خلطة جرانولي يومية متوازنة بطعم العسل العماني، مع شوفان كامل ولوز محمّص. مثالية مع الزبادي أو الحليب أو كوجبة خفيفة سريعة.",
    price: "2.500",
    imageUrl: "/manus-storage/granoli-classic_04bd5e81.png",
    badge: "الأكثر طلباً",
    stock: 30,
    active: 1,
  },
  {
    slug: "date-cinnamon",
    name: "تمر وقرفة",
    shortDescription: "تمر عماني، قرفة وهيل في كل قضمة.",
    description: "نكهة دافئة مستوحاة من البيت العماني: تمر غني، قرفة عطرية، هيل ولمسة من الشوفان المقرمش. خيار لطيف لبداية اليوم.",
    price: "2.750",
    imageUrl: "/manus-storage/granoli-date-cinnamon_013dcf53.png",
    badge: "نكهة موسمية",
    stock: 24,
    active: 1,
  },
  {
    slug: "mixed-nuts",
    name: "مكسرات مشكلة",
    shortDescription: "لوز وجوز وبندق لمحبي القرمشة.",
    description: "خلطة غنية بالمكسرات المحمصة بعناية مع حبوب الشوفان والعسل. قوام مقرمش وطعم عميق يناسب القهوة والرحلات.",
    price: "3.000",
    imageUrl: "/manus-storage/granoli-nuts_27d4e7e5.png",
    badge: "غنية بالبروتين",
    stock: 18,
    active: 1,
  },
];

async function ensureDemoProducts() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });
  const existing = await db.select({ id: products.id }).from(products).limit(1);
  if (existing.length === 0) await db.insert(products).values(demoProducts);
  return db;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(key, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

async function createLocalSession(ctx: { req: any; res: any }, user: { openId: string; name: string | null }) {
  const token = await sdk.signSession({ openId: user.openId, appId: ENV.appId, name: user.name || "زائر جرانولي" });
  ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: 1000 * 60 * 60 * 24 * 365 });
}

function publicUser(user: any) {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => publicUser(opts.ctx.user)),
    register: publicProcedure.input(z.object({ name: z.string().min(2).max(100), ...localAuthInput.shape })).mutation(async ({ input, ctx }) => {
      const email = input.email.trim().toLowerCase();
      const existing = await getUserByEmail(email);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "هذا البريد مسجل مسبقاً" });
      const openId = `local_${createHash("sha256").update(email).digest("hex")}`;
      await upsertUser({ openId, name: input.name.trim(), email, passwordHash: hashPassword(input.password), loginMethod: "email" });
      const user = await getUserByOpenId(openId);
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذر إنشاء الحساب" });
      await createLocalSession(ctx, user);
      return publicUser(user);
    }),
    login: publicProcedure.input(localAuthInput).mutation(async ({ input, ctx }) => {
      const email = input.email.trim().toLowerCase();
      const user = await getUserByEmail(email);
      if (!user?.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "البريد أو كلمة المرور غير صحيحة" });
      }
      await upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      await createLocalSession(ctx, user);
      return publicUser(user);
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  products: router({
    list: publicProcedure.query(async () => {
      const db = await ensureDemoProducts();
      return db.select().from(products).where(eq(products.active, 1)).orderBy(desc(products.createdAt));
    }),
    bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const db = await ensureDemoProducts();
      const result = await db.select().from(products).where(and(eq(products.slug, input.slug), eq(products.active, 1))).limit(1);
      if (!result[0]) throw new TRPCError({ code: "NOT_FOUND", message: "المنتج غير موجود" });
      return result[0];
    }),
  }),
  orders: router({
    create: protectedProcedure.input(z.object({ items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(20) })).min(1), note: z.string().max(500).optional() })).mutation(async ({ input, ctx }) => {
      const db = await ensureDemoProducts();
      const ids = input.items.map(item => item.productId);
      const found = await db.select().from(products).where(and(inArray(products.id, ids), eq(products.active, 1)));
      if (found.length !== ids.length) throw new TRPCError({ code: "BAD_REQUEST", message: "أحد المنتجات غير متاح" });
      const lineItems = input.items.map(item => {
        const product = found.find(p => p.id === item.productId)!;
        if (product.stock < item.quantity) throw new TRPCError({ code: "BAD_REQUEST", message: `الكمية المتاحة من ${product.name} غير كافية` });
        return { product, quantity: item.quantity, total: Number(product.price) * item.quantity };
      });
      const total = lineItems.reduce((sum, item) => sum + item.total, 0);
      const inserted = await db.insert(orders).values({ userId: ctx.user.id, status: "pending", total: total.toFixed(3), note: input.note || null });
      const orderId = Number(inserted[0].insertId);
      await db.insert(orderItems).values(lineItems.map(item => ({ orderId, productId: item.product.id, quantity: item.quantity, unitPrice: item.product.price })));
      for (const item of lineItems) await db.update(products).set({ stock: sql`${products.stock} - ${item.quantity}` }).where(eq(products.id, item.product.id));
      return { id: orderId, total: total.toFixed(3), status: "pending" as const };
    }),
    mine: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });
      return db.select().from(orders).where(eq(orders.userId, ctx.user.id)).orderBy(desc(orders.createdAt));
    }),
  }),
  admin: router({
    stats: adminProcedure.query(async () => {
      const db = await ensureDemoProducts();
      const [usersCount, productsCount, ordersCount, revenue] = await Promise.all([
        db.select({ value: count() }).from(users),
        db.select({ value: count() }).from(products).where(eq(products.active, 1)),
        db.select({ value: count() }).from(orders),
        db.select({ value: sum(orders.total) }).from(orders).where(eq(orders.status, "completed")),
      ]);
      return { users: usersCount[0]?.value ?? 0, products: productsCount[0]?.value ?? 0, orders: ordersCount[0]?.value ?? 0, revenue: revenue[0]?.value ?? "0.000" };
    }),
    products: adminProcedure.query(async () => {
      const db = await ensureDemoProducts();
      return db.select().from(products).orderBy(desc(products.createdAt));
    }),
    orders: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });
      return db.select({ order: orders, userName: users.name, userEmail: users.email }).from(orders).leftJoin(users, eq(orders.userId, users.id)).orderBy(desc(orders.createdAt));
    }),
    updateOrderStatus: adminProcedure.input(z.object({ id: z.number().int(), status: z.enum(["pending", "confirmed", "shipped", "completed", "cancelled"]) })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });
      await db.update(orders).set({ status: input.status }).where(eq(orders.id, input.id));
      return { success: true } as const;
    }),
    createProduct: adminProcedure.input(z.object({ slug: z.string().min(2), name: z.string().min(2), shortDescription: z.string().min(2), description: z.string().min(2), price: z.string(), imageUrl: z.string().url(), badge: z.string().optional(), stock: z.number().int().min(0).default(25) })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });
      await db.insert(products).values({ ...input, badge: input.badge || null, active: 1 });
      return { success: true } as const;
    }),
    toggleProduct: adminProcedure.input(z.object({ id: z.number().int(), active: z.number().int().min(0).max(1) })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });
      await db.update(products).set({ active: input.active }).where(eq(products.id, input.id));
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
