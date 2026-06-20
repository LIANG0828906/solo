import React, { useEffect, useRef, useCallback, useState, useImperativeHandle, forwardRef } from 'react'
import L from 'leaflet'
import { format } from 'date-fns'
import { Photo, FilterState } from '@/types'

export interface MapRendererHandle {
  addManualMarker: (lat: number, lng: number, name: string, description: string) => void
}

interface MapRendererProps {
  photos: Photo[]
  filterState: FilterState
  onAddManualMarkerRequest: (lat: number, lng: number) => void
}

const interpolateColor = (t: number): string => {
  const r1 = 30, g1 = 100, b1 = 200
  const r2 = 220, g2 = 50, b2 = 50
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r}, ${g}, ${b})`
}

const createPhotoIcon = (color: string, isManual: boolean): L.DivIcon => {
  const className = `photo-marker-icon${isManual ? ' manual-marker' : ''}`
  return L.divIcon({
    className,
    html: `<div style="width:28px;height:28px;background:${color};border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">${
      isManual
        ? '<span style="color:#fff;font-size:18px;font-weight:bold;line-height:1;text-shadow:0 1px 2px rgba(0,0,0,0.3);">+</span>'
        : ''
    }</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  })
}

const MapRenderer = forwardRef<MapRendererHandle, MapRendererProps>(
  ({ photos, filterState, onAddManualMarkerRequest }, ref) => {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<L.Map | null>(null)
    const markersRef = useRef<Map<string, L.Marker>>(new Map())
    const polylinesRef = useRef<L.Polyline[]>([])
    const [addModal, setAddModal] = useState<{ lat: number; lng: number; name: string; description: string } | null>(
      null
    )

    useImperativeHandle(ref, () => ({
      addManualMarker: (lat: number, lng: number, name: string, description: string) => {
        setAddModal({ lat, lng, name, description })
      }
    }))

    useEffect(() => {
      if (!mapRef.current || mapInstanceRef.current) return

      const map = L.map(mapRef.current, {
        center: [35.8617, 104.1954],
        zoom: 4,
        zoomControl: true,
        preferCanvas: true
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
      }).addTo(map)

      map.on('dblclick', (e) => {
        onAddManualMarkerRequest(e.latlng.lat, e.latlng.lng)
      })

      mapInstanceRef.current = map

      return () => {
        map.remove()
        mapInstanceRef.current = null
      }
    }, [onAddManualMarkerRequest])

    const clearPolylines = useCallback(() => {
      polylinesRef.current.forEach((pl) => pl.remove())
      polylinesRef.current = []
    }, [])

    const drawPolylines = useCallback(
      (visiblePhotos: Photo[]) => {
        clearPolylines()
        if (!mapInstanceRef.current || visiblePhotos.length < 2) return

        const sorted = [...visiblePhotos].sort(
          (a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime()
        )

        for (let i = 0; i < sorted.length - 1; i++) {
          const p1 = sorted[i]
          const p2 = sorted[i + 1]
          const t = i / Math.max(sorted.length - 2, 1)
          const color = interpolateColor(t)

          const latlngs: [number, number][] = [
            [p1.latitude, p1.longitude],
            [p2.latitude, p2.longitude]
          ]

          const polyline = L.polyline(latlngs, {
            color,
            weight: 3,
            opacity: 0.6,
            className: 'route-line',
            lineCap: 'round'
          }).addTo(mapInstanceRef.current)

          polylinesRef.current.push(polyline)
        }
      },
      [clearPolylines]
    )

    const isPhotoVisible = useCallback(
      (photo: Photo): boolean => {
        const taken = new Date(photo.takenAt)
        const takenMs = taken.getTime()

        if (filterState.startTime) {
          if (takenMs < filterState.startTime.getTime()) return false
        }
        if (filterState.endTime) {
          if (takenMs > filterState.endTime.getTime()) return false
        }

        if (filterState.startDate) {
          const start = new Date(filterState.startDate + 'T00:00:00')
          if (takenMs < start.getTime()) return false
        }
        if (filterState.endDate) {
          const end = new Date(filterState.endDate + 'T23:59:59')
          if (takenMs > end.getTime()) return false
        }

        if (filterState.keyword) {
          const kw = filterState.keyword.toLowerCase()
          const matchName = photo.fileName.toLowerCase().includes(kw)
          const matchCamera = photo.cameraModel.toLowerCase().includes(kw)
          if (!matchName && !matchCamera) return false
        }

        return true
      },
      [filterState]
    )

    useEffect(() => {
      if (!mapInstanceRef.current) return
      const map = mapInstanceRef.current

      const currentIds = new Set(photos.map((p) => p.id))

      markersRef.current.forEach((marker, id) => {
        if (!currentIds.has(id)) {
          marker.remove()
          markersRef.current.delete(id)
        }
      })

      photos.forEach((photo) => {
        let marker = markersRef.current.get(photo.id)
        const visible = isPhotoVisible(photo)

        if (!marker) {
          const popupContent = `
            <div class="popup-content">
              <img src="${photo.thumbnailUrl}" alt="" />
              <div class="popup-time">${format(new Date(photo.takenAt), 'yyyy-MM-dd HH:mm:ss')}</div>
            </div>
          `

          marker = L.marker([photo.latitude, photo.longitude], {
            icon: createPhotoIcon(photo.dominantColor, photo.isManual)
          }).bindPopup(popupContent)

          marker.addTo(map)
          markersRef.current.set(photo.id, marker)
        }

        const el = marker.getElement()
        if (el) {
          el.classList.toggle('photo-marker-hidden', !visible)
        }
      })

      const visiblePhotos = photos.filter(isPhotoVisible)
      drawPolylines(visiblePhotos)
    }, [photos, isPhotoVisible, drawPolylines])

    useEffect(() => {
      if (!mapInstanceRef.current) return

      const visiblePhotos = photos.filter(isPhotoVisible)

      markersRef.current.forEach((marker, id) => {
        const photo = photos.find((p) => p.id === id)
        if (!photo) return
        const visible = isPhotoVisible(photo)
        const el = marker.getElement()
        if (el) {
          el.classList.toggle('photo-marker-hidden', !visible)
        }
      })

      drawPolylines(visiblePhotos)
    }, [filterState, photos, isPhotoVisible, drawPolylines])

    const confirmAddManual = useCallback(() => {
      if (!addModal || !mapInstanceRef.current) return
      const { lat, lng, name, description } = addModal
      const latlng: [number, number] = [lat, lng]
      const popupContent = `
        <div class="popup-content" style="padding:8px;">
          <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${name || '手动标记'}</div>
          <div style="font-size:12px;color:#666;">${description || ''}</div>
          <div class="popup-time" style="margin-top:6px;">${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</div>
        </div>
      `
      const marker = L.marker(latlng, {
        icon: createPhotoIcon('#d4a373', true)
      }).bindPopup(popupContent)
      marker.addTo(mapInstanceRef.current)
      mapInstanceRef.current.setView(latlng, mapInstanceRef.current.getZoom())
      setAddModal(null)
    }, [addModal])

    const cancelAddManual = useCallback(() => {
      setAddModal(null)
    }, [])

    return (
      <>
        <div ref={mapRef} className="map-container" />
        {addModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-title">添加手动标记</div>
              <div className="modal-desc">
                位置：{addModal.lat.toFixed(4)}, {addModal.lng.toFixed(4)}
              </div>
              <input
                className="modal-input"
                type="text"
                placeholder="名称"
                value={addModal.name}
                onChange={(e) => setAddModal({ ...addModal, name: e.target.value })}
              />
              <input
                className="modal-input"
                type="text"
                placeholder="描述信息"
                value={addModal.description}
                onChange={(e) => setAddModal({ ...addModal, description: e.target.value })}
              />
              <div className="modal-actions">
                <button className="modal-btn modal-btn-secondary" onClick={cancelAddManual}>
                  取消
                </button>
                <button className="modal-btn modal-btn-primary" onClick={confirmAddManual}>
                  添加
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }
)

MapRenderer.displayName = 'MapRenderer'

export default MapRenderer
