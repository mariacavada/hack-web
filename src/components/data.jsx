/* ============================================================
   MOCK DATA — Order Rescue
   Generic B2B beverage/abarrotes catalog (no real trademarks)
   ============================================================ */

const CATEGORIES = [
  { id: "refrescos", name: "Refrescos", icon: "zap" },
  { id: "agua", name: "Agua", icon: "leaf" },
  { id: "jugos", name: "Jugos", icon: "gift" },
  { id: "energeticas", name: "Energéticas", icon: "zap" },
  { id: "abarrotes", name: "Abarrotes", icon: "box" },
];

const PRODUCTS = [
  { id: "p1", name: "Refresco Cola 600 ml", cat: "refrescos", price: 168, unit: "Caja 24 pz", stock: "alta", img: "COLA 600ml" },
  { id: "p2", name: "Refresco Cola Sin Azúcar 600 ml", cat: "refrescos", price: 168, unit: "Caja 24 pz", stock: "media", img: "COLA ZERO" },
  { id: "p3", name: "Refresco Sabor Naranja 600 ml", cat: "refrescos", price: 155, unit: "Caja 24 pz", stock: "baja", img: "NARANJA" },
  { id: "p4", name: "Refresco Sabor Manzana 600 ml", cat: "refrescos", price: 155, unit: "Caja 24 pz", stock: "alta", img: "MANZANA" },
  { id: "p5", name: "Agua Natural 1 L", cat: "agua", price: 96, unit: "Paq 12 pz", stock: "alta", img: "AGUA 1L" },
  { id: "p6", name: "Agua Mineral 355 ml", cat: "agua", price: 132, unit: "Caja 24 pz", stock: "media", img: "MINERAL" },
  { id: "p7", name: "Jugo de Naranja 1 L", cat: "jugos", price: 210, unit: "Paq 12 pz", stock: "baja", img: "JUGO NJA" },
  { id: "p8", name: "Néctar Durazno 1 L", cat: "jugos", price: 198, unit: "Paq 12 pz", stock: "alta", img: "DURAZNO" },
  { id: "p9", name: "Bebida Energética 473 ml", cat: "energeticas", price: 360, unit: "Caja 24 pz", stock: "media", img: "ENERGY" },
  { id: "p10", name: "Café Frío 250 ml", cat: "energeticas", price: 288, unit: "Caja 24 pz", stock: "alta", img: "CAFÉ" },
  { id: "p11", name: "Galletas Surtido", cat: "abarrotes", price: 240, unit: "Caja 12 pz", stock: "alta", img: "GALLETAS" },
  { id: "p12", name: "Botana Salada 45 g", cat: "abarrotes", price: 180, unit: "Caja 30 pz", stock: "media", img: "BOTANA" },
];

const productById = (id) => PRODUCTS.find(p => p.id === id);

/* The order with a substitution risk (the hero moment) */
const ACTIVE_ORDER = {
  id: "OR-4821",
  status: "validando", // recibido, preparando, validando, ruta, entregado
  placed: "Hoy, 8:12 a. m.",
  eta: "Hoy, 2:00 – 4:00 p. m.",
  total: 2_184,
  address: "Tienda Don Ramón · Av. Hidalgo 245, Centro",
  items: [
    { ...productById("p1"), qty: 4 },
    { ...productById("p5"), qty: 3 },
    { ...productById("p7"), qty: 2, atRisk: true, riskPct: 78 },
    { ...productById("p11"), qty: 1 },
  ],
};

/* AI substitution suggestions for the at-risk item (Jugo de Naranja) */
const SUBSTITUTIONS = [
  { ...productById("p8"), match: 94, reason: "Lo aceptaste 3 veces antes", best: true },
  { ...productById("p3"), match: 81, reason: "Misma categoría, precio similar" },
  { ...productById("p4"), match: 72, reason: "Disponible en tu CEDIS" },
];

const ORDER_HISTORY = [
  { id: "OR-4790", date: "2 jun 2026", total: 1_980, items: 5, status: "entregado", subs: 1 },
  { id: "OR-4731", date: "28 may 2026", total: 2_410, items: 7, status: "entregado", subs: 0 },
  { id: "OR-4688", date: "21 may 2026", total: 1_550, items: 4, status: "entregado", subs: 2 },
  { id: "OR-4602", date: "14 may 2026", total: 3_120, items: 9, status: "entregado", subs: 0 },
];

const TRACK_EVENTS = [
  { t: "Pedido recibido", time: "8:12 a. m.", state: "done", icon: "checkCircle" },
  { t: "Preparando pedido", time: "9:40 a. m.", state: "done", icon: "box" },
  { t: "Validando inventario", time: "11:05 a. m.", state: "active", icon: "shield", note: "Detectamos 1 producto con riesgo de faltante." },
  { t: "En ruta", time: "Estimado 1:30 p. m.", state: "todo", icon: "truck" },
  { t: "Entregado", time: "Estimado 2:00 – 4:00 p. m.", state: "todo", icon: "home" },
];

/* ---- Recycling ---- */
const RECYCLE = {
  points: 1_240,
  envases: 386,
  co2: 47.5, // kg
  nextReward: 1_500,
  badges: [
    { name: "Primer envase", icon: "leaf", got: true },
    { name: "100 envases", icon: "recycle", got: true },
    { name: "Eco aliado", icon: "shield", got: true },
    { name: "500 envases", icon: "award", got: false },
    { name: "Héroe verde", icon: "star", got: false },
  ],
  rewards: [
    { name: "$50 de descuento", cost: 800, icon: "dollar" },
    { name: "Caja de agua gratis", cost: 1200, icon: "leaf" },
    { name: "Envío sin costo", cost: 1500, icon: "truck" },
  ],
};

