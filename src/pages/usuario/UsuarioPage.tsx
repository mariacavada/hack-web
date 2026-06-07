import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import { useCart } from './CartContext';
import { useProducts } from './ProductsContext';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const SUB_PREF_KEY = 'or_sub_prefs';

const STATUS_STEP: Record<string, number> = {
  'Pendiente': 0,
  'Confirmado': 1,
  'En preparación': 2,
  'En camino': 3,
  'Entregado': 4,
};
const STATUS_LABEL: Record<string, string> = {
  'Pendiente': 'Pedido recibido',
  'Confirmado': 'Confirmado',
  'En preparación': 'Preparando tu pedido',
  'En camino': 'Tu pedido está en camino',
  'Entregado': 'Entregado',
  'Cancelado': 'Cancelado',
};
const TIMELINE = ['Pendiente', 'Confirmado', 'En preparación', 'En camino', 'Entregado'];

const STATUS_BADGE: Record<string, string> = {
  'Pendiente':      'bg-yellow-100 text-yellow-700',
  'Confirmado':     'bg-blue-100 text-blue-700',
  'En preparación': 'bg-indigo-100 text-indigo-700',
  'En camino':      'bg-orange-100 text-orange-700',
  'Entregado':      'bg-green-100 text-green-700',
  'Incompleto':     'bg-amber-100 text-amber-700',
  'Cancelado':      'bg-gray-100 text-gray-500',
};

function normalizeStatus(raw: string): string {
  const map: Record<string, string> = {
    pendiente:        'Pendiente',
    confirmado:       'Confirmado',
    asignado:         'Confirmado',
    en_preparacion:   'En preparación',
    'en preparación': 'En preparación',
    preparando:       'En preparación',
    en_camino:        'En camino',
    'en camino':      'En camino',
    entregado:        'Entregado',
    incompleto:       'Incompleto',
    cancelado:        'Cancelado',
  };
  return map[raw?.toLowerCase()] ?? raw ?? 'Pendiente';
}

interface OrderItem { sku?: string; nombre?: string; cantidad: number; }
interface Order {
  id_pedido: string;
  status_final: string;
  total: number;
  items: OrderItem[];
  cedis_id?: string;
  fecha_pedido?: string;
  fecha_entrega?: string;
}
interface Notification { _id: string; leida: boolean; }

interface ReorderPattern {
  sku: string;
  nombre?: string;
  frecuencia_dias?: number;
  proximo_pedido?: string;
  confianza?: number;
}

interface StockAlert {
  sku: string;
  nombre?: string;
  dias_restantes?: number;
  nivel_riesgo?: string;
  recomendacion?: string;
}

interface SubstituteSuggestion {
  sku: string;
  nombre: string;
  score: number;
  razon: string;
}
interface SubPref {
  substitute_sku: string;
  substitute_nombre: string;
  saved_at: string;
}

