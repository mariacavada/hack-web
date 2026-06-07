import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

/* ── Types ───────────────────────────────────────────────────────── */
interface Cedis {
  _id: string;
  cedis_id: string;
  nombre?: string;
  ciudad?: string;
}

interface MLResult {
  sku: string;
  nombre?: string;
  nivel_alerta?: 'ok' | 'bajo' | 'critico';
  stock_actual?: number;
  dias_estimados_agotamiento?: number;
  fecha_agotamiento_predicha?: string;
  fecha_limite_pedido?: string;
  cantidad_reorden_sugerida?: number;
  demanda_diaria_predicha?: number;
  confianza?: number;
  error?: string;
}

type Group = 'hoy' | 'semana' | 'mes' | 'ok';

/* ── Helpers ─────────────────────────────────────────────────────── */
function getGroup(r: MLResult): Group {
  if (r.nivel_alerta === 'ok') return 'ok';
  const dias = r.dias_estimados_agotamiento ?? 999;
  const limite = r.fecha_limite_pedido ? new Date(r.fecha_limite_pedido) : null;
  const hoy = new Date();
  if (!limite || limite <= hoy) return 'hoy';
  const diff = Math.ceil((limite.getTime() - hoy.getTime()) / 86_400_000);
  if (diff <= 7) return 'semana';
  if (dias <= 30) return 'mes';
  return 'ok';
}

function fmtDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
}

