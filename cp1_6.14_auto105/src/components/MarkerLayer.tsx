import { useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { TravelMarker } from '@/types'
import { CONTINENT_COLORS, MOOD_EMOJIS, MOOD_LABELS } from '@/types'
import MarkerClusterGroup from './MarkerClusterGroup'

interface MarkerLayerProps {
  markers: TravelMarker[]
  onMarkerClick: (marker: TravelMarker) => void
  onEdit: (marker: TravelMarker) => void
  onDelete: (marker: TravelMarker) => void
  deletingId?: string
  newMarkerId?: string
  selectedMarker?: TravelMarker | null
}

function MarkerLayer({
  markers,
  onMarkerClick,
  onEdit,
  onDelete,
  deletingId,
  newMarkerId,
}: MarkerLayerProps) {
  const useClustering = markers.length > 100

  const createIcon = (marker: TravelMarker) => {
    const color = CONTINENT_COLORS[marker.continent] || CONTINENT_COLORS.Unknown
    const isNew = newMarkerId === marker.id
    const isDeleting = deletingId === marker.id

    const className = [
      'marker-pin',
      isNew ? 'marker-pin-new' : '',
      isDeleting ? 'marker-deleting' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return L.divIcon({
      className,
      html: `
        <div class="marker-pin-pulse" style="background-color: ${color};"></div>
        <div class="marker-pin-dot" style="background-color: ${color};"></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    })
  }

  const handleEditClick = (e: React.MouseEvent, marker: TravelMarker) => {
    e.stopPropagation()
    onEdit(marker)
  }

  const handleDeleteClick = (e: React.MouseEvent, marker: TravelMarker) => {
    e.stopPropagation()
    onDelete(marker)
  }

  const markerElements = useMemo(() => {
    return markers.map((marker) => (
      <Marker
        key={marker.id}
        position={[marker.lat, marker.lng]}
        icon={createIcon(marker)}
        eventHandlers={{
          click: () => onMarkerClick(marker),
        }}
      >
        <Popup className="marker-popup-card" closeButton={false}>
          <div className="popup-city">{marker.city}</div>
          <div className="popup-country">{marker.country}</div>
          <div className="popup-date">{marker.date}</div>
          <div className="popup-mood">
            <span>{MOOD_EMOJIS[marker.mood]}</span>
            <span>{MOOD_LABELS[marker.mood]}</span>
          </div>
          {marker.photo && (
            <img className="popup-photo" src={marker.photo} alt="" />
          )}
          <div className="popup-actions">
            <button
              className="popup-btn popup-btn-edit"
              onClick={(e) => handleEditClick(e, marker)}
            >
              编辑
            </button>
            <button
              className="popup-btn popup-btn-delete"
              onClick={(e) => handleDeleteClick(e, marker)}
            >
              删除
            </button>
          </div>
        </Popup>
      </Marker>
    ))
  }, [markers, newMarkerId, deletingId, onMarkerClick, onEdit, onDelete])

  if (useClustering) {
    return (
      <MarkerClusterGroup
        options={{
          showCoverageOnHover: false,
          maxClusterRadius: 50,
        }}
      >
        {markerElements}
      </MarkerClusterGroup>
    )
  }

  return <>{markerElements}</>
}

export default MarkerLayer
