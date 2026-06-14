import { useState, useCallback, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet'
import MarkerLayer from '@/components/MarkerLayer'
import AddMarkerModal from '@/components/AddMarkerModal'
import type { TravelMarker, MarkerFormData } from '@/types'
import {
  getMarkers,
  addMarker,
  updateMarker,
  deleteMarker,
} from '@/services/api'

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface MapControllerProps {
  flyToPosition?: { lat: number; lng: number } | null
}

function MapController({ flyToPosition }: MapControllerProps) {
  const map = useMap()
  const lastFlyRef = useRef<string>('')

  useEffect(() => {
    if (flyToPosition) {
      const key = `${flyToPosition.lat}-${flyToPosition.lng}`
      if (key !== lastFlyRef.current) {
        lastFlyRef.current = key
        map.flyTo([flyToPosition.lat, flyToPosition.lng], 4, {
          duration: 0.8,
        })
      }
    }
  }, [flyToPosition, map])

  return null
}

export default function MapPage() {
  const [markers, setMarkers] = useState<TravelMarker[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clickPosition, setClickPosition] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [editingMarker, setEditingMarker] = useState<TravelMarker | null>(null)
  const [newMarkerId, setNewMarkerId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [markerToDelete, setMarkerToDelete] = useState<TravelMarker | null>(
    null
  )
  const [flyToPosition, setFlyToPosition] = useState<{
    lat: number
    lng: number
  } | null>(null)

  useEffect(() => {
    const data = getMarkers()
    setMarkers(data)
  }, [])

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setEditingMarker(null)
    setClickPosition({ lat, lng })
    setIsModalOpen(true)
  }, [])

  const handleMarkerClick = useCallback(
    (_marker: TravelMarker) => {},
    []
  )

  const handleEditMarker = useCallback((marker: TravelMarker) => {
    setEditingMarker(marker)
    setClickPosition({ lat: marker.lat, lng: marker.lng })
    setIsModalOpen(true)
  }, [])

  const handleDeleteRequest = useCallback((marker: TravelMarker) => {
    setMarkerToDelete(marker)
    setShowConfirmDelete(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!markerToDelete) return

    setDeletingId(markerToDelete.id)

    setTimeout(() => {
      const success = deleteMarker(markerToDelete.id)
      if (success) {
        setMarkers((prev) => prev.filter((m) => m.id !== markerToDelete.id))
      }
      setDeletingId(null)
      setMarkerToDelete(null)
      setShowConfirmDelete(false)
    }, 300)
  }, [markerToDelete])

  const handleCancelDelete = useCallback(() => {
    setShowConfirmDelete(false)
    setMarkerToDelete(null)
  }, [])

  const handleSubmit = useCallback(
    (data: MarkerFormData) => {
      if (editingMarker) {
        const updated = updateMarker(editingMarker.id, {
          city: data.city,
          country: data.country,
          continent: data.continent,
          date: data.date,
          mood: data.mood,
          photo: data.photo,
          lat: data.lat,
          lng: data.lng,
        })
        if (updated) {
          setMarkers((prev) =>
            prev.map((m) => (m.id === editingMarker.id ? updated : m))
          )
          setFlyToPosition({ lat: updated.lat, lng: updated.lng })
        }
      } else {
        const newMarker = addMarker({
          city: data.city,
          country: data.country,
          continent: data.continent,
          date: data.date,
          mood: data.mood,
          photo: data.photo,
          lat: data.lat,
          lng: data.lng,
        })
        setMarkers((prev) => [...prev, newMarker])
        setNewMarkerId(newMarker.id)
        setFlyToPosition({ lat: newMarker.lat, lng: newMarker.lng })

        setTimeout(() => {
          setNewMarkerId(null)
        }, 1000)
      }

      setIsModalOpen(false)
      setEditingMarker(null)
      setClickPosition(null)
    },
    [editingMarker]
  )

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingMarker(null)
    setClickPosition(null)
  }, [])

  return (
    <div className="map-page">
      <div className="map-container">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          minZoom={2}
          maxZoom={18}
          style={{ height: '100%', width: '100%' }}
          worldCopyJump={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />
          <MapClickHandler onMapClick={handleMapClick} />
          <MapController flyToPosition={flyToPosition} />
          <MarkerLayer
            markers={markers}
            onMarkerClick={handleMarkerClick}
            newMarkerId={newMarkerId || undefined}
            deletingId={deletingId || undefined}
            onEdit={handleEditMarker}
            onDelete={handleDeleteRequest}
          />
        </MapContainer>
      </div>

      <AddMarkerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={editingMarker || undefined}
        position={clickPosition || undefined}
      />

      {showConfirmDelete && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog">
              <h3 className="modal-title">确认删除</h3>
              <p className="confirm-dialog-text">
                确定要删除
                {markerToDelete ? ` "${markerToDelete.city}" 的旅行记录吗？` : '这条旅行记录吗？'}
                <br />
                <span style={{ fontSize: '0.85rem', color: '#8D6E63' }}>
                  删除后无法恢复
                </span>
              </p>
              <div className="confirm-dialog-actions">
                <button
                  className="btn btn-secondary"
                  onClick={handleCancelDelete}
                >
                  取消
                </button>
                <button className="btn btn-danger" onClick={handleConfirmDelete}>
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
