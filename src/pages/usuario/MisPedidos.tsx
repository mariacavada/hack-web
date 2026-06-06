import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from "react-router";

// --- TYPES & INTERFACES ---
interface OrderItem {
  sku: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
}

interface TrackingUpdate {
  status: string;
  timestamp: string;
  descripcion: string;
}

interface Order {
  id_pedido: string;
  fecha_pedido: string;
  status_final: 'Pendiente' | 'Confirmado' | 'En preparación' | 'En camino' | 'Entregado' | 'Cancelado';
  subtotal: number;
  total: number;
  cedis_id: string;
  items: OrderItem[];
  tracking: TrackingUpdate[];
  direccion_entrega?: string;
  repartidor?: {
    nombre: string;
    vehiculo: string;
  };
}

interface SummaryData {
  totalPedidos: number;
  totalGastado: number;
  pedidoRecienteText: string;
  productoMasComprado: string;
}

interface TopProduct {
  nombre: string;
  cantidad: number;
}

// --- MAIN COMPONENT ---
export default function MisPedidosPage() {
const navigate = useNavigate();
  // State variables
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'7' | '30' | '90' | 'todo'>('todo');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [amountFilter, setAmountFilter] = useState<'todos' | 'under500' | '500-1000' | 'over1000'>('todos');

  // --- API FETCHING ---
  useEffect(() => {
    async function fetchOrders() {
      setIsLoading(true);
      setError(null);
      try {
        // Replace with your real token strategy (e.g., localStorage, Context, cookie)
        const token = localStorage.getItem('token_usuario') || ''; 
        
        const response = await fetch('https://hack-back.up.railway.app/api/orders/my', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Hubo un error al recuperar tu historial de pedidos.');
        }

        const data = await response.json();
        
        // Mock fallback data structures if live API is missing granular tracking/items schemas
        const normalizedData = (data || []).map((order: any, idx: number) => ({
          id_pedido: order.id_pedido || `ORD-${10234 + idx}`,
          fecha_pedido: order.fecha_pedido || new Date(Date.now() - idx * 24 * 60 * 60 * 1000).toISOString(),
          status_final: order.status_final || 'Entregado',
          subtotal: order.SubTotal || order.subtotal || 0,
          total: order.Total || order.total || 0,
          cedis_id: order.cedis || order.cedis_id || '3012',
          items: order.items || [
            { sku: 'SKU-001', nombre: 'Coca-Cola Original 600ml', cantidad: 12, precio_unitario: 17.50 },
            { sku: 'SKU-002', nombre: 'Agua Purificada Ciel 1L', cantidad: 6, precio_unitario: 12.00 }
          ],
          tracking: order.tracking || [
            { status: 'Pendiente', timestamp: '10:15 AM', descripcion: 'Pedido registrado en la plataforma.' },
            { status: 'Confirmado', timestamp: '10:22 AM', descripcion: 'Pedido verificado e inventario asignado.' },
            { status: order.status_final || 'Entregado', timestamp: '11:45 AM', descripcion: 'Operación concluida de forma correcta.' }
          ],
          direccion_entrega: order.direccion_entrega || 'Av. Paseo de la Reforma 222, Interior 4B, CDMX',
          repartidor: order.repartidor || { nombre: 'Carlos Ramírez', vehiculo: 'Moto (Placas: 72XYZ)' }
        }));

        setOrders(normalizedData);
      } catch (err: any) {
        setError(err.message || 'Error de conexión.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, []);

  // --- STATS & INSIGHTS ANALYTICS CALCULATIONS ---
  const summaryMetrics = useMemo<SummaryData>(() => {
    if (orders.length === 0) {
      return { totalPedidos: 0, totalGastado: 0, pedidoRecienteText: 'Sin pedidos', productoMasComprado: 'N/A' };
    }

    const totalPedidos = orders.length;
    const totalGastado = orders.reduce((sum, order) => sum + order.total, 0);

    // Get most recent order date description
    const recentOrder = orders[0];
    let pedidoRecienteText = 'Hoy';
    if (recentOrder?.fecha_pedido) {
      const diffTime = Math.abs(Date.now() - new Date(recentOrder.fecha_pedido).getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      pedidoRecienteText = diffDays === 0 ? 'Hoy' : diffDays === 1 ? 'Ayer' : `Hace ${diffDays} días`;
    }

    // Product frequency aggregation
    const productCounts: { [key: string]: number } = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        productCounts[item.nombre] = (productCounts[item.nombre] || 0) + item.cantidad;
      });
    });
    
    let productoMasComprado = 'Ninguno';
    let maxQty = 0;
    Object.entries(productCounts).forEach(([name, qty]) => {
      if (qty > maxQty) {
        maxQty = qty;
        productoMasComprado = name;
      }
    });

    return { totalPedidos, totalGastado, pedidoRecienteText, productoMasComprado };
  }, [orders]);

  // Aggregate Top 5 products for horizontal progress charts
  const topProductsList = useMemo<TopProduct[]>(() => {
    const productCounts: { [key: string]: number } = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        productCounts[item.nombre] = (productCounts[item.nombre] || 0) + 1; // Count per order instance
      });
    });
    return Object.entries(productCounts)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }, [orders]);

  // SVG Line Chart Coordinate Generator
  const spendingHistoryCoordinates = useMemo(() => {
    if (orders.length === 0) return '';
    const sorted = [...orders].sort((a, b) => new Date(a.fecha_pedido).getTime() - new Date(b.fecha_pedido).getTime());
    const dataPoints = sorted.map(o => o.total);
    const maxVal = Math.max(...dataPoints, 1000);
    const minVal = Math.min(...dataPoints, 0);
    const range = maxVal - minVal;
    
    const width = 500;
    const height = 80;
    const padding = 5;

    return dataPoints.map((val, idx) => {
      const x = (idx / Math.max(dataPoints.length - 1, 1)) * (width - padding * 2) + padding;
      const y = height - (((val - minVal) / range) * (height - padding * 2) + padding);
      return `${x},${y}`;
    }).join(' ');
  }, [orders]);

  // --- FILTERS LOGIC ---
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Text Search Match
      const matchesSearch = 
        order.id_pedido.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(i => i.nombre.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Status Match
      const matchesStatus = statusFilter === 'todos' || order.status_final.toLowerCase() === statusFilter.toLowerCase();

      // 3. Amount Metric Match
      let matchesAmount = true;
      if (amountFilter === 'under500') matchesAmount = order.total < 500;
      else if (amountFilter === '500-1000') matchesAmount = order.total >= 500 && order.total <= 1000;
      else if (amountFilter === 'over1000') matchesAmount = order.total > 1000;

      // 4. Date Filter Range Match
      let matchesDate = true;
      if (dateFilter !== 'todo') {
        const orderTime = new Date(order.fecha_pedido).getTime();
        const now = Date.now();
        const diffDays = (now - orderTime) / (1000 * 60 * 60 * 24);
        matchesDate = diffDays <= parseInt(dateFilter);
      }

      return matchesSearch && matchesStatus && matchesAmount && matchesDate;
    });
  }, [orders, searchQuery, dateFilter, statusFilter, amountFilter]);

  // Status Badge styling definitions
  const getStatusStyle = (status: Order['status_final']) => {
    const normalize = status.toLowerCase();
    if (normalize === 'pendiente') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (normalize === 'confirmado') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (normalize === 'en preparación') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (normalize === 'en camino') return 'bg-orange-50 text-orange-700 border-orange-200';
    if (normalize === 'entregado') return 'bg-green-50 text-green-700 border-green-200';
    return 'bg-red-50 text-red-700 border-red-200'; // Cancelado
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* HEADER SECTION */}
        <header className="border-b border-gray-200 pb-5 mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Mis pedidos</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Consulta tu historial de compras y el estado de tus entregas en tiempo real.
          </p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* LOADING STATE (Production Skeleton Grid) */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 h-24 animate-pulse" />
              ))}
            </div>
            <div className="h-12 bg-white rounded-lg border border-gray-200 animate-pulse" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white h-40 rounded-lg border border-gray-200 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* KPI METRIC SUMMARY GRID */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm transition-all hover:border-gray-300">
                <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Total pedidos</span>
                <span className="block mt-1 text-2xl font-semibold text-gray-900">{summaryMetrics.totalPedidos} pedidos</span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm transition-all hover:border-gray-300">
                <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Total gastado</span>
                <span className="block mt-1 text-2xl font-semibold text-gray-900">
                  ${summaryMetrics.totalGastado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-xs text-gray-500 font-normal">MXN</span>
                </span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm transition-all hover:border-gray-300">
                <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Pedido más reciente</span>
                <span className="block mt-1 text-2xl font-semibold text-gray-900">{summaryMetrics.pedidoRecienteText}</span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm transition-all hover:border-gray-300 overflow-hidden">
                <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Producto estrella</span>
                <span className="block mt-1 text-base font-semibold text-gray-900 truncate" title={summaryMetrics.productoMasComprado}>
                  {summaryMetrics.productoMasComprado}
                </span>
              </div>
            </section>

            {/* ANALYTICS SECTION (Horizontal Bars & Native SVG Spend Chart) */}
            {orders.length > 0 && (
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Horizontal Progress Bars */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Productos más comprados</h3>
                  <div className="space-y-2.5">
                    {topProductsList.map((product, index) => {
                      const maxQty = topProductsList[0]?.cantidad || 1;
                      const percentage = (product.cantidad / maxQty) * 100;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-700">
                            <span className="font-medium truncate max-w-[75%]">{product.nombre}</span>
                            <span className="text-gray-500">{product.cantidad} órdenes</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-red-600 h-full rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SVG Mini Line Chart */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Historial de gasto temporal</h3>
                    <p className="text-xs text-gray-400">Fluctuación de valor por ticket en orden cronológico</p>
                  </div>
                  <div className="mt-4 w-full">
                    <svg viewBox="0 0 500 80" className="w-full h-20 overflow-visible">
                      <polyline
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={spendingHistoryCoordinates}
                      />
                      {/* Interactive dot markers for data points */}
                      {spendingHistoryCoordinates.split(' ').map((coord, i) => {
                        const [x, y] = coord.split(',');
                        if (!x || !y) return null;
                        return (
                          <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="3.5"
                            className="fill-white stroke-red-600 stroke-2 hover:r-5 transition-all cursor-pointer"
                          />
                        );
                      })}
                    </svg>
                  </div>
                </div>
              </section>
            )}

            {/* FILTER TOOLBAR */}
            <section className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search field */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Buscar pedido</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    placeholder="ID o nombre de producto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Date range filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Periodo de tiempo</label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                    value={dateFilter}
                    onChange={(e: any) => setDateFilter(e.target.value)}
                  >
                    <option value="todo">Todos los registros</option>
                    <option value="7">Últimos 7 días</option>
                    <option value="30">Últimos 30 días</option>
                    <option value="90">Últimos 90 días</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Estado del envío</label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="En preparación">En preparación</option>
                    <option value="En camino">En camino</option>
                    <option value="Entregado">Entregado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                {/* Amount Tier Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Monto de la compra</label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                    value={amountFilter}
                    onChange={(e: any) => setAmountFilter(e.target.value)}
                  >
                    <option value="todos">Todos los montos</option>
                    <option value="under500">Menos de $500.00</option>
                    <option value="500-1000">$500.00 - $1,000.00</option>
                    <option value="over1000">Más de $1,000.00</option>
                  </select>
                </div>
              </div>
            </section>

            {/* ORDERS ITEMS CARDS LIST CONTAINER */}
            <section className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredOrders.length === 0 ? (
                  // EMPTY STATE SUB-COMPONENT
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12 bg-white border border-gray-200 rounded-lg shadow-sm"
                  >
                    <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">Todavía no has realizado pedidos</h3>
                    <p className="mt-1 text-xs text-gray-500">¿Buscas algo refrescante? Explora nuestro catálogo actual.</p>
                    <div className="mt-6">
                      <button onClick={() => navigate("/usuario/tienda")} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md Skinner text-white bg-red-600 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        Explorar productos
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  filteredOrders.map((order) => (
                    <motion.div
                      layout
                      key={order.id_pedido}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:border-gray-300 transition-all"
                    >
                      {/* Card Header Structure */}
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                        <div className="flex items-center space-x-6">
                          <div>
                            <span className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider">Fecha de pedido</span>
                            <span className="font-medium text-gray-700">
                              {new Date(order.fecha_pedido).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div>
                            <span className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider">Total</span>
                            <span className="font-bold text-gray-900">
                              ${order.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                            </span>
                          </div>
                          <div>
                            <span className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider">ID Pedido</span>
                            <span className="font-mono text-gray-600 text-xs">{order.id_pedido}</span>
                          </div>
                        </div>

                        {/* Order Status Badge */}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(order.status_final)}`}>
                          {order.status_final}
                        </span>
                      </div>

                      {/* Card Body Core Info */}
                      <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        {/* Compact Products Aggregator Matrix */}
                        <div className="space-y-1 w-full sm:max-w-xl">
                          {order.items.slice(0, 3).map((item, i) => (
                            <div key={i} className="text-sm text-gray-700 flex items-center justify-between">
                              <span className="truncate pr-4">• {item.nombre}</span>
                              <span className="text-gray-400 text-xs shrink-0">x{item.cantidad}</span>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <span className="text-xs text-red-600 font-medium block mt-1">
                              +{order.items.length - 3} productos más en el pedido
                            </span>
                          )}
                        </div>

                        {/* Interactive Dynamic CTAs Buttons Panel */}
                        <div className="flex sm:flex-col lg:flex-row gap-2 w-full sm:w-auto shrink-0 justify-end">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="flex-1 sm:flex-none text-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none"
                          >
                            Ver detalle
                          </button>
                          
                          {['Pendiente', 'Confirmado', 'En preparación', 'En camino'].includes(order.status_final) && (
                            <button className="flex-1 sm:flex-none text-center px-3 py-1.5 border border-transparent rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors focus:outline-none shadow-sm">
                              Seguir pedido
                            </button>
                          )}

                          {order.status_final === 'Entregado' && (
                            <button className="flex-1 sm:flex-none text-center px-3 py-1.5 border border-red-200 rounded-md text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors focus:outline-none">
                              Volver a comprar
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </section>
          </>
        )}

        {/* SIDE DRAWER SIDE-PANEL FOR COMPREHENSIVE ORDER HISTORY SPECIFICS */}
        <AnimatePresence>
          {selectedOrder && (
            <>
              {/* Dark backdrop overlay layout shroud */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedOrder(null)}
                className="fixed inset-0 bg-black z-40"
              />

              {/* Right Side Drawer Content Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
                className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-white shadow-xl z-50 overflow-y-auto flex flex-col border-l border-gray-200"
              >
                {/* Drawer Header Layout */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Detalle del pedido</h2>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedOrder.id_pedido}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Drawer Main Body */}
                <div className="p-4 space-y-6 flex-1">
                  {/* Status Grid Overview Banner Summary */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md text-xs sm:text-sm">
                    <span className="text-gray-500 font-medium">Estado actual</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-semibold border ${getStatusStyle(selectedOrder.status_final)}`}>
                      {selectedOrder.status_final}
                    </span>
                  </div>

                  {/* Complete List of Products Line Items Grid */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Artículos</h3>
                    <div className="divide-y divide-gray-100 border border-gray-200 rounded-md overflow-hidden">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="p-3 bg-white flex justify-between items-start text-xs sm:text-sm">
                          <div className="max-w-[70%]">
                            <p className="font-medium text-gray-800 break-words">{item.nombre}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Precio Unitario: ${item.precio_unitario.toFixed(2)} MXN</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-gray-500 font-medium">Cant: {item.cantidad}</p>
                            <p className="font-semibold text-gray-900 mt-0.5">${(item.cantidad * item.precio_unitario).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial Receipt Invoicing breakdown block */}
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200 space-y-1.5 text-xs sm:text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal</span>
                      <span>${selectedOrder.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Costo de envío / Logística</span>
                      <span>$0.00 MXN</span>
                    </div>
                    <div className="flex justify-between text-gray-900 font-bold text-base border-t border-gray-200 pt-1.5 mt-1">
                      <span>Total final</span>
                      <span>${selectedOrder.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                    </div>
                  </div>

                  {/* Logistics Fulfillment Details Block */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Información de Entrega</h3>
                    <div className="bg-white border border-gray-200 rounded-md p-3 text-xs sm:text-sm space-y-2">
                      <div>
                        <span className="block text-gray-400 text-[10px] uppercase font-bold tracking-tight">Dirección</span>
                        <span className="text-gray-700 font-medium">{selectedOrder.direccion_entrega}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                        <div>
                          <span className="block text-gray-400 text-[10px] uppercase font-bold tracking-tight">CEDIS de Despacho</span>
                          <span className="text-gray-700 font-medium">ID #{selectedOrder.cedis_id}</span>
                        </div>
                        {selectedOrder.repartidor && (
                          <div>
                            <span className="block text-gray-400 text-[10px] uppercase font-bold tracking-tight">Repartidor</span>
                            <span className="text-gray-700 font-medium truncate block">{selectedOrder.repartidor.nombre}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tracking Log Timeline Stepper Updates */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Historial de Ruta</h3>
                    <div className="relative border-l-2 border-gray-200 ml-2 pl-4 space-y-4 text-xs sm:text-sm">
                      {selectedOrder.tracking.map((track, idx) => (
                        <div key={idx} className="relative">
                          {/* Active state pulsing node icon indicator indicator */}
                          <span className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 bg-white ${
                            idx === selectedOrder.tracking.length - 1 ? 'border-red-600 scale-125' : 'border-gray-400'
                          }`} />
                          <div className="flex items-baseline justify-between">
                            <p className={`font-semibold ${idx === selectedOrder.tracking.length - 1 ? 'text-red-600' : 'text-gray-700'}`}>
                              {track.status}
                            </p>
                            <span className="text-[11px] text-gray-400 font-mono shrink-0 ml-2">{track.timestamp}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{track.descripcion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sticky Side Drawer Bottom Footer Panel Actions */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2">
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 text-center py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
                  >
                    Cerrar panel
                  </button>
                  {selectedOrder.status_final === 'Entregado' && (
                    <button className="flex-1 text-center py-2 border border-transparent rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-all shadow-sm">
                      Reordenar todo
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}