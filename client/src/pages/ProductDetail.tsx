import { ArrowRight, Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Link, useRoute } from "wouter";
import StoreHeader from "@/components/StoreHeader";
import { addToCart } from "@/lib/cart";
import { trpc } from "@/lib/trpc";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:slug");
  const { data: product, isLoading } = trpc.products.bySlug.useQuery({ slug: params?.slug || "" }, { enabled: Boolean(params?.slug) });
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  if (isLoading) return <><StoreHeader /><div className="empty-state">نجهّز التفاصيل...</div></>;
  if (!product) return <><StoreHeader /><div className="empty-state">لم نعثر على المنتج.</div></>;
  const handleAdd = () => { addToCart({ productId: product.id, slug: product.slug, name: product.name, price: product.price, imageUrl: product.imageUrl }, quantity); setAdded(true); setTimeout(() => setAdded(false), 1500); };
  return <div className="site-shell"><StoreHeader /><main className="product-detail"><div className="container"><Link href="/products" className="inline-flex items-center gap-2 text-sm text-[#766b5d] mb-8"><ArrowRight size={16} /> العودة للمنتجات</Link><div className="detail-grid"><div><img className="detail-image" src={product.imageUrl} alt={product.name} /></div><div className="detail-copy"><div className="section-kicker">{product.badge || "خلطة جرانولي"}</div><h1>{product.name}</h1><p>{product.description}</p><div className="detail-price">{Number(product.price).toFixed(3)} ر.ع</div><div className="flex items-center gap-3 flex-wrap"><div className="quantity"><button aria-label="تقليل" onClick={() => setQuantity((v) => Math.max(1, v - 1))}><Minus size={15} /></button><strong>{quantity}</strong><button aria-label="زيادة" onClick={() => setQuantity((v) => Math.min(product.stock, v + 1))}><Plus size={15} /></button></div><button className="btn-dark" onClick={handleAdd}><ShoppingBag size={17} /> {added ? "تمت الإضافة" : "أضف للسلة"}</button><Link href="/cart" className="btn-ghost">عرض السلة</Link></div><p className="!text-sm !mt-7">متوفر حالياً: {product.stock} عبوة · وزن العبوة 300 جم</p></div></div></div></main></div>;
}
