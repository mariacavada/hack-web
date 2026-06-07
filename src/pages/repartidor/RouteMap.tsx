import { useEffect, useRef, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export type Stop = {
  order_id?: string
  id_pedido?: string
  cliente?: string
  direccion?: string
  lat?: number
  lng?: number
  stop_number?: number
  status?: string
  eta?: string
}

export type CedisInfo = { lat: number; lng: number; nombre: string }

function MapController({
  allPositions,
  focusCoord,
}: {
  allPositions: [number, number][]
  focusCoord: [number, number] | null
}) {
  const map       = useMap()
  const fittedRef = useRef(false)

  useEffect(() => {
    if (fittedRef.current || allPositions.length === 0) return
    if (allPositions.length > 1) {
      map.fitBounds(allPositions as any, { padding: [48, 48] })
    } else {
      map.setView(allPositions[0], 14)
    }
    fittedRef.current = true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPositions.length])

  useEffect(() => {
    if (focusCoord) {
      map.flyTo(focusCoord, 16, { animate: true, duration: 0.8 } as any)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusCoord])

  return null
}

interface RouteMapProps {
  stops: Stop[]
  cedis?: CedisInfo | null
  canComplete?: boolean
  completingStop?: number | null
  onCompleteStop?: (index: number) => void
  onMissingStop?: (index: number, orderId: string) => void
}

export default function RouteMap({
  stops,
  cedis,
  canComplete = false,
  completingStop = null,
  onCompleteStop,
  onMissingStop,
}: RouteMapProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  // Real coords per stop — null when the API didn't provide location
  const stopCoords = useMemo<([number, number] | null)[]>(
    () => stops.map(s => (s.lat != null && s.lng != null ? [s.lat, s.lng] : null)),
    [stops]
  )

  // Only positions that actually have coords, for fitBounds
  const allPositions = useMemo<[number, number][]>(() => {
    const pts = stopCoords.filter(Boolean) as [number, number][]
    if (cedis) pts.unshift([cedis.lat, cedis.lng])
    return pts
  }, [stopCoords, cedis])

  const focusCoord: [number, number] | null =
    focusedIndex !== null ? (stopCoords[focusedIndex] ?? null) : null

  const firstRealCoord = stopCoords.find(Boolean) as [number, number] | undefined
  const center: [number, number] = cedis
    ? [cedis.lat, cedis.lng]
    : firstRealCoord ?? [19.4326, -99.1332]

  const hasAnyMapData = allPositions.length > 0

  return (
    <div className="isolate bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* ── Map ──────────────────────────────────────────────────────── */}
      {hasAnyMapData ? (
        <MapContainer {...({ center, zoom: 13, style: { height: 300, width: '100%' } } as any)}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapController allPositions={allPositions} focusCoord={focusCoord} />

          {cedis && (
            <CircleMarker
              {...({
                center: [cedis.lat, cedis.lng],
                pathOptions: { color: '#1D4ED8', fillColor: '#3B82F6', fillOpacity: 0.95, weight: 3 },
                radius: 13,
              } as any)}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold text-blue-700">CEDIS</div>
                  <div className="text-gray-700 mt-0.5">{cedis.nombre}</div>
                </div>
              </Popup>
            </CircleMarker>
          )}

          {stops.map((stop, i) => {
            const coord   = stopCoords[i]
            if (!coord) return null
            const done    = stop.status === 'completada'
            const focused = focusedIndex === i
            return (
              <CircleMarker
                key={i}
                {...({
                  center: coord,
                  pathOptions: {
                    color:       focused ? '#6D28D9' : done ? '#15803D' : '#E61A27',
                    fillColor:   focused ? '#7C3AED' : done ? '#22C55E' : '#EF4444',
                    fillOpacity: 0.9,
                    weight:      focused ? 3 : 2,
                  },
                  radius: focused ? 11 : 9,
                  eventHandlers: { click: () => setFocusedIndex(focused ? null : i) },
                } as any)}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">
                      {stop.stop_number ?? i + 1}. {stop.cliente ?? stop.id_pedido ?? `Parada ${i + 1}`}
                    </div>
                    {stop.direccion && (
                      <div className="text-xs text-gray-500 mt-0.5">{stop.direccion}</div>
                    )}
                    <div className={`text-xs font-semibold mt-1 ${done ? 'text-green-600' : 'text-orange-600'}`}>
                      {done ? '✓ Completada' : 'Pendiente'}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      ) : (
        <div className="h-[180px] bg-gray-50 flex items-center justify-center border-b border-gray-100">
          <p className="text-sm text-gray-400">Sin coordenadas disponibles para mostrar en el mapa.</p>
        </div>
      )}

      {/* ── Legend ───────────────────────────────────────────────────── */}
      {hasAnyMapData && (
        <div className="flex items-center gap-5 px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          {cedis && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" /> CEDIS
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" /> Pendiente
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" /> Completada
          </span>
        </div>
      )}

      {/* ── Delivery list ─────────────────────────────────────────────── */}
      {stops.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-gray-400">No hay paradas asignadas para hoy.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {stops.map((stop, i) => {
            const done         = stop.status === 'completada'
            const focused      = focusedIndex === i
            const hasCoord     = stopCoords[i] !== null
            const isCompleting = completingStop === i
            const showActions  = canComplete && !done

            return (
              <div key={i} className={`transition-colors ${focused ? 'bg-violet-50' : ''}`}>

                {/* Tappable row → zoom */}
                <button
                  onClick={() => hasCoord && setFocusedIndex(focused ? null : i)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                    hasCoord ? 'hover:bg-black/[0.02] active:bg-black/[0.04]' : 'cursor-default'
                  }`}
                >
                  {/* Stop number / check */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 tabular-nums transition-colors ${
                    done    ? 'bg-green-100 text-green-700'
                    : focused ? 'bg-violet-100 text-violet-700'
                    :          'bg-[#E61A27]/10 text-[#E61A27]'
                  }`}>
                    {done ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (stop.stop_number ?? i + 1)}
                  </div>

                  {/* Name + address */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate transition-colors ${
                      done ? 'text-gray-400' : focused ? 'text-violet-900' : 'text-gray-900'
                    }`}>
                      {stop.cliente ?? stop.id_pedido ?? `Parada ${i + 1}`}
                    </p>
                    {stop.direccion && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{stop.direccion}</p>
                    )}
                    {stop.eta && !done && (
                      <p className="text-xs text-gray-400 mt-0.5">ETA: {stop.eta}</p>
                    )}
                  </div>

                  {/* Right label */}
                  <span className={`text-xs font-semibold shrink-0 transition-colors ${
                    done      ? 'text-green-600'
                    : focused  ? 'text-violet-600'
                    : !hasCoord ? 'text-gray-300'
                    :            'text-orange-500'
                  }`}>
                    {done ? 'Hecho' : focused ? 'Ver ↑' : !hasCoord ? '—' : 'Pendiente'}
                  </span>
                </button>

                {/* Action buttons */}
                {showActions && (
                  <div className="px-4 pb-3 flex gap-2">
                    <button
                      onClick={() => onCompleteStop?.(i)}
                      disabled={isCompleting}
                      className="flex-1 h-10 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      {isCompleting ? (
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Entregado
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => onMissingStop?.(i, stop.order_id ?? stop.id_pedido ?? '')}
                      className="h-10 px-4 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors"
                    >
                      Faltante
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
