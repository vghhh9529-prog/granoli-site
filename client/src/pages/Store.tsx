import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import StoreHeader from "@/components/StoreHeader";
import { trpc } from "@/lib/trpc";

export default function Store() {
  const { data: products, isLoading } = trpc.products.list.useQuery();
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => products?.filter((p) => `${p.name} ${p.shortDescription}`.includes(search.trim())) || [], [products, search]);
  return <div className="site-shell"><StoreHeader /><section className="page-hero"><div className="container"><div className="eyebrow">تشكيلة جرانولي</div><h1>منتجاتنا الطبيعية</h1><p>اختاري نكهتك المفضلة من خلطات جرانولي المصنوعة بحبوب كاملة ومكونات مختارة بعناية.</p></div></section><main className="section"><div className="container"><div className="section-head"><div><div className="section-kicker">كل النكهات</div><h2 className="section-title">اختاري قرمشتك</h2></div><label className="flex items-center gap-2 border border-[#e5dac9] rounded-full px-4 py-2 bg-[#fffdf9] text-[#766b5d]"><Search size={17} /><input aria-label="ابحثي عن منتج" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحثي عن نكهة" className="bg-transparent outline-none w-36 text-sm" /></label></div>{isLoading ? <div className="empty-state">نحضّر المنتجات...</div> : filtered.length ? <div className="product-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state">لا توجد منتجات بهذا الاسم.</div>}</div></main><footer className="footer"><div className="container">اضغطي على المنتج لمعرفة التفاصيل ومكونات الخلطة.</div></footer></div>;
}
