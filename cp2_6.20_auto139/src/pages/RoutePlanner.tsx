import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useParams, useNavigate } from 'react-router-dom';
import { useRouteStore } from '../stores/routeStore';
import { useTeamStore } from '../stores/teamStore';
import type { Point } from '../types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const supplyIcon = L.divIcon({
  className: 'custom-marker supply-marker',
  html: '<svg width="28" height="28" viewBox="0 0 24 24" fill="#f39c12"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>',
  iconSize: [28, 28],
  iconAnchor: [14, 28]
});

const campIcon = L.divIcon({
  className: 'custom-marker camp-marker',
  html: '<svg width="32" height="32" viewBox="0 0 24 24" fill="#8b4513"><path d="M12 2L2 22H22L12 2ZM12 8L18 20H6L12 8Z"/></svg>',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

const selectedIcon = L.divIcon({
  className: 'custom-marker selected-marker',
  html: '<div class="marker-selected" style="width: 40px; height: 40px; border-radius: 50%; background: rgba(241, 196, 15, 0.3); border: 3px solid #f1c40f;"></div>',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

function MapClickHandler({ onMapClick, activeTool }: { onMapClick: (lat: number, lng: number) => void; activeTool: 'supply' | 'camp' | 'select' | null }) {
  useMapEvents({
    click: (e) => {
      if (activeTool === 'supply' || activeTool === 'camp') {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

function DraggableMarker({ point, onDragEnd, onDelete, isSelected, onSelect, members }: {
  point: Point;
  onDragEnd: (pointId: string, lat: number, lng: number) => void;
  onDelete: (pointId: string) => void;
  isSelected: boolean;
  onSelect: (point: Point) => void;
  members: any[];
}) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const position = marker.getLatLng();
        onDragEnd(point.id, position.lat, position.lng);
      }
    },
    click() {
      onSelect(point);
    }
  }), [onDragEnd, point.id, onSelect, point]);

  const getIcon = () => {
    if (isSelected) return selectedIcon;
    return point.type === 'supply' ? supplyIcon : campIcon;
  };

  const pointMembers = members.filter((m) => m.nearestPointId === point.id);

  return (
    <Marker
      ref={markerRef}
      position={[point.lat, point.lng]}
      icon={getIcon()}
      draggable={true}
      eventHandlers={eventHandlers}
      zIndexOffset={isSelected ? 1000 : 100}
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
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <span>{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</span>
            </div>
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
            <div className={`popup-icon-item ${point.hasWater ? 'has-water' : ''}`}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />
              </svg>
              水源
            </div>
            <div className={`popup-icon-item ${point.hasShelter ? 'has-shelter' : ''}`}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 22H22L12 2Z" />
              </svg>
              庇护所
            </div>
          </div>
          {pointMembers.length > 0 && (
            <div className="team-members-list">
              <h5>到达队员 ({pointMembers.length})</h5>
              {pointMembers.map((member) => (
                <div key={member.id} className="member-list-item">
                  <span className="member-name">{member.name}</span>
                  <span className={`member-status-badge ${member.status}`}>
                    {member.status === 'moving' ? '行进中' : member.status === 'resting' ? '休息中' : '遇到困难'}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => onDelete(point.id)}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '8px',
              background: '#fee',
              border: 'none',
              borderRadius: '6px',
              color: '#e74c3c',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s ease-out'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fdd'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fee'; }}
          >
            删除此点
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

export default function RoutePlanner() {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const {
    currentRoute,
    selectedPoint,
    loading,
    fetchRoute,
    createRoute,
    setCurrentRoute,
    setSelectedPoint,
    addPoint,
    updatePoint,
    deletePoint
  } = useRouteStore();
  const { teamData, fetchTeam } = useTeamStore();

  const [activeTool, setActiveTool] = useState<'supply' | 'camp' | 'select' | null>(null);
  const [newPoint, setNewPoint] = useState<Partial<Point> | null>(null);
  const [copied, setCopied] = useState(false);
  const [routeName, setRouteName] = useState('');

  const center: [number, number] = [35.8617, 104.1954];

  useEffect(() => {
    if (routeId) {
      fetchRoute(routeId);
      fetchTeam(routeId);
    } else {
      setCurrentRoute(null);
    }
  }, [routeId, fetchRoute, fetchTeam, setCurrentRoute]);

  useEffect(() => {
    if (currentRoute) {
      setRouteName(currentRoute.name);
    }
  }, [currentRoute]);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    if (!activeTool || activeTool === 'select') return;

    setNewPoint({
      type: activeTool,
      lat,
      lng,
      altitude: Math.round(Math.random() * 2000 + 500),
      estimatedArrival: dayjs().format('HH:mm')
    });
  }, [activeTool]);

  const handleSaveNewPoint = async () => {
    if (!newPoint || !newPoint.name || !currentRoute) return;

    await addPoint(currentRoute.id, {
      name: newPoint.name,
      type: newPoint.type as 'supply' | 'camp',
      lat: newPoint.lat!,
      lng: newPoint.lng!,
      altitude: newPoint.altitude!,
      estimatedArrival: newPoint.estimatedArrival!,
      hasWater: newPoint.hasWater,
      hasShelter: newPoint.hasShelter
    });

    setNewPoint(null);
    setActiveTool(null);
  };

  const handleDragEnd = (pointId: string, lat: number, lng: number) => {
    if (!currentRoute) return;
    updatePoint(currentRoute.id, pointId, { lat, lng });
  };

  const handleDeletePoint = (pointId: string) => {
    if (!currentRoute) return;
    deletePoint(currentRoute.id, pointId);
  };

  const handleCreateRoute = async () => {
    const route = await createRoute({
      name: '新探险路线',
      points: [],
      totalDistance: 0,
      estimatedDuration: 0
    });
    navigate(`/planner/${route.id}`);
  };

  const handleCopyCode = async () => {
    if (!currentRoute) return;
    const shareLink = `${window.location.origin}/join/${currentRoute.code}`;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdatePoint = async (field: string, value: any) => {
    if (!selectedPoint || !currentRoute) return;
    await updatePoint(currentRoute.id, selectedPoint.id, { [field]: value });
  };

  const polylinePositions = useMemo(() => {
    if (!currentRoute) return [];
    return currentRoute.points.map((p) => [p.lat, p.lng] as [number, number]);
  }, [currentRoute]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? `${mins}分钟` : ''}`;
    }
    return `${mins}分钟`;
  };

  const members = teamData?.members || [];

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}

      {currentRoute && (
        <>
          <div className="route-header">
            <span className="route-code">{currentRoute.code}</span>
            <input
              type="text"
              className="route-name-input"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              onBlur={() => {
                if (currentRoute && routeName !== currentRoute.name) {
                  updatePoint(currentRoute.id, '', { name: routeName });
                }
              }}
              placeholder="路线名称"
            />
            <button className="copy-btn" onClick={handleCopyCode}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {copied ? '已复制' : '分享链接'}
            </button>
            <button
              className="copy-btn"
              onClick={() => navigate(`/tracker/${currentRoute.id}`)}
              style={{ background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', color: 'white' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              查看队伍
            </button>
          </div>

          <div className="stats-panel">
            <h4>路线统计</h4>
            <div className="stat-item">
              <span className="stat-label">总距离</span>
              <span className="stat-value">{currentRoute.totalDistance} km</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">预计时长</span>
              <span className="stat-value">{formatDuration(currentRoute.estimatedDuration)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">点数</span>
              <span className="stat-value">{currentRoute.points.length}</span>
            </div>
          </div>
        </>
      )}

      <MapContainer
        center={center}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onMapClick={handleMapClick} activeTool={activeTool} />

        {polylinePositions.length > 1 && (
          <Polygon
            positions={polylinePositions}
            pathOptions={{
              color: '#2ecc71',
              weight: 4,
              opacity: 0.8,
              fill: false,
              dashArray: '10, 10'
            }}
            interactive={false}
          />
        )}

        {currentRoute?.points.map((point) => (
          <DraggableMarker
            key={point.id}
            point={point}
            onDragEnd={handleDragEnd}
            onDelete={handleDeletePoint}
            isSelected={selectedPoint?.id === point.id}
            onSelect={setSelectedPoint}
            members={members}
          />
        ))}

        {newPoint && (
          <Marker position={[newPoint.lat!, newPoint.lng!]} icon={newPoint.type === 'supply' ? supplyIcon : campIcon}>
            <Popup className="point-popup" maxWidth={300}>
              <div className="popup-content">
                <div className="popup-header">
                  <h3 className="popup-title">添加{newPoint.type === 'supply' ? '补给点' : '营地'}</h3>
                  <span className={`popup-type-badge ${newPoint.type}`}>
                    {newPoint.type === 'supply' ? '补给点' : '营地'}
                  </span>
                </div>
                <div className="popup-info" style={{ gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#666' }}>名称</label>
                    <input
                      type="text"
                      value={newPoint.name || ''}
                      onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
                      placeholder="输入点名称"
                      style={{ width: '100%', padding: '8px', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>
                  <div className="popup-info-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    <span>{newPoint.lat?.toFixed(4)}, {newPoint.lng?.toFixed(4)}</span>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#666' }}>海拔 (米)</label>
                    <input
                      type="number"
                      value={newPoint.altitude || ''}
                      onChange={(e) => setNewPoint({ ...newPoint, altitude: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '8px', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#666' }}>预计到达时间</label>
                    <input
                      type="time"
                      value={newPoint.estimatedArrival || ''}
                      onChange={(e) => setNewPoint({ ...newPoint, estimatedArrival: e.target.value })}
                      style={{ width: '100%', padding: '8px', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={newPoint.hasWater || false}
                        onChange={(e) => setNewPoint({ ...newPoint, hasWater: e.target.checked })}
                      />
                      有水源
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={newPoint.hasShelter || false}
                        onChange={(e) => setNewPoint({ ...newPoint, hasShelter: e.target.checked })}
                      />
                      有庇护所
                    </label>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button
                    onClick={() => { setNewPoint(null); setActiveTool(null); }}
                    style={{ flex: 1, padding: '10px', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveNewPoint}
                    disabled={!newPoint.name}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: newPoint.name ? 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: newPoint.name ? 'pointer' : 'not-allowed',
                      fontSize: '14px'
                    }}
                  >
                    保存
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {selectedPoint && !newPoint && (
        <div className="toolbar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
          <div style={{ fontWeight: 600, color: '#1a3c2e', fontSize: '15px' }}>
            编辑: {selectedPoint.name}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>名称</label>
              <input
                type="text"
                value={selectedPoint.name}
                onChange={(e) => handleUpdatePoint('name', e.target.value)}
                style={{ width: '100%', padding: '6px 10px', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '13px' }}
              />
            </div>
            <div style={{ width: '100px' }}>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>海拔</label>
              <input
                type="number"
                value={selectedPoint.altitude}
                onChange={(e) => handleUpdatePoint('altitude', parseInt(e.target.value) || 0)}
                style={{ width: '100%', padding: '6px 10px', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '13px' }}
              />
            </div>
            <div style={{ width: '110px' }}>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>到达时间</label>
              <input
                type="time"
                value={selectedPoint.estimatedArrival}
                onChange={(e) => handleUpdatePoint('estimatedArrival', e.target.value)}
                style={{ width: '100%', padding: '6px 10px', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '13px' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={selectedPoint.hasWater || false}
                onChange={(e) => handleUpdatePoint('hasWater', e.target.checked)}
              />
              水源
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={selectedPoint.hasShelter || false}
                onChange={(e) => handleUpdatePoint('hasShelter', e.target.checked)}
              />
              庇护所
            </label>
            <button
              onClick={() => setSelectedPoint(null)}
              style={{ marginLeft: 'auto', padding: '6px 14px', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '13px' }}
            >
              完成
            </button>
          </div>
        </div>
      )}

      {!selectedPoint && !newPoint && (
        <div className="toolbar">
          {!currentRoute ? (
            <button className="tool-btn active" onClick={handleCreateRoute}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              创建新路线
            </button>
          ) : (
            <>
              <button
                className={`tool-btn ${activeTool === 'supply' ? 'active' : ''}`}
                onClick={() => { setActiveTool(activeTool === 'supply' ? null : 'supply'); setSelectedPoint(null); }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#f39c12">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                添加补给点
              </button>
              <button
                className={`tool-btn ${activeTool === 'camp' ? 'active' : ''}`}
                onClick={() => { setActiveTool(activeTool === 'camp' ? null : 'camp'); setSelectedPoint(null); }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#8b4513">
                  <path d="M12 2L2 22H22L12 2Z" />
                </svg>
                添加营地
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
