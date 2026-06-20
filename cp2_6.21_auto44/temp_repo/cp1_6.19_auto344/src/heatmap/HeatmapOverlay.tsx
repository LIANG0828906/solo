import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { HeatPoint, FLOOR_SIZE, FLOOR_HALF } from '@/types';

interface HeatmapOverlayProps {
  heatPoints: HeatPoint[];
}

function HeatmapCanvas({ heatPoints }: { heatPoints: HeatPoint[] }) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      containerRef.current = L.DomUtil.create('div', 'heatmap-overlay');
      containerRef.current.style.position = 'absolute';
      containerRef.current.style.top = '0';
      containerRef.current.style.left = '0';
      containerRef.current.style.width = '100%';
      containerRef.current.style.height = '100%';
      containerRef.current.style.pointerEvents = 'none';
      containerRef.current.style.zIndex = '450';

      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvasRef.current = canvas;
      containerRef.current.appendChild(canvas);

      map.getPanes().overlayPane.appendChild(containerRef.current);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bounds = map.getBounds();
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();

    const mapWidth = northEast.lng - southWest.lng;
    const mapHeight = northEast.lat - southWest.lat;

    heatPoints.forEach((point) => {
      const normalizedX = (point.x + FLOOR_HALF) / FLOOR_SIZE;
      const normalizedZ = (point.z + FLOOR_HALF) / FLOOR_SIZE;

      const lat = southWest.lat + normalizedZ * mapHeight;
      const lng = southWest.lng + normalizedX * mapWidth;

      const pointXY = map.latLngToContainerPoint([lat, lng]);

      const radius = 8 + point.intensity * 12;
      const gradient = ctx.createRadialGradient(
        pointXY.x,
        pointXY.y,
        0,
        pointXY.x,
        pointXY.y,
        radius
      );

      const intensity = Math.max(0.2, point.intensity);
      const color = getHeatColor(point.intensity);

      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.globalAlpha = 0.6 * intensity;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pointXY.x, pointXY.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
  }, [heatPoints, map]);

  return null;
}

function getHeatColor(intensity: number): string {
  const r = Math.round(0 + intensity * 255);
  const g = Math.round(188 - intensity * 134);
  const b = Math.round(212 - intensity * 212);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function HeatmapOverlay({ heatPoints }: HeatmapOverlayProps) {
  const center: [number, number] = [0, 0];

  return (
    <div className="heatmap-container">
      <MapContainer
        center={center}
        zoom={1}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        boxZoom={false}
        keyboard={false}
        style={{
          width: '200px',
          height: '200px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #444',
        }}
        crs={L.CRS.Simple}
      >
        <TileLayer
          url=""
          attribution=""
          minZoom={0}
          maxZoom={1}
        />
        <HeatmapCanvas heatPoints={heatPoints} />
      </MapContainer>
      <style>{`
        .heatmap-container .leaflet-container {
          background: #16213e !important;
        }
        .heatmap-container .leaflet-pane {
          z-index: 100;
        }
        .heatmap-container .leaflet-tile-container {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
