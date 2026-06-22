import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import type { Trip, Activity } from '../types';

interface ActivityWithDate extends Activity {
  date: string;
}
import { dataStore } from '../dataStore';
import '../styles/map-view.css';

interface MapViewProps {
  trip: Trip;
  onUpdate: () => void;
}

const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-teal.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function MapView({ trip, onUpdate }: MapViewProps) {
  const [selectedActivity, setSelectedActivity] = useState<ActivityWithDate | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPoint, setNewPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [newActivity, setNewActivity] = useState({
    time: '10:00',
    place: '',
    description: '',
    notes: '',
    date: ''
  });

  const allActivities = useMemo(() => {
    const activities: ActivityWithDate[] = [];
    const sortedDays = [...trip.days].sort((a, b) => a.date.localeCompare(b.date));
    sortedDays.forEach(day => {
      const sortedActivities = [...day.activities].sort((a, b) => a.time.localeCompare(b.time));
      sortedActivities.forEach(act => {
        activities.push({ ...act, date: day.date });
      });
    });
    return activities;
  }, [trip.days]);

  const polylinePoints = useMemo(() => {
    return allActivities
      .filter(act => act.lat !== 0 && act.lng !== 0)
      .map(act => [act.lat, act.lng] as [number, number]);
  }, [allActivities]);

  const mapCenter = useMemo((): [number, number] => {
    if (polylinePoints.length > 0) {
      const avgLat = polylinePoints.reduce((sum, p) => sum + p[0], 0) / polylinePoints.length;
      const avgLng = polylinePoints.reduce((sum, p) => sum + p[1], 0) / polylinePoints.length;
      return [avgLat, avgLng];
    }
    return [35.6762, 139.6503];
  }, [polylinePoints]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setNewPoint({ lat, lng });
    setShowAddForm(true);
    setNewActivity(prev => ({
      ...prev,
      place: '',
      description: '',
      notes: ''
    }));
  }, []);

  const handleMarkerDoubleClick = async (activity: Activity) => {
    if (!confirm(`确定要删除「${activity.place}」这个地点吗？`)) return;
    try {
      await dataStore.deleteActivity(trip.id, activity.id);
      onUpdate();
      setSelectedActivity(null);
    } catch (error) {
      console.error('Failed to delete marker:', error);
    }
  };

  const handleAddActivity = async () => {
    if (!newPoint || !newActivity.place || !newActivity.date) return;

    try {
      await dataStore.addActivity(trip.id, newActivity.date, {
        time: newActivity.time,
        place: newActivity.place,
        description: newActivity.description,
        notes: newActivity.notes,
        lat: newPoint.lat,
        lng: newPoint.lng
      });
      setShowAddForm(false);
      setNewPoint(null);
      setNewActivity({
        time: '10:00',
        place: '',
        description: '',
        notes: '',
        date: ''
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to add activity:', error);
    }
  };

  const handleUpdateActivity = async () => {
    if (!selectedActivity) return;

    try {
      await dataStore.updateActivity(trip.id, selectedActivity.id, selectedActivity);
      setSelectedActivity(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  };

  const sortedDays = useMemo(() => {
    return [...trip.days].sort((a, b) => a.date.localeCompare(b.date));
  }, [trip.days]);

  return (
    <div className="map-view-container split-layout">
      <div className="map-section">
        <div className="map-wrapper">
          <MapContainer
            center={mapCenter}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <ChangeView center={mapCenter} zoom={polylinePoints.length > 0 ? 12 : 10} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents onMapClick={handleMapClick} />
            
            {polylinePoints.length > 1 && (
              <Polyline
                positions={polylinePoints}
                color="#2dd4bf"
                weight={4}
                opacity={0.8}
                dashArray="10, 10"
              />
            )}

            {allActivities.map((activity, index) => (
              activity.lat !== 0 && activity.lng !== 0 && (
                <Marker
                  key={activity.id}
                  position={[activity.lat, activity.lng]}
                  icon={customIcon}
                  eventHandlers={{
                    click: () => setSelectedActivity(activity),
                    dblclick: () => handleMarkerDoubleClick(activity)
                  }}
                >
                  <Popup>
                    <div className="popup-content">
                      <div className="popup-number">#{index + 1}</div>
                      <h4 className="popup-title">{activity.place}</h4>
                      <p className="popup-time">{activity.date} {activity.time}</p>
                      <p className="popup-desc">{activity.description}</p>
                      <p className="popup-hint">双击标记可删除</p>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}

            {newPoint && (
              <Marker position={[newPoint.lat, newPoint.lng]} icon={customIcon}>
                <Popup>
                  <div className="popup-content">
                    <p className="popup-hint">新地点</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
        <div className="map-legend">
          <p className="legend-hint">💡 点击地图添加地点，双击标记删除</p>
        </div>
      </div>

      <div className="detail-section">
        {showAddForm && newPoint ? (
          <div className="detail-card scale-in">
            <div className="detail-header">
              <h3>添加新地点</h3>
              <button className="close-btn" onClick={() => {
                setShowAddForm(false);
                setNewPoint(null);
              }}>
                ✕
              </button>
            </div>
            
            <div className="coord-info">
              <span>📍 纬度: {newPoint.lat.toFixed(4)}</span>
              <span>经度: {newPoint.lng.toFixed(4)}</span>
            </div>

            <div className="form-group">
              <label>日期 *</label>
              <select
                value={newActivity.date}
                onChange={(e) => setNewActivity(prev => ({ ...prev, date: e.target.value }))}
                className="form-input"
              >
                <option value="">选择日期</option>
                {sortedDays.map(day => (
                  <option key={day.date} value={day.date}>{day.date}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>时间</label>
                <input
                  type="time"
                  value={newActivity.time}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, time: e.target.value }))}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>地点名称 *</label>
                <input
                  type="text"
                  value={newActivity.place}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, place: e.target.value }))}
                  placeholder="例如：浅草寺"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>活动描述</label>
              <input
                type="text"
                value={newActivity.description}
                onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                placeholder="描述一下活动内容"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>备注</label>
              <textarea
                value={newActivity.notes}
                onChange={(e) => setNewActivity(prev => ({ ...prev, notes: e.target.value }))}
                className="form-textarea"
                rows={2}
                placeholder="门票、交通等提醒"
              />
            </div>

            <div className="detail-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowAddForm(false);
                  setNewPoint(null);
                }}
              >
                取消
              </button>
              <button
                className="submit-btn"
                onClick={handleAddActivity}
                disabled={!newActivity.place || !newActivity.date}
              >
                添加地点
              </button>
            </div>
          </div>
        ) : selectedActivity ? (
          <div className="detail-card scale-in">
            <div className="detail-header">
              <h3>地点详情</h3>
              <button className="close-btn" onClick={() => setSelectedActivity(null)}>
                ✕
              </button>
            </div>

            <div className="detail-info">
              <div className="info-row">
                <span className="info-label">日期</span>
                <span className="info-value">{selectedActivity.date || ''}</span>
              </div>
              <div className="info-row">
                <span className="info-label">时间</span>
                <input
                  type="time"
                  value={selectedActivity.time}
                  onChange={(e) => setSelectedActivity({ ...selectedActivity, time: e.target.value })}
                  className="edit-input"
                />
              </div>
              <div className="info-row">
                <span className="info-label">地点</span>
                <input
                  type="text"
                  value={selectedActivity.place}
                  onChange={(e) => setSelectedActivity({ ...selectedActivity, place: e.target.value })}
                  className="edit-input"
                />
              </div>
              <div className="info-row">
                <span className="info-label">描述</span>
                <input
                  type="text"
                  value={selectedActivity.description}
                  onChange={(e) => setSelectedActivity({ ...selectedActivity, description: e.target.value })}
                  className="edit-input"
                />
              </div>
              <div className="info-row">
                <span className="info-label">备注</span>
                <textarea
                  value={selectedActivity.notes}
                  onChange={(e) => setSelectedActivity({ ...selectedActivity, notes: e.target.value })}
                  className="edit-textarea"
                  rows={2}
                />
              </div>
              <div className="info-row">
                <span className="info-label">纬度</span>
                <input
                  type="number"
                  step="0.0001"
                  value={selectedActivity.lat}
                  onChange={(e) => setSelectedActivity({ ...selectedActivity, lat: parseFloat(e.target.value) || 0 })}
                  className="edit-input"
                />
              </div>
              <div className="info-row">
                <span className="info-label">经度</span>
                <input
                  type="number"
                  step="0.0001"
                  value={selectedActivity.lng}
                  onChange={(e) => setSelectedActivity({ ...selectedActivity, lng: parseFloat(e.target.value) || 0 })}
                  className="edit-input"
                />
              </div>
            </div>

            <div className="detail-actions">
              <button
                className="delete-btn-large"
                onClick={() => handleMarkerDoubleClick(selectedActivity)}
              >
                删除地点
              </button>
              <button className="submit-btn" onClick={handleUpdateActivity}>
                保存修改
              </button>
            </div>
          </div>
        ) : (
          <div className="detail-card empty-detail fade-in">
            <div className="empty-detail-icon">🗺️</div>
            <h3>选择或添加地点</h3>
            <p>点击左侧地图上的标记查看详情，或点击地图空白处添加新的地点。</p>
            <div className="tip-list">
              <div className="tip-item">
                <span className="tip-icon">📍</span>
                <span>点击地图添加地点标记</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">👆</span>
                <span>点击标记查看地点详情</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">🖱️</span>
                <span>双击标记可删除地点</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">📈</span>
                <span>按日期顺序自动生成路线</span>
              </div>
            </div>
          </div>
        )}

        {allActivities.length > 0 && (
          <div className="route-summary-card fade-in">
            <h4>路线概览</h4>
            <div className="route-stats">
              <div className="stat-item">
                <span className="stat-value">{allActivities.length}</span>
                <span className="stat-label">个地点</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{trip.days.length}</span>
                <span className="stat-label">天行程</span>
              </div>
            </div>
            <div className="route-list">
              {allActivities.slice(0, 6).map((activity, index) => (
                <div key={activity.id} className="route-item">
                  <span className="route-number">{index + 1}</span>
                  <div className="route-info">
                    <span className="route-place">{activity.place}</span>
                    <span className="route-time">{activity.date} {activity.time}</span>
                  </div>
                </div>
              ))}
              {allActivities.length > 6 && (
                <p className="more-items">还有 {allActivities.length - 6} 个地点...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapView;
