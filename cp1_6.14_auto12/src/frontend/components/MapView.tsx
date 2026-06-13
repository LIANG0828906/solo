import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Sound, SoundCategory } from '../../shared/types'

interface MapViewProps {
  sounds: Sound[]
  onMapClick: (lat: number, lng: number) => void
  onMarkerClick: (sound: Sound) => void
  isLoading: boolean
}

const categoryColors: Record<SoundCategory, { primary: string; secondary: string }> = {
  traffic: { primary: '#e67e22', secondary: '#d35400' },
  nature: { primary: '#27ae60', secondary: '#2ecc71' },
  crowd: { primary: '#3498db', secondary: '#2980b9' },
  machinery: { primary: '#9b59b6', secondary: '#8e44ad' },
  other: { primary: '#7f8c8d', secondary: '#95a5a6' },
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function MapBoundsController({ sounds }: { sounds: Sound[] }) {
  const map = useMap()
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (sounds.length > 0 && !hasInitialized.current) {
      hasInitialized.current = true
      const bounds = L.latLngBounds(sounds.map((s) => [s.lat, s.lng]))
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [sounds, map])

  return null
}

function createMarkerIcon(sound: Sound): L.DivIcon {
  const colors = categoryColors[sound.category] || categoryColors.other
  const html = `
    <div class="sound-marker marker-fade-in">
      <div class="marker-pulse" style="background: radial-gradient(circle, ${colors.primary}40 0%, transparent 70%);"></div>
      <div class="marker-wave" style="border: 2px solid ${colors.primary}60;"></div>
      <div class="marker-wave" style="border: 2px solid ${colors.primary}40;"></div>
      <div class="marker-dot" style="background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});"></div>
    </div>
  `

  return L.divIcon({
    className: 'sound-marker-container',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

function SoundMarkers({
  sounds,
  onMarkerClick,
}: {
  sounds: Sound[]
  onMarkerClick: (sound: Sound) => void
}) {
  const map = useMap()

  useEffect(() => {
    const markers: L.Marker[] = []

    sounds.forEach((sound) => {
      const icon = createMarkerIcon(sound)
      const marker = L.marker([sound.lat, sound.lng], { icon })
      marker.on('click', () => onMarkerClick(sound))
      marker.addTo(map)
      markers.push(marker)
    })

    return () => {
      markers.forEach((marker) => marker.remove())
    }
  }, [sounds, map, onMarkerClick])

  return null
}

function MapView({ sounds, onMapClick, onMarkerClick, isLoading }: MapViewProps) {
  const center: [number, number] = useMemo(() => [31.2304, 121.4737], [])

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onClick={onMapClick} />
        <MapBoundsController sounds={sounds} />
        <SoundMarkers sounds={sounds} onMarkerClick={onMarkerClick} />
      </MapContainer>
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
          }}
        >
          <div className="loading-spinner" style={{ width: 40, height: 40 }} />
        </div>
      )}
    </div>
  )
}

export default MapView
