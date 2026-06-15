import { useMemo, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import L from 'leaflet';
import type { Photo, Weather } from './types';

const weatherIcons: Record<Weather, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️'
};

function lerpColor(t: number): string {
  const tClamped = Math.max(0, Math.min(1, t));
  const startR = 108, startG = 92, startB = 231;
  const endR = 255, endG = 107, endB = 129;
  const r = Math.round(startR + (endR - startR) * tClamped);
  const g = Math.round(startG + (endG - startG) * tClamped);
  const b = Math.round(startB + (endB - startB) * tClamped);
  return `rgb(${r}, ${g}, ${b})`;
}

interface GradientPolylineProps {
  positions: [number, number][];
  startT: number;
  endT: number;
  segments?: number;
}

function GradientPolyline({ positions, startT, endT, segments = 12 }: GradientPolylineProps) {
  const segmentsArray = useMemo(() => {
    if (positions.length < 2) return [];
    const start = positions[0];
    const end = positions[1];
    const result: { color: string; positions: [number, number][] }[] = [];
    for (let i = 0; i < segments; i++) {
      const segStart = i / segments;
      const segEnd = (i + 1) / segments;
      const latStart = start[0] + (end[0] - start[0]) * segStart;
      const lngStart = start[1] + (end[1] - start[1]) * segStart;
      const latEnd = start[0] + (end[0] - start[0]) * segEnd;
      const lngEnd = start[1] + (end[1] - start[1]) * segEnd;
      const segStartT = startT + (endT - startT) * segStart;
      const segEndT = startT + (endT - startT) * segEnd;
      const midT = (segStartT + segEndT) / 2;
      result.push({
        color: lerpColor(midT),
        positions: [
          [latStart, lngStart] as [number, number],
          [latEnd, lngEnd] as [number, number]
        ]
      });
    }
    return result;
  }, [positions, startT, endT, segments]);

  return (
    <>
      {segmentsArray.map((seg, i) => (
        <Polyline
          key={`seg-${i}`}
          positions={seg.positions}
          pathOptions={{
            color: seg.color,
            weight: 5,
            opacity: 0.92,
            lineCap: 'butt',
            lineJoin: 'round'
          }}
        />
      ))}
    </>
  );
}

function AutoFitBounds({ photos }: { photos: Photo[] }) {
  const map = useMap();

  useEffect(() => {
    const validPhotos = photos.filter(
      (p) => p.latitude != null && p.longitude != null
    );
    if (validPhotos.length === 0) {
      map.setView([35.8617, 104.1954], 4);
      return;
    }
    if (validPhotos.length === 1) {
      map.setView(
        [validPhotos[0].latitude!, validPhotos[0].longitude!],
        12
      );
      return;
    }
    const bounds = L.latLngBounds(
      validPhotos.map((p) => [p.latitude!, p.longitude!])
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [photos, map]);

  return null;
}

const FALLBACK_CENTER: [number, number] = [35.8617, 104.1954];

export default function MapView({ photos }: { photos: Photo[] }) {
  const sortedPhotos = useMemo(() => {
    return [...photos].sort(
      (a, b) => new Date(a.captureTime).getTime() - new Date(b.captureTime).getTime()
    );
  }, [photos]);

  const validPhotos = useMemo(() => {
    return sortedPhotos.filter((p) => p.latitude != null && p.longitude != null);
  }, [sortedPhotos]);

  const noGpsPhotos = useMemo(() => {
    return sortedPhotos.filter((p) => p.latitude == null || p.longitude == null);
  }, [sortedPhotos]);

  const positions = useMemo(() => {
    return validPhotos.map((p) => [p.latitude!, p.longitude!] as [number, number]);
  }, [validPhotos]);

  const total = validPhotos.length;
  const noGpsCount = noGpsPhotos.length;
  const [, forceRender] = useState(0);

  if (photos.length === 0) {
    return (
      <div
        style={{
          height: '400px',
          backgroundColor: '#2d2d44',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#8080a0'
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗺️</div>
        <p>暂无带GPS信息的照片</p>
        <p style={{ fontSize: '13px', marginTop: '4px', color: '#606080' }}>
          上传包含GPS坐标的照片以显示旅行轨迹
        </p>
      </div>
    );
  }

  const fallbackCenter: [number, number] =
    validPhotos.length > 0
      ? [validPhotos[0].latitude!, validPhotos[0].longitude!]
      : FALLBACK_CENTER;

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)' }}>
      <MapContainer
        center={FALLBACK_CENTER}
        zoom={4}
        style={{ height: '400px', width: '100%', borderRadius: '12px' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AutoFitBounds photos={sortedPhotos} />

        {positions.length >= 2 &&
          positions.slice(0, -1).map((pos, i) => {
            const nextPos = positions[i + 1];
            const tStart = total > 1 ? i / (total - 1) : 0;
            const tEnd = total > 1 ? (i + 1) / (total - 1) : 0;
            return (
              <GradientPolyline
                key={`grad-${i}`}
                positions={[pos, nextPos]}
                startT={tStart}
                endT={tEnd}
                segments={12}
              />
            );
          })}

        {validPhotos.map((photo, index) => {
          const t = total > 1 ? index / (total - 1) : 0;
          const color = lerpColor(t);
          return (
            <CircleMarker
              key={photo.id}
              center={[photo.latitude!, photo.longitude!]}
              radius={8}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 1,
                weight: 3,
                opacity: 1,
                className: 'marker-animate'
              }}
            >
              <Popup style={{ transition: 'all 0.3s ease' }}>
                <div style={{ minWidth: '180px', textAlign: 'center' }}>
                  <img
                    src={photo.dataUrl}
                    alt={photo.fileName}
                    style={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginBottom: '8px'
                    }}
                  />
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#e0e0ff',
                      marginBottom: '4px'
                    }}
                  >
                    📍 {photo.cityName} {weatherIcons[photo.weather]}
                  </div>
                  <div style={{ fontSize: '12px', color: '#a0a0c0' }}>
                    {format(new Date(photo.captureTime), 'yyyy年M月d日 HH:mm', {
                      locale: zhCN
                    })}
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '6px', color: '#8080a0' }}>
                    第 {index + 1} / {total} 站
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {noGpsPhotos.map((photo, index) => {
          const offsetAngle = (index * 137.5) * (Math.PI / 180);
          const offsetRadius = 0.05 + index * 0.015;
          const lat = fallbackCenter[0] + Math.sin(offsetAngle) * offsetRadius;
          const lng = fallbackCenter[1] + Math.cos(offsetAngle) * offsetRadius;
          return (
            <CircleMarker
              key={`nogps-${photo.id}`}
              center={[lat, lng]}
              radius={7}
              pathOptions={{
                color: '#606080',
                fillColor: '#8080a0',
                fillOpacity: 0.6,
                weight: 2,
                opacity: 0.8,
                dashArray: '4, 4',
                className: 'marker-animate'
              }}
            >
              <Popup style={{ transition: 'all 0.3s ease' }}>
                <div style={{ minWidth: '180px', textAlign: 'center' }}>
                  <img
                    src={photo.dataUrl}
                    alt={photo.fileName}
                    style={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginBottom: '8px'
                    }}
                  />
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#e0e0ff',
                      marginBottom: '4px'
                    }}
                  >
                    📍 {photo.cityName} {weatherIcons[photo.weather]}
                  </div>
                  <div style={{ fontSize: '12px', color: '#a0a0c0' }}>
                    {format(new Date(photo.captureTime), 'yyyy年M月d日 HH:mm', {
                      locale: zhCN
                    })}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      marginTop: '8px',
                      color: '#fdcb6e',
                      padding: '4px 8px',
                      backgroundColor: 'rgba(253, 203, 110, 0.1)',
                      borderRadius: '4px'
                    }}
                  >
                    ⚠️ 此照片无GPS，显示为默认位置
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '12px',
          backgroundColor: '#2d2d44',
          borderTop: '1px solid #3d3d5c',
          fontSize: '12px'
        }}
      >
        <span style={{ color: '#8080a0' }}>轨迹渐变：</span>
        <div
          style={{
            width: '120px',
            height: '6px',
            borderRadius: '3px',
            background: 'linear-gradient(90deg, rgb(108, 92, 231) 0%, rgb(255, 107, 129) 100%)'
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '120px',
            fontSize: '11px',
            color: '#8080a0'
          }}
        >
          <span>行程开始</span>
          <span>行程结束</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginLeft: '4px'
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#8080a0',
              border: '2px solid #1e1e2e',
              opacity: 0.6
            }}
          />
          <span style={{ color: '#8080a0', fontSize: '11px' }}>无GPS照片</span>
        </div>
        {noGpsCount > 0 && (
          <span style={{ color: '#fdcb6e', fontSize: '11px' }}>
            ⚠️ {noGpsCount} 张照片无GPS，灰色标记为默认位置
          </span>
        )}
      </div>
    </div>
  );
}