function daysUntil(iso?: string) {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

/* ── Recommendation card ─────────────────────────────────────────── */
function RecomCard({ r, skuMap }: { r: MLResult; skuMap: Record<string, string> }) {
  const nombre = skuMap[r.sku] ?? r.nombre ?? r.sku;
  const limiteDiff = daysUntil(r.fecha_limite_pedido);
  const agotaDiff  = daysUntil(r.fecha_agotamiento_predicha);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Product name */}
      <p className="text-sm font-bold text-gray-900 leading-tight mb-3">{nombre}</p>

      {/* Prediction insights */}
      <div className="space-y-2 mb-4">
        {agotaDiff != null && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            Se agotará en{' '}
            <span className={`font-bold ${agotaDiff <= 7 ? 'text-red-600' : 'text-gray-700'}`}>
              {agotaDiff <= 0 ? 'menos de 1 día' : `${agotaDiff} días`}
            </span>
            {r.fecha_agotamiento_predicha && (
              <span className="text-gray-400">— {fmtDate(r.fecha_agotamiento_predicha)}</span>
            )}
          </div>
        )}

        {r.fecha_limite_pedido && (
          <div className="flex items-center gap-2 text-xs">
            <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
            </svg>
            <span className={`font-semibold ${limiteDiff != null && limiteDiff <= 0 ? 'text-red-600' : limiteDiff != null && limiteDiff <= 3 ? 'text-amber-600' : 'text-gray-600'}`}>
              Pide antes del {fmtDate(r.fecha_limite_pedido)}
              {limiteDiff != null && limiteDiff <= 0 && ' ⚠ (venció)'}
              {limiteDiff != null && limiteDiff > 0 && limiteDiff <= 3 && ` (en ${limiteDiff}d)`}
            </span>
          </div>
        )}

        {r.demanda_diaria_predicha != null && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
            Rotación predicha:{' '}
            <span className="font-semibold text-gray-700">{r.demanda_diaria_predicha.toFixed(1)} u/día</span>
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Pedir</p>
          <p className="text-lg font-black text-gray-900">
            {r.cantidad_reorden_sugerida ?? '—'}
            <span className="text-xs font-medium text-gray-400 ml-1">unidades</span>
          </p>
        </div>
        {r.confianza != null && (
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Confianza</p>
            <div className="flex items-center gap-1.5 justify-end">
              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${r.confianza >= 0.7 ? 'bg-green-400' : r.confianza >= 0.4 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${r.confianza * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-600 font-mono">{Math.round(r.confianza * 100)}%</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Section header ──────────────────────────────────────────────── */
function SectionHeader({ icon, title, count, desc, color }: {
  icon: React.ReactNode; title: string; count: number; desc: string; color: string;
}) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${color}`}>
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          <span className="text-xs font-mono font-bold bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded">{count}</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function AdminPrediccionesPage() {
  const navigate = useNavigate();
  const [cedisList,   setCedisList]   = useState<Cedis[]>([]);
  const [selectedCedis, setSelectedCedis] = useState('');
  const [skuNames,    setSkuNames]    = useState<Record<string, string>>({});
  const [results,     setResults]     = useState<MLResult[] | null>(null);
  const [okCount,     setOkCount]     = useState(0);
  const [cedisNombre, setCedisNombre] = useState('');
  const [loadingInit, setLoadingInit] = useState(true);
  const [running,     setRunning]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [lastRun,     setLastRun]     = useState<string | null>(null);

  const token = localStorage.getItem('or_token') ?? '';
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  /* Load CEDIS on mount, then fetch stock from each CEDIS for SKU→nombre map */
  useEffect(() => {
    fetch(`${API}/api/cedis`, { headers: h })
      .then(r => r.ok ? r.json() : [])
      .then(async (cedis: any) => {
        const cedsArr: Cedis[] = Array.isArray(cedis) ? cedis : [];
        setCedisList(cedsArr);
        if (cedsArr.length > 0) {
          setSelectedCedis(cedsArr[0].cedis_id);
          setCedisNombre(cedsArr[0].nombre ?? cedsArr[0].cedis_id);
        }
        // Build SKU→nombre from CEDIS stock endpoints (no estado filter, gets all products)
        const stocks = await Promise.all(
          cedsArr.map(c =>
            fetch(`${API}/api/cedis/${c.cedis_id}/stock`, { headers: h })
              .then(r => r.ok ? r.json() : { productos: [] })
              .catch(() => ({ productos: [] }))
          )
        );
        const pmap: Record<string, string> = {};
        stocks.forEach((s: any) => {
          (s.productos ?? []).forEach((p: any) => {
            if (p.sku && p.nombre) pmap[String(p.sku)] = p.nombre;
          });
        });
        setSkuNames(pmap);
      })
      .catch(() => {})
      .finally(() => setLoadingInit(false));
  }, []);

  /* Run ML — backend responds immediately; Gemini corre en background por SKU */
  const handleRun = async () => {
    if (!selectedCedis) return;
    setRunning(true);
    setError(null);
    setResults(null);
    setOkCount(0);
    const cedis = cedisList.find(c => c.cedis_id === selectedCedis);
    setCedisNombre(cedis?.nombre ?? selectedCedis);
    try {
      // 1. Trigger — responde de inmediato, el análisis corre en segundo plano
      const triggerRes = await fetch(`${API}/api/ml/stock-predict/cedis`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ cedis_id: selectedCedis }),
      });
      if (!triggerRes.ok) throw new Error(`Error ${triggerRes.status}`);

      // 2. Poll depletion-risk (bajo + critico) mientras Gemini procesa cada SKU.
      //    20 intentos: 6s inicial + 4s entre cada uno = hasta ~82s de espera.
      //    El ML solo llama a Gemini para SKUs donde stock <= minimo*1.5,
      //    así que si el stock está sano puede terminar en segundos con 0 items.
      let predictions: MLResult[] = [];
      for (let attempt = 0; attempt < 20; attempt++) {
        await new Promise(res => setTimeout(res, attempt === 0 ? 6000 : 4000));
        const riskRes = await fetch(
          `${API}/api/admin/inventory/depletion-risk?cedis_id=${selectedCedis}`,
          { headers: h }
        );
        if (riskRes.ok) {
          const data = await riskRes.json();
          predictions = data.predictions ?? [];
          if (predictions.length > 0) break;
        }
      }

      // 3. Si no hay bajo/critico, consultar nivel=ok para saber si el ML
      //    sí analizó productos pero los clasificó como stock sano.
      let ok = 0;
      if (predictions.length === 0) {
        const okRes = await fetch(
          `${API}/api/admin/inventory/depletion-risk?cedis_id=${selectedCedis}&nivel=ok`,
          { headers: h }
        ).catch(() => null);
        if (okRes?.ok) {
          const okData = await okRes.json();
          ok = (okData.predictions ?? []).length;
        }
      }

      setResults(predictions);
      setOkCount(ok);
      setLastRun(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al ejecutar análisis');
    } finally {
      setRunning(false);
    }
  };

  /* Group results by urgency — depletion-risk only returns bajo/critico items */
  const grouped = useMemo(() => {
    if (!results) return null;
    const valid   = results.filter(r => !r.error);
    const hoy     = valid.filter(r => getGroup(r) === 'hoy');
    const semana  = valid.filter(r => getGroup(r) === 'semana');
    const mes     = valid.filter(r => getGroup(r) === 'mes');
    const errores = results.filter(r => !!r.error);
    return { hoy, semana, mes, errores, total: valid.length };
  }, [results]);

  if (loadingInit) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#E61A27] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Predicciones ML</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Gemini AI analiza el inventario y te dice qué productos pedir, cuántos y para cuándo — antes de que se agoten.
        </p>
      </div>

      {/* Run panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#E61A27]/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#E61A27]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Análisis predictivo de inventario</h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Selecciona un CEDIS y ejecuta el modelo. Gemini AI revisa el stock actual y los movimientos de los últimos 30 días
              para predecir qué productos necesitan reabastecimiento, calculando cuánto pedir y la fecha límite considerando
              los 3-5 días de lead time del proveedor.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedCedis}
            onChange={e => {
              setSelectedCedis(e.target.value);
              setResults(null);
              setError(null);
            }}
            className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-[#E61A27] focus:border-[#E61A27] bg-white"
          >
            {cedisList.map(c => (
              <option key={c.cedis_id} value={c.cedis_id}>
                {c.nombre ?? c.cedis_id}{c.ciudad ? ` — ${c.ciudad}` : ''}
              </option>
            ))}
          </select>
          <button
            onClick={handleRun}
            disabled={running || !selectedCedis}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#E61A27] text-white text-sm font-bold rounded-xl disabled:opacity-50 hover:bg-[#C9141A] transition-colors whitespace-nowrap"
          >
            {running ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Analizando productos…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                Ejecutar predicción
              </>
            )}
          </button>
        </div>

        {running && (
          <p className="text-xs text-gray-400 mt-3 text-center">
            Gemini analiza los SKUs cercanos al mínimo de stock — puede tardar hasta 80 seg según cuántos productos estén en riesgo
          </p>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-4 py-2.5 font-medium">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      <AnimatePresence>
        {grouped && (
          <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

            {/* Summary banner */}
            {grouped.total > 0 ? (
              /* ── Hay productos en riesgo ── */
              <div className="bg-gray-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-white font-bold text-sm">Predicción completada — {cedisNombre}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {grouped.total} producto(s) en riesgo · {grouped.hoy.length + grouped.semana.length + grouped.mes.length} necesitan reabastecimiento · {lastRun}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/admin/cedis')}
                  className="text-xs font-bold bg-[#E61A27] hover:bg-[#C9141A] text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                  Ir a CEDIS → crear restock
                </button>
              </div>
            ) : okCount > 0 ? (
              /* ── ML corrió pero todo está bien ── */
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-green-800 font-bold text-sm">Stock en buen estado — {cedisNombre}</p>
                  <p className="text-green-700 text-xs mt-0.5">
                    Gemini analizó {okCount} producto(s) y todos tienen stock suficiente para los próximos días. No se requiere reabastecimiento. · {lastRun}
                  </p>
                </div>
              </div>
            ) : (
              /* ── El ML no encontró SKUs cerca del umbral ── */
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <div>
                  <p className="text-blue-800 font-bold text-sm">Sin productos en umbral de riesgo — {cedisNombre}</p>
                  <p className="text-blue-700 text-xs mt-0.5">
                    El modelo revisa solo SKUs con stock cercano al mínimo configurado. Ningún producto de este CEDIS alcanzó ese umbral, lo que indica que el inventario está sano. · {lastRun}
                  </p>
                </div>
              </div>
            )}

            {/* GRUPO: Pedir HOY */}
            {grouped.hoy.length > 0 && (
              <section className="space-y-4">
                <SectionHeader
                  icon={
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                    </svg>
                  }
                  title="Pedir HOY — fecha límite vencida o inmediata"
                  count={grouped.hoy.length}
                  desc="El modelo predice que si no haces el pedido hoy, el stock se agotará antes de que llegue el reabastecimiento."
                  color="bg-red-50 border-red-200"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped.hoy.map(r => <RecomCard key={r.sku} r={r} skuMap={skuNames} />)}
                </div>
              </section>
            )}

            {/* GRUPO: Pedir esta semana */}
            {grouped.semana.length > 0 && (
              <section className="space-y-4">
                <SectionHeader
                  icon={
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  title="Pedir esta semana"
                  count={grouped.semana.length}
                  desc="La fecha límite de pedido está dentro de los próximos 7 días. Actúa pronto para evitar quiebres de stock."
                  color="bg-amber-50 border-amber-200"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped.semana.map(r => <RecomCard key={r.sku} r={r} skuMap={skuNames} />)}
                </div>
              </section>
            )}

            {/* GRUPO: Planear este mes */}
            {grouped.mes.length > 0 && (
              <section className="space-y-4">
                <SectionHeader
                  icon={
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
                    </svg>
                  }
                  title="Planear este mes"
                  count={grouped.mes.length}
                  desc="Stock bajo pero aún hay tiempo. El modelo recomienda programar el pedido en las próximas semanas."
                  color="bg-blue-50 border-blue-200"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped.mes.map(r => <RecomCard key={r.sku} r={r} skuMap={skuNames} />)}
                </div>
              </section>
            )}

{/* Errores */}
            {grouped.errores.length > 0 && (
              <p className="text-xs text-gray-400">
                {grouped.errores.length} producto(s) no pudieron analizarse (datos insuficientes).
              </p>
            )}

          </motion.div>
        )}

        {/* Empty state — before first run */}
        {!grouped && !running && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-400">Selecciona un CEDIS y ejecuta la predicción</p>
            <p className="text-xs text-gray-300 mt-1">El modelo te dirá qué pedir, cuánto y para cuándo</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