function loadSubPrefs(): Record<string, SubPref> {
  try {
    return JSON.parse(localStorage.getItem(SUB_PREF_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveSubPref(original_sku: string, pref: SubPref) {
  const prefs = loadSubPrefs();
  prefs[original_sku] = pref;
  localStorage.setItem(SUB_PREF_KEY, JSON.stringify(prefs));
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function ActiveOrderCard({ order, index }: { order: Order; index: number }) {
  const navigate = useNavigate();
  const step = STATUS_STEP[order.status_final] ?? 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => navigate('/usuario/seguir')}
      className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-5 text-left shadow-sm hover:border-gray-300 hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_BADGE[order.status_final] ?? 'bg-gray-100 text-gray-600'}`}>
          {order.status_final}
        </span>
        <span className="text-xs font-mono text-gray-400">
          {order.id_pedido}
        </span>
      </div>
      <h2 className="text-base font-bold text-gray-900 leading-tight">
        {STATUS_LABEL[order.status_final] ?? order.status_final}
      </h2>
      <p className="text-sm text-gray-500 mt-0.5">
        {order.items?.length ?? 0} productos · ${order.total?.toLocaleString('es-MX')} MXN
      </p>
      <div className="flex gap-1 mt-4">
        {TIMELINE.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
              i <= step ? 'bg-[#E61A27]' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className="text-xs font-semibold text-[#E61A27] mt-2">Ver seguimiento →</p>
    </motion.button>
  );
}

function SubstitutionSheet({
  alert,
  cedisId,
  customerId,
  activeOrders,
  onSaved,
  onClose,
}: {
  alert: StockAlert;
  cedisId: string;
  customerId: string;
  activeOrders: Order[];
  onSaved: (original_sku: string, pref: SubPref) => void;
  onClose: () => void;
}) {
  const [suggestions, setSuggestions] = useState<SubstituteSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const token = localStorage.getItem('or_token');

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/ml/substitution/suggest`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: customerId,
        original_sku: alert.sku,
        cedis_id: cedisId,
      }),
    })
      .then(r => (r.ok ? r.json() : []))
      .then(data => setSuggestions(Array.isArray(data) ? data : []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [token, customerId, alert.sku, cedisId]);

  const handlePick = async (suggestion: SubstituteSuggestion) => {
    setSaving(suggestion.sku);
    const pref: SubPref = {
      substitute_sku: suggestion.sku,
      substitute_nombre: suggestion.nombre,
      saved_at: new Date().toISOString(),
    };
    saveSubPref(alert.sku, pref);

    if (token) {
      const ordersWithSku = activeOrders.filter(o =>
        o.items.some(i => i.sku === alert.sku),
      );
      await Promise.all(
        ordersWithSku.map(o =>
          fetch(`${API}/api/orders/${o.id_pedido}/substitution`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              original_sku: alert.sku,
              substitute_sku: suggestion.sku,
              accepted: true,
            }),
          }).catch(() => {}),
        ),
      );
    }

    onSaved(alert.sku, pref);
    onClose();
  };

  const riskColor: Record<string, string> = {
    critico: 'text-red-600',
    alto: 'text-orange-600',
    medio: 'text-yellow-600',
  };
  const risk = alert.nivel_riesgo?.toLowerCase() ?? 'medio';

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black z-40"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'tween', duration: 0.26 }}
        className="fixed bottom-0 left-0 right-0 max-h-[88dvh] bg-white rounded-t-3xl shadow-xl z-50 flex flex-col"
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pt-3 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p
                className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  riskColor[risk] ?? 'text-yellow-600'
                }`}
              >
                Stock bajo ·{' '}
                {alert.dias_restantes != null
                  ? `${alert.dias_restantes} días restantes`
                  : alert.nivel_riesgo}
              </p>
              <h2 className="text-base font-bold text-gray-900 leading-snug">
                Elige un sustituto para
              </h2>
              <p className="text-sm text-gray-500 truncate mt-0.5">{alert.nombre ?? alert.sku}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0 mt-1"
            >
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No hay sustitutos disponibles por ahora.
            </p>
          ) : (
            suggestions.map((s, i) => (
              <motion.button
                key={s.sku || i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handlePick(s)}
                disabled={saving !== null}
                className="w-full flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left hover:border-[#E61A27]/30 hover:bg-red-50/30 transition-all disabled:opacity-60"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.nombre}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{s.razon}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full tabular-nums">
                    {Math.round(s.score * 100)}%
                  </span>
                  {saving === s.sku ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-[#E61A27] rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="w-4 h-4 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </motion.button>
            ))
          )}
        </div>

        <div className="px-5 pb-8 pt-2 shrink-0">
          <button
            onClick={onClose}
            className="w-full h-11 border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 transition-colors text-sm"
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    </>
  );
}

const quickLinks = [
  {
    path: '/usuario/pedidos',
    label: 'Mis pedidos',
    sub: 'Historial completo',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    ),
    color: 'bg-violet-50 text-violet-600',
  },
  {
    path: '/usuario/seguir',
    label: 'Seguimiento',
    sub: '¿Dónde está mi pedido?',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0M3 7h18M3 7l2-4h14l2 4M3 7v10h1m15 0h1V7"
      />
    ),
    color: 'bg-orange-50 text-orange-600',
  },
];

export default function UsuarioPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAllActives, setShowAllActives] = useState(false);

  const { add } = useCart();
  const { products, loading: productsLoading } = useProducts();
  const [reorderPatterns, setReorderPatterns] = useState<ReorderPattern[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [subPrefs, setSubPrefs] = useState<Record<string, SubPref>>(loadSubPrefs);
  const [selectedAlert, setSelectedAlert] = useState<StockAlert | null>(null);
  const [cedisId, setCedisId] = useState<string | null>(null);
  const [recommendationAdded, setRecommendationAdded] = useState(false);
  const mlFetchedRef = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('or_token');
    if (!token) {
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/orders/my`, { headers }).then(r => (r.ok ? r.json() : [])),
      fetch(`${API}/api/notifications`, { headers }).then(r => (r.ok ? r.json() : [])),
    ])
      .then(([rawOrders, notifs]: [any[], Notification[]]) => {
        if (Array.isArray(rawOrders)) {
          const orders: Order[] = rawOrders.map(o => ({
            ...o,
            status_final:  normalizeStatus(o.status_final ?? 'pendiente'),
            fecha_pedido:  o.fecha_pedido ?? o.createdAt ?? undefined,
            fecha_entrega: o.fecha_entrega ?? undefined,
          }));
          const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
          const actives = orders
            .filter(o => {
              if (['Entregado', 'Cancelado', 'Incompleto'].includes(o.status_final)) return false;
              const d = o.fecha_entrega ?? o.fecha_pedido;
              return !!d && new Date(d) >= todayStart;
            })
            .sort((a, b) => {
              const da = a.fecha_entrega ?? a.fecha_pedido;
              const db = b.fecha_entrega ?? b.fecha_pedido;
              if (!da && !db) return 0;
              if (!da) return 1;
              if (!db) return -1;
              return new Date(da).getTime() - new Date(db).getTime();
            });
          setActiveOrders(actives);
          if (actives.length === 0 && orders.length > 0) setLastOrder(orders[0]);
          const cid = orders.find(o => o.cedis_id)?.cedis_id ?? null;
          setCedisId(cid);
        }
        if (Array.isArray(notifs)) setUnread(notifs.filter(n => !n.leida).length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (mlFetchedRef.current || !cedisId || !user?.id) return;
    mlFetchedRef.current = true;

    const token = localStorage.getItem('or_token');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    Promise.all([
      fetch(`${API}/api/ml/reorder-pattern/customer`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ customer_id: user.id }),
      })
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null),

      fetch(`${API}/api/ml/stock-predict/cedis`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ cedis_id: cedisId }),
      })
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([patterns, stock]) => {
      const patternList: ReorderPattern[] = Array.isArray(patterns)
        ? patterns
        : patterns
        ? [patterns]
        : [];

      const upcoming = patternList
        .filter(p => {
          const date = p.proximo_pedido;
          if (!date) return false;
          const days = daysUntil(date);
          return days >= -1 && days <= 7 && (p.confianza ?? 1) > 0.4;
        })
        .sort((a, b) => daysUntil(a.proximo_pedido!) - daysUntil(b.proximo_pedido!));
      setReorderPatterns(upcoming);

      const stockList: StockAlert[] = Array.isArray(stock) ? stock : stock ? [stock] : [];
      const userSkus = new Set(patternList.map(p => p.sku));
      const alerts = stockList
        .filter(s => {
          const risk = s.nivel_riesgo?.toLowerCase() ?? '';
          const isRisky = ['critico', 'alto', 'medio'].includes(risk);
          const isRelevant = userSkus.size === 0 || userSkus.has(s.sku);
          return isRisky && isRelevant;
        })
        .sort((a, b) => (a.dias_restantes ?? 99) - (b.dias_restantes ?? 99))
        .slice(0, 3);
      setStockAlerts(alerts);
    });
  }, [cedisId, user?.id]);

  useEffect(() => {
    setRecommendationAdded(false);
  }, [reorderPatterns]);

  const recommendedProducts = useMemo(() => {
    const seen = new Set<string>();
    return reorderPatterns
      .map((pattern) => {
        const product = products.find((p) => p.sku === pattern.sku);
        return product ? { pattern, product } : null;
      })
      .filter((item): item is { pattern: ReorderPattern; product: { sku: string; nombre: string; precio: number; categoria: string } } => item !== null)
      .filter((item) => {
        if (seen.has(item.pattern.sku)) return false;
        seen.add(item.pattern.sku);
        return true;
      });
  }, [products, reorderPatterns]);

  const handleAddRecommendedToCart = () => {
    if (recommendedProducts.length === 0) return;
    recommendedProducts.forEach(({ product }) => add(product));
    setRecommendationAdded(true);
  };

  const firstName = user?.nombre?.split(' ')[0] ?? 'Usuario';
  const riskBg: Record<string, string> = {
    critico: 'border-red-200 bg-red-50',
    alto: 'border-orange-200 bg-orange-50',
    medio: 'border-yellow-200 bg-yellow-50',
  };
  const riskText: Record<string, string> = {
    critico: 'text-red-700',
    alto: 'text-orange-700',
    medio: 'text-yellow-700',
  };
  const riskBadge: Record<string, string> = {
    critico: 'bg-red-100 text-red-700',
    alto: 'bg-orange-100 text-orange-700',
    medio: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium">Bienvenido de vuelta</p>
            <h1 className="text-2xl font-bold text-gray-900">{firstName}</h1>
          </div>
          {unread > 0 && (
            <button
              onClick={() => navigate('/usuario/perfil')}
              className="relative mt-1 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:border-gray-300 transition-colors shadow-sm"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E61A27] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white tabular-nums">
                {unread}
              </span>
            </button>
          )}
        </div>

        {recommendedProducts.length > 0 && !productsLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-yellow-600">
                  Recomendación ML
                </p>
                <h2 className="text-lg font-semibold text-gray-900 mt-1">
                  Te recomendamos hacer un pedido
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  En base a tus pedidos pasados te recomendamos hacer el siguiente pedido.
                </p>
              </div>
              <button
                onClick={handleAddRecommendedToCart}
                disabled={recommendationAdded}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${
                  recommendationAdded
                    ? 'bg-gray-200 text-gray-600 cursor-default'
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
              >
                {recommendationAdded ? 'Agregados al carrito' : 'Agregar recomendados'}
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {recommendedProducts.slice(0, 3).map(({ pattern, product }) => (
                <div key={pattern.sku} className="rounded-2xl border border-yellow-100 bg-white p-3">
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.nombre}</p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Próximo pedido estimado: {pattern.proximo_pedido ? new Date(pattern.proximo_pedido).toLocaleDateString('es-MX') : 'Próximamente'}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 h-40 animate-pulse" />
        ) : activeOrders.length > 0 ? (
          <div className="space-y-3">
            {(showAllActives ? activeOrders : activeOrders.slice(0, 3)).map((order, i) => (
              <ActiveOrderCard key={order.id_pedido} order={order} index={i} />
            ))}
            {activeOrders.length > 3 && (
              <button
                onClick={() => setShowAllActives(v => !v)}
                className="w-full text-sm font-semibold text-[#E61A27] py-2 hover:opacity-80 transition-opacity"
              >
                {showAllActives ? 'Ver menos' : `Ver ${activeOrders.length - 3} pedido${activeOrders.length - 3 !== 1 ? 's' : ''} más`}
              </button>
            )}
          </div>
        ) : lastOrder ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-green-200 p-5 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Último pedido entregado</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {lastOrder.id_pedido} · ${lastOrder.total?.toLocaleString('es-MX')} MXN
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold text-sm">Sin pedidos activos</p>
            <p className="text-gray-400 text-xs mt-1">¡Haz tu primer pedido!</p>
          </motion.div>
        )}

        <AnimatePresence>
          {reorderPatterns.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3"
            >
              <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-0.5">
                  Sugerencia de pedido
                </p>
                <p className="text-sm font-semibold text-indigo-900 leading-snug">
                  Basado en tu historial, es hora de pedir
                  {reorderPatterns[0].nombre ? ` ${reorderPatterns[0].nombre}` : ''}
                  {reorderPatterns[0].proximo_pedido
                    ? ` ${daysUntil(reorderPatterns[0].proximo_pedido) <= 0
                        ? 'hoy'
                        : daysUntil(reorderPatterns[0].proximo_pedido) === 1
                        ? 'mañana'
                        : `en ${daysUntil(reorderPatterns[0].proximo_pedido)} días`}`
                    : ''}
                  .
                </p>
                {reorderPatterns.length > 1 && (
                  <p className="text-xs text-indigo-500 mt-0.5">
                    +{reorderPatterns.length - 1} producto
                    {reorderPatterns.length > 2 ? 's' : ''} más
                  </p>
                )}
                <button
                  onClick={() => navigate('/usuario/tienda')}
                  className="mt-2 text-xs font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
                >
                  Hacer pedido ahora →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {stockAlerts.length > 0 && (
            <motion.div className="space-y-2">
              {stockAlerts.map((alert, i) => {
                const risk = alert.nivel_riesgo?.toLowerCase() ?? 'medio';
                const existingPref = subPrefs[alert.sku];
                return (
                  <motion.div
                    key={alert.sku}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`border rounded-2xl p-4 flex items-start gap-3 ${
                      riskBg[risk] ?? 'border-yellow-200 bg-yellow-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        riskBadge[risk] ?? 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77 1.333-2.694 1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${
                          riskText[risk] ?? 'text-yellow-700'
                        }`}
                      >
                        Posible falta de stock
                      </p>
                      <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
                        {alert.nombre ?? alert.sku}
                      </p>
                      {alert.dias_restantes != null && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Stock estimado: ~{alert.dias_restantes} día
                          {alert.dias_restantes !== 1 ? 's' : ''}
                        </p>
                      )}
                      {existingPref ? (
                        <div className="flex items-center gap-1.5 mt-2">
                          <svg
                            className="w-3.5 h-3.5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-xs text-green-700 font-semibold">
                            Sustituto: {existingPref.substitute_nombre}
                          </p>
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="text-xs text-gray-400 hover:text-gray-600 underline ml-1"
                          >
                            cambiar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedAlert(alert)}
                          className={`mt-2 text-xs font-bold ${
                            riskText[risk] ?? 'text-yellow-700'
                          } hover:opacity-80 transition-opacity`}
                        >
                          Elegir sustituto →
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate('/usuario/tienda')}
          className="w-full bg-[#E61A27] hover:bg-[#C9141A] text-white font-bold py-4 rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-2 text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Hacer un pedido
        </motion.button>

        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map(item => (
            <motion.button
              key={item.path}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.path)}
              className="bg-white border border-gray-100 rounded-2xl p-4 text-left hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div className={`w-9 h-9 ${item.color} rounded-xl flex items-center justify-center mb-3`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  {item.icon}
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedAlert && cedisId && user?.id && (
          <SubstitutionSheet
            alert={selectedAlert}
            cedisId={cedisId}
            customerId={user.id}
            activeOrders={activeOrders}
            onSaved={(sku, pref) => setSubPrefs(prev => ({ ...prev, [sku]: pref }))}
            onClose={() => setSelectedAlert(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}