import React, { useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trip, MapLocation, Activity, generateId } from '../dataStore';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const tealIcon = L.divIcon({
  className: '',
  html: `<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 11.25 15 27 15 27s15-15.75 15-27C30 6.716 23.284 0 15 0z" fill="#14b8a6"/>
    <circle cx="15" cy="15" r="7" fill="white"/>
  </svg>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42],
});

interface MapViewProps {
  trip: Trip;
  onTripUpdate: (trip: Trip) => void;
}

const DEFAULT_CENTER: [number, number] = [35.6762, 139.6503];
const DEFAULT_ZOOM = 5;

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    minHeight: 400,
    transition: 'all 0.3s ease',
  },
  containerTablet: {
    flexDirection: 'column',
  },
  containerMobile: {
    flexDirection: 'column',
  },
  mapPanel: {
    width: '50%',
    height: '100%',
    transition: 'all 0.3s ease',
  },
  mapPanelTablet: {
    width: '100%',
    height: '50%',
  },
  mapPanelMobile: {
    width: '100%',
    height: '60%',
  },
  detailPanel: {
    width: '50%',
    height: '100%',
    padding: 20,
    overflowY: 'auto',
    backgroundColor: '#f8fafc',
    transition: 'all 0.3s ease',
  },
  detailPanelTablet: {
    width: '100%',
    height: '50%',
  },
  detailPanelMobile: {
    width: '100%',
    height: '40%',
  },
  heading: {
    margin: '0 0 16px 0',
    color: '#0f172a',
    fontSize: 20,
    fontWeight: 600,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    display: 'block',
    marginBottom: 4,
    color: '#475569',
    fontSize: 13,
    fontWeight: 500,
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
    minHeight: 60,
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  buttonRow: {
    display: 'flex',
    gap: 10,
    marginTop: 16,
  },
  btnPrimary: {
    padding: '8px 20px',
    backgroundColor: '#14b8a6',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  btnSecondary: {
    padding: '8px 20px',
    backgroundColor: '#e2e8f0',
    color: '#334155',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  btnDelete: {
    padding: '8px 20px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  instruction: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 1.6,
  },
  coordInfo: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  popupContent: {
    fontSize: 13,
    lineHeight: 1.5,
  },
  popupName: {
    fontWeight: 600,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 4,
  },
  popupDetail: {
    color: '#64748b',
  },
  sectionDivider: {
    border: 'none',
    borderTop: '1px solid #e2e8f0',
    margin: '16px 0',
  },
  dayBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: '#ccfbf1',
    color: '#0d9488',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
    marginBottom: 8,
  },
};

function MapClickHandler({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

type SelectionState =
  | { type: 'none' }
  | { type: 'selected'; dayIndex: number; activityIndex: number }
  | { type: 'adding'; lat: number; lng: number };

export default function MapView({ trip, onTripUpdate }: MapViewProps) {
  const [selection, setSelection] = useState<SelectionState>({ type: 'none' });
  const [formLocation, setFormLocation] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [viewportKey, setViewportKey] = useState(0);

  const allMappedActivities = useMemo(() => {
    const items: { dayIndex: number; activityIndex: number; date: string; activity: Activity }[] = [];
    trip.days.forEach((day, di) => {
      day.activities.forEach((act, ai) => {
        if (act.mapLocation) {
          items.push({ dayIndex: di, activityIndex: ai, date: day.date, activity: act });
        }
      });
    });
    items.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.activity.time.localeCompare(b.activity.time);
    });
    return items;
  }, [trip]);

  const polylinePositions = useMemo<[number, number][]>(
    () => allMappedActivities.map((item) => [item.activity.mapLocation!.lat, item.activity.mapLocation!.lng]),
    [allMappedActivities]
  );

  const mapCenter = useMemo<[number, number]>(() => {
    if (allMappedActivities.length === 0) return DEFAULT_CENTER;
    const sumLat = allMappedActivities.reduce((s, i) => s + i.activity.mapLocation!.lat, 0);
    const sumLng = allMappedActivities.reduce((s, i) => s + i.activity.mapLocation!.lng, 0);
    return [sumLat / allMappedActivities.length, sumLng / allMappedActivities.length];
  }, [allMappedActivities]);

  const handleMapClick = useCallback((latlng: L.LatLng) => {
    setSelection({ type: 'adding', lat: latlng.lat, lng: latlng.lng });
    setFormLocation('');
    setFormTime('');
    setFormDescription('');
    setFormNotes('');
  }, []);

  const handleMarkerClick = useCallback((dayIndex: number, activityIndex: number) => {
    const act = trip.days[dayIndex].activities[activityIndex];
    setSelection({ type: 'selected', dayIndex, activityIndex });
    setFormLocation(act.location);
    setFormTime(act.time);
    setFormDescription(act.description);
    setFormNotes(act.notes);
  }, [trip]);

  const handleMarkerDblClick = useCallback((dayIndex: number, activityIndex: number) => {
    const updated = { ...trip, days: trip.days.map((day, di) => {
      if (di !== dayIndex) return day;
      return {
        ...day,
        activities: day.activities.map((act, ai) => {
          if (ai !== activityIndex) return act;
          return { ...act, mapLocation: null };
        }),
      };
    })};
    onTripUpdate(updated);
    setSelection({ type: 'none' });
  }, [trip, onTripUpdate]);

  const handleAddSubmit = useCallback(() => {
    if (!formLocation.trim()) return;
    const newActivity: Activity = {
      id: generateId(),
      time: formTime,
      location: formLocation,
      description: formDescription,
      notes: formNotes,
      mapLocation: { lat: selection.type === 'adding' ? selection.lat : 0, lng: selection.type === 'adding' ? selection.lng : 0 },
    };
    const dayIndex = trip.days.length > 0 ? 0 : -1;
    if (dayIndex < 0) return;
    const updated = { ...trip, days: trip.days.map((day, di) => {
      if (di !== dayIndex) return day;
      return { ...day, activities: [...day.activities, newActivity] };
    })};
    onTripUpdate(updated);
    setSelection({ type: 'none' });
    setFormLocation('');
    setFormTime('');
    setFormDescription('');
    setFormNotes('');
  }, [selection, formLocation, formTime, formDescription, formNotes, trip, onTripUpdate]);

  const handleEditSubmit = useCallback(() => {
    if (selection.type !== 'selected') return;
    const { dayIndex, activityIndex } = selection;
    const updated = { ...trip, days: trip.days.map((day, di) => {
      if (di !== dayIndex) return day;
      return {
        ...day,
        activities: day.activities.map((act, ai) => {
          if (ai !== activityIndex) return act;
          return {
            ...act,
            location: formLocation,
            time: formTime,
            description: formDescription,
            notes: formNotes,
          };
        }),
      };
    })};
    onTripUpdate(updated);
    setSelection({ type: 'none' });
  }, [selection, formLocation, formTime, formDescription, formNotes, trip, onTripUpdate]);

  const handleCancel = useCallback(() => {
    setSelection({ type: 'none' });
  }, []);

  const handleDelete = useCallback(() => {
    if (selection.type !== 'selected') return;
    const { dayIndex, activityIndex } = selection;
    const updated = { ...trip, days: trip.days.map((day, di) => {
      if (di !== dayIndex) return day;
      return {
        ...day,
        activities: day.activities.map((act, ai) => {
          if (ai !== activityIndex) return act;
          return { ...act, mapLocation: null };
        }),
      };
    })};
    onTripUpdate(updated);
    setSelection({ type: 'none' });
  }, [selection, trip, onTripUpdate]);

  const renderRightPanel = () => {
    if (selection.type === 'adding') {
      return (
        <div>
          <h3 style={styles.heading}>添加新标记</h3>
          <div style={styles.coordInfo}>
            坐标: {selection.lat.toFixed(4)}, {selection.lng.toFixed(4)}
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>地点名称 *</label>
            <input
              style={styles.input}
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="输入地点名称"
              autoFocus
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>时间</label>
            <input
              style={styles.input}
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
              placeholder="如 09:00"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>描述</label>
            <textarea
              style={styles.textarea}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="活动描述"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>备注</label>
            <textarea
              style={styles.textarea}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="额外备注"
            />
          </div>
          <div style={styles.buttonRow}>
            <button style={styles.btnPrimary} onClick={handleAddSubmit}>添加</button>
            <button style={styles.btnSecondary} onClick={handleCancel}>取消</button>
          </div>
        </div>
      );
    }

    if (selection.type === 'selected') {
      const day = trip.days[selection.dayIndex];
      const act = day?.activities[selection.activityIndex];
      if (!act) return null;
      return (
        <div>
          <div style={styles.dayBadge}>{day.date}</div>
          <h3 style={styles.heading}>编辑标记</h3>
          {act.mapLocation && (
            <div style={styles.coordInfo}>
              坐标: {act.mapLocation.lat.toFixed(4)}, {act.mapLocation.lng.toFixed(4)}
            </div>
          )}
          <div style={styles.formGroup}>
            <label style={styles.label}>地点名称</label>
            <input
              style={styles.input}
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>时间</label>
            <input
              style={styles.input}
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>描述</label>
            <textarea
              style={styles.textarea}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>备注</label>
            <textarea
              style={styles.textarea}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>
          <div style={styles.buttonRow}>
            <button style={styles.btnPrimary} onClick={handleEditSubmit}>保存</button>
            <button style={styles.btnDelete} onClick={handleDelete}>删除标记</button>
            <button style={styles.btnSecondary} onClick={handleCancel}>取消</button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <h3 style={styles.heading}>地图视图</h3>
        <p style={styles.instruction}>
          点击地图任意位置添加新标记。
        </p>
        <p style={styles.instruction}>
          点击已有标记查看详情并编辑。
        </p>
        <p style={styles.instruction}>
          双击标记可删除该位置信息。
        </p>
        {allMappedActivities.length > 0 && (
          <>
            <hr style={styles.sectionDivider} />
            <p style={{ ...styles.instruction, fontWeight: 500 }}>
              已有 {allMappedActivities.length} 个位置标记
            </p>
          </>
        )}
      </div>
    );
  };

  const containerStyle = {
    ...styles.container,
    ...(window.innerWidth < 768 ? styles.containerMobile : window.innerWidth < 1024 ? styles.containerTablet : {}),
  };
  const mapPanelStyle = {
    ...styles.mapPanel,
    ...(window.innerWidth < 768 ? styles.mapPanelMobile : window.innerWidth < 1024 ? styles.mapPanelTablet : {}),
  };
  const detailPanelStyle = {
    ...styles.detailPanel,
    ...(window.innerWidth < 768 ? styles.detailPanelMobile : window.innerWidth < 1024 ? styles.detailPanelTablet : {}),
  };

  return (
    <div style={containerStyle}>
      <div style={mapPanelStyle}>
        <MapContainer
          key={viewportKey}
          center={mapCenter}
          zoom={DEFAULT_ZOOM}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {allMappedActivities.map((item) => (
            <Marker
              key={`${item.dayIndex}-${item.activityIndex}-${item.activity.id}`}
              position={[item.activity.mapLocation!.lat, item.activity.mapLocation!.lng]}
              icon={tealIcon}
              eventHandlers={{
                click: () => handleMarkerClick(item.dayIndex, item.activityIndex),
                dblclick: (e) => {
                  e.originalEvent.stopPropagation();
                  handleMarkerDblClick(item.dayIndex, item.activityIndex);
                },
              }}
            >
              <Popup>
                <div style={styles.popupContent}>
                  <div style={styles.popupName}>{item.activity.location}</div>
                  <div style={styles.popupDetail}>
                    {item.date} {item.activity.time}
                  </div>
                  {item.activity.description && (
                    <div style={styles.popupDetail}>{item.activity.description}</div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
          {polylinePositions.length > 1 && (
            <Polyline
              positions={polylinePositions}
              pathOptions={{ color: '#14b8a6', weight: 3 }}
            />
          )}
        </MapContainer>
      </div>
      <div style={detailPanelStyle}>
        {renderRightPanel()}
      </div>
    </div>
  );
}
