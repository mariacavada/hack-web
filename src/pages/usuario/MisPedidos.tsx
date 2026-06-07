import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { useCart } from './CartContext';
import { useProducts } from './ProductsContext';
import type { Product } from './types';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

interface OrderItem {
  sku?: string;
  nombre: string;
  cantidad: number;
  precio_unitario?: number;
}

interface Order {
  id_pedido: string;
  fecha_pedido: string;
  status_final: string;
  subtotal: number;
  total: number;
  items: OrderItem[];
  direccion_entrega?: string;
  repartidor?: { nombre: string; vehiculo?: string };
  tracking?: { status: string; timestamp: string; descripcion: string }[];
}

const ACTIVE_STATUSES = ['Pendiente', 'Confirmado', 'En preparación', 'En camino']

function normalizeStatus(raw: string): string {
  const map: Record<string, string> = {
    pendiente: 'Pendiente', confirmado: 'Confirmado', asignado: 'Confirmado',
    en_preparacion: 'En preparación', 'en preparación': 'En preparación',
    en_camino: 'En camino', 'en camino': 'En camino',
    entregado: 'Entregado', incompleto: 'Entregado', cancelado: 'Cancelado',
  }
  const key = (raw ?? '').toLowerCase().replace(/ /g, '_')
  return map[key] ?? map[(raw ?? '').toLowerCase()] ?? raw
}

function groupItems(items: OrderItem[]): OrderItem[] {
  const map = new Map<string, OrderItem>()
  for (const item of items) {
    const key = item.sku ?? item.nombre
    const ex = map.get(key)
    if (ex) map.set(key, { ...ex, cantidad: ex.cantidad + item.cantidad })
    else map.set(key, { ...item })
  }
  return Array.from(map.values())
}

