import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { addToCart } from "@/lib/cart";

type Product = { id: number; slug: string; name: string; shortDescription: string; price: string; imageUrl: string; badge: string | null };
export default function ProductCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  const handleAdd = () => { addToCart({ productId: product.id, slug: product.slug, name: product.name, price: product.price, imageUrl: product.imageUrl }); setAdded(true); setTimeout(() => setAdded(false), 1400); };
  return <article className="product-card">
    <Link href={`/products/${product.slug}`}><img className="product-image" src={product.imageUrl} alt={product.name} /></Link>
    {product.badge && <span className="badge">{product.badge}</span>}
    <div className="product-info">
      <Link href={`/products/${product.slug}`}><h3>{product.name}</h3></Link>
      <p>{product.shortDescription}</p>
      <div className="product-meta"><span className="price">{Number(product.price).toFixed(3)} ر.ع</span><button className="btn-dark !px-4 !py-2 !text-xs" onClick={handleAdd}>{added ? <><Check size={15} /> تمت الإضافة</> : <><Plus size={15} /> أضف للسلة</>}</button></div>
    </div>
  </article>;
}
