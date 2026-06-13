import { useEffect, useMemo, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Sound, SoundCategory } from '../../shared/types'

interface MapViewProps {
  sounds: Sound[]
  onMapClick: (lat: number, lng: number) => void
  onMarkerClick: (sound: Sound) => void
  isLoading: boolean
}

const categoryColors: Record<SoundCategory, { primary: string; secondary: string; glow: string }> = {
  traffic: { primary: '#e67e22', secondary: '#d35400', glow: 'rgba(230, 126, 34, 0.6)' },
  nature: { primary: '#27ae60', secondary: '#2ecc71', glow: 'rgba(39, 174, 96, 0.6)' },
  crowd: { primary: '#3498db', secondary: '#2980b9', glow: 'rgba(52, 152, 219, 0.6)' },
  machinery: { primary: '#9b59b6', secondary: '#8e44ad', glow: 'rgba(155, 89, 182, 0.6)' },
  other: { primary: '#7f8c8d', secondary: '#95a5a6', glow: 'rgba(127, 140, 141, 0.6)' },
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

function createMarkerIcon(sound: Sound, animate: 'in' | 'out' = 'in'): L.DivIcon {
  const colors = categoryColors[sound.category] || categoryColors.other
  const animClass = animate === 'in' ? 'marker-fade-in' : 'marker-fade-out'

  const html = `
    <div class="sound-marker ${animClass}" data-id="${sound.id}">
      <div class="marker-glow" style="
        background: radial-gradient(circle, ${colors.glow} 0%, transparent 70%);
        animation: marker-breathe 3s ease-in-out infinite;
      "></div>
      <div class="marker-pulse-ring" style="
        background: radial-gradient(circle, ${colors.primary}50 0%, transparent 70%);
        animation: pulse-ring 2.5s ease-out infinite;
      "></div>
      <div class="marker-wave-ring marker-wave-1" style="
        border: 2px solid ${colors.primary}50;
        animation: wave-expand 3s ease-out infinite;
      "></div>
      <div class="marker-wave-ring marker-wave-2" style="
        border: 2px solid ${colors.primary}35;
        animation: wave-expand 3s ease-out 1s infinite;
      "></div>
      <div class="marker-wave-ring marker-wave-3" style="
        border: 2px solid ${colors.primary}20;
        animation: wave-expand 3s ease-out 2s infinite;
      "></div>
      <div class="marker-dot" style="
        background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
        box-shadow: 0 0 8px ${colors.glow}, 0 0 16px ${colors.primary}40;
      "></div>
    </div>
  `

  return L.divIcon({
    className: 'sound-marker-container',
    html,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
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
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map())
  const onMarkerClickRef = useRef(onMarkerClick)
  onMarkerClickRef.current = onMarkerClick

  const updateMarkers = useCallback(
    (newSounds: Sound[]) => {
      const currentMarkers = markerMapRef.current
      const newIds = new Set(newSounds.map((s) => s.id))
      const currentIds = new Set(currentMarkers.keys())

      const toRemove: string[] = []
      currentIds.forEach((id) => {
        if (!newIds.has(id)) {
          toRemove.push(id)
        }
      })

      const toAdd: Sound[] = []
      newSounds.forEach((sound) => {
        if (!currentIds.has(sound.id)) {
          toAdd.push(sound)
        }
      })

      toRemove.forEach((id) => {
        const marker = currentMarkers.get(id)
        if (marker) {
          const el = marker.getElement()
          if (el) {
            const markerEl = el.querySelector('.sound-marker')
            if (markerEl) {
              markerEl.classList.remove('marker-fade-in')
              markerEl.classList.add('marker-fade-out')
            }
          }
          setTimeout(() => {
            marker.remove()
          }, 400)
          currentMarkers.delete(id)
        }
      })

      toAdd.forEach((sound) => {
        const icon = createMarkerIcon(sound, 'in')
        const marker = L.marker([sound.lat, sound.lng], { icon })
        marker.on('click', () => onMarkerClickRef.current(sound))
        marker.addTo(map)
        currentMarkers.set(sound.id, marker)
      })

      newSounds.forEach((sound) => {
        const marker = currentMarkers.get(sound.id)
        if (marker) {
          const currentIcon = marker.getIcon() as L.DivIcon
          const currentHtml = currentIcon.options.html || ''
          const currentCategory = currentHtml.includes(`data-id="${sound.id}"`)
          if (currentCategory) {
            marker.setLatLng([sound.lat, sound.lng])
          }
        }
      })
    },
    [map],
  )

  useEffect(() => {
    updateMarkers(sounds)

    return () => {
      markerMapRef.current.forEach((marker) => marker.remove())
      markerMapRef.current.clear()
    }
  }, [sounds, updateMarkers])

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
        <div className="map-loading">
          <div className="loading-spinner" style={{ width: 40, height: 40 }} />
        </div>
      )}
    </div>
  )
}

export default MapView
