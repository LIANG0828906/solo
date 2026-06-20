import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import { useRouteStore } from '../stores/routeStore'
import { useTeamStore } from '../stores/teamStore'
import { supplyIcon, campIcon, createMemberIcon } from '../components/mapIcons'
import { formatRelativeTime } from '../utils'
import { useToast } from '../components/Toast'
import type { RoutePoint, MemberStatus, TeamMember } from '../types'

function FitBounds({ points, members }: { points: RoutePoint[]; members: TeamMember[] }) {
  const map = useMap()
  useEffect(() => {
    const allPositions: [number, number][] = [
      ...points.map((p) => [p.lat, p.lng] as [number, number]),
      ...members.filter((m) => m.lat !== 0 && m.lng !== 0).map((m) => [m.lat, m.lng] as [number, number]),
    ]
    if (allPositions.length > 0) {
      const bounds = L.latLngBounds(allPositions)
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [points, members, map])
  return null
}

function HeatmapLayer({ data }: { data: [number, number, number][] }) {
  const map = useMap()
  const heatRef = useRef<L.HeatLayer | null>(null)

  useEffect(() => {
    if (heatRef.current) {
      heatRef.current.remove()
      heatRef.current = null
    }
    if (data.length > 0 && typeof L.heatLayer === 'function') {
      heatRef.current = L.heatLayer(data, {
        minOpacity: 0.3,
        maxZoom: 14,
        max: 1.0,
        radius: 40,
        blur: 30,
        gradient: {
          0.0: '#0000ff',
          0.2: '#0066ff',
          0.4: '#00ccff',
          0.5: '#00ff88',
          0.6: '#88ff00',
          0.7: '#ffff00',
          0.8: '#ff8800',
          0.9: '#ff3300',
          1.0: '#ff0000',
        },
      }).addTo(map)
    }
    return () => {
      if (heatRef.current) {
        heatRef.current.remove()
        heatRef.current = null
      }
    }
  }, [data, map])

  return null
}

export default function TeamTracker() {
  const { routeId } = useParams<{ routeId: string }>()
  const navigate = useNavigate()
  const { currentRoute, fetchRoute } = useRouteStore()
  const {
    teamData,
    fetchTeam,
    currentMember,
    updatePosition,
    setCurrentMember,
    error,
    resetFailures,
  } = useTeamStore()
  const toast = useToast()
  const [status, setStatus] = useState<MemberStatus>('moving')
  const [geoError, setGeoError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (routeId) {
      fetchRoute(routeId)
      fetchTeam(routeId)
    }
  }, [routeId, fetchRoute, fetchTeam])

  useEffect(() => {
    const stored = localStorage.getItem('currentMember')
    if (stored) {
      try {
        const m = JSON.parse(stored)
        if (m.routeId === routeId) {
          setCurrentMember(m)
        }
      } catch (e) {}
    }
  }, [routeId, setCurrentMember])

  useEffect(() => {
    if (currentMember) {
      localStorage.setItem('currentMember', JSON.stringify(currentMember))
    }
  }, [currentMember])

  const sendPositionUpdate = useCallback(
    (memberId: string, lat: number, lng: number, currentStatus: MemberStatus) => {
      updatePosition(memberId, lat, lng, currentStatus)
      lastPosRef.current = { lat, lng }
    },
    [updatePosition],
  )

  useEffect(() => {
    if (!currentMember) return
    if (!navigator.geolocation) {
      setGeoError('浏览器不支持地理定位')
      toast.showError('您的浏览器不支持地理定位功能')
      return
    }

    const memberId = currentMember.id
    let active = true

    const onPosition = (position: GeolocationPosition) => {
      if (!active) return
      const { latitude, longitude } = position.coords
      setGeoError(null)
      sendPositionUpdate(memberId, latitude, longitude, status)
    }

    const onError = (err: GeolocationPositionError) => {
      if (!active) return
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setGeoError('位置权限被拒绝，请在浏览器设置中允许')
          toast.showError('位置权限被拒绝，无法上报位置。请在浏览器设置中允许位置访问。', 5000)
          break
        case err.POSITION_UNAVAILABLE:
          setGeoError('无法获取位置信息')
          toast.showWarning('暂时无法获取位置，请检查GPS或网络状态')
          break
        case err.TIMEOUT:
          setGeoError('获取位置超时')
          break
      }
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    }

    navigator.geolocation.getCurrentPosition(onPosition, onError, geoOptions)

    watchIdRef.current = navigator.geolocation.watchPosition(onPosition, onError, geoOptions)

    intervalRef.current = window.setInterval(() => {
      if (!active) return
      navigator.geolocation.getCurrentPosition(onPosition, onError, geoOptions)
    }, 10000)

    return () => {
      active = false
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [currentMember, status, sendPositionUpdate, toast])

  useEffect(() => {
    if (!routeId) return
    const interval = setInterval(() => {
      fetchTeam(routeId)
    }, 5000)
    return () => clearInterval(interval)
  }, [routeId, fetchTeam])

  useEffect(() => {
    if (error && error.includes('位置同步失败')) {
      toast.showError('位置同步失败，服务器连接异常')
      const timer = setTimeout(() => resetFailures(), 5000)
      return () => clearTimeout(timer)
    }
  }, [error, resetFailures, toast])

  const points = currentRoute?.points || []
  const members = teamData?.members || []
  const polylinePositions = points.map((p) => [p.lat, p.lng]) as [number, number][]

  const statusLabels: Record<MemberStatus, { label: string; cls: string }> = {
    moving: { label: '行进中', cls: 'status-moving' },
    resting: { label: '休息中', cls: 'status-resting' },
    trouble: { label: '遇到困难', cls: 'status-trouble' },
  }

  const getNearestPointName = (pointId?: string) => {
    if (!pointId) return '—'
    const p = points.find((x) => x.id === pointId)
    return p ? p.name : '—'
  }

  const center: [number, number] =
    points.length > 0
      ? [points[0].lat, points[0].lng]
      : [31.2304, 121.4737]

  const heatmapData: [number, number, number][] = (teamData?.heatmapData || []) as any

  if (!currentRoute) {
    return (
      <div className="welcome-screen">
        <p className="welcome-subtitle">加载中...</p>
      </div>
    )
  }

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
          <FitBounds points={points} members={members} />
          {heatmapData.length > 0 && <HeatmapLayer data={heatmapData} />}
          {polylinePositions.length > 1 && (
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                color: '#e67e22',
                weight: 3,
                opacity: 0.6,
                dashArray: '8, 8',
              }}
            />
          )}
          {points.map((point) => (
            <Marker
              key={point.id}
              position={[point.lat, point.lng]}
              icon={point.type === 'supply' ? supplyIcon : campIcon}
            >
              <Popup className="point-popup" minWidth={300} maxWidth={300}>
                <PointPopupContent point={point} members={members} />
              </Popup>
            </Marker>
          ))}
          {members
            .filter((m) => m.lat !== 0 && m.lng !== 0)
            .map((member) => (
              <Marker
                key={member.id}
                position={[member.lat, member.lng]}
                icon={createMemberIcon(member.status, member.name)}
              />
            ))}
        </MapContainer>
      </div>

      <div className="progress-panel">
        <div className="progress-header">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a3c2e' }}>
            队伍进度
          </h3>
          <div className="progress-stats">
            <div className="progress-stat">
              <div className="progress-stat-value">
                {teamData?.totalMembers ?? 0}
              </div>
              <div className="progress-stat-label">总人数</div>
            </div>
            <div className="progress-stat">
              <div className="progress-stat-value">
                {teamData?.arrivedMembers ?? 0}
              </div>
              <div className="progress-stat-label">到达补给点</div>
            </div>
            <div className="progress-stat">
              <div className="progress-stat-value">
                {teamData?.averageProgress ?? 0}%
              </div>
              <div className="progress-stat-label">平均进度</div>
            </div>
          </div>
        </div>

        {currentMember && (
          <div style={{ padding: '10px 0', borderBottom: '1px solid #e5e7eb' }}>
            <div className="form-label" style={{ fontSize: 12, color: '#374151' }}>
              我的状态
            </div>
            <div className="status-selector">
              {(Object.keys(statusLabels) as MemberStatus[]).map((s) => (
                <div
                  key={s}
                  className={`status-option ${statusLabels[s].cls} ${
                    status === s ? 'selected' : ''
                  }`}
                  style={{
                    borderColor: status === s ? 'currentColor' : 'transparent',
                    background:
                      status === s
                        ? s === 'moving'
                          ? '#d1fae5'
                          : s === 'resting'
                          ? '#fef3c7'
                          : '#fee2e2'
                        : '#f0f4f1',
                    color:
                      status === s
                        ? s === 'moving'
                          ? '#065f46'
                          : s === 'resting'
                          ? '#92400e'
                          : '#991b1b'
                        : '#6b7280',
                  }}
                  onClick={() => {
                    setStatus(s)
                    toast.showSuccess(`状态已切换为：${statusLabels[s].label}`)
                  }}
                >
                  {statusLabels[s].label}
                </div>
              ))}
            </div>
            {geoError && (
              <div style={{ fontSize: 11, color: '#dc2626', marginTop: 6 }}>
                ⚠️ {geoError}
              </div>
            )}
            {lastPosRef.current && !geoError && (
              <div
                style={{
                  fontSize: 11,
                  color: '#6b7280',
                  marginTop: 4,
                  fontFamily: 'monospace',
                }}
              >
                📍 位置已同步: {lastPosRef.current.lat.toFixed(4)},{' '}
                {lastPosRef.current.lng.toFixed(4)}
              </div>
            )}
          </div>
        )}

        <div className="member-list">
          {members.map((member) => (
            <div key={member.id} className="member-card">
              <div className="member-card-header">
                <span className="member-name">{member.name}</span>
                <span
                  className={`status-tag ${
                    statusLabels[member.status as MemberStatus]?.cls || 'status-moving'
                  }`}
                >
                  {statusLabels[member.status as MemberStatus]?.label || '未知'}
                </span>
              </div>
              <div className="member-info">
                <span>最近补给点: {getNearestPointName(member.nearestPointId)}</span>
                <span>{formatRelativeTime(member.lastUpdated)}</span>
              </div>
              <div
                style={{
                  marginTop: 6,
                  height: 4,
                  background: '#e5e7eb',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${member.progress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #2ecc71, #27ae60)',
                    borderRadius: 2,
                    transition: 'width 0.3s ease-out',
                  }}
                />
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: 40,
                color: '#9ca3af',
                fontSize: 13,
              }}
            >
              暂无队员数据
            </div>
          )}
        </div>

        <button
          className="btn-secondary"
          style={{ width: '100%' }}
          onClick={() => navigate(`/planner/${currentRoute.id}`)}
        >
          查看路线规划
        </button>
      </div>
    </>
  )
}

function PointPopupContent({
  point,
  members,
}: {
  point: RoutePoint
  members: TeamMember[]
}) {
  const membersAtPoint = members.filter((m) => m.nearestPointId === point.id)
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
          <span style={{ fontSize: 12, color: '#9ca3af' }}>暂无设施</span>
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
        <span className="popup-label">坐标</span>
        <span className="popup-value">
          {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
        </span>
      </div>
      {membersAtPoint.length > 0 && (
        <div className="popup-members">
          <div className="popup-members-title">
            当前附近队员 ({membersAtPoint.length})
          </div>
          {membersAtPoint.map((m) => (
            <div key={m.id} className="popup-member">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: statusColor[m.status as MemberStatus] || '#9ca3af',
                  display: 'inline-block',
                }}
              />
              <span>{m.name}</span>
              <span
                className={`status-tag ${
                  m.status === 'moving'
                    ? 'status-moving'
                    : m.status === 'resting'
                    ? 'status-resting'
                    : 'status-trouble'
                }`}
                style={{ fontSize: 10, padding: '1px 6px', marginLeft: 4 }}
              >
                {m.status === 'moving'
                  ? '行进中'
                  : m.status === 'resting'
                  ? '休息中'
                  : '困难'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
