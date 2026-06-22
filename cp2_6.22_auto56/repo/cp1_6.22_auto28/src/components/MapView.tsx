import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Task } from '@/lib/api';
import { getTypeColor, formatRelativeTime } from '@/lib/helpers';

interface MapViewProps {
  tasks: Task[];
  pickedLocation: { lat: number; lng: number } | null;
  isPickingLocation: boolean;
  onLocationPick: (lat: number, lng: number) => void;
}

function createCircleIcon(color: string, completed: boolean): L.DivIcon {
  const size = completed ? 28 : 24;
  const opacity = completed ? 0.5 : 1;
  const checkMark = completed
    ? `<svg viewBox="0 0 20 20" style="width:14px;height:14px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)" fill="white"><path d="M5 10l3 3 7-7" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    : '';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};opacity:${opacity};
      border:2px solid rgba(255,255,255,0.8);
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      position:relative;
    ">${checkMark}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function createPickIcon(): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:var(--accent);border:3px solid white;
      box-shadow:0 0 0 4px rgba(230,126,34,0.3), 0 2px 8px rgba(0,0,0,0.3);
      animation: pulse 1.5s infinite;
    "></div>
    <style>@keyframes pulse{0%{box-shadow:0 0 0 4px rgba(230,126,34,0.3),0 2px 8px rgba(0,0,0,0.3)}50%{box-shadow:0 0 0 12px rgba(230,126,34,0.1),0 2px 8px rgba(0,0,0,0.3)}100%{box-shadow:0 0 0 4px rgba(230,126,34,0.3),0 2px 8px rgba(0,0,0,0.3)}}</style>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function FitBounds({ tasks }: { tasks: Task[] }) {
  const map = useMap();

  useEffect(() => {
    if (tasks.length === 0) return;
    const bounds = L.latLngBounds(tasks.map((t) => [t.lat, t.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [tasks.length, map]);

  return null;
}

function MapClickHandler({
  isPickingLocation,
  onLocationPick,
}: {
  isPickingLocation: boolean;
  onLocationPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (isPickingLocation) {
        onLocationPick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function DragMarker({
  pickedLocation,
  onLocationPick,
}: {
  pickedLocation: { lat: number; lng: number } | null;
  onLocationPick: (lat: number, lng: number) => void;
}) {
  if (!pickedLocation) return null;

  return (
    <Marker
      position={[pickedLocation.lat, pickedLocation.lng]}
      icon={createPickIcon()}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const marker = e.target as L.Marker;
          const pos = marker.getLatLng();
          onLocationPick(pos.lat, pos.lng);
        },
      }}
    >
      <Popup>
        <div style={{ fontSize: '13px', color: '#333' }}>
          📍 选取位置
          <br />
          <span style={{ fontSize: '11px', color: '#888' }}>
            {pickedLocation.lat.toFixed(4)}, {pickedLocation.lng.toFixed(4)}
          </span>
        </div>
      </Popup>
    </Marker>
  );
}

const DEFAULT_CENTER: [number, number] = [39.9042, 116.4074];
const DEFAULT_ZOOM = 12;

export default function MapView({ tasks, pickedLocation, isPickingLocation, onLocationPick }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);

  const taskMarkers = useMemo(
    () =>
      tasks.map((task) => (
        <Marker
          key={task.id}
          position={[task.lat, task.lng]}
          icon={createCircleIcon(getTypeColor(task.type), task.completed)}
        >
          <Popup>
            <div style={{ minWidth: '160px', padding: '4px 0' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#2c3e50', marginBottom: '6px' }}>
                {task.description}
              </div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                创建时间: {formatRelativeTime(task.createdAt)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: getTypeColor(task.type),
                  }}
                />
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {task.completed ? '✅ 已完成' : '⏳ 进行中'}
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      )),
    [tasks]
  );

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 'var(--radius)',
        border: '1px solid rgba(255,255,255,0.3)',
      }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds tasks={tasks} />
      <MapClickHandler isPickingLocation={isPickingLocation} onLocationPick={onLocationPick} />
      <DragMarker pickedLocation={pickedLocation} onLocationPick={onLocationPick} />
      {taskMarkers}
    </MapContainer>
  );
}
