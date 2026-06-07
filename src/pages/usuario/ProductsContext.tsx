import { createContext, useContext, useEffect, useState } from "react";
import type { Product } from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

interface ProductsContextValue {
  products: Product[];
  loading: boolean;
  error: string | null;
}

const ProductsContext = createContext<ProductsContextValue>({
  products: [],
  loading: true,
  error: null,
});

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("or_token");
    fetch(`${API_BASE}/api/customer/products`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { sku: string; nombre: string; precio: number; categoria: string; imagen_url?: string | null }[]) => {
        setProducts(data.map((p) => ({ sku: p.sku, nombre: p.nombre, precio: p.precio, categoria: p.categoria, imagen_url: p.imagen_url ?? null })));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProductsContext.Provider value={{ products, loading, error }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductsContext);
}
