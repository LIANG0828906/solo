import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useReportStore } from '../store'
import { FACILITY_COLORS } from '../types'
import type { FacilityType } from '../types'

const DEFAULT_CENTER: [number, number] = [39.9042, 116.4074]
const FACILITY_TYPES: FacilityType[] = ['长椅', '路灯', '垃圾桶', '健身器材']

function LocationMarker({ position, setPosition }: { position: [number, number] | null; setPosition: (pos: [number, number]) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng])
    },
    load() {
      map.dragging.enable()
    }
  })

  const markerIcon = L.divIcon({
    className: 'submit-marker-icon',
    html: `<div style="width: 24px; height: 24px; border-radius: 50%; background-color: #1A237E; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  })

  return position ? (
    <Marker position={position} icon={markerIcon} draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target
          const latlng = marker.getLatLng()
          setPosition([latlng.lat, latlng.lng])
        }
      }}
    />
  ) : null
}

function RecenterMap({ position }: { position: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.panTo(position)
    }
  }, [position, map])
  return null
}

function ReportForm() {
  const navigate = useNavigate()
  const { addReport, loading, error } = useReportStore()

  const [facilityType, setFacilityType] = useState<FacilityType | null>(null)
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [position, setPosition] = useState<[number, number] | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_LENGTH = 200

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!facilityType) {
      alert('请选择设施类型')
      return
    }
    if (!description.trim()) {
      alert('请填写问题描述')
      return
    }
    if (description.length > MAX_LENGTH) {
      alert(`描述不能超过${MAX_LENGTH}字`)
      return
    }
    if (!position) {
      alert('请在地图上点击选择位置')
      return
    }

    try {
      await addReport({
        facilityType,
        description: description.trim(),
        image: imageFile || undefined,
        lat: position[0],
        lng: position[1]
      })
      navigate('/')
    } catch (err) {
      // Error is handled by store
    }
  }

  return (
    <div>
      <h1 className="page-title">上报设施问题</h1>
      <div className="card">
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">设施位置（点击地图选择或拖拽标记调整）</label>
            <div className="submit-map-container">
              <MapContainer
                center={DEFAULT_CENTER}
                zoom={17}
                style={{ width: '100%', height: '100%' }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                />
                <LocationMarker position={position} setPosition={setPosition} />
                <RecenterMap position={position} />
              </MapContainer>
            </div>
            {position && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                已选择位置: {position[0].toFixed(6)}, {position[1].toFixed(6)}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">设施类型</label>
            <div className="facility-options">
              {FACILITY_TYPES.map(type => (
                <label
                  key={type}
                  className={`facility-option ${facilityType === type ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="facilityType"
                    value={type}
                    checked={facilityType === type}
                    onChange={() => setFacilityType(type)}
                  />
                  <div
                    className="facility-color"
                    style={{ backgroundColor: FACILITY_COLORS[type] }}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">问题描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="请详细描述设施存在的问题（不超过200字）"
              maxLength={MAX_LENGTH}
            />
            <div className="char-count">
              {description.length}/{MAX_LENGTH}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">现场照片（可选）</label>
            <div className="file-upload">
              <label className="file-upload-label">
                📷 {imageFile ? '更换图片' : '选择图片'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="预览"
                  className="file-preview"
                />
              )}
            </div>
          </div>

          <div className="btn-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/')}
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '提交中...' : '提交上报'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReportForm
