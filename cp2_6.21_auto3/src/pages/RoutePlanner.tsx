import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import { useRouteStore } from '../stores/routeStore'
import { useTeamStore } from '../stores/teamStore'
import { supplyIcon, campIcon } from '../components/mapIcons'
import { useToast } from '../components/Toast'
import type { PointType, RoutePoint, MemberStatus } from '../types'

function MapClickHandler({
  onMapClick,
  enabled,
}: {
  onMapClick: (lat: number, lng: number) => void
  enabled: boolean
}) {
  useMapEvents({
    click(e) {
      if (enabled) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

function FitBounds({ points }: { points: RoutePoint[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]))
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [points, map])
  return null
}

function DraggableMarker({
  point,
  onDragEnd,
  onEdit,
  onDelete,
  isSelected,
}: {
  point: RoutePoint
  onDragEnd: (id: string, lat: number, lng: number) => void
  onEdit: (point: RoutePoint) => void
  onDelete: (pointId: string) => void
  isSelected: boolean
}) {
  const markerRef = useRef<L.Marker>(null)
  const icon = point.type === 'supply' ? supplyIcon : campIcon

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker != null) {
          const pos = marker.getLatLng()
          onDragEnd(point.id, pos.lat, pos.lng)
        }
      },
    }),
    [point.id, onDragEnd],
  )

  return (
    <Marker
      ref={markerRef}
      position={[point.lat, point.lng]}
      icon={icon}
      draggable={true}
      eventHandlers={eventHandlers}
    >
      <Popup className="point-popup" minWidth={300} maxWidth={300} closeOnClick={false}>
        <PointPopupContent
          point={point}
          onEdit={() => onEdit(point)}
          onDelete={() => onDelete(point.id)}
          isSelected={isSelected}
        />
      </Popup>
    </Marker>
  )
}

function PointPopupContent({
  point,
  onEdit,
  onDelete,
  isSelected,
}: {
  point: RoutePoint
  onEdit: () => void
  onDelete: () => void
  isSelected: boolean
}) {
  const { teamData } = useTeamStore()
  const membersAtPoint = teamData
    ? teamData.members.filter((m) => m.nearestPointId === point.id)
    : []

  const statusColor: Record<MemberStatus, string> = {
    moving: '#2ecc71',
    resting: '#f1c40f',
    trouble: '#e74c3c',
  }

  return (
    <div className="popup-content">
      <div className="popup-title">
        <span>{point.type === 'supply' ? '🚩' : '⛺'}</span>
        <span>{point.name}</span>
      </div>
      <div className="popup-amenities">
        {point.hasWater && <span className="amenity-icon">💧 水源</span>}
        {point.hasShelter && <span className="amenity-icon">⛺ 庇护所</span>}
        {!point.hasWater && !point.hasShelter && (
          <span style={{ fontSize: 12, color: '#9ca3af' }}>暂无设施信息</span>
        )}
      </div>
      <div className="popup-detail">
        <span className="popup-label">海拔</span>
        <span className="popup-value">{point.elevation} 米</span>
      </div>
      <div className="popup-detail">
        <span className="popup-label">预计到达</span>
        <span className="popup-value">{point.eta}</span>
      </div>
      <div className="popup-detail">
        <span className="popup-label">经纬度</span>
        <span className="popup-value">
          {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
        </span>
      </div>
      {membersAtPoint.length > 0 && (
        <div className="popup-members">
          <div className="popup-members-title">
            计划到达的队员 ({membersAtPoint.length})
          </div>
          {membersAtPoint.map((m) => (
            <div key={m.id} className="popup-member">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: statusColor[m.status],
                  display: 'inline-block',
                }}
              />
              <span>{m.name}</span>
              <span
                className={`status-tag ${m.status === 'moving' ? 'status-moving' : m.status === 'resting' ? 'status-resting' : 'status-trouble'}`}
                style={{ fontSize: 10, padding: '1px 6px', marginLeft: 4 }}
              >
                {m.status === 'moving' ? '行进中' : m.status === 'resting' ? '休息中' : '困难'}
              </span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 10, borderTop: '1px solid #f0f0f0' }}>
        <button
          className="btn-primary"
          style={{ flex: 1, padding: '8px 12px', fontSize: 12 }}
          onClick={onEdit}
        >
          编辑
        </button>
        <button
          className="btn-danger"
          style={{ padding: '8px 12px', fontSize: 12 }}
          onClick={onDelete}
        >
          删除
        </button>
      </div>
    </div>
  )
}

export default function RoutePlanner() {
  const { routeId } = useParams<{ routeId: string }>()
  const navigate = useNavigate()
  const { currentRoute, fetchRoute, addPoint, updatePoint, deletePoint } = useRouteStore()
  const { fetchTeam, teamData } = useTeamStore()
  const toast = useToast()
  const [addMode, setAddMode] = useState<PointType | null>(null)
  const [selectedPoint, setSelectedPoint] = useState<RoutePoint | null>(null)
  const [showPointModal, setShowPointModal] = useState(false)
  const [editingPoint, setEditingPoint] = useState<Partial<RoutePoint> | null>(null)
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (routeId) {
      fetchRoute(routeId)
      fetchTeam(routeId)
    }
  }, [routeId, fetchRoute, fetchTeam])

  useEffect(() => {
    if (!currentRoute && routeId) {
      setTimeout(() => {
        if (!useRouteStore.getState().currentRoute) {
          navigate('/')
        }
      }, 2000)
    }
  }, [currentRoute, routeId, navigate])

  const points = currentRoute?.points || []
  const polylinePositions = points.map((p) => [p.lat, p.lng]) as [number, number][]

  const handleMapClick = (lat: number, lng: number) => {
    if (!addMode) return
    setPendingCoords({ lat, lng })
    setEditingPoint({
      lat,
      lng,
      type: addMode,
      name: addMode === 'supply' ? '补给点' : '营地',
      elevation: 0,
      eta: '12:00',
      order: points.length,
      hasWater: false,
      hasShelter: addMode === 'camp',
    })
    setShowPointModal(true)
    setAddMode(null)
  }

  const handleSavePoint = async () => {
    if (!editingPoint || !routeId) return
    if (!editingPoint.name) return

    try {
      if (selectedPoint && pendingCoords && selectedPoint.id) {
        await updatePoint(routeId, selectedPoint.id, {
          name: editingPoint.name,
          elevation: Number(editingPoint.elevation) || 0,
          eta: editingPoint.eta || '12:00',
          hasWater: editingPoint.hasWater,
          hasShelter: editingPoint.hasShelter,
          lat: pendingCoords.lat,
          lng: pendingCoords.lng,
        })
        toast.showSuccess(`已更新：${editingPoint.name}`)
      } else if (pendingCoords) {
        await addPoint(routeId, {
          name: editingPoint.name!,
          lat: pendingCoords.lat,
          lng: pendingCoords.lng,
          elevation: Number(editingPoint.elevation) || 0,
          eta: editingPoint.eta || '12:00',
          type: editingPoint.type!,
          order: points.length,
          hasWater: editingPoint.hasWater,
          hasShelter: editingPoint.hasShelter,
        })
        toast.showSuccess(
          `已添加${editingPoint.type === 'supply' ? '补给点' : '营地'}：${editingPoint.name}`,
        )
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '保存失败'
      toast.showError(msg)
    }
    setShowPointModal(false)
    setEditingPoint(null)
    setPendingCoords(null)
    setSelectedPoint(null)
  }

  const handleDragEnd = async (id: string, lat: number, lng: number) => {
    if (!routeId) return
    await updatePoint(routeId, id, { lat, lng })
  }

  const handleEditPoint = (point: RoutePoint) => {
    setSelectedPoint(point)
    setEditingPoint({ ...point })
    setPendingCoords({ lat: point.lat, lng: point.lng })
    setShowPointModal(true)
  }

  const handleDeletePoint = async (pointId: string) => {
    if (!routeId) return
    const pointName = points.find((p) => p.id === pointId)?.name || '该点'
    await deletePoint(routeId, pointId)
    toast.showSuccess(`已删除：${pointName}`)
  }

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`
  }

  const copyShareLink = async () => {
    if (!currentRoute) return
    const shareUrl = `${window.location.origin}/join/${currentRoute.code}`
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = shareUrl
        textArea.style.position = 'fixed'
        textArea.style.left = '-9999px'
        document.body.appendChild(textArea)
        textArea.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(textArea)
        if (!ok) throw new Error('复制命令执行失败')
      }
      setCopied(true)
      toast.showSuccess(`分享链接已复制：${shareUrl}`)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '复制失败'
      toast.showError(`${msg}，请手动复制：${shareUrl}`, 5000)
    }
  }

  const center: [number, number] = points.length > 0
    ? [points[0].lat, points[0].lng]
    : [31.2304, 121.4737]

  return (
    <>
      <div className="map-container">
        <MapContainer
          center={center}
          zoom={10}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            maxZoom={17}
          />
          <MapClickHandler onMapClick={handleMapClick} enabled={addMode !== null} />
          {points.length > 0 && <FitBounds points={points} />}
          {polylinePositions.length > 1 && (
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                color: '#e67e22',
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 10',
              }}
            />
          )}
          {points.map((point) => (
            <DraggableMarker
              key={point.id}
              point={point}
              onDragEnd={handleDragEnd}
              onEdit={handleEditPoint}
              onDelete={handleDeletePoint}
              isSelected={selectedPoint?.id === point.id}
            />
          ))}
        </MapContainer>
      </div>

      <div className="add-point-controls">
        <button
          className={`control-btn ${addMode === 'supply' ? 'active' : ''}`}
          onClick={() => setAddMode(addMode === 'supply' ? null : 'supply')}
        >
          🚩 添加补给点
        </button>
        <button
          className={`control-btn ${addMode === 'camp' ? 'active' : ''}`}
          onClick={() => setAddMode(addMode === 'camp' ? null : 'camp')}
        >
          ⛺ 添加营地
        </button>
        {addMode && (
          <div style={{ fontSize: 12, color: '#fff', marginTop: 4 }}>
            点击地图上的位置放置{addMode === 'supply' ? '补给点' : '营地'}
          </div>
        )}
      </div>

      {currentRoute && (
        <div className="route-info-panel">
          <div className="route-info-item">
            <span className="route-info-label">总距离</span>
            <span className="route-info-value">{currentRoute.totalDistance} km</span>
          </div>
          <div className="route-info-item">
            <span className="route-info-label">点数</span>
            <span className="route-info-value">{points.length}</span>
          </div>
          <div className="route-info-item">
            <span className="route-info-label">预计时长</span>
            <span className="route-info-value">
              {formatDuration(currentRoute.totalDistance * 30)}
            </span>
          </div>

          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>分享路线</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <code style={{
                flex: 1,
                padding: '6px 10px',
                background: '#f0f4f1',
                borderRadius: 6,
                fontSize: 14,
                fontFamily: 'monospace',
                letterSpacing: 2,
                color: '#1a3c2e',
                textAlign: 'center',
              }}>
                {currentRoute.code}
              </code>
              <button
                onClick={copyShareLink}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: 6,
                  background: copied ? '#27ae60' : 'linear-gradient(135deg, #2ecc71, #27ae60)',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-out',
                  whiteSpace: 'nowrap',
                }}
                title="复制分享链接"
              >
                {copied ? '✓ 已复制' : '复制链接'}
              </button>
            </div>
          </div>

          <button
            className="nav-btn"
            style={{ width: '100%', marginTop: 12, padding: '8px 16px' }}
            onClick={() => navigate(`/tracker/${currentRoute.id}`)}
          >
            查看队伍追踪
          </button>
        </div>
      )}

      {showPointModal && editingPoint && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowPointModal(false)
            setEditingPoint(null)
            setSelectedPoint(null)
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {selectedPoint ? '编辑' : '添加'}
              {editingPoint.type === 'supply' ? '补给点' : '营地'}
            </h2>

            <div className="form-group">
              <label className="form-label">名称</label>
              <input
                type="text"
                className="form-input"
                placeholder="输入点名称"
                value={editingPoint.name || ''}
                onChange={(e) =>
                  setEditingPoint({ ...editingPoint, name: e.target.value })
                }
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">纬度</label>
                <input
                  type="number"
                  step="0.0001"
                  className="form-input"
                  value={editingPoint.lat?.toFixed(4) || ''}
                  readOnly
                  style={{ background: '#f9fafb' }}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">经度</label>
                <input
                  type="number"
                  step="0.0001"
                  className="form-input"
                  value={editingPoint.lng?.toFixed(4) || ''}
                  readOnly
                  style={{ background: '#f9fafb' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">海拔（米）</label>
                <input
                  type="number"
                  className="form-input"
                  value={editingPoint.elevation || 0}
                  onChange={(e) =>
                    setEditingPoint({
                      ...editingPoint,
                      elevation: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">预计到达时间</label>
                <input
                  type="time"
                  className="form-input"
                  value={editingPoint.eta || '12:00'}
                  onChange={(e) =>
                    setEditingPoint({ ...editingPoint, eta: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">设施</label>
              <div className="form-checkbox-group">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={editingPoint.hasWater || false}
                    onChange={(e) =>
                      setEditingPoint({ ...editingPoint, hasWater: e.target.checked })
                    }
                  />
                  💧 水源
                </label>
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={editingPoint.hasShelter || false}
                    onChange={(e) =>
                      setEditingPoint({
                        ...editingPoint,
                        hasShelter: e.target.checked,
                      })
                    }
                  />
                  ⛺ 庇护所
                </label>
              </div>
            </div>

            <div className="modal-actions">
              {selectedPoint && (
                <button
                  className="btn-danger"
                  onClick={async () => {
                    if (!routeId || !selectedPoint) return
                    await deletePoint(routeId, selectedPoint.id)
                    setShowPointModal(false)
                    setSelectedPoint(null)
                    setEditingPoint(null)
                  }}
                >
                  删除
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowPointModal(false)
                  setEditingPoint(null)
                  setSelectedPoint(null)
                }}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleSavePoint}
                disabled={!editingPoint.name}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
