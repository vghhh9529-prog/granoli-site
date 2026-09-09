import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { ShoppingBag, UserRound } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useCartCount } from "@/lib/cart";

export default function StoreHeader({ className = "" }: { className?: string }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const count = useCartCount();
  return (
    <header className={`site-nav ${className}`}>
      <div className="container nav-inner">
        <Link href="/" className="brand"><span className="brand-mark" /><span>GRANOLI</span></Link>
        <nav className="nav-links" aria-label="التنقل الرئيسي">
          <Link href="/" className={location === "/" ? "font-bold text-[#314a31]" : ""}>الرئيسية</Link>
          <Link href="/products" className={location.startsWith("/products") ? "font-bold text-[#314a31]" : ""}>المنتجات</Link>
          <a href="/#contact">التواصل</a>
        </nav>
        <div className="nav-actions">
          <Link href="/cart" className="icon-button cart-pill" aria-label="السلة"><ShoppingBag size={18} /><span className="cart-count">{count}</span></Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link href={user.role === "admin" ? "/admin" : "/"} className="btn-ghost hidden sm:inline-flex"><UserRound size={16} /> {user.name?.split(" ")[0] || "حسابي"}</Link>
              <button className="text-xs text-[#766b5d] hidden md:block" onClick={() => void logout()}>خروج</button>
            </div>
          ) : <button className="btn-primary" onClick={() => startLogin()}>دخول</button>}
        </div>
      </div>
    </header>
  );
}
