import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

/* ── Types ───────────────────────────────────────────────────────── */
interface Cedis {
  _id: string;
  cedis_id: string;
  nombre?: string;
  ciudad?: string;
  direccion?: string;
  estado?: string;
  pais?: string;
}

interface StockProduct {
  sku: string;
  nombre: string;
  precio_unitario: number;
  imagen_url: string | null;
  stock_disponible: number;
  stock_reservado: number;
  stock_minimo: number;
  stock_critico: number;
}

type Cart = Record<string, number>;

/* ── Category detection ──────────────────────────────────────────── */
const CATEGORY_ICONS: Record<string, string> = {
  Refrescos:  '🥤',
  Aguas:      '💧',
  Deportivas: '⚡',
  Tés:        '🍵',
  Jugos:      '🧃',
  Lácteos:    '🥛',
  Snacks:     '🍿',
  Otros:      '📦',
};

const CATEGORY_ORDER = ['Refrescos', 'Aguas', 'Deportivas', 'Tés', 'Jugos', 'Lácteos', 'Snacks', 'Otros'];

function getCategoria(nombre: string): string {
  const n = nombre.toLowerCase();
  if (/powerade|monster|glacéau|vitaminwater/.test(n)) return 'Deportivas';
  if (/fuze tea|costa coffee/.test(n))                  return 'Tés';
  if (/del valle|pulpy|joya|frutsi|valle frut|ades/.test(n)) return 'Jugos';
  if (/santa clara|leche/.test(n))                      return 'Lácteos';
  if (/ciel|dasani|topo chico agua|agua pur|agua mineral/.test(n)) return 'Aguas';
  if (/ina cake|tortolines|azúcar|gelatina|yogurt/.test(n)) return 'Snacks';
  if (/coca|sprite|fanta|fresca|sidral|topo chico/.test(n)) return 'Refrescos';
  return 'Otros';
}

