import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTripStore } from '@/shared/data/TripStore'
import type { MapMarker as SharedMapMarker, TripPage, Photo as SharedPhoto } from '@/shared/types'
import Timeline, { TimelinePage } from './Timeline'
import MarkerPopup, { MarkerPhoto } from './MarkerPopup'

export interface MapDisplayProps {
  tripId: string
}

interface ExtendedMapMarker {
  id: string
  pageId: string
  name: string
  address?: string
  lat: number
  lng: number
  date: string
  photos?: MarkerPhoto[]
}

const ANIMATION_DURATION = 3000

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function createCustomIcon(isActive: boolean, isCurrent: boolean) {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="${cn(
          'w-6 h-6 rounded-full border-2 border-white shadow-lg transform transition-all duration-300',
          isCurrent ? 'bg-indigo-600 scale-125' : isActive ? 'bg-indigo-500' : 'bg-gray-400'
        )}"></div>
        ${isCurrent ? '<div class="absolute -top-1 -left-1 w-8 h-8 rounded-full bg-indigo-400 opacity-30 animate-ping"></div>' : ''}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function MapBoundsController({ markers }: { markers: ExtendedMapMarker[] }) {
  const map = useMap()
  useEffect(() => {
    if (markers.length === 0) return
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]))
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 })
  }, [markers, map])
  return null
}

function getPhotosForMarker(page: TripPage, marker: SharedMapMarker): MarkerPhoto[] {
  const result: MarkerPhoto[] = []
  if (marker.photoId) {
    const photo = page.photos.find((p: SharedPhoto) => p.id === marker.photoId)
    if (photo) {
      result.push({
        id: photo.id,
        url: photo.thumbnailUrl || photo.url,
      })
    }
  }
  if (result.length === 0 && page.photos.length > 0) {
    page.photos.slice(0, 4).forEach((p: SharedPhoto) => {
      result.push({
        id: p.id,
        url: p.thumbnailUrl || p.url,
      })
    })
  }
  return result
}

export default function MapDisplay({ tripId }: MapDisplayProps) {
  const { getTrip } = useTripStore()
  const trip = getTrip(tripId)

  const [isPlaying, setIsPlaying] = useState(false)
  const [animationProgress, setAnimationProgress] = useState(0)
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null)
  const progressRef = useRef(0)

  useEffect(() => {
    progressRef.current = animationProgress
  }, [animationProgress])

  const sortedMarkers = useMemo(() => {
    if (!trip || !trip.pages) return []
    const markers: ExtendedMapMarker[] = []
    const sortedPages = [...trip.pages].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    sortedPages.forEach((page) => {
      if (page.markers && page.markers.length > 0) {
        page.markers.forEach((marker: SharedMapMarker) => {
          markers.push({
            id: marker.id,
            pageId: page.id,
            name: marker.name,
            address: marker.address,
            lat: marker.lat,
            lng: marker.lng,
            date: page.date,
            photos: getPhotosForMarker(page, marker),
          })
        })
      }
    })
    return markers.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [trip])

  const positions = useMemo(
    () => sortedMarkers.map((m) => [m.lat, m.lng] as [number, number]),
    [sortedMarkers]
  )

  const animatedPositions = useMemo(() => {
    if (positions.length < 2) return positions
    const totalSegments = positions.length - 1
    const easedProgress = easeInOut(animationProgress)
    const progressAlongPath = easedProgress * totalSegments
    const currentSegmentIndex = Math.min(Math.floor(progressAlongPath), totalSegments - 1)
    const segmentProgress = progressAlongPath - currentSegmentIndex
    const result: [number, number][] = []
    for (let i = 0; i <= currentSegmentIndex; i++) {
      result.push(positions[i])
    }
    if (currentSegmentIndex < totalSegments) {
      const start = positions[currentSegmentIndex]
      const end = positions[currentSegmentIndex + 1]
      const lat = start[0] + (end[0] - start[0]) * segmentProgress
      const lng = start[1] + (end[1] - start[1]) * segmentProgress
      result.push([lat, lng])
    } else {
      result.push(positions[positions.length - 1])
    }
    return result
  }, [positions, animationProgress])

  const currentMarkerIndex = useMemo(() => {
    if (sortedMarkers.length === 0) return -1
    const easedProgress = easeInOut(animationProgress)
    const index = Math.floor(easedProgress * sortedMarkers.length)
    return Math.min(index, sortedMarkers.length - 1)
  }, [animationProgress, sortedMarkers.length])

  useEffect(() => {
    if (!isPlaying) return
    let startTime: number | null = null
    let animationFrameId: number
    const startProgress = progressRef.current

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const remainingDuration = (1 - startProgress) * ANIMATION_DURATION
      const progress = startProgress + (elapsed / remainingDuration) * (1 - startProgress)

      if (progress >= 1) {
        setAnimationProgress(1)
        setIsPlaying(false)
        return
      }

      setAnimationProgress(progress)
      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isPlaying])

  const handlePlayPause = useCallback(() => {
    if (animationProgress >= 1) {
      setAnimationProgress(0)
      setTimeout(() => setIsPlaying(true), 50)
    } else {
      setIsPlaying((prev) => !prev)
    }
  }, [animationProgress])

  const handleReset = useCallback(() => {
    setIsPlaying(false)
    setAnimationProgress(0)
    setActiveMarkerId(null)
  }, [])

  const timelinePages: TimelinePage[] = useMemo(() => {
    if (!trip || !trip.pages) return []
    const sortedPages = [...trip.pages].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    return sortedPages.map((page) => ({
      id: page.id,
      tripId,
      date: page.date,
      title: page.title,
      locationName: page.markers?.[0]?.name,
      thumbnailUrl: page.photos?.[0]?.thumbnailUrl || page.photos?.[0]?.url,
    }))
  }, [trip, tripId])

  if (sortedMarkers.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 rounded-xl">
        <p className="text-gray-500">暂无地图数据</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="relative flex-1 min-h-[400px]">
        <MapContainer
          center={[sortedMarkers[0].lat, sortedMarkers[0].lng]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapBoundsController markers={sortedMarkers} />

          {animatedPositions.length >= 2 && (
            <Polyline
              positions={animatedPositions}
              pathOptions={{
                color: '#6366f1',
                weight: 4,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}

          {sortedMarkers.map((marker, index) => {
            const isActive = index <= currentMarkerIndex
            const isCurrent = index === currentMarkerIndex
            return (
              <Marker
                key={marker.id}
                position={[marker.lat, marker.lng]}
                icon={createCustomIcon(isActive, isCurrent)}
                eventHandlers={{
                  click: () => setActiveMarkerId(activeMarkerId === marker.id ? null : marker.id),
                }}
              >
                <Popup closeButton={false} minWidth={280} maxWidth={280} className="p-0">
                  <MarkerPopup
                    name={marker.name}
                    address={marker.address}
                    photos={marker.photos}
                    onClose={() => setActiveMarkerId(null)}
                  />
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-[1000] flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg px-5 py-3">
          <button
            onClick={handleReset}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
            title="重置"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={handlePlayPause}
            className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 transition-colors text-white shadow-md hover:shadow-lg"
            title={isPlaying ? '暂停' : animationProgress >= 1 ? '重新播放' : '播放'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-75 ease-linear"
              style={{ width: `${animationProgress * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 font-medium min-w-[48px] text-right">
            {Math.round(animationProgress * 100)}%
          </span>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-gray-50/50">
        <Timeline pages={timelinePages} animationProgress={animationProgress} tripId={tripId} />
      </div>
    </div>
  )
}
