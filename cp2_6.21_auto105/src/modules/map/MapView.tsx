import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import type { Popup as LeafletPopup } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Clock, Plus, X } from 'lucide-react';
import type { AttractionCreateData } from '@/types';
import useTripStore from '@/stores/tripStore';
import RouteLayer from './RouteLayer';

const defaultIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background: #1a73e8; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);"></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const selectedIcon = L.divIcon({
  className: 'custom-marker selected',
  html: '<div style="background: #34a853; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface MapEventsHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

function MapEventsHandler({ onMapClick }: MapEventsHandlerProps) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface AttractionMarkerProps {
  attraction: Attraction;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, lat: number, lng: number) => void;
  dayId: string;
}

function AttractionMarker({
  attraction,
  isSelected,
  onSelect,
  onDragEnd,
  dayId,
}: AttractionMarkerProps) {
  const { updateAttraction } = useTripStore();
  const [name, setName] = useState(attraction.name);
  const [notes, setNotes] = useState(attraction.notes || '');
  const [duration, setDuration] = useState(attraction.duration?.toString() || '');

  const handleSave = useCallback(() => {
    updateAttraction(dayId, attraction.id, {
      name: name || '未命名景点',
      notes,
      duration: duration ? parseInt(duration, 10) : undefined,
    });
  }, [dayId, attraction.id, name, notes, duration, updateAttraction]);

  const handleDragEnd = useCallback(
    (e: L.DragEndEvent) => {
      const marker = e.target;
      const position = marker.getLatLng();
      onDragEnd(attraction.id, position.lat, position.lng);
    },
    [attraction.id, onDragEnd]
  );

  return (
    <Marker
      position={[attraction.lat, attraction.lng]}
      icon={isSelected ? selectedIcon : defaultIcon}
      draggable
      eventHandlers={{
        click: () => onSelect(attraction.id),
        dragend: handleDragEnd,
      }}
    >
      <Popup>
        <div style={{ minWidth: '200px', padding: '8px 0' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <MapPin size={18} style={{ color: '#1a73e8' }} />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>编辑景点</span>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSave}
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none',
              }}
              placeholder="输入景点名称"
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              备注
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSave}
              rows={2}
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical',
              }}
              placeholder="添加备注..."
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
              停留时间（分钟）
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              onBlur={handleSave}
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none',
              }}
              placeholder="60"
            />
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export function MapView() {
  const {
    trip,
    selectedAttractionId,
    selectedDayId,
    setSelectedAttraction,
    setSelectedDay,
    addAttraction,
    updateAttraction,
  } = useTripStore();

  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newPoint, setNewPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const addPopupRef = useRef<LeafletPopup | null>(null);

  const allAttractions = useMemo(() => {
    if (!trip) return [];
    return trip.days.flatMap((day) =>
      day.attractions.map((attr) => ({ ...attr, dayId: day.id }))
    );
  }, [trip]);

  const currentDayAttractions = useMemo(() => {
    if (!trip || !selectedDayId) return [];
    const day = trip.days.find((d) => d.id === selectedDayId);
    return day?.attractions || [];
  }, [trip, selectedDayId]);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (!selectedDayId) {
        return;
      }
      setNewPoint({ lat, lng });
      setShowAddPopup(true);
      setNewName('');
      setNewNotes('');
      setNewDuration('');
    },
    [selectedDayId]
  );

  const handleAddAttraction = useCallback(() => {
    if (!selectedDayId || !newPoint) return;

    const attractionData: AttractionCreateData = {
      name: newName || '未命名景点',
      lat: newPoint.lat,
      lng: newPoint.lng,
      notes: newNotes || undefined,
      duration: newDuration ? parseInt(newDuration, 10) : undefined,
    };

    addAttraction(selectedDayId, attractionData);
    setShowAddPopup(false);
    setNewPoint(null);
  }, [selectedDayId, newPoint, newName, newNotes, newDuration, addAttraction]);

  const handleCancelAdd = useCallback(() => {
    setShowAddPopup(false);
    setNewPoint(null);
  }, []);

  const handleSelectAttraction = useCallback(
    (id: string) => {
      setSelectedAttraction(id);
      const attraction = allAttractions.find((a) => a.id === id);
      if (attraction) {
        setSelectedDay(attraction.dayId);
      }
    },
    [allAttractions, setSelectedAttraction, setSelectedDay]
  );

  const handleDragEnd = useCallback(
    (id: string, lat: number, lng: number) => {
      const attraction = allAttractions.find((a) => a.id === id);
      if (attraction) {
        updateAttraction(attraction.dayId, id, { lat, lng });
      }
    },
    [allAttractions, updateAttraction]
  );

  useEffect(() => {
    if (showAddPopup && addPopupRef.current) {
      setTimeout(() => {
        addPopupRef.current?.openOn(addPopupRef.current.getMap());
      }, 50);
    }
  }, [showAddPopup, newPoint]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={[35, 105]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEventsHandler onMapClick={handleMapClick} />
        <RouteLayer attractions={currentDayAttractions} />
        {allAttractions.map((attraction) => (
          <AttractionMarker
            key={attraction.id}
            attraction={attraction}
            isSelected={selectedAttractionId === attraction.id}
            onSelect={handleSelectAttraction}
            onDragEnd={handleDragEnd}
            dayId={attraction.dayId}
          />
        ))}
        {newPoint && showAddPopup && (
          <Marker
            position={[newPoint.lat, newPoint.lng]}
            icon={defaultIcon}
            eventHandlers={{
              popupclose: () => {
                setShowAddPopup(false);
                setNewPoint(null);
              },
            }}
          >
            <Popup
              ref={(ref) => {
                if (ref) {
                  addPopupRef.current = ref;
                }
              }}
            >
              <div style={{ minWidth: '220px', padding: '8px 0' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  <Plus size={18} style={{ color: '#34a853' }} />
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>添加景点</span>
                  <button
                    onClick={handleCancelAdd}
                    style={{
                      marginLeft: 'auto',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      padding: '4px',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '4px',
                    }}
                  >
                    名称 *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="输入景点名称"
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '4px',
                    }}
                  >
                    备注
                  </label>
                  <textarea
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                    placeholder="添加备注..."
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '4px',
                    }}
                  >
                    停留时间（分钟）
                  </label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="60"
                  />
                </div>
                <button
                  onClick={handleAddAttraction}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    backgroundColor: '#1a73e8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  添加
                </button>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default MapView;
