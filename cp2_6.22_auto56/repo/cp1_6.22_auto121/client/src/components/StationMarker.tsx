import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import type { Station, DriftRecord } from '../types';

interface Props {
  station: Station;
  recentRecords: DriftRecord[];
  shouldBounce?: boolean;
}

function interpolateColor(factor: number): string {
  const green = { r: 76, g: 175, b: 80 };
  const red = { r: 255, g: 82, b: 82 };
  const f = Math.max(0, Math.min(1, factor));
  const r = Math.round(green.r + (red.r - green.r) * f);
  const g = Math.round(green.g + (red.g - green.g) * f);
  const b = Math.round(green.b + (red.b - green.b) * f);
  return `rgb(${r}, ${g}, ${b})`;
}

const StationMarker: React.FC<Props> = ({ station, recentRecords, shouldBounce }) => {
  const maxBooks = 30;
  const factor = 1 - Math.min(station.bookCount / maxBooks, 1);
  const color = interpolateColor(factor);

  const icon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        position: relative;
        width: 28px;
        height: 28px;
        background: ${color};
        border-radius: 50%;
        border: 3px solid #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translate(-50%, -50%);
        animation: ${shouldBounce ? 'bounceDrop 0.5s ease-out' : 'none'};
      ">
        <span style="
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
        ">${station.bookCount}</span>
        <div style="
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid ${color};
        "></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}天前`;
    return d.toLocaleDateString('zh-CN');
  };

  return (
    <Marker position={[station.latitude, station.longitude]} icon={icon}>
      <Popup closeButton={true} autoPan={true} maxWidth={320}>
        <div
          className="marker-popup-card"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            width: '280px',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#1565C0',
                marginBottom: '4px',
              }}
            >
              📍 {station.name}
            </h3>
            <p style={{ fontSize: '12px', color: '#666', lineHeight: 1.5 }}>{station.address}</p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              backgroundColor: 'rgba(21,101,192,0.08)',
              borderRadius: '8px',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#555' }}>在架图书</span>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color,
              }}
            >
              {station.bookCount} 本
            </span>
          </div>

          {recentRecords.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#888',
                  marginBottom: '6px',
                }}
              >
                最近漂流记录
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {recentRecords.slice(0, 2).map((r) => (
                  <div
                    key={r.id}
                    style={{
                      fontSize: '11px',
                      color: '#666',
                      padding: '4px 6px',
                      background: 'rgba(0,0,0,0.03)',
                      borderRadius: '4px',
                      lineHeight: 1.4,
                    }}
                  >
                    <span style={{ color: '#888' }}>{formatTime(r.timestamp)}</span> ·{' '}
                    <span>{r.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link
            to={`/stations/${station.id}`}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(21,101,192,0.3)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(21,101,192,0.2)';
            }}
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '8px 12px',
              backgroundColor: '#1565C0',
              color: '#fff',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(21,101,192,0.2)',
            }}
          >
            查看站点详情 →
          </Link>
        </div>
      </Popup>
    </Marker>
  );
};

export default StationMarker;
