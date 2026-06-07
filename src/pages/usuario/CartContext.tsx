import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Cart, Product } from "./types";

const CART_STORAGE_KEY = "or_cart";

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
        .filter(([, qty]) => Number.isFinite(qty) && qty > 0)
    );
  } catch {
    return {};
  }
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
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(() => loadCartFromStorage());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (Object.keys(cart).length === 0) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart]);

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
    <CartContext.Provider value={{ cart, totalItems, totalPrice, add, remove, changeQty, setQty, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}