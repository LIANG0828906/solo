import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import type { Log } from '../types';

const MONTH_COLORS = [
  '#81D4FA', '#B3E5FC', '#A5D6A7', '#81C784',
  '#FFF176', '#FFD54F', '#FF7043', '#FF8A65',
  '#FFB74D', '#FFA726', '#90CAF9', '#64B5F6',
];

interface MapViewProps {
  logs: Log[];
  selectedLogId: string | null;
  onMapClick: (lat: number, lng: number) => void;
  onMarkerClick: (log: Log, position: { x: number; y: number; lat: number; lng: number }) => void;
  onFlyToLog?: (log: Log) => void;
  routeLogIds?: string[];
  isShareView?: boolean;
  animateRoute?: boolean;
}

function getMonthColor(dateStr: string): string {
  const month = new Date(dateStr).getMonth();
  return MONTH_COLORS[month] || MONTH_COLORS[0];
}

function createMarkerIcon(color: string, size: number = 32) {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="travel-marker" style="
        width: ${size}px; height: ${size}px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: 700; font-size: ${size * 0.4}px;
      ">
        📍
        <div class="marker-ripple" style="background: ${color};"></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createClusterIcon(count: number) {
  const size = count > 50 ? 60 : count > 20 ? 50 : 40;
  return L.divIcon({
    className: 'cluster-marker',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#FF7043;border:3px solid white;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:${size * 0.35}px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface Cluster {
  center: [number, number];
  logs: Log[];
}

function clusterLogs(logs: Log[], zoom: number): Cluster[] {
  if (logs.length <= 100 || zoom >= 10) {
    return logs.map(log => ({ center: [log.lat, log.lng], logs: [log] }));
  }
  const gridSize = zoom < 5 ? 10 : zoom < 7 ? 5 : zoom < 9 ? 2 : 1;
  const clusters = new Map<string, Cluster>();
  logs.forEach(log => {
    const key = `${Math.floor(log.lat / gridSize)},${Math.floor(log.lng / gridSize)}`;
    if (clusters.has(key)) {
      const c = clusters.get(key)!;
      c.center = [
        (c.center[0] * c.logs.length + log.lat) / (c.logs.length + 1),
        (c.center[1] * c.logs.length + log.lng) / (c.logs.length + 1),
      ];
      c.logs.push(log);
    } else {
      clusters.set(key, { center: [log.lat, log.lng], logs: [log] });
    }
  });
  return Array.from(clusters.values());
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapFlyTo({ logId, logs, zoom }: { logId: string | null; logs: Log[]; zoom: number }) {
  const map = useMap();
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (logId && logId !== prevId.current) {
      const log = logs.find(l => l.id === logId);
      if (log) {
        map.flyTo([log.lat, log.lng], Math.max(zoom, 12), { duration: 0.6 });
      }
      prevId.current = logId;
    }
  }, [logId, logs, map, zoom]);

  return null;
}

interface FlowingDotProps {
  positions: LatLngExpression[];
  isActive: boolean;
}

function FlowingDot({ positions, isActive }: FlowingDotProps) {
  const map = useMap();
  const dotRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<number | null>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    if (!isActive || positions.length < 2) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (dotRef.current) dotRef.current.style.display = 'none';
      return;
    }

    if (!dotRef.current) {
      dotRef.current = document.createElement('div');
      dotRef.current.className = 'flowing-dot';
      map.getContainer().appendChild(dotRef.current);
    }
    dotRef.current.style.display = 'block';

    const totalSegments = positions.length - 1;
    const speed = 0.0008;

    const animate = () => {
      progressRef.current += speed;
      if (progressRef.current > totalSegments) progressRef.current = 0;

      const segIdx = Math.floor(progressRef.current);
      const t = progressRef.current - segIdx;

      if (segIdx < totalSegments) {
        const start = positions[segIdx] as [number, number];
        const end = positions[segIdx + 1] as [number, number];
        const lat = start[0] + (end[0] - start[0]) * t;
        const lng = start[1] + (end[1] - start[1]) * t;
        const point = map.latLngToContainerPoint([lat, lng]);

        if (dotRef.current) {
          dotRef.current.style.left = `${point.x - 6}px`;
          dotRef.current.style.top = `${point.y - 6}px`;
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    progressRef.current = 0;
    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (dotRef.current) dotRef.current.style.display = 'none';
    };
  }, [positions, isActive, map]);

  return null;
}

export default function MapView({
  logs,
  selectedLogId,
  onMapClick,
  onMarkerClick,
  onFlyToLog,
  routeLogIds = [],
  isShareView = false,
  animateRoute = false,
}: MapViewProps) {
  const [zoom, setZoom] = useState(5);
  const [newMarkerId, setNewMarkerId] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const prevLogsLen = useRef(logs.length);

  useEffect(() => {
    if (logs.length > prevLogsLen.current) {
      const newLog = logs[0];
      if (newLog) {
        setNewMarkerId(newLog.id);
        const timer = setTimeout(() => setNewMarkerId(null), 1000);
        return () => clearTimeout(timer);
      }
    }
    prevLogsLen.current = logs.length;
  }, [logs.length, logs]);

  const clusters = useMemo(() => clusterLogs(logs, zoom), [logs, zoom]);

  const routePositions = useMemo(() => {
    const routeLogs = routeLogIds
      .map(id => logs.find(l => l.id === id))
      .filter(Boolean) as Log[];
    routeLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return routeLogs.map(l => [l.lat, l.lng] as LatLngExpression);
  }, [routeLogIds, logs]);

  const polylineColors = useMemo(() => {
    const colors: string[] = [];
    for (let i = 0; i < routePositions.length - 1; i++) {
      const hue = 210 - (i / Math.max(routePositions.length - 2, 1)) * 190;
      colors.push(`hsl(${hue}, 80%, 55%)`);
    }
    return colors;
  }, [routePositions.length]);

  const handleMarkerClick = (log: Log, e: L.LeafletMouseEvent) => {
    const container = mapContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const point = e.target._map.latLngToContainerPoint(e.latlng);
    onMarkerClick(log, {
      x: point.x,
      y: point.y,
      lat: log.lat,
      lng: log.lng,
    });
    if (onFlyToLog) onFlyToLog(log);
  };

  const handleZoom = (e: L.LeafletEvent) => {
    setZoom(e.target.getZoom());
  };

  return (
    <div className="map-container" ref={mapContainerRef}>
      <MapContainer
        center={[35.8617, 104.1954]}
        zoom={5}
        style={{ width: '100%', height: '100%' }}
        onZoomend={handleZoom}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {!isShareView && <MapClickHandler onClick={onMapClick} />}

        <MapFlyTo logId={selectedLogId} logs={logs} zoom={zoom} />

        {clusters.map((cluster, idx) => {
          if (cluster.logs.length > 1) {
            return (
              <Marker
                key={`cluster-${idx}`}
                position={cluster.center}
                icon={createClusterIcon(cluster.logs.length)}
              />
            );
          }
          const log = cluster.logs[0];
          const color = getMonthColor(log.date);
          return (
            <Marker
              key={log.id}
              position={[log.lat, log.lng]}
              icon={createMarkerIcon(color)}
              eventHandlers={{ click: (e) => handleMarkerClick(log, e) }}
            >
              <Popup>{log.name}</Popup>
            </Marker>
          );
        })}

        {routePositions.length >= 2 && (
          <>
            {routePositions.slice(0, -1).map((pos, i) => (
              <Polyline
                key={i}
                positions={[pos, routePositions[i + 1]]}
                color={polylineColors[i]}
                weight={5}
                opacity={0.85}
                className={animateRoute ? 'route-line-animate' : ''}
              />
            ))}
            {routeLogIds.map((id, idx) => {
              const log = logs.find(l => l.id === id);
              if (!log) return null;
              return (
                <Marker
                  key={`wp-${id}`}
                  position={[log.lat, log.lng]}
                  icon={L.divIcon({
                    className: 'waypoint-icon',
                    html: `<div class="route-waypoint">${idx + 1}</div>`,
                    iconSize: [36, 36],
                    iconAnchor: [18, 18],
                  })}
                />
              );
            })}
            {!isShareView && (
              <FlowingDot positions={routePositions} isActive={routePositions.length >= 2} />
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
}
