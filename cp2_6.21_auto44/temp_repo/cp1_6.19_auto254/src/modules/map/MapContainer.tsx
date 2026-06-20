import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
  Marker,
  Popup
} from 'react-leaflet'
import L from 'leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import { useJourneyStore } from '@/store/useJourneyStore'
import type { Photo } from '@/types'

function formatDateTime(date: Date | null): string {
  if (!date) return '未知时间'
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}年${m}月${d}日 ${h}:${min}`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 }
}

function interpolateColor(c1: string, c2: string, t: number): string {
  const a = hexToRgb(c1)
  const b = hexToRgb(c2)
  const r = Math.round(a.r + (b.r - a.r) * t)
  const g = Math.round(a.g + (b.g - a.g) * t)
  const bl = Math.round(a.b + (b.b - a.b) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

interface MapControllerProps {
  onMapClick?: (lat: number, lng: number) => void
  isAddingLocation: boolean
}

function MapController({ onMapClick, isAddingLocation }: MapControllerProps) {
  const map = useMap()

  useMapEvents({
    click: (e) => {
      if (isAddingLocation && onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    }
  })

  useEffect(() => {
    if (isAddingLocation) {
      map.getContainer().style.cursor = 'crosshair'
    } else {
      map.getContainer().style.cursor = ''
    }
  }, [isAddingLocation, map])

  return null
}

interface MapFlyToProps {
  targetPhoto: Photo | null
  isRoaming: boolean
  roamingSpeed: number
}

function MapFlyTo({ targetPhoto, isRoaming, roamingSpeed }: MapFlyToProps) {
  const map = useMap()
  const prevIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!targetPhoto || !targetPhoto.hasGPS) return
    if (prevIdRef.current === targetPhoto.id && !isRoaming) return
    prevIdRef.current = targetPhoto.id

    const duration = isRoaming ? 2000 / roamingSpeed : 800
    map.flyTo([targetPhoto.lat!, targetPhoto.lng!], 13, {
      duration: duration / 1000,
      easeLinearity: 0.25
    })
  }, [targetPhoto, isRoaming, roamingSpeed, map])

  return null
}

interface GradientPathProps {
  photos: Photo[]
}

function GradientPath({ photos }: GradientPathProps) {
  const map = useMap()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const layerRef = useRef<L.Layer | null>(null)

  const validPhotos = useMemo(
    () =>
      photos
        .filter((p) => p.hasGPS)
        .sort((a, b) => {
          if (!a.timestamp && !b.timestamp) return 0
          if (!a.timestamp) return 1
          if (!b.timestamp) return -1
          return a.timestamp.getTime() - b.timestamp.getTime()
        }),
    [photos]
  )

  const drawPath = useCallback(() => {
    if (!map || !canvasRef.current || validPhotos.length < 2) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const size = map.getSize()
    const dpr = window.devicePixelRatio || 1

    canvas.width = size.x * dpr
    canvas.height = size.y * dpr
    canvas.style.width = `${size.x}px`
    canvas.style.height = `${size.y}px`
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, size.x, size.y)

    const points = validPhotos.map((p) => map.latLngToContainerPoint([p.lat!, p.lng!]))

    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.shadowColor = 'rgba(0, 196, 255, 0.5)'
    ctx.shadowBlur = 8
    ctx.strokeStyle = 'rgba(0, 196, 255, 0.3)'
    ctx.lineWidth = 6
    ctx.beginPath()
    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y)
      else ctx.lineTo(pt.x, pt.y)
    })
    ctx.stroke()

    ctx.shadowBlur = 0
    ctx.lineWidth = 3

    const segments = 200
    const totalLen = points.length - 1

    for (let i = 0; i < totalLen; i++) {
      const p1 = points[i]
      const p2 = points[i + 1]
      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const segsForThis = Math.max(1, Math.round((dist / 200) * segments / totalLen))

      for (let s = 0; s < segsForThis; s++) {
        const t1 = (i + s / segsForThis) / totalLen
        const t2 = (i + (s + 1) / segsForThis) / totalLen
        const sx = p1.x + dx * (s / segsForThis)
        const sy = p1.y + dy * (s / segsForThis)
        const ex = p1.x + dx * ((s + 1) / segsForThis)
        const ey = p1.y + dy * ((s + 1) / segsForThis)

        const grad = ctx.createLinearGradient(sx, sy, ex, ey)
        grad.addColorStop(0, interpolateColor('#00C4FF', '#7B2FF7', t1))
        grad.addColorStop(1, interpolateColor('#00C4FF', '#7B2FF7', t2))
        ctx.strokeStyle = grad

        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(ex, ey)
        ctx.stroke()
      }
    }
  }, [map, validPhotos])

  useEffect(() => {
    if (!map) return

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
      canvasRef.current.style.position = 'absolute'
      canvasRef.current.style.top = '0'
      canvasRef.current.style.left = '0'
      canvasRef.current.style.pointerEvents = 'none'
      canvasRef.current.style.zIndex = '400'

      const Overlay = L.Layer.extend({
        onAdd: function () {
          const pane = map.getPane('overlayPane')
          if (pane && canvasRef.current) {
            pane.appendChild(canvasRef.current)
          }
        },
        onRemove: function () {
          if (canvasRef.current && canvasRef.current.parentNode) {
            canvasRef.current.parentNode.removeChild(canvasRef.current)
          }
        }
      })

      const overlay = new Overlay()
      overlay.addTo(map)
      layerRef.current = overlay
    }

    drawPath()

    map.on('move', drawPath)
    map.on('zoom', drawPath)
    map.on('resize', drawPath)

    return () => {
      map.off('move', drawPath)
      map.off('zoom', drawPath)
      map.off('resize', drawPath)
    }
  }, [map, drawPath])

  return null
}

interface PhotoMarkerProps {
  photo: Photo
  isSelected: boolean
  isHighlighted: boolean
  index: number
  total: number
  onClick: () => void
}

function PhotoMarker({
  photo,
  isSelected,
  isHighlighted,
  index,
  total,
  onClick
}: PhotoMarkerProps) {
  const progress = total > 1 ? index / (total - 1) : 0
  const color = interpolateColor('#00C4FF', '#7B2FF7', progress)

  const size = isHighlighted ? 32 : 24

  const icon = L.divIcon({
    className: 'photo-marker',
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background:rgba(255,255,255,0.8);
        border:2px solid ${isHighlighted ? color : '#007AFF'};
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:${isHighlighted ? '13px' : '11px'};
        font-weight:700;
        color:#161B22;
        box-shadow: 0 2px 12px rgba(0,0,0,0.4), 0 0 0 3px ${color}33;
        transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
        transform: translate(-50%, -50%);
        position: absolute;
        left: 50%;
        top: 50%;
      ">
        ${index + 1}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  })

  return (
    <Marker
      position={[photo.lat!, photo.lng!]}
      icon={icon}
      eventHandlers={{ click: onClick }}
      zIndexOffset={isHighlighted ? 1000 : 100}
      keyboard={false}
    >
      <Popup
        closeButton={false}
        autoPan={false}
        minWidth={240}
        maxWidth={280}
        className="custom-popup"
      >
        <PhotoCard photo={photo} index={index} color={color} />
      </Popup>
    </Marker>
  )
}

interface PhotoCardProps {
  photo: Photo
  index: number
  color: string
}

function PhotoCard({ photo, index, color }: PhotoCardProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minWidth: '220px'
      }}
    >
      <div
        style={{
          position: 'relative',
          marginBottom: '10px',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        <img
          src={photo.url}
          alt=""
          style={{
            width: '100%',
            maxWidth: '200px',
            maxHeight: '150px',
            objectFit: 'cover',
            display: 'block',
            borderRadius: '6px'
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '6px',
            left: '6px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: `linear-gradient(135deg, ${color}, #7B2FF7)`,
            color: '#fff',
            fontSize: '10px',
            fontWeight: 700
          }}
        >
          #{index + 1}
        </div>
      </div>
      <div style={{ color: '#C9D1D9', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
        {photo.file.name}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          color: '#8B949E',
          marginBottom: '4px'
        }}
      >
        <span>🕒</span>
        <span>{formatDateTime(photo.timestamp)}</span>
      </div>
      {photo.locationDescription && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            color: '#58A6FF'
          }}
        >
          <span>📍</span>
          <span>{photo.locationDescription}</span>
        </div>
      )}
      {!photo.locationDescription && photo.lat && photo.lng && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            color: '#8B949E'
          }}
        >
          <span>📍</span>
          <span>
            {photo.lat.toFixed(4)}, {photo.lng.toFixed(4)}
          </span>
        </div>
      )}
    </motion.div>
  )
}

