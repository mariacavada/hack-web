import React, { useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

type Stop = {
  order_id?: string
  id_pedido?: string
  cliente?: string
  direccion?: string
  lat?: number
  lng?: number
  stop_number?: number
}

export default function RouteMap({ stops }: { stops: Stop[] }) {
  // Generate mock stops if none provided
  const mockStops: Stop[] = [
    { id_pedido: 'PED-001', cliente: 'María García', direccion: 'Av. Paseo de la Reforma 505, CDMX', lat: 19.4326, lng: -99.1332 },
    { id_pedido: 'PED-002', cliente: 'Carlos López', direccion: 'Calle Amberes 54, CDMX', lat: 19.4316, lng: -99.1342 },
    { id_pedido: 'PED-003', cliente: 'Ana Rodríguez', direccion: 'Av. Paseo de la Reforma 222, CDMX', lat: 19.4336, lng: -99.1322 },
  ]

  const displayStops = stops && stops.length > 0 ? stops : mockStops

  const coords = useMemo(() => {
    if (!displayStops || displayStops.length === 0) return [] as [number, number][]
    // If stops include lat/lng use them, otherwise generate mock coords around Mexico City
    const base = { lat: 19.4326, lng: -99.1332 }
    const delta = 0.005
    return displayStops.map((s, i) => {
      if (s.lat != null && s.lng != null) return [s.lat, s.lng] as [number, number]
      const sign = i % 2 === 0 ? 1 : -1
      return [base.lat + sign * delta * i, base.lng + (i * delta) / 2 * sign] as [number, number]
    })
  }, [displayStops])

  if (coords.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center">
        <p className="text-gray-500 text-sm">No hay paradas para mostrar en el mapa.</p>
      </div>
    )
  }

  // center map on the first coordinate
  const center = coords[0]

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <MapContainer {...({ center, zoom: 13, style: { height: 300, width: '100%' } } as any)}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {coords.map((c, i) => (
          <CircleMarker
            key={i}
            {...({ center: c, pathOptions: { color: '#E61A27', fillColor: '#E61A27' }, radius: 8 } as any)}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{displayStops[i]?.cliente ?? displayStops[i]?.id_pedido ?? `Parada ${i + 1}`}</div>
                {displayStops[i]?.direccion && <div className="text-xs text-gray-600">{displayStops[i]!.direccion}</div>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
