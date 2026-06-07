import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "./componentes/ProductCard";
import type { Product } from "./types";
import { mockProducts, CATEGORY_ICONS } from "./MockProducts";
import { useCart } from "./CartContext";

export default function PedidosPage() {
  const navigate = useNavigate();
  const { cart, add, remove, changeQty, totalItems } = useCart();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");

  const totalPrice = mockProducts.reduce((s, p) => s + p.precio * (cart[p.sku] ?? 0), 0);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(mockProducts.map((p) => p.categoria)));
    return ["Todos", ...cats];
  }, []);

  const grouped = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = mockProducts.filter((p) => {
      const matchSearch = !q || p.nombre.toLowerCase().includes(q);
      const matchCat = activeCategory === "Todos" || p.categoria === activeCategory;
      return matchSearch && matchCat;
    });
    
    const result: Record<string, Product[]> = {};
    filtered.forEach((p) => {
      if (!result[p.categoria]) result[p.categoria] = [];
      result[p.categoria].push(p);
    });
    return result;
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased">
      
      {/* Structural Sub-header / Filters Toolbar */}
      <div className="top-[72px] z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Hacer Pedido
            </h1>
            
            {/* Professional Search Input */}
            <div className="w-full sm:max-w-md relative">
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por marca, sabor o producto..."
                className="w-full bg-gray-50 border border-gray-300 rounded-2xl pl-9 pr-4 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Clean Segmented Category Buttons */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  activeCategory === cat
                    ? "bg-red-600 text-white border-red-600 font-semibold shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="text-sm opacity-80">{CATEGORY_ICONS[cat] ?? "📦"}</span>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="popLayout">
          {Object.keys(grouped).length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm"
            >
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="mt-4 font-medium text-gray-900">Sin resultados para "{search}"</p>
              <p className="text-xs text-gray-400 mt-1">Verifica la ortografía o intenta cambiando de categoría.</p>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([cat, products]) => (
                <motion.section 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  key={cat} 
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{cat}</h2>
                    <span className="text-xs text-gray-400 font-mono">({products.length})</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {products.map((product) => (
                      <ProductCard
                        key={product.sku}
                        product={product}
                        qty={cart[product.sku] ?? 0}
                        onAdd={add}
                        onRemove={remove}
                        onSetQty={(sku, newQty) => changeQty(sku, newQty - (cart[sku] ?? 0))}
                      />
                    ))}
                  </div>
                </motion.section>
              ))}
            </div>
          )}
        </AnimatePresence>
        
        {totalItems > 0 && <div className="h-20 sm:h-0" />}
      </main>

      {/* Floating Sticky Mobile Order Status Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-[10000] sm:hidden">
          <button
            onClick={() => navigate("/usuario/tienda/checkout")}
            className="w-full bg-red-600 text-white font-semibold py-3.5 rounded-2xl shadow-lg flex items-center justify-between px-4 active:bg-red-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="bg-red-700 text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
              <span className="text-sm font-medium">Ver mi pedido</span>
            </div>
            <span className="font-bold text-sm">${totalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
          </button>
        </div>
      )}
    </div>
  );
}