import { useEffect, useCallback, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, Marker } from 'react-leaflet';
import L from 'leaflet';
import { useMapStore } from '../store';
import { useRecordStore } from '../../record/store';
import { TrailPolyline } from './TrailPolyline';
import { POIMarker } from './POIMarker';
import { POI } from '@/shared/types';

interface TrailMapProps {
  height?: string | number;
}

function MapController() {
  const { mapCenter, mapZoom, trails, compareMode, compareTrailIds, activeTrailId, isAddingPOI, loadPOIs, addPOI, selectedPOI, setSelectedPOI, updatePOIPosition, pois } = useMapStore();
  const { points: recordPoints, isRecording, currentTrailId } = useRecordStore();
  const map = useMap();
  const [pendingPOIPos, setPendingPOIPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (mapCenter) {
      map.setView(mapCenter, mapZoom, { animate: true });
    }
  }, [mapCenter, mapZoom, map]);

  useMapEvents({
    click: (e) => {
      if (isAddingPOI) {
        setPendingPOIPos({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });

  useEffect(() => {
    if (activeTrailId) {
      loadPOIs(activeTrailId);
    } else {
      loadPOIs(null);
    }
  }, [activeTrailId, loadPOIs]);

  const handlePOIClick = useCallback((poi: POI) => {
    setSelectedPOI(poi);
  }, [setSelectedPOI]);

  const handlePOIDragEnd = useCallback((poiId: string, lat: number, lng: number) => {
    updatePOIPosition(poiId, lat, lng);
  }, [updatePOIPosition]);

  const activeTrail = activeTrailId ? trails.get(activeTrailId) : null;

  const trailList = compareMode && compareTrailIds
    ? compareTrailIds.map(id => ({ id, trail: trails.get(id) }))
    : Array.from(trails.entries()).map(([id, trail]) => ({ id, trail }));

  const getTrailColor = (index: number, isActive: boolean) => {
    if (compareMode) {
      return index === 0 ? '#1976D2' : '#FF9800';
    }
    return isActive ? '#1976D2' : '#90CAF9';
  };

  const positionIcon = L.divIcon({
    className: 'current-position-icon',
    html: '<div class="position-dot"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {trailList.map(({ id, trail }, index) => (
        trail && (
          <TrailPolyline
            key={id}
            points={trail.points}
            color={getTrailColor(index, id === activeTrailId)}
            isActive={id === activeTrailId}
            isCompare={compareMode}
            trailName={trail.name}
            distance={trail.distance}
          />
        )
      ))}

      {isRecording && recordPoints.length > 1 && (
        <TrailPolyline
          points={recordPoints}
          color="#1976D2"
          isActive={true}
          trailName="正在记录..."
        />
      )}

      {pois.map(poi => (
        <POIMarker
          key={poi.id}
          poi={poi}
          isSelected={selectedPOI?.id === poi.id}
          onClick={() => handlePOIClick(poi)}
          onDragEnd={(lat, lng) => handlePOIDragEnd(poi.id, lat, lng)}
          draggable={true}
        />
      ))}

      {isAddingPOI && pendingPOIPos && (
        <AddPOIModal
          position={pendingPOIPos}
          onClose={() => setPendingPOIPos(null)}
          onSave={(name, description) => {
            if (pendingPOIPos) {
              addPOI({
                name,
                description,
                lat: pendingPOIPos.lat,
                lng: pendingPOIPos.lng,
                trailId: activeTrailId,
              });
              setPendingPOIPos(null);
            }
          }}
        />
      )}

      {recordPoints.length > 0 && isRecording && (
        <Marker
          position={[recordPoints[recordPoints.length - 1].lat, recordPoints[recordPoints.length - 1].lng]}
          icon={positionIcon}
        />
      )}
    </>
  );
}

function AddPOIModal({
  position,
  onClose,
  onSave,
}: {
  position: { lat: number; lng: number };
  onClose: () => void;
  onSave: (name: string, description: string) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), description.trim());
    }
  };

  return (
    <div className="poi-add-modal">
      <div className="poi-add-content">
        <h3>添加兴趣点</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入兴趣点名称"
              maxLength={20}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>描述 (最多30字)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 30))}
              placeholder="请输入简短描述"
              rows={3}
              maxLength={30}
            />
            <span className="char-count">{description.length}/30</span>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TrailMap({ height = '100%' }: TrailMapProps) {
  const { mapCenter, mapZoom } = useMapStore();

  return (
    <div className="trail-map-container" style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <MapController />
      </MapContainer>
    </div>
  );
}
