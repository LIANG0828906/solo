import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useParams, useNavigate } from 'react-router-dom';
import { useRouteStore } from '../stores/routeStore';
import { useTeamStore } from '../stores/teamStore';
import type { TeamMemberStatus } from '../types';
import type { Point } from '../types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import 'leaflet.heat';

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
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (points.length === 0) return;

    heatLayerRef.current = (L as any).heatLayer(points, {
      radius: 50,
      blur: 30,
      maxZoom: 12,
      minOpacity: 0.3,
      gradient: {
        0.0: '#3498db',
        0.25: '#2ecc71',
        0.5: '#f1c40f',
        0.75: '#e67e22',
        1.0: '#e74c3c'
      }
    }).addTo(map);

    return () => {
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
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

function PointDetailCard({ point, members, onClose }: {
  point: Point;
  members: any[];
  onClose: () => void;
}) {
  const pointMembers = members.filter((m) => m.nearestPointId === point.id);

  return (
    <div
      style={{
        position: 'absolute',
        top: '80px',
        left: '16px',
        width: '300px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        zIndex: 600,
        overflow: 'hidden',
        transition: 'all 0.2s ease-out'
      }}
    >
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a3c2e' }}>{point.name}</h3>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500,
              background: point.type === 'supply' ? 'rgba(243, 156, 18, 0.2)' : 'rgba(139, 69, 19, 0.2)',
              color: point.type === 'supply' ? '#e67e22' : '#8b4513'
            }}
          >
            {point.type === 'supply' ? '补给点' : '营地'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#555' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            <span>{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#555' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>海拔 {point.altitude} 米</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#555' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>预计到达 {point.estimatedArrival}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: point.hasWater ? '#3498db' : '#999'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />
            </svg>
            水源{point.hasWater ? '' : ' (无)'}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: point.hasShelter ? '#8b4513' : '#999'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 22H22L12 2Z" />
            </svg>
            庇护所{point.hasShelter ? '' : ' (无)'}
          </div>
        </div>

        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
          <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666', fontWeight: 500 }}>
            到达队员 ({pointMembers.length})
          </h5>
          {pointMembers.length === 0 ? (
            <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>暂无队员到达</p>
          ) : (
            pointMembers.map((member) => (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  fontSize: '13px'
                }}
              >
                <span style={{ color: '#333' }}>{member.name}</span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 500,
                    background: statusColors[member.status as TeamMemberStatus]
                      ? `rgba(${member.status === 'moving' ? '46,204,113' : member.status === 'resting' ? '241,196,15' : '231,76,60'}, 0.2)`
                      : 'rgba(0,0,0,0.1)',
                    color: statusColors[member.status as TeamMemberStatus] || '#666'
                  }}
                >
                  {statusLabels[member.status as TeamMemberStatus]}
                </span>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '10px',
            background: '#f0f4f1',
            border: 'none',
            borderRadius: '8px',
            color: '#1a3c2e',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease-out'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#e0e8e2'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f0f4f1'; }}
        >
          关闭
        </button>
      </div>
    </div>
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
    updateMemberStatus,
    startPositionTracking,
    stopPositionTracking
  } = useTeamStore();

  const currentStatus: TeamMemberStatus = currentMember?.status || 'moving';
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const refreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

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

  useEffect(() => {
    if (currentMember && routeId) {
      cleanupRef.current = startPositionTracking(
        currentMember.id,
        routeId,
        currentMember.name
      );
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      stopPositionTracking();
    };
  }, [currentMember?.id, routeId, currentMember?.name, startPositionTracking, stopPositionTracking]);

  const polylinePositions = useMemo(() => {
    if (!currentRoute) return [];
    return currentRoute.points.map((p) => [p.lat, p.lng] as [number, number]);
  }, [currentRoute]);

  const heatmapData = useMemo(() => {
    if (!teamData || !teamData.members) return [];
    return teamData.members.map((m) => {
      const intensity = m.status === 'trouble' ? 1.5 : m.status === 'moving' ? 1.0 : 0.6;
      return [m.lat, m.lng, intensity] as [number, number, number];
    });
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

  const members = teamData?.members || [];

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

      {selectedPoint && (
        <PointDetailCard
          point={selectedPoint}
          members={members}
          onClose={() => setSelectedPoint(null)}
        />
      )}

      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '320px',
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          zIndex: 500,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          maxHeight: 'calc(100vh - 100px)',
          overflowY: 'auto',
          transition: 'all 0.2s ease-out'
        }}
      >
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#1a3c2e' }}>队伍进度</h3>
        {teamData && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '20px',
              paddingBottom: '20px',
              borderBottom: '1px solid #eee'
            }}
          >
            <div style={{ textAlign: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a3c2e', lineHeight: 1 }}>
                {teamData.stats.totalMembers}
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>总人数</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a3c2e', lineHeight: 1 }}>
                {teamData.stats.arrivedSupply}
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>已到补给点</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a3c2e', lineHeight: 1 }}>
                {teamData.stats.averageProgress}%
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>平均进度</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {members.map((member) => (
            <div
              key={member.id}
              style={{
                background: '#f0f4f1',
                borderRadius: '8px',
                padding: '14px',
                transition: 'all 0.2s ease-out'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}
              >
                <span style={{ fontWeight: 600, color: '#1a3c2e' }}>{member.name}</span>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 500,
                    background: `rgba(${member.status === 'moving' ? '46,204,113' : member.status === 'resting' ? '241,196,15' : '231,76,60'}, 0.2)`,
                    color: statusColors[member.status as TeamMemberStatus] || '#666'
                  }}
                >
                  {statusLabels[member.status as TeamMemberStatus]}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  最近: {getPointName(member.nearestPointId)}
                </div>
                <div style={{ color: '#888', fontSize: '11px', marginTop: '4px' }}>
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
            eventHandlers={{
              click: () => setSelectedPoint(point)
            }}
          />
        ))}

        {members.map((member) => (
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
