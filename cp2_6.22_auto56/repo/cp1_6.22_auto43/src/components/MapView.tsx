import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import type { TravelSpot } from '../types'
import L from 'leaflet'

interface MapViewProps {
  spots: TravelSpot[]
  center: [number, number]
  zoom?: number
}

function MapController({ center, zoom = 12 }: { center: [number, number]; zoom?: number }) {
  const map = useMap()
  useMemo(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

function createNumberedIcon(number: number) {
  return L.divIcon({
    className: 'numbered-marker',
    html: `<div class="marker-number">${number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })
}

function MapView({ spots, center, zoom = 12 }: MapViewProps) {
  const sortedSpots = useMemo(() => [...spots], [spots])

  const polylinePositions = useMemo(
    () => sortedSpots.map((spot) => [spot.lat, spot.lng] as [number, number]),
    [sortedSpots],
  )

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ width: '100%', height: '100%' }}
    >
      <MapController center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {sortedSpots.map((spot, index) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={createNumberedIcon(index + 1)}
        >
          <Popup>
            <div style={{ padding: '4px 8px' }}>
              <strong style={{ fontSize: '14px' }}>
                {index + 1}. {spot.name}
              </strong>
              <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>
                {spot.description}
              </p>
              <p style={{ fontSize: '12px', color: '#e84545', margin: 0 }}>
                花费: ¥{spot.cost}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {polylinePositions.length > 1 && (
        <Polyline
          positions={polylinePositions}
          color="#e84545"
          weight={3}
          opacity={0.7}
          dashArray="10, 10"
        />
      )}
    </MapContainer>
  )
}

export default MapView
