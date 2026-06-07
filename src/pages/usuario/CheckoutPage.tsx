import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { mockProducts } from "./MockProducts";
import { useCart } from "./CartContext";
import { useAuth } from "../../auth/AuthContext";
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

// ── Editable quantity input ───────────────────────────────────────────────────
function QtyInput({ qty, onCommit }: { qty: number; onCommit: (n: number) => void }) {
  const [val, setVal] = useState(String(qty));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setVal(String(qty)); }, [qty]);

  const commit = () => {
    const n = parseInt(val, 10);
    if (!n || n < 1 || !isFinite(n)) { setVal(String(qty)); return; }
    const capped = Math.min(n, 999);
    setVal(String(capped));
    if (capped !== qty) onCommit(capped);
  };

  return (
    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-1 py-0.5 shrink-0">
      <button
        onClick={() => onCommit(Math.max(1, qty - 1))}
        className="w-6 h-6 rounded-lg bg-white border border-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold hover:bg-gray-100 transition-colors"
      >
        −
      </button>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={val}
        onChange={e => { if (/^\d*$/.test(e.target.value)) setVal(e.target.value); }}
        onBlur={commit}
        onKeyDown={e => e.key === 'Enter' && commit()}
        className="w-8 text-xs font-bold font-mono text-center text-gray-800 bg-transparent focus:outline-none"
        aria-label="Cantidad"
      />
      <button
        onClick={() => onCommit(Math.min(999, qty + 1))}
        className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center text-sm font-bold hover:bg-red-700 transition-colors"
      >
        +
      </button>
    </div>
  );
}

interface ConfirmModalProps {
  onClose: () => void;
}

function ConfirmModal({ onClose }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black"
        onClick={onClose}
      />
      
      {/* Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl relative z-10 border border-gray-200"
      >
        <span className="text-5xl block mb-3">🎉</span>
        <h2 className="text-lg font-bold text-gray-900 mb-1.5">¡Pedido realizado con éxito!</h2>
        <p className="text-gray-500 text-xs mb-5 leading-relaxed">
          Tu orden fue registrada correctamente en la plataforma. Puedes dar seguimiento al despacho desde tu panel de historial.
        </p>
        <button
          onClick={onClose}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors shadow-sm"
        >
          Ver mis pedidos
        </button>
      </motion.div>
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, changeQty, clear } = useCart();
  const { user } = useAuth(); // Consumo del estado global de autenticación

  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mapeo y filtrado de productos activos en el carrito
  const items = mockProducts.filter((p) => (cart[p.sku] ?? 0) > 0);
  const subtotal = items.reduce((sum, p) => sum + p.precio * (cart[p.sku] ?? 0), 0);

  const handleRealizarPedido = async () => {
    setLoading(true);
    setError(null);

    if (!user || !user.token) {
      setError("No hay una sesión activa. Por favor inicia sesión.");
      setLoading(false);
      return;
    }

    const orderItems = items.map((p) => ({
      sku: p.sku,
      nombre: p.nombre,
      cantidad: cart[p.sku] ?? 0,
    }));

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`, // Inyección limpia del token JWT verificado
        },
        body: JSON.stringify({
          cedis_id: "3012",
          subtotal,
          total: subtotal,
          items: orderItems,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? `Error en el servidor (${res.status})`);
      }

      setShowConfirm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar la compra.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseConfirm = () => {
    setShowConfirm(false);
    clear(); // Resetea el carrito global
    navigate("/usuario/pedidos"); // Redirección al historial nativo superior
  };

  // Estado vacío estructurado (Empty State)
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 text-center px-4">
        <svg className="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h2 className="mt-4 text-base font-bold text-gray-900">Tu carrito está vacío</h2>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">Agrega productos líquidos e insumos desde la tienda antes de proceder.</p>
        <button
          onClick={() => navigate("/usuario/tienda")}
          className="mt-5 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors shadow-sm"
        >
          Regresar al catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased px-4 md:px-8 py-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Botón de retorno técnico */}
        <button
          onClick={() => navigate("/usuario/tienda")}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors mb-4"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Volver a la tienda
        </button>

        <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-5">Revisión de tu pedido</h1>

        <div className="flex flex-col lg:flex-row gap-5 items-start">

          {/* Columna Izquierda: Lista limpia de artículos */}
          <div className="flex-1 w-full bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
            {items.map((p) => {
              const qty = cart[p.sku] ?? 0;
              return (
                <div key={p.sku} className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                  <span className="text-2xl shrink-0 select-none">{p.emoji ?? "🥤"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{p.nombre}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">${p.precio.toFixed(2)} c/u</p>
                  </div>
                  
                  {/* Editable quantity */}
                  <QtyInput
                    qty={qty}
                    onCommit={n => changeQty(p.sku, n - qty)}
                  />
                  
                  <span className="text-xs font-bold text-gray-900 w-16 text-right shrink-0 font-mono">
                    ${(p.precio * qty).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Columna Derecha: Tarjeta de Resumen (Clean & Light Surface) */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm sticky top-24 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-2">
                Resumen de Compra
              </h2>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {items.map((p) => (
                  <div key={p.sku} className="flex justify-between text-xs text-gray-600">
                    <span className="truncate mr-3">
                      {p.nombre} <span className="font-mono text-gray-400">x{cart[p.sku]}</span>
                    </span>
                    <span className="font-medium shrink-0">${(p.precio * (cart[p.sku] ?? 0)).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Logística de Envío</span>
                  <span className="text-green-600 font-semibold uppercase text-[10px]">Sin Costo</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
                <span className="font-bold text-xs text-gray-900">Total Neto</span>
                <div className="text-right">
                  <span className="font-extrabold text-lg text-gray-900 font-mono">
                    ${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 block -mt-1">MXN</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl p-2.5 font-medium leading-normal">
                  {error}
                </div>
              )}

              <button
                onClick={handleRealizarPedido}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="flex items-center gap-1.5">
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span>Procesando...</span>
                  </div>
                ) : (
                  "Confirmar Pedido"
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Modal controlado por Framer Motion */}
      <AnimatePresence>
        {showConfirm && <ConfirmModal onClose={handleCloseConfirm} />}
      </AnimatePresence>
    </div>
  );
}