const DEFAULT_CENTER: [number, number] = [35.6895, 139.6917]

export function JourneyMap() {
  const {
    photos,
    selectedPhotoId,
    selectPhoto,
    highlightedPhotoId,
    highlightPhoto,
    isRoaming,
    roamingSpeed,
    isAddingLocation,
    pendingPhotoId,
    updatePhotoLocation,
    cancelAddLocation
  } = useJourneyStore()

  const mapRef = useRef<L.Map | null>(null)
  const [popupState, setPopupState] = useState<string | null>(null)

  const validPhotos = useMemo(
    () =>
      photos
        .filter((p) => p.hasGPS)
        .sort((a, b) => {
          if (!a.timestamp && !b.timestamp) return 0
          if (!a.timestamp) return 1
          if (!b.timestamp) return -1
          return a.timestamp.getTime() - b.timestamp.getTime()
        }),
    [photos]
  )

  const highlightedPhoto = useMemo(
    () => validPhotos.find((p) => p.id === highlightedPhotoId) || null,
    [validPhotos, highlightedPhotoId]
  )

  const selectedPhoto = useMemo(
    () => validPhotos.find((p) => p.id === selectedPhotoId) || null,
    [validPhotos, selectedPhotoId]
  )

  const showTarget = highlightedPhoto || selectedPhoto

  const center = useMemo<[number, number]>(() => {
    if (validPhotos.length > 0) {
      const lats = validPhotos.map((p) => p.lat!)
      const lngs = validPhotos.map((p) => p.lng!)
      return [
        lats.reduce((a, b) => a + b, 0) / lats.length,
        lngs.reduce((a, b) => a + b, 0) / lngs.length
      ]
    }
    return DEFAULT_CENTER
  }, [validPhotos])

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (pendingPhotoId) {
        updatePhotoLocation(pendingPhotoId, lat, lng)
      }
    },
    [pendingPhotoId, updatePhotoLocation]
  )

  useEffect(() => {
    if (highlightedPhotoId && !isRoaming) {
      setPopupState(highlightedPhotoId)
    }
  }, [highlightedPhotoId, isRoaming])

  useEffect(() => {
    if (isRoaming && highlightedPhotoId) {
      const timer = setTimeout(() => setPopupState(highlightedPhotoId), 500)
      return () => clearTimeout(timer)
    }
  }, [highlightedPhotoId, isRoaming])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#0D1117'
      }}
    >
      <MapContainer
        ref={(m) => {
          if (m) mapRef.current = (m as unknown) as L.Map
        }}
        center={center}
        zoom={validPhotos.length > 0 ? 10 : 3}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={20}
        />

        <MapController onMapClick={handleMapClick} isAddingLocation={isAddingLocation} />
        <MapFlyTo
          targetPhoto={showTarget}
          isRoaming={isRoaming}
          roamingSpeed={roamingSpeed}
        />
        <GradientPath photos={photos} />

        <AnimatePresence>
          {validPhotos.map((photo, idx) => (
            <PhotoMarker
              key={photo.id}
              photo={photo}
              index={idx}
              total={validPhotos.length}
              isSelected={selectedPhotoId === photo.id}
              isHighlighted={highlightedPhotoId === photo.id}
              onClick={() => {
                if (isAddingLocation) return
                selectPhoto(selectedPhotoId === photo.id ? null : photo.id)
                highlightPhoto(photo.id)
                setPopupState(photo.id)
              }}
            />
          ))}
        </AnimatePresence>
      </MapContainer>

      <AnimatePresence>
        {isAddingLocation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #1F6FEB, #7B2FF7)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 4px 20px rgba(31, 111, 235, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span>📍</span>
            <span>点击地图为照片标记位置</span>
            <motion.button
              onClick={cancelAddLocation}
              style={{
                marginLeft: '8px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600
              }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.95 }}
            >
              取消
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {validPhotos.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(13, 17, 23, 0.85)',
            backdropFilter: 'blur(4px)',
            zIndex: 900,
            pointerEvents: 'none'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '64px',
                marginBottom: '16px',
                opacity: 0.5
              }}
            >
              🗺️
            </div>
            <div
              style={{
                color: '#C9D1D9',
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '6px'
              }}
            >
              上传带GPS信息的照片
            </div>
            <div style={{ color: '#8B949E', fontSize: '13px' }}>
              轨迹与标记将自动生成在地图上
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          zIndex: 500,
          padding: '8px 12px',
          backgroundColor: 'rgba(22, 27, 34, 0.9)',
          backdropFilter: 'blur(8px)',
          borderRadius: '8px',
          border: '1px solid #30363D'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '60px',
              height: '4px',
              borderRadius: '2px',
              background: 'linear-gradient(90deg, #00C4FF, #7B2FF7)',
              boxShadow: '0 0 6px rgba(0, 196, 255, 0.5)'
            }}
          />
          <span style={{ fontSize: '11px', color: '#8B949E' }}>
            旅程 · {validPhotos.length} 个位置点
          </span>
        </div>
      </div>
    </div>
  )
}
