import { useEffect, useRef, useState, type DragEvent } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Attraction } from '../data/TripDataManager';
import { TripDataManager } from '../data/TripDataManager';
import 'leaflet/dist/leaflet.css';

const createBlueIcon = () =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#3B82F6;border:2px solid white;box-shadow:0 0 0 2px #3B82F6;display:flex;align-items:center;justify-content:center;"><div style="width:4px;height:4px;border-radius:50%;background:white;"></div></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 12);
    }
  }, [center, map]);
  return null;
}

export function RoutePlannerPanel() {
  const [attractions, setAttractions] = useState<Attraction[]>(() =>
    TripDataManager.getAttractions()
  );
  const [totalDistance, setTotalDistance] = useState(() =>
    TripDataManager.getTotalDistance()
  );
  const [totalDuration, setTotalDuration] = useState(() =>
    TripDataManager.getTotalDuration()
  );
  const [showForm, setShowForm] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    duration: 60,
    lat: 39.9042,
    lng: 116.4074,
    budget: 0,
  });

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return TripDataManager.subscribe(() => {
      setAttractions(TripDataManager.getAttractions());
      setTotalDistance(TripDataManager.getTotalDistance());
      setTotalDuration(TripDataManager.getTotalDuration());
    });
  }, []);

  const positions: [number, number][] = attractions.map((a) => [a.lat, a.lng]);
  const mapCenter: [number, number] | null =
    attractions.length > 0 ? positions[0] : null;

  const handleAddAttraction = () => {
    if (!formData.name.trim()) return;
    TripDataManager.addAttraction(formData);
    setFormData({
      name: '',
      duration: 60,
      lat: 39.9042,
      lng: 116.4074,
      budget: 0,
    });
    setShowForm(false);
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedId || dragOverIndex === null) {
      setDraggedId(null);
      setDragOverIndex(null);
      return;
    }
    const ids = attractions.map((a) => a.id);
    const fromIndex = ids.indexOf(draggedId);
    if (fromIndex === -1) return;
    const toIndex = dragOverIndex > fromIndex ? dragOverIndex - 1 : dragOverIndex;
    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, draggedId);
    TripDataManager.updateAttractionOrder(ids);
    setDraggedId(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverIndex(null);
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}小时${m > 0 ? m + '分' : ''}` : `${m}分`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>路线规划</h3>
        <div style={styles.summary}>
          <span style={styles.summaryItem}>{totalDistance} km</span>
          <span style={styles.summaryItem}>{formatDuration(totalDuration)}</span>
        </div>
      </div>

      <div style={styles.attractionsList} ref={listRef}>
        {attractions.map((attraction, index) => (
          <div key={attraction.id}>
            {dragOverIndex === index && (
              <div style={styles.dropIndicator} />
            )}
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, attraction.id)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              style={{
                ...styles.attractionCard,
                ...(draggedId === attraction.id ? styles.draggingCard : {}),
              }}
            >
              <div style={styles.cardIndex}>{index + 1}</div>
              <div style={styles.cardContent}>
                <div style={styles.cardName}>{attraction.name}</div>
                <div style={styles.cardDetails}>
                  <span>⏱ {formatDuration(attraction.duration)}</span>
                  <span>💰 ¥{attraction.budget}</span>
                </div>
              </div>
              <button
                onClick={() => TripDataManager.removeAttraction(attraction.id)}
                style={styles.deleteBtn}
              >
                ×
              </button>
            </div>
          </div>
        ))}
        {dragOverIndex === attractions.length && (
          <div style={styles.dropIndicator} />
        )}
      </div>

      {showForm ? (
        <div style={styles.form}>
          <input
            type="text"
            placeholder="景点名称"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            style={styles.input}
          />
          <div style={styles.formRow}>
            <input
              type="number"
              placeholder="时长(分钟)"
              value={formData.duration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration: parseInt(e.target.value) || 0,
                })
              }
              style={{ ...styles.input, ...styles.inputSmall }}
            />
            <input
              type="number"
              placeholder="预算"
              value={formData.budget}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  budget: parseFloat(e.target.value) || 0,
                })
              }
              style={{ ...styles.input, ...styles.inputSmall }}
            />
          </div>
          <div style={styles.formRow}>
            <input
              type="number"
              step="0.0001"
              placeholder="纬度"
              value={formData.lat}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  lat: parseFloat(e.target.value) || 0,
                })
              }
              style={{ ...styles.input, ...styles.inputSmall }}
            />
            <input
              type="number"
              step="0.0001"
              placeholder="经度"
              value={formData.lng}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  lng: parseFloat(e.target.value) || 0,
                })
              }
              style={{ ...styles.input, ...styles.inputSmall }}
            />
          </div>
          <div style={styles.formActions}>
            <button onClick={handleAddAttraction} style={styles.addBtn}>
              添加
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={styles.cancelBtn}
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} style={styles.addAttractionBtn}>
          + 添加景点
        </button>
      )}

      <div style={styles.mapContainer}>
        {mapCenter && (
          <MapContainer
            center={mapCenter}
            zoom={12}
            style={{ height: '100%', width: '100%', borderRadius: 8 }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={mapCenter} />
            {positions.length > 1 && (
              <Polyline
                positions={positions}
                color="#3B82F6"
                weight={3}
                opacity={0.8}
                dashArray="5, 5"
              />
            )}
            {attractions.map((a) => (
              <Marker
                key={a.id}
                position={[a.lat, a.lng]}
                icon={createBlueIcon()}
              />
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 300,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #E5E7EB',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 16px 12px',
    borderBottom: '1px solid #E5E7EB',
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#1E3A5F',
    marginBottom: 8,
  },
  summary: {
    display: 'flex',
    gap: 12,
  },
  summaryItem: {
    fontSize: 13,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    padding: '4px 10px',
    borderRadius: 12,
  },
  attractionsList: {
    flex: '0 1 auto',
    maxHeight: '45%',
    overflowY: 'auto',
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  attractionCard: {
    width: 220,
    backgroundColor: '#F9FAFB',
    border: '1px solid #D1D5DB',
    borderRadius: 10,
    padding: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'grab',
    transition: 'all 0.3s ease',
    userSelect: 'none',
  },
  draggingCard: {
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    transform: 'scale(1.02)',
    cursor: 'grabbing',
    opacity: 0.9,
  },
  dropIndicator: {
    height: 2,
    border: '2px dashed #3B82F6',
    borderRadius: 2,
    margin: '4px 0',
    backgroundColor: '#EFF6FF',
  },
  cardIndex: {
    width: 24,
    height: 24,
    backgroundColor: '#3B82F6',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1F2937',
    marginBottom: 4,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardDetails: {
    display: 'flex',
    gap: 10,
    fontSize: 12,
    color: '#6B7280',
  },
  deleteBtn: {
    width: 24,
    height: 24,
    border: 'none',
    backgroundColor: 'transparent',
    color: '#9CA3AF',
    fontSize: 18,
    cursor: 'pointer',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  form: {
    padding: 12,
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  formRow: {
    display: 'flex',
    gap: 8,
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
    transition: 'all 0.3s ease',
    width: '100%',
    boxSizing: 'border-box',
  },
  inputSmall: {
    flex: 1,
  },
  formActions: {
    display: 'flex',
    gap: 8,
  },
  addBtn: {
    flex: 1,
    padding: '8px 12px',
    border: 'none',
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    color: 'white',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  cancelBtn: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    backgroundColor: 'white',
    color: '#6B7280',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  addAttractionBtn: {
    margin: '0 12px 12px',
    padding: '10px 12px',
    border: '1px dashed #3B82F6',
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  mapContainer: {
    flex: 1,
    minHeight: 200,
    padding: '0 12px 12px',
  },
};
