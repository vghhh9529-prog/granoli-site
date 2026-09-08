import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowLeft, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import ProductCard from "@/components/ProductCard";
import StoreHeader from "@/components/StoreHeader";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { user } = useAuth();
  const { data: products, isLoading } = trpc.products.list.useQuery();
  const [showHello, setShowHello] = useState(false);
  useEffect(() => { if (user && !sessionStorage.getItem(`granoli-hello-${user.id}`)) { setShowHello(true); sessionStorage.setItem(`granoli-hello-${user.id}`, "1"); } }, [user]);
  return <div className="site-shell"><StoreHeader />
    {showHello && <div className="hello-screen"><div className="hello-inner"><small>مرحباً بك في جرانولي</small><h2>Hello، {user?.name?.split(" ")[0]}</h2><p>خلّينا نبدأ يومك بقرمشة طيبة.</p></div></div>}
    <main>
      <section className="hero"><div className="container hero-grid"><div className="hero-copy"><div className="eyebrow">من عُمان إلى يومك</div><h1>حبوب طبيعية، ولذة تُصنع بعناية.</h1><p>جرانولي محمصة على دفعات صغيرة من الشوفان الكامل، العسل الطبيعي والمكسرات المختارة — بدون سكر مضاف.</p><div className="hero-actions"><Link className="btn-primary" href="/products">اطلب الآن <ArrowLeft size={16} /></Link><a className="btn-ghost !text-[#fffaf0] !border-white/30" href="#why">لماذا جرانولي؟</a></div></div><div className="hero-visual"><img src="/manus-storage/granoli-classic_04bd5e81.png" alt="جرانولي كلاسيك بالعسل" /></div></div></section>
      <section className="section"><div className="container"><div className="section-head"><div><div className="section-kicker">اختياراتنا</div><h2 className="section-title">نكهات تستحق التجربة</h2></div><Link href="/products" className="btn-ghost">كل المنتجات <ArrowLeft size={16} /></Link></div>{isLoading ? <div className="empty-state">نحضّر لكِ المنتجات...</div> : <div className="product-grid">{products?.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} />)}</div>}</div></section>
      <section id="why" className="section feature-band"><div className="container"><div className="section-head"><div><div className="section-kicker">تفاصيل صغيرة، فرق كبير</div><h2 className="section-title">صُنعت لتناسب يومك</h2></div></div><div className="feature-grid"><div className="feature"><div className="feature-icon"><Leaf size={20} /></div><h3>مكونات واضحة</h3><p>نعرف كل حبة تدخل خلطتنا، ونختارها بعناية من مصادر موثوقة.</p></div><div className="feature"><div className="feature-icon"><Sparkles size={20} /></div><h3>تحميص على دفعات</h3><p>قرمشة متوازنة وطعم طازج لأننا نحضّر كميات صغيرة.</p></div><div className="feature"><div className="feature-icon"><ShieldCheck size={20} /></div><h3>طلب سهل وآمن</h3><p>أنشئ حسابك، اختر نكهتك، وتابع طلبك من مكان واحد.</p></div></div></div></section>
      <section id="contact" className="section"><div className="container" style={{ background: "#314a31", color: "#fffaf0", borderRadius: 32, padding: "48px" }}><div className="section-kicker">نحن قريبون منك</div><h2 className="section-title">جاهز لقرمشة مختلفة؟</h2><p style={{ color: "rgba(255,250,240,.7)", maxWidth: 550, lineHeight: 2 }}>تواصل معنا للطلبات الكبيرة أو الهدايا أو أي سؤال عن النكهات.</p><a className="btn-primary" href="mailto:hello@granoli.om">hello@granoli.om</a></div></section>
    </main><footer className="footer"><div className="container flex justify-between gap-4 flex-wrap"><span>© 2026 جرانولي — صُنع بحب في عُمان</span><span>الشوفان. العسل. القرمشة.</span></div></footer>
  </div>;
}
