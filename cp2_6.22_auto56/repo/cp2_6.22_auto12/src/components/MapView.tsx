import { useEffect, useState, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Trash2, Plus, Edit3, Save, X, Navigation } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useTripStore } from '../store/useTripStore';
import { useUiStore } from '../store/useUiStore';
import { createCustomIcon, calculateRoutePath, getCenterFromLocations, formatDistance, calculateDistance } from '../utils/mapUtils';
import { getDayLabel, getDayCount } from '../utils/dateUtils';
import type { Location, CreateLocationData } from '../types';

const ClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapController = ({ center, locations }: { center: [number, number]; locations: Location[] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(l => [l.lat, l.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView(center, 12);
    }
  }, [center, locations, map]);
  
  return null;
};

export const MapView = () => {
  const { tripId = '' } = useParams<{ tripId: string }>();
  const { currentTrip, addLocation, deleteLocation, fetchTripById } = useTripStore();
  const { selectedLocationId, setSelectedLocationId, selectedDayIndex, setSelectedDayIndex } = useUiStore();
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocation, setNewLocation] = useState<CreateLocationData | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editName, setEditName] = useState('');
  
  useEffect(() => {
    if (!currentTrip) {
      fetchTripById(tripId);
    }
  }, [tripId, currentTrip, fetchTripById]);
  
  if (!currentTrip) return null;
  
  const dayCount = getDayCount(currentTrip.startDate, currentTrip.endDate);
  const sortedLocations = [...currentTrip.locations].sort((a, b) => {
    if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
    return 0;
  });
  
  const routePath = calculateRoutePath(sortedLocations);
  const mapCenter = getCenterFromLocations(currentTrip.locations);
  
  const selectedLocation = currentTrip.locations.find(l => l.id === selectedLocationId);
  
  let totalDistance = 0;
  for (let i = 0; i < sortedLocations.length - 1; i++) {
    totalDistance += calculateDistance(
      sortedLocations[i].lat, sortedLocations[i].lng,
      sortedLocations[i + 1].lat, sortedLocations[i + 1].lng
    );
  }
  
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setNewLocation({
      name: '',
      lat,
      lng,
      dayIndex: selectedDayIndex,
    });
    setShowAddForm(true);
    setSelectedLocationId(null);
  }, [selectedDayIndex, setSelectedLocationId]);
  
  const handleAddLocation = async () => {
    if (!newLocation || !newLocation.name.trim()) {
      alert('请输入地点名称');
      return;
    }
    
    await addLocation(tripId, newLocation);
    setShowAddForm(false);
    setNewLocation(null);
  };
  
  const handleDeleteLocation = async (locationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个地点标记吗？')) {
      await deleteLocation(tripId, locationId);
      setSelectedLocationId(null);
    }
  };
  
  const handleStartEdit = (location: Location) => {
    setEditingLocation(location);
    setEditName(location.name);
  };
  
  const handleSaveEdit = () => {
    if (!editingLocation || !editName.trim()) return;
    setEditingLocation(null);
  };
  
  const dayLocations = currentTrip.locations.filter(l => l.dayIndex === selectedDayIndex);
  const otherLocations = currentTrip.locations.filter(l => l.dayIndex !== selectedDayIndex);
  
  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)] min-h-[600px] animate-fade-in">
      <div className="flex-1 lg:w-1/2 relative" ref={mapRef}>
        <MapContainer
          center={mapCenter}
          zoom={12}
          className="w-full h-full rounded-2xl shadow-card"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController center={mapCenter} locations={currentTrip.locations} />
          <ClickHandler onMapClick={handleMapClick} />
          
          {currentTrip.locations.length > 1 && (
            <Polyline
              positions={routePath}
              pathOptions={{
                color: '#14b8a6',
                weight: 4,
                opacity: 0.8,
                dashArray: '1000',
                className: 'animate-draw-line',
              }}
            />
          )}
          
          {currentTrip.locations.map((location, index) => {
            const sortedIndex = sortedLocations.findIndex(l => l.id === location.id);
            return (
              <Marker
                key={location.id}
                position={[location.lat, location.lng]}
                icon={createCustomIcon(sortedIndex, location.dayIndex)}
                eventHandlers={{
                  click: () => {
                    setSelectedLocationId(location.id);
                    setSelectedDayIndex(location.dayIndex);
                  },
                  dblclick: (e) => {
                    handleDeleteLocation(location.id, e as unknown as React.MouseEvent);
                  },
                }}
              >
                <Popup>
                  <div className="p-1">
                    <h4 className="font-bold text-warm-800 mb-1">{location.name}</h4>
                    <p className="text-sm text-primary-600 mb-2">{getDayLabel(currentTrip.startDate, location.dayIndex)}</p>
                    <p className="text-xs text-warm-400">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
                    <p className="text-xs text-warm-500 mt-2">双击标记可删除</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
        
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4 text-primary-500" />
            <span className="text-warm-600">
              {currentTrip.locations.length} 个地点 · 总距离约 <span className="font-semibold text-primary-600">{formatDistance(totalDistance)}</span>
            </span>
          </div>
        </div>
        
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg text-xs text-warm-500">
          💡 点击地图添加标记 · 双击删除标记
        </div>
      </div>
      
      <div className="flex-1 lg:w-1/2 bg-white rounded-2xl shadow-card p-6 overflow-y-auto custom-scrollbar">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-warm-800 mb-3">选择日期</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {Array.from({ length: dayCount }).map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedDayIndex(index)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedDayIndex === index
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-glow'
                    : 'bg-warm-100 text-warm-600 hover:bg-primary-50 hover:text-primary-600'
                }`}
              >
                D{index + 1}
              </button>
            ))}
          </div>
        </div>
        
        {selectedLocation ? (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-warm-800">地点详情</h3>
              <div className="flex gap-2">
                {editingLocation?.id === selectedLocation.id ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="btn-icon text-primary-500"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingLocation(null)}
                      className="btn-icon text-warm-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleStartEdit(selectedLocation)}
                      className="btn-icon text-warm-400 hover:text-primary-500"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteLocation(selectedLocation.id, e)}
                      className="btn-icon text-warm-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-4">
                <div className="text-xs text-warm-500 mb-1">地点名称</div>
                {editingLocation?.id === selectedLocation.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-transparent text-xl font-bold text-warm-800 outline-none border-b-2 border-primary-400"
                    autoFocus
                  />
                ) : (
                  <div className="text-xl font-bold text-warm-800">{selectedLocation.name}</div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-warm-50 rounded-xl p-3">
                  <div className="text-xs text-warm-500 mb-1">日期</div>
                  <div className="font-medium text-warm-700">
                    {getDayLabel(currentTrip.startDate, selectedLocation.dayIndex)}
                  </div>
                </div>
                <div className="bg-warm-50 rounded-xl p-3">
                  <div className="text-xs text-warm-500 mb-1">坐标</div>
                  <div className="font-medium text-warm-700 text-sm">
                    {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                  </div>
                </div>
              </div>
              
              {selectedLocation.activityId && (
                <div className="bg-accent-50 rounded-xl p-3">
                  <div className="text-xs text-accent-600 mb-1">关联活动</div>
                  <div className="font-medium text-accent-700">
                    {currentTrip.activities.find(a => a.id === selectedLocation.activityId)?.description || '已关联活动'}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : showAddForm && newLocation ? (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-warm-800">添加地点</h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewLocation(null);
                }}
                className="btn-icon"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="input-label">地点名称</label>
                <input
                  type="text"
                  placeholder="例如：东京塔"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  className="input-field"
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-warm-50 rounded-xl p-3">
                  <div className="text-xs text-warm-500 mb-1">日期</div>
                  <div className="font-medium text-warm-700">
                    {getDayLabel(currentTrip.startDate, newLocation.dayIndex)}
                  </div>
                </div>
                <div className="bg-warm-50 rounded-xl p-3">
                  <div className="text-xs text-warm-500 mb-1">坐标</div>
                  <div className="font-medium text-warm-700 text-sm">
                    {newLocation.lat.toFixed(4)}, {newLocation.lng.toFixed(4)}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleAddLocation}
                className="btn-primary w-full inline-flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加地点标记
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-primary-500" />
            </div>
            <h4 className="text-lg font-semibold text-warm-700 mb-2">选择或添加地点</h4>
            <p className="text-warm-500">
              点击左侧地图添加新地点<br />
              或从下方列表中选择已有地点
            </p>
          </div>
        )}
        
        {dayLocations.length > 0 && (
          <div className="mt-6 pt-6 border-t border-warm-100">
            <h4 className="text-sm font-semibold text-warm-600 mb-3">当日地点 ({dayLocations.length})</h4>
            <div className="space-y-2">
              {dayLocations.map((loc, idx) => (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocationId(loc.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    selectedLocationId === loc.id
                      ? 'bg-primary-50 border-2 border-primary-400'
                      : 'bg-warm-50 hover:bg-primary-50 border-2 border-transparent'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 text-white flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-medium text-warm-800 truncate">{loc.name}</div>
                    <div className="text-xs text-warm-400">{loc.lat.toFixed(3)}, {loc.lng.toFixed(3)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {otherLocations.length > 0 && (
          <div className="mt-6 pt-6 border-t border-warm-100">
            <h4 className="text-sm font-semibold text-warm-600 mb-3">其他日期地点 ({otherLocations.length})</h4>
            <div className="space-y-2">
              {otherLocations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => {
                    setSelectedLocationId(loc.id);
                    setSelectedDayIndex(loc.dayIndex);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all opacity-70 hover:opacity-100 ${
                    selectedLocationId === loc.id
                      ? 'bg-primary-50 border-2 border-primary-400'
                      : 'bg-warm-50 hover:bg-primary-50 border-2 border-transparent'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-warm-300 text-white flex items-center justify-center text-xs font-bold">
                    D{loc.dayIndex + 1}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-medium text-warm-800 truncate">{loc.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