/* ── Step indicator ──────────────────────────────────────────────── */
function Steps({ current }: { current: number }) {
  const steps = ['Seleccionar CEDIS', 'Elegir productos', 'Confirmar pedido'];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${active ? 'text-[#E61A27]' : done ? 'text-green-600' : 'text-gray-300'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${active ? 'border-[#E61A27] bg-[#E61A27] text-white' : done ? 'border-green-500 bg-green-500 text-white' : 'border-gray-200 text-gray-300'}`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${active ? 'text-[#E61A27]' : done ? 'text-green-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-8 sm:w-16 transition-all ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Stock badge ─────────────────────────────────────────────────── */
function StockBadge({ stock, minimo, critico }: { stock: number; minimo: number; critico: number }) {
  if (stock <= critico) return <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Crítico</span>;
  if (stock <= minimo)  return <span className="text-[10px] font-semibold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">Bajo</span>;
  return null;
}

/* ── Carousel row ────────────────────────────────────────────────── */
function CategoryCarousel({
  category, products, cart, onAdd, onRemove,
}: {
  category: string;
  products: StockProduct[];
  cart: Cart;
  onAdd: (sku: string) => void;
  onRemove: (sku: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const icon = CATEGORY_ICONS[category] ?? '📦';

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'right' ? 280 : -280, behavior: 'smooth' });
  };

  return (
    <section className="space-y-2">
      {/* Category header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{category}</h2>
          <span className="text-xs text-gray-400 font-mono">({products.length})</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => scroll('left')}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
            ‹
          </button>
          <button onClick={() => scroll('right')}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
            ›
          </button>
        </div>
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map(p => {
          const qty = cart[p.sku] ?? 0;
          return (
            <div
              key={p.sku}
              className={`shrink-0 w-36 bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden transition-all ${
                qty > 0 ? 'border-[#E61A27] shadow-red-100' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
              }`}
            >
              {/* Image area */}
              <div className="relative bg-linear-to-br from-gray-50 to-gray-100 h-28 flex items-center justify-center overflow-hidden select-none">
                {p.imagen_url ? (
                  <img src={p.imagen_url} alt={p.nombre}
                    className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl">{icon}</span>
                )}
                {qty > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-[#E61A27] text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow">
                    {qty}
                  </span>
                )}
                <StockBadge stock={p.stock_disponible} minimo={p.stock_minimo} critico={p.stock_critico} />
              </div>

              {/* Content */}
              <div className="p-2.5 flex flex-col flex-1">
                <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2 flex-1 mb-1.5">
                  {p.nombre}
                </p>
                <p className="text-[10px] text-gray-400 mb-1.5">Stock: {p.stock_disponible}</p>

                <div className="flex items-center justify-between mt-auto">
                  <span className="text-sm font-extrabold text-gray-900">${p.precio_unitario.toFixed(2)}</span>

                  {qty === 0 ? (
                    <button onClick={() => onAdd(p.sku)}
                      className="w-7 h-7 rounded-full bg-[#E61A27] text-white flex items-center justify-center text-lg font-light hover:bg-[#C9141A] shadow transition-colors leading-none">
                      +
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button onClick={() => onRemove(p.sku)}
                        className="w-6 h-6 rounded-full border-2 border-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold hover:border-[#E61A27] hover:text-[#E61A27] transition-colors">
                        −
                      </button>
                      <span className="text-xs font-bold text-gray-900 w-4 text-center">{qty}</span>
                      <button onClick={() => onAdd(p.sku)}
                        className="w-6 h-6 rounded-full bg-[#E61A27] text-white flex items-center justify-center text-xs font-bold hover:bg-[#C9141A] transition-colors">
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function AdminCedisPage() {
  const [step, setStep]             = useState(0);
  const [cedisList, setCedisList]   = useState<Cedis[]>([]);
  const [products,  setProducts]    = useState<StockProduct[]>([]);
  const [selected,  setSelected]    = useState<Cedis | null>(null);
  const [cart,      setCart]        = useState<Cart>({});
  const [search,    setSearch]      = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [loadingCedis,  setLoadingCedis]  = useState(true);
  const [loadingStock,  setLoadingStock]  = useState(false);
  const [submitting, setSubmitting]  = useState(false);
  const [success,   setSuccess]     = useState(false);
  const [error,     setError]       = useState<string | null>(null);

  const token = localStorage.getItem('or_token') ?? '';
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetch(`${API}/api/cedis`, { headers: h })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCedisList(Array.isArray(data) ? data : []))
      .finally(() => setLoadingCedis(false));
  }, []);

  const goToProducts = async () => {
    if (!selected) return;
    setLoadingStock(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/cedis/${selected.cedis_id}/stock`, { headers: h });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setProducts(Array.isArray(data.productos) ? data.productos : []);
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar inventario');
    } finally {
      setLoadingStock(false);
    }
  };

  const add    = (sku: string) => setCart(prev => ({ ...prev, [sku]: (prev[sku] ?? 0) + 1 }));
  const remove = (sku: string) => setCart(prev => {
    const next = { ...prev };
    if ((next[sku] ?? 0) <= 1) delete next[sku]; else next[sku]--;
    return next;
  });
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  /* Group products by category, respecting search filter */
  const grouped = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = products.filter(p => {
      const matchSearch = !q || p.nombre.toLowerCase().includes(q);
      const cat = getCategoria(p.nombre);
      const matchCat = activeCategory === 'Todos' || cat === activeCategory;
      return matchSearch && matchCat;
    });

    const map: Record<string, StockProduct[]> = {};
    filtered.forEach(p => {
      const cat = getCategoria(p.nombre);
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    });
    return map;
  }, [products, search, activeCategory]);

  const availableCategories = useMemo(() => {
    const cats = new Set(products.map(p => getCategoria(p.nombre)));
    return ['Todos', ...CATEGORY_ORDER.filter(c => cats.has(c))];
  }, [products]);

  const cartItems = products.filter(p => (cart[p.sku] ?? 0) > 0);
  const subtotal  = cartItems.reduce((s, p) => s + p.precio_unitario * cart[p.sku], 0);

  const handleConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/admin/inventory/restock`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          cedis_id: selected.cedis_id,
          items: cartItems.map(p => ({ sku: p.sku, cantidad: cart[p.sku] })),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as any)?.message ?? `Error ${res.status}`);
      }
      setSuccess(true);
      setCart({});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al procesar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(0); setSelected(null); setCart({});
    setProducts([]); setSuccess(false); setError(null);
  };

  if (loadingCedis) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#E61A27] rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Success screen ─────────────────────────────────────── */
  if (success) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Stock actualizado</h2>
        <p className="text-sm text-gray-400">
          Los productos fueron sumados al inventario de{' '}
          <span className="font-semibold text-gray-700">{selected?.nombre ?? selected?.cedis_id}</span>.
        </p>
        <button onClick={handleReset}
          className="mt-4 px-6 py-2.5 bg-[#E61A27] text-white text-sm font-semibold rounded-xl hover:bg-[#C9141A] transition-colors">
          Nuevo pedido de restock
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CEDIS — Restock de inventario</h1>
        <p className="text-sm text-gray-400 mt-0.5">Levanta un pedido de productos para actualizar el stock de un CEDIS</p>
      </div>

      <Steps current={step} />

      <AnimatePresence mode="wait">

        {/* ── STEP 0: Seleccionar CEDIS ───────────────────────── */}
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p className="text-sm font-medium text-gray-600 mb-4">¿A qué CEDIS le vas a surtir inventario?</p>
            {cedisList.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-16">Sin CEDIS registrados en la base de datos.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cedisList.map(c => {
                  const isActive = selected?.cedis_id === c.cedis_id;
                  return (
                    <button key={c.cedis_id} onClick={() => setSelected(c)}
                      className={`text-left p-5 rounded-xl border-2 transition-all hover:shadow-md ${
                        isActive ? 'border-[#E61A27] bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        {isActive && (
                          <div className="w-5 h-5 rounded-full bg-[#E61A27] flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="font-bold text-gray-900 text-sm">{c.nombre ?? `CEDIS ${c.cedis_id}`}</p>
                      {c.ciudad && <p className="text-xs text-gray-400 mt-0.5">{c.ciudad}</p>}
                      {c.direccion && <p className="text-xs text-gray-400 truncate">{c.direccion}</p>}
                      <span className="inline-block mt-2 text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                        ID {c.cedis_id}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg p-2.5 font-medium">{error}</div>
            )}
            <div className="mt-6 flex justify-end">
              <button onClick={goToProducts} disabled={!selected || loadingStock}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#E61A27] text-white text-sm font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#C9141A] transition-colors">
                {loadingStock ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Cargando...
                  </>
                ) : 'Siguiente →'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 1: Elegir productos ────────────────────────── */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {/* CEDIS badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-gray-400">Surtiendo a:</span>
              <span className="text-xs font-semibold bg-red-50 text-[#E61A27] border border-red-200 px-2.5 py-1 rounded-full">
                {selected?.nombre ?? `CEDIS ${selected?.cedis_id}`}
              </span>
              <button onClick={() => { setStep(0); setCart({}); setProducts([]); }}
                className="text-xs text-gray-400 hover:text-gray-600 underline">
                Cambiar
              </button>
            </div>

            {/* Search + category filters */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-5 space-y-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#E61A27] focus:border-[#E61A27]" />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
                {availableCategories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                      activeCategory === cat
                        ? 'bg-[#E61A27] text-white border-[#E61A27] shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}>
                    <span className="text-sm opacity-80">{CATEGORY_ICONS[cat] ?? '🏪'}</span>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Category carousels */}
            <div className="space-y-6">
              {CATEGORY_ORDER.filter(cat => grouped[cat]?.length > 0).map(cat => (
                <CategoryCarousel
                  key={cat}
                  category={cat}
                  products={grouped[cat]}
                  cart={cart}
                  onAdd={add}
                  onRemove={remove}
                />
              ))}
              {Object.keys(grouped).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-10">Sin resultados para "{search}"</p>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-between">
              <button onClick={() => { setStep(0); setCart({}); setProducts([]); }}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                ← Atrás
              </button>
              <button onClick={() => setStep(2)} disabled={totalItems === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#E61A27] text-white text-sm font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#C9141A] transition-colors">
                Ver resumen
                {totalItems > 0 && (
                  <span className="bg-white text-[#E61A27] text-xs font-bold px-1.5 py-0.5 rounded-full">{totalItems}</span>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Confirmar pedido ────────────────────────── */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex flex-col lg:flex-row gap-6 items-start">

              {/* Items list */}
              <div className="flex-1 w-full bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Productos seleccionados</p>
                </div>
                {cartItems.map(p => {
                  const qty = cart[p.sku] ?? 0;
                  const catIcon = CATEGORY_ICONS[getCategoria(p.nombre)] ?? '📦';
                  return (
                    <div key={p.sku} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {p.imagen_url
                          ? <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                          : <span className="text-xl">{catIcon}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{p.nombre}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Stock actual: {p.stock_disponible} uds.</p>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-0.5 shrink-0">
                        <button onClick={() => remove(p.sku)} className="w-6 h-6 rounded bg-white border border-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold hover:bg-gray-100">−</button>
                        <span className="text-sm font-bold font-mono w-5 text-center">{qty}</span>
                        <button onClick={() => add(p.sku)} className="w-6 h-6 rounded bg-[#E61A27] text-white flex items-center justify-center text-xs font-bold hover:bg-[#C9141A]">+</button>
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-16 text-right font-mono shrink-0">
                        ${(p.precio_unitario * qty).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Summary card */}
              <div className="w-full lg:w-80 shrink-0">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm sticky top-24 space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-2">
                    Resumen de pedido
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">CEDIS destino</p>
                    <p className="text-sm font-semibold text-gray-900">{selected?.nombre ?? `CEDIS ${selected?.cedis_id}`}</p>
                    {selected?.ciudad && <p className="text-xs text-gray-400">{selected.ciudad}</p>}
                    <span className="text-[10px] font-mono bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded">
                      ID {selected?.cedis_id}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {cartItems.map(p => (
                      <div key={p.sku} className="flex justify-between text-xs text-gray-600">
                        <span className="truncate mr-3">{p.nombre} <span className="font-mono text-gray-400">×{cart[p.sku]}</span></span>
                        <span className="font-medium shrink-0">${(p.precio_unitario * cart[p.sku]).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-3 space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Total de unidades</span>
                      <span className="font-mono font-bold text-gray-800">{totalItems} uds.</span>
                    </div>
                    {subtotal > 0 && (
                      <div className="flex justify-between">
                        <span>Costo estimado</span>
                        <span className="font-mono">${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg p-2.5 font-medium">{error}</div>
                  )}
                  <button onClick={handleConfirm} disabled={submitting || cartItems.length === 0}
                    className="w-full bg-[#E61A27] hover:bg-[#C9141A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Procesando...
                      </>
                    ) : 'Confirmar y actualizar stock'}
                  </button>
                  <button onClick={() => setStep(1)} className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    ← Volver a productos
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
