import { useEffect, useRef, useState } from 'react'
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
import 'leaflet.heat'
import { useRouteStore } from '../stores/routeStore'
import { useTeamStore } from '../stores/teamStore'
import { supplyIcon, campIcon, createMemberIcon } from '../components/mapIcons'
import { formatRelativeTime } from '../utils'
import type { RoutePoint, MemberStatus } from '../types'

declare module 'leaflet' {
  function heatLayer(
    latlngs: [number, number, number][],
    options?: {
      minOpacity?: number
      maxZoom?: number
      max?: number
      radius?: number
      blur?: number
      gradient?: Record<number, string>
    },
  ): any
}

function FitBounds({ points, members }: { points: RoutePoint[]; members: any[] }) {
  const map = useMap()
  useEffect(() => {
    const allPositions: [number, number][] = [
      ...points.map((p) => [p.lat, p.lng] as [number, number]),
      ...members.map((m) => [m.lat, m.lng] as [number, number]),
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
  const heatRef = useRef<any>(null)

  useEffect(() => {
    if (heatRef.current) {
      heatRef.current.remove()
    }
    if (data.length > 0) {
      heatRef.current = (L as any).heatLayer(data, {
        radius: 35,
        blur: 25,
        maxZoom: 13,
        gradient: {
          0.1: 'blue',
          0.3: 'cyan',
          0.5: 'lime',
          0.7: 'yellow',
          0.9: 'orange',
          1.0: 'red',
        },
      }).addTo(map)
    }
    return () => {
      if (heatRef.current) {
        heatRef.current.remove()
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
  } = useTeamStore()
  const [status, setStatus] = useState<MemberStatus>('moving')
  const watchIdRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)

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

  useEffect(() => {
    if (!currentMember) return

    const updateGeo = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords
      updatePosition(currentMember.id, latitude, longitude, status)
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(updateGeo, (err) => {
        console.warn('获取位置失败:', err.message)
      })

      watchIdRef.current = navigator.geolocation.watchPosition(updateGeo, (err) => {
        console.warn('位置更新失败:', err.message)
      })

      intervalRef.current = window.setInterval(() => {
        navigator.geolocation.getCurrentPosition(updateGeo, (err) => {
          console.warn('定时获取位置失败:', err.message)
        })
      }, 10000)
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
      }
    }
  }, [currentMember, status, updatePosition])

  useEffect(() => {
    if (!routeId) return
    const interval = setInterval(() => {
      fetchTeam(routeId)
    }, 5000)
    return () => clearInterval(interval)
  }, [routeId, fetchTeam])

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
          {teamData && teamData.heatmapData.length > 0 && (
            <HeatmapLayer data={teamData.heatmapData} />
          )}
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
                <PopupContent point={point} members={members} />
              </Popup>
            </Marker>
          ))}
          {members.map((member) => (
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
            <div className="form-label" style={{ fontSize: 12 }}>
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
                  onClick={() => setStatus(s)}
                >
                  {statusLabels[s].label}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="member-list">
          {members.map((member) => (
            <div key={member.id} className="member-card">
              <div className="member-card-header">
                <span className="member-name">{member.name}</span>
                <span
                  className={`status-tag ${statusLabels[member.status].cls}`}
                >
                  {statusLabels[member.status].label}
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

      {error && error.includes('位置同步失败') && (
        <div className="sync-error">⚠️ {error}</div>
      )}
    </>
  )
}

function PopupContent({
  point,
  members,
}: {
  point: RoutePoint
  members: any[]
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
                  background: statusColor[m.status as MemberStatus],
                  display: 'inline-block',
                }}
              />
              <span>{m.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