/* ============================================================
   ADMIN DATA
   ============================================================ */
const ADMIN_KPIS = [
  { label: "Pedidos activos", val: "342", delta: "+8%", up: true },
  { label: "Sustituciones hoy", val: "57", delta: "+12%", up: true },
  { label: "Nivel de servicio", val: "96.4%", delta: "+1.2%", up: true },
  { label: "Productos críticos", val: "9", delta: "+3", up: false },
  { label: "Clientes afectados", val: "23", delta: "−5", up: true },
];

const ADMIN_ORDERS = [
  { id: "OR-4821", client: "Tienda Don Ramón", region: "Centro", status: "validando", date: "6 jun", total: 2184, risk: true },
  { id: "OR-4820", client: "Abarrotes La Esquina", region: "Norte", status: "ruta", date: "6 jun", total: 3960, risk: false },
  { id: "OR-4818", client: "Minisúper El Sol", region: "Sur", status: "preparando", date: "6 jun", total: 1450, risk: true },
  { id: "OR-4815", client: "Tienda Lupita", region: "Centro", status: "ruta", date: "6 jun", total: 2780, risk: false },
  { id: "OR-4812", client: "Comercial Hnos. Díaz", region: "Oriente", status: "entregado", date: "6 jun", total: 5210, risk: false },
  { id: "OR-4809", client: "Super Express", region: "Norte", status: "entregado", date: "5 jun", total: 1990, risk: false },
  { id: "OR-4805", client: "Tienda La Bodega", region: "Sur", status: "validando", date: "5 jun", total: 3340, risk: true },
];

const INVENTORY_RISK = [
  { name: "Jugo de Naranja 1 L", pct: 78, hours: 6, region: "Centro" },
  { name: "Refresco Sabor Naranja 600 ml", pct: 64, hours: 11, region: "Sur" },
  { name: "Bebida Energética 473 ml", pct: 52, hours: 18, region: "Norte" },
  { name: "Agua Mineral 355 ml", pct: 41, hours: 26, region: "Oriente" },
  { name: "Néctar Durazno 1 L", pct: 33, hours: 34, region: "Centro" },
];

const SUB_INSIGHTS = {
  topSubstituted: [
    { name: "Jugo de Naranja 1 L", count: 142 },
    { name: "Refresco Naranja 600 ml", count: 98 },
    { name: "Energética 473 ml", count: 73 },
    { name: "Agua Mineral 355 ml", count: 61 },
  ],
  accepted: 74,
  rejected: 26,
};

const DELIVERERS = [
  { name: "Carlos Méndez", route: "Ruta Centro", pending: 4, eff: 98, x: 30, y: 40, hue: 20 },
  { name: "Ana Torres", route: "Ruta Norte", pending: 6, eff: 92, x: 62, y: 28, hue: 150 },
  { name: "Luis Ramírez", route: "Ruta Sur", pending: 3, eff: 95, x: 48, y: 70, hue: 250 },
  { name: "Sofía Cruz", route: "Ruta Oriente", pending: 5, eff: 89, x: 78, y: 58, hue: 320 },
];

const ADMIN_USERS = [
  { name: "Tienda Don Ramón", orders: 48, region: "Centro", subs: "Acepta jugos", hue: 20 },
  { name: "Abarrotes La Esquina", orders: 31, region: "Norte", subs: "Solo misma marca", hue: 150 },
  { name: "Minisúper El Sol", orders: 67, region: "Sur", subs: "Flexible", hue: 250 },
  { name: "Tienda Lupita", orders: 22, region: "Centro", subs: "No sustituir agua", hue: 320 },
];

const WEEK_SUBS = [
  { d: "Lun", v: 38 }, { d: "Mar", v: 52 }, { d: "Mié", v: 44 },
  { d: "Jue", v: 61 }, { d: "Vie", v: 57 }, { d: "Sáb", v: 72 }, { d: "Dom", v: 29 },
];

/* ============================================================
   DELIVERY (Repartidor) DATA
   ============================================================ */
const DELIVERY_STOPS = [
  { id: "OR-4821", client: "Tienda Don Ramón", addr: "Av. Hidalgo 245, Centro", items: 4, subs: 1, status: "pendiente", eta: "1:30 p. m." },
  { id: "OR-4815", client: "Tienda Lupita", addr: "Calle Morelos 88, Centro", items: 6, subs: 0, status: "pendiente", eta: "2:10 p. m." },
  { id: "OR-4798", client: "Café Central", addr: "Plaza Juárez 12, Centro", items: 3, subs: 0, status: "pendiente", eta: "2:45 p. m." },
  { id: "OR-4772", client: "Abarrotes Mary", addr: "Av. Reforma 410, Centro", items: 8, subs: 2, status: "entregado", eta: "11:20 a. m." },
];

const DELIVERY_PROFILE = {
  name: "Carlos Méndez",
  route: "Ruta Centro",
  delivered: 1_284,
  rating: 4.9,
  avgTime: "14 min",
  hue: 20,
};

Object.assign(window, {
  CATEGORIES, PRODUCTS, productById, ACTIVE_ORDER, SUBSTITUTIONS, ORDER_HISTORY,
  TRACK_EVENTS, RECYCLE, ADMIN_KPIS, ADMIN_ORDERS, INVENTORY_RISK, SUB_INSIGHTS,
  DELIVERERS, ADMIN_USERS, WEEK_SUBS, DELIVERY_STOPS, DELIVERY_PROFILE,
});
