import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { LayoutDashboard, LogOut, Package, ShoppingBag } from "lucide-react";
import { Link } from "wouter";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  if (loading) return <div className="empty-state">جارٍ التحقق من الحساب...</div>;
  if (!user) return <div className="auth-wrap"><div className="auth-card text-center"><h1>لوحة الإدارة</h1><p>سجّلي الدخول للوصول إلى لوحة جرانولي.</p><button className="btn-dark w-full" onClick={() => startLogin()}>تسجيل الدخول</button></div></div>;
  if (user.role !== "admin") return <div className="auth-wrap"><div className="auth-card text-center"><h1>الوصول غير متاح</h1><p>هذه الصفحة مخصصة لحساب الإدارة فقط.</p><Link className="btn-ghost mt-4" href="/">العودة للموقع</Link></div></div>;
  return <div className="admin-shell"><aside className="hidden lg:flex fixed right-0 top-0 bottom-0 w-64 bg-[#314a31] text-[#fffaf0] p-6 flex-col gap-8 z-20"><Link href="/" className="brand"><span className="brand-mark" /><span>GRANOLI</span></Link><nav className="grid gap-2 text-sm"><Link className="rounded-xl px-4 py-3 bg-white/10 flex items-center gap-3" href="/admin"><LayoutDashboard size={17} /> نظرة عامة</Link><Link className="rounded-xl px-4 py-3 hover:bg-white/10 flex items-center gap-3" href="/products"><Package size={17} /> المتجر</Link><Link className="rounded-xl px-4 py-3 hover:bg-white/10 flex items-center gap-3" href="/cart"><ShoppingBag size={17} /> السلة</Link></nav><button className="mt-auto flex items-center gap-3 text-sm text-white/70" onClick={() => void logout()}><LogOut size={16} /> تسجيل الخروج</button></aside><main className="lg:mr-64">{children}</main></div>;
}
