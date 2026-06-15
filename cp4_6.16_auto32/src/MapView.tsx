import { useMemo, useEffect, Fragment } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import L from 'leaflet';
import type { Photo } from './types';

function lerpColor(t: number): string {
  const tClamped = Math.max(0, Math.min(1, t));
  const startR = 108, startG = 92, startB = 231;
  const endR = 255, endG = 107, endB = 129;
  const r = Math.round(startR + (endR - startR) * tClamped);
  const g = Math.round(startG + (endG - startG) * tClamped);
  const b = Math.round(startB + (endB - startB) * tClamped);
  return `rgb(${r}, ${g}, ${b})`;
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

interface MarkerData {
  index: number;
  total: number;
}

const memoizedDivIcon = (color: string, index: number) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-dot marker-animate" style="
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: ${color};
      border: 3px solid #1e1e2e;
      box-shadow: 0 0 0 2px ${color};
      animation-delay: ${index * 0.02}s;
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

export default function MapView({ photos }: { photos: Photo[] }) {
  const sortedPhotos = useMemo(() => {
    return [...photos].sort(
      (a, b) => new Date(a.captureTime).getTime() - new Date(b.captureTime).getTime()
    );
  }, [photos]);

  const validPhotos = useMemo(() => {
    return sortedPhotos.filter((p) => p.latitude != null && p.longitude != null);
  }, [sortedPhotos]);

  const positions = useMemo(() => {
    return validPhotos.map((p) => [p.latitude!, p.longitude!] as [number, number]);
  }, [validPhotos]);

  const polylineColors = useMemo(() => {
    if (positions.length < 2) return [];
    const result: string[] = [];
    for (let i = 0; i < positions.length - 1; i++) {
      const t = validPhotos.length > 1 ? (i + 1) / (validPhotos.length - 1) : 0;
      result.push(lerpColor(t));
    }
    return result;
  }, [positions, validPhotos]);

  const total = validPhotos.length;
  const noGpsCount = photos.length - validPhotos.length;

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

  if (validPhotos.length === 0) {
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
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📍</div>
        <p>照片缺少GPS坐标</p>
        <p style={{ fontSize: '13px', marginTop: '4px', color: '#606080' }}>
          {photos.length} 张照片均未包含GPS位置信息
        </p>
        <p style={{ fontSize: '12px', marginTop: '8px', color: '#505070' }}>
          时间线仍可正常显示，地图需GPS坐标才能绘制轨迹
        </p>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)' }}>
      <MapContainer
        center={[35.8617, 104.1954]}
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

        {positions.length >= 2 && (
          <>
            {positions.slice(0, positions.length - 1).map((pos, i) => {
              const nextPos = positions[i + 1];
              const t = i / (positions.length - 1);
              const nextT = (i + 1) / (positions.length - 1);
              const midLat = (pos[0] + nextPos[0]) / 2;
              const midLng = (pos[1] + nextPos[1]) / 2;
              return (
                <Fragment key={`line-${i}`}>
                  <Polyline
                    positions={[pos, [midLat, midLng]]}
                    pathOptions={{
                      color: lerpColor(t),
                      weight: 4,
                      opacity: 0.9,
                      lineCap: 'round',
                      lineJoin: 'round'
                    }}
                  />
                  <Polyline
                    positions={[[midLat, midLng], nextPos]}
                    pathOptions={{
                      color: lerpColor((t + nextT) / 2),
                      weight: 4,
                      opacity: 0.9,
                      lineCap: 'round',
                      lineJoin: 'round'
                    }}
                  />
                </Fragment>
              );
            })}
          </>
        )}

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
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#e0e0ff', marginBottom: '4px' }}>
                    📍 {photo.cityName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#a0a0c0' }}>
                    {format(new Date(photo.captureTime), 'yyyy年M月d日 HH:mm', { locale: zhCN })}
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '6px', color: '#8080a0' }}>
                    第 {index + 1} / {total} 站
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
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '120px', fontSize: '11px', color: '#8080a0' }}>
          <span>行程开始</span>
          <span>行程结束</span>
        </div>
        {noGpsCount > 0 && (
          <span style={{ color: '#fdcb6e', fontSize: '11px' }}>
            ⚠️ {noGpsCount} 张照片无GPS，未在地图显示
          </span>
        )}
      </div>
    </div>
  );
}
