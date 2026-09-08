import { useEffect, useState } from "react";

export type CartItem = { productId: number; slug: string; name: string; price: string; imageUrl: string; quantity: number };
const KEY = "granoli-cart";
const EVENT = "granoli-cart-change";

export function getCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") as CartItem[]; } catch { return []; }
}
export function setCart(items: CartItem[]) { localStorage.setItem(KEY, JSON.stringify(items)); window.dispatchEvent(new Event(EVENT)); }
export function addToCart(item: Omit<CartItem, "quantity">, quantity = 1) {
  const cart = getCart(); const found = cart.find((x) => x.productId === item.productId);
  if (found) found.quantity += quantity; else cart.push({ ...item, quantity }); setCart(cart);
}
export function removeFromCart(productId: number) { setCart(getCart().filter((x) => x.productId !== productId)); }
export function updateCartQuantity(productId: number, quantity: number) { const next = getCart().map((x) => x.productId === productId ? { ...x, quantity } : x).filter((x) => x.quantity > 0); setCart(next); }
export function clearCart() { setCart([]); }
export function useCartCount() {
  const [count, setCount] = useState(() => getCart().reduce((total, item) => total + item.quantity, 0));
  useEffect(() => { const refresh = () => setCount(getCart().reduce((total, item) => total + item.quantity, 0)); window.addEventListener(EVENT, refresh); return () => window.removeEventListener(EVENT, refresh); }, []);
  return count;
}
