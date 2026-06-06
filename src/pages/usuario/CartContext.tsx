import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Cart, Product } from "./types";

interface CartContextValue {
  cart: Cart;
  totalItems: number;
  totalPrice: number;
  add: (product: Product) => void;
  remove: (sku: string) => void;
  changeQty: (sku: string, delta: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({});

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

  const clear = useCallback(() => setCart({}), []);

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = 0; // calculated in consumers who have access to mockProducts

  return (
    <CartContext.Provider value={{ cart, totalItems, totalPrice, add, remove, changeQty, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}