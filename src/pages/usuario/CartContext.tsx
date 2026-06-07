import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Cart, Product } from "./types";

const CART_STORAGE_KEY = "or_cart";
const FECHA_STORAGE_KEY = "or_cart_fechaEntrega";

function loadCartFromStorage(): Cart {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([sku, qty]) => [sku, Number(qty)])
        .filter(([, qty]) => Number.isFinite(qty as number) && (qty as number) > 0)
    );
  } catch {
    return {};
  }
}

function loadFechaEntregaFromStorage(): string {
  if (typeof window === "undefined") {
    // Fallback: hoy + 3 días
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  }
  try {
    const raw = window.localStorage.getItem(FECHA_STORAGE_KEY);
    if (raw) return String(raw);
  } catch {}
  // Fallback: hoy + 3 días si no hay nada guardado
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().slice(0, 10);
}

interface CartContextValue {
  cart: Cart;
  totalItems: number;
  totalPrice: number;
  add: (product: Product) => void;
  remove: (sku: string) => void;
  changeQty: (sku: string, delta: number) => void;
  setQty: (sku: string, qty: number) => void;
  clear: () => void;
  fechaEntrega: string;
  setFechaEntrega: (d: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(() => loadCartFromStorage());
  const [fechaEntrega, setFechaEntrega] = useState<string>(() => loadFechaEntregaFromStorage());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (Object.keys(cart).length === 0) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(FECHA_STORAGE_KEY, fechaEntrega);
  }, [fechaEntrega]);

  const add = useCallback((product: Product) => {
    setCart((prev) => ({ ...prev, [product.sku]: (prev[product.sku] ?? 0) + 1 }));
  }, []);

  const remove = useCallback((sku: string) => {
    setCart((prev) => {
      const next = { ...prev };
      if ((next[sku] ?? 0) <= 1) delete next[sku];
      else next[sku]--;
      return next;
    });
  }, []);

  const changeQty = useCallback((sku: string, delta: number) => {
    setCart((prev) => {
      const next = { ...prev };
      const newQty = (next[sku] ?? 0) + delta;
      if (newQty <= 0) delete next[sku];
      else next[sku] = newQty;
      return next;
    });
  }, []);

  const setQty = useCallback((sku: string, qty: number) => {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[sku];
      else next[sku] = qty;
      return next;
    });
  }, []);

  const clear = useCallback(() => setCart({}), []);

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = 0; // calculated in consumers who have access to mockProducts

  return (
    <CartContext.Provider value={{ cart, totalItems, totalPrice, add, remove, changeQty, setQty, clear, fechaEntrega, setFechaEntrega }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}