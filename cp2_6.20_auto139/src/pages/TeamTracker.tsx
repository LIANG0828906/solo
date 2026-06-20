import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useParams, useNavigate } from 'react-router-dom';
import { useRouteStore } from '../stores/routeStore';
import { useTeamStore } from '../stores/teamStore';
import type { TeamMemberStatus } from '../types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import 'leaflet.heat';
import { useMap } from 'react-leaflet';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const statusColors: Record<TeamMemberStatus, string> = {
  moving: '#2ecc71',
  resting: '#f1c40f',
  trouble: '#e74c3c'
};

const statusLabels: Record<TeamMemberStatus, string> = {
  moving: '行进中',
  resting: '休息中',
  trouble: '遇到困难'
};

function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    const heatLayer = (L as any).heatLayer(points, {
      radius: 40,
      blur: 25,
      maxZoom: 10,
      gradient: {
        0.2: '#3498db',
        0.4: '#2ecc71',
        0.6: '#f1c40f',
        0.8: '#e67e22',
        1.0: '#e74c3c'
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

function MemberMarker({ member }: { member: { status: TeamMemberStatus; [key: string]: any } }) {
  const color = statusColors[member.status];

  return (
    <>
      <CircleMarker
        center={[member.lat, member.lng]}
        radius={8}
        pathOptions={{
          color: 'white',
          weight: 2,
          fillColor: color,
          fillOpacity: 1
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -10,
            left: 0,
            right: 0,
            textAlign: 'center',
            pointerEvents: 'none'
          }}
        >
          <div className="member-marker-label">{member.name}</div>
        </div>
        <Popup>
          <div style={{ padding: '8px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#1a3c2e' }}>{member.name}</h4>
            <p style={{ margin: '4px 0', fontSize: '13px', color: '#666' }}>
              状态: <span style={{ color }}>{statusLabels[member.status as TeamMemberStatus]}</span>
            </p>
            <p style={{ margin: '4px 0', fontSize: '13px', color: '#666' }}>
              最后更新: {dayjs(member.lastUpdate).fromNow()}
            </p>
          </div>
        </Popup>
      </CircleMarker>
      <CircleMarker
        center={[member.lat, member.lng]}
        radius={16}
        pathOptions={{
          color: color,
          weight: 0,
          fillColor: color,
          fillOpacity: 0.3
        }}
        interactive={false}
      />
    </>
  );
}

export default function TeamTracker() {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();
  const { currentRoute, fetchRoute } = useRouteStore();
  const {
    teamData,
    fetchTeam,
    currentMember,
    error,
    resetSyncError,
    updateMemberStatus
  } = useTeamStore();

  const currentStatus: TeamMemberStatus = currentMember?.status || 'moving';

  const refreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (routeId) {
      fetchRoute(routeId);
      fetchTeam(routeId);

      refreshInterval.current = setInterval(() => {
        fetchTeam(routeId);
      }, 5000);
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [routeId, fetchRoute, fetchTeam]);

  const polylinePositions = useMemo(() => {
    if (!currentRoute) return [];
    return currentRoute.points.map((p) => [p.lat, p.lng] as [number, number]);
  }, [currentRoute]);

  const heatmapData = useMemo(() => {
    return teamData?.heatmapData || [];
  }, [teamData]);

  const center: [number, number] = currentRoute?.points.length
    ? [currentRoute.points[0].lat, currentRoute.points[0].lng]
    : [35.8617, 104.1954];

  const getPointName = (pointId?: string) => {
    if (!pointId || !currentRoute) return '未知';
    const point = currentRoute.points.find((p) => p.id === pointId);
    return point?.name || '未知';
  };

  const handleStatusChange = (status: TeamMemberStatus) => {
    updateMemberStatus(status);
  };

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      {error && (
        <div className="sync-error" onClick={resetSyncError}>
          ⚠️ {error} (点击重试)
        </div>
      )}

      {currentRoute && (
        <div className="route-header">
          <span className="route-code">{currentRoute.code}</span>
          <span style={{ fontSize: '16px', fontWeight: 500, color: '#333' }}>
            {currentRoute.name} - 队伍追踪
          </span>
          <button className="copy-btn" onClick={() => navigate(`/planner/${routeId}`)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
            返回路线
          </button>
        </div>
      )}

      <div className="progress-panel">
        <h3>队伍进度</h3>
        {teamData && (
          <div className="progress-stats">
            <div className="progress-stat-card">
              <div className="progress-stat-value">{teamData.stats.totalMembers}</div>
              <div className="progress-stat-label">总人数</div>
            </div>
            <div className="progress-stat-card">
              <div className="progress-stat-value">{teamData.stats.arrivedSupply}</div>
              <div className="progress-stat-label">已到补给点</div>
            </div>
            <div className="progress-stat-card">
              <div className="progress-stat-value">{teamData.stats.averageProgress}%</div>
              <div className="progress-stat-label">平均进度</div>
            </div>
          </div>
        )}

        <div className="team-members-cards">
          {teamData?.members.map((member) => (
            <div key={member.id} className="team-member-card">
              <div className="member-card-header">
                <span className="member-card-name">{member.name}</span>
                <span className={`member-card-status ${member.status}`}>
                  {statusLabels[member.status]}
                </span>
              </div>
              <div className="member-card-info">
                <div className="member-card-point">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  最近: {getPointName(member.nearestPointId)}
                </div>
                <div className="member-card-time">
                  {dayjs(member.lastUpdate).fromNow()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        />

        {polylinePositions.length > 1 && (
          <Polygon
            positions={polylinePositions}
            pathOptions={{
              color: '#2ecc71',
              weight: 3,
              opacity: 0.6,
              fill: false,
              dashArray: '8, 8'
            }}
            interactive={false}
          />
        )}

        <HeatmapLayer points={heatmapData} />

        {currentRoute?.points.map((point) => (
          <Marker
            key={point.id}
            position={[point.lat, point.lng]}
            icon={L.divIcon({
              className: 'custom-marker',
              html: point.type === 'supply'
                ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="#f39c12"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>'
                : '<svg width="28" height="28" viewBox="0 0 24 24" fill="#8b4513"><path d="M12 2L2 22H22L12 2Z"/></svg>',
              iconSize: point.type === 'supply' ? [24, 24] : [28, 28],
              iconAnchor: point.type === 'supply' ? [12, 24] : [14, 28]
            })}
          >
            <Popup className="point-popup" maxWidth={300}>
              <div className="popup-content">
                <div className="popup-header">
                  <h3 className="popup-title">{point.name}</h3>
                  <span className={`popup-type-badge ${point.type}`}>
                    {point.type === 'supply' ? '补给点' : '营地'}
                  </span>
                </div>
                <div className="popup-info">
                  <div className="popup-info-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    <span>海拔 {point.altitude} 米</span>
                  </div>
                  <div className="popup-info-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>预计到达 {point.estimatedArrival}</span>
                  </div>
                </div>
                <div className="popup-icons">
                  {point.hasWater && (
                    <div className="popup-icon-item has-water">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />
                      </svg>
                      水源
                    </div>
                  )}
                  {point.hasShelter && (
                    <div className="popup-icon-item has-shelter">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 22H22L12 2Z" />
                      </svg>
                      庇护所
                    </div>
                  )}
                </div>
                <div className="team-members-list">
                  <h5>到达队员 ({teamData?.members.filter((m) => m.nearestPointId === point.id).length || 0})</h5>
                  {teamData?.members
                    .filter((m) => m.nearestPointId === point.id)
                    .map((member) => (
                      <div key={member.id} className="member-list-item">
                        <span className="member-name">{member.name}</span>
                        <span className={`member-status-badge ${member.status}`}>
                          {statusLabels[member.status]}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {teamData?.members.map((member) => (
          <MemberMarker key={member.id} member={member} />
        ))}
      </MapContainer>

      {currentMember && (
        <div className="status-selector">
          <span className="status-selector-label">我的状态:</span>
          <div className="status-options">
            <div
              className={`status-option moving ${currentStatus === 'moving' ? 'selected' : ''}`}
              onClick={() => handleStatusChange('moving')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              行进中
            </div>
            <div
              className={`status-option resting ${currentStatus === 'resting' ? 'selected' : ''}`}
              onClick={() => handleStatusChange('resting')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              休息中
            </div>
            <div
              className={`status-option trouble ${currentStatus === 'trouble' ? 'selected' : ''}`}
              onClick={() => handleStatusChange('trouble')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              遇到困难
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