const STATUS_BADGE: Record<string, string> = {
  'Pendiente':      'bg-yellow-100 text-yellow-700',
  'Confirmado':     'bg-blue-100 text-blue-700',
  'En preparación': 'bg-indigo-100 text-indigo-700',
  'En camino':      'bg-orange-100 text-orange-700',
  'Entregado':      'bg-green-100 text-green-700',
  'Cancelado':      'bg-red-100 text-red-600',
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0M3 7h18M3 7l2-4h14l2 4M3 7v10h1m15 0h1V7" />
    </svg>
  )
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Order detail drawer ───────────────────────────────────────────────────────
function OrderDrawer({
  order,
  onClose,
  onRepeat,
}: {
  order: Order
  onClose: () => void
  onRepeat: (order: Order) => void
}) {
  const grouped = useMemo(() => groupItems(order.items), [order])
  const canRepeat = ['Entregado', 'Cancelado'].includes(order.status_final)

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black z-40"
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'tween', duration: 0.26 }}
        className="fixed bottom-0 left-0 right-0 max-h-[88dvh] bg-white rounded-t-3xl shadow-xl z-50 flex flex-col overflow-y-auto"
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">{order.id_pedido}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{fmtDate(order.fecha_pedido)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[order.status_final] ?? 'bg-gray-100 text-gray-600'}`}>
              {order.status_final}
            </span>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="px-5 py-4 flex-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Artículos</p>
          {grouped.map((item, i) => (
            <div key={i} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-800 truncate flex-1 mr-3">{item.nombre}</span>
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-xs text-gray-400 tabular-nums">×{item.cantidad}</span>
                {item.precio_unitario != null && (
                  <span className="text-sm font-semibold text-gray-900 tabular-nums w-16 text-right">
                    ${(item.cantidad * item.precio_unitario).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          ))}
          {order.total > 0 && (
            <div className="flex justify-between pt-3 mt-1 border-t border-gray-200">
              <span className="text-sm font-bold text-gray-700">Total</span>
              <span className="text-sm font-bold text-gray-900 tabular-nums">
                ${order.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-8 pt-2 shrink-0 space-y-2">
          {canRepeat && (
            <button
              onClick={() => onRepeat(order)}
              className="w-full h-12 bg-[#E61A27] hover:bg-[#C9141A] text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Repetir este pedido
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full h-11 border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 transition-colors text-sm"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </>
  )
}

// ── Repeat confirm sheet ──────────────────────────────────────────────────────
function RepeatConfirmSheet({
  order,
  products,
  onConfirm,
  onCancel,
}: {
  order: Order
  products: Product[]
  onConfirm: () => void
  onCancel: () => void
}) {
  const grouped = useMemo(() => groupItems(order.items), [order])
  const matchedItems = useMemo(() =>
    grouped.map(item => ({
      ...item,
      product:
        products.find(p => p.sku === item.sku) ??
        products.find(p => p.nombre.toLowerCase() === item.nombre.toLowerCase()),
    })),
  [grouped, products])
  const unavailableCount = matchedItems.filter(i => !i.product).length

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
        onClick={onCancel}
        className="fixed inset-0 bg-black z-[60]"
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'tween', duration: 0.24 }}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-xl z-[70] px-5 pb-8 pt-4"
      >
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-1">¿Repetir este pedido?</h2>
        <p className="text-sm text-gray-400 mb-4">
          {grouped.length} producto{grouped.length !== 1 ? 's' : ''} se agregarán al carrito.
          {unavailableCount > 0 && (
            <span className="text-orange-500 font-semibold"> {unavailableCount} podrían no estar disponibles.</span>
          )}
        </p>

        <div className="bg-gray-50 rounded-2xl p-4 mb-5 max-h-44 overflow-y-auto space-y-1.5">
          {matchedItems.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className={`truncate mr-3 ${item.product ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                {item.nombre}
              </span>
              <span className="text-gray-400 tabular-nums shrink-0">×{item.cantidad}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onConfirm}
          className="w-full h-12 bg-[#E61A27] hover:bg-[#C9141A] text-white font-bold rounded-2xl transition-colors mb-2"
        >
          Agregar al carrito e ir a checkout
        </button>
        <button
          onClick={onCancel}
          className="w-full h-11 border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 transition-colors text-sm"
        >
          Cancelar
        </button>
      </motion.div>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MisPedidosPage() {
  const navigate             = useNavigate()
  const { user }             = useAuth()
  const { changeQty, clear } = useCart()
  const { products }         = useProducts()

  const [orders, setOrders]       = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [repeatTarget, setRepeatTarget]   = useState<Order | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('or_token')
    if (!token) { setIsLoading(false); return; }
    fetch(`${API}/api/orders/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error('Error al cargar pedidos'); return r.json(); })
      .then((data: any[]) => {
        setOrders((data ?? []).map(o => ({
          id_pedido:         o.id_pedido ?? o._id,
          fecha_pedido:      o.fecha_pedido ?? o.createdAt ?? new Date().toISOString(),
          status_final:      normalizeStatus(o.status_final ?? 'pendiente'),
          subtotal:          o.subtotal ?? o.SubTotal ?? o.total ?? 0,
          total:             o.total ?? o.Total ?? o.subtotal ?? 0,
          items:             (o.items ?? []).map((i: any) => ({
            sku:             i.sku,
            nombre:          i.nombre ?? i.name ?? i.sku ?? 'Producto',
            cantidad:        i.cantidad ?? i.quantity ?? 1,
            precio_unitario: i.precio_unitario ?? i.precio ?? i.price,
          })),
          direccion_entrega: o.direccion_entrega ?? o.direccion ?? null,
          repartidor:        o.repartidor ?? null,
          tracking:          o.tracking ?? [],
        })))
      })
      .catch(e => setError(e.message))
      .finally(() => setIsLoading(false))
  }, [user])

  const activeOrders   = useMemo(() => orders.filter(o => ACTIVE_STATUSES.includes(o.status_final)), [orders])
  const previousOrders = useMemo(() => orders.filter(o => !ACTIVE_STATUSES.includes(o.status_final)), [orders])

  const handleRepeatConfirm = (order: Order) => {
    clear()
    for (const item of groupItems(order.items)) {
      const product =
        products.find(p => p.sku === item.sku) ??
        products.find(p => p.nombre.toLowerCase() === item.nombre.toLowerCase())
      if (product) {
        changeQty(product.sku, item.cantidad)
      }
    }
    setRepeatTarget(null)
    setSelectedOrder(null)
    navigate('/usuario/tienda/checkout')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mis pedidos</h1>
          <button
            onClick={() => navigate('/usuario/tienda')}
            className="flex items-center gap-1.5 bg-[#E61A27] hover:bg-[#C9141A] text-white text-sm font-bold px-4 py-2 rounded-full transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl p-4 mb-4">{error}</div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            <div className="h-5 w-24 bg-gray-200 rounded-full animate-pulse mt-4" />
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {[0, 1, 2].map(i => <div key={i} className="h-16 animate-pulse border-b border-gray-50 last:border-0" />)}
            </div>
          </div>
        ) : (
          <div className="space-y-6">

            {/* En curso */}
            {activeOrders.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-gray-900 mb-3">En curso</h2>
                <div className="space-y-3">
                  {activeOrders.map((order, idx) => (
                    <motion.button
                      key={order.id_pedido}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => navigate('/usuario/seguir')}
                      className="w-full flex items-center gap-4 bg-white border-2 border-[#E61A27] rounded-2xl p-4 text-left hover:bg-red-50/30 transition-colors shadow-sm"
                    >
                      <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                        <TruckIcon className="w-6 h-6 text-[#E61A27]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-gray-900">{order.id_pedido}</span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status_final] ?? 'bg-gray-100 text-gray-600'}`}>
                            {order.status_final}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {groupItems(order.items).length} producto{groupItems(order.items).length !== 1 ? 's' : ''} · llega hoy
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                  ))}
                </div>
              </section>
            )}

            {/* Anteriores */}
            {previousOrders.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-gray-900 mb-3">Anteriores</h2>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
                  {previousOrders.map((order, idx) => {
                    const grouped = groupItems(order.items)
                    return (
                      <motion.button
                        key={order.id_pedido}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => setSelectedOrder(order)}
                        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                          <BoxIcon className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900">{order.id_pedido}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {fmtDate(order.fecha_pedido)} · {grouped.length} producto{grouped.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-sm font-bold text-gray-900 tabular-nums">
                            ${order.total.toLocaleString('es-MX')}
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status_final] ?? 'bg-gray-100 text-gray-600'}`}>
                            {order.status_final}
                          </span>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Empty state */}
            {activeOrders.length === 0 && previousOrders.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <BoxIcon className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-900 font-semibold text-sm">Sin pedidos aún</p>
                <p className="text-gray-400 text-xs mt-1">¡Haz tu primer pedido!</p>
                <button
                  onClick={() => navigate('/usuario/tienda')}
                  className="mt-4 bg-[#E61A27] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#C9141A] transition-colors"
                >
                  Ir a la tienda
                </button>
              </div>
            )}

            {/* Repetir un pedido anterior */}
            {previousOrders.length > 0 && (
              <button
                onClick={() => setSelectedOrder(previousOrders[0])}
                className="w-full py-4 text-center text-sm font-bold text-gray-700 hover:text-[#E61A27] transition-colors"
              >
                Repetir un pedido anterior
              </button>
            )}
          </div>
        )}
      </div>

      {/* Drawers */}
      <AnimatePresence>
        {selectedOrder && !repeatTarget && (
          <OrderDrawer
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onRepeat={order => setRepeatTarget(order)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {repeatTarget && (
          <RepeatConfirmSheet
            order={repeatTarget}
            products={products}
            onConfirm={() => handleRepeatConfirm(repeatTarget)}
            onCancel={() => setRepeatTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
