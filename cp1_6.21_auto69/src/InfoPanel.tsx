import { useEffect, useState, useRef } from 'react';
import type { Earthquake } from './quakeData';
import { magnitudeToColor, formatUTC } from './quakeData';

export default function InfoPanel({
  quake,
  onClose,
}: {
  quake: Earthquake;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const color = magnitudeToColor(quake.magnitude);
  const depthCategory =
    quake.depth <= 70 ? '浅源' : quake.depth <= 300 ? '中源' : '深源';

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: visible ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -30%) scale(0.8)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: 1000,
        width: '300px',
        background: 'rgba(26, 26, 46, 0.9)',
        backdropFilter: 'blur(8px)',
        borderRadius: '12px',
        border: '1px solid #e94560',
        padding: '20px',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: '#e0e0e0',
        pointerEvents: 'auto',
      }}
    >
      <button
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: '10px',
          right: '12px',
          background: 'none',
          border: 'none',
          color: '#ffffff',
          fontSize: '18px',
          cursor: 'pointer',
          lineHeight: 1,
          transition: 'color 0.15s',
          padding: '4px',
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.color = '#e94560';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.color = '#ffffff';
        }}
      >
        ✕
      </button>

      <div style={{ marginBottom: '14px' }}>
        <span
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color,
          }}
        >
          {quake.magnitude.toFixed(1)}
        </span>
        <span style={{ fontSize: '14px', marginLeft: '8px', color: '#888' }}>
          {depthCategory}地震
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
        <InfoRow label="纬度" value={`${quake.latitude.toFixed(2)}°`} />
        <InfoRow label="经度" value={`${quake.longitude.toFixed(2)}°`} />
        <InfoRow label="深度" value={`${quake.depth.toFixed(1)} km`} />
        <InfoRow label="时间" value={formatUTC(quake.timestamp)} />
      </div>

      <div
        style={{
          marginTop: '14px',
          height: '3px',
          borderRadius: '2px',
          background: `linear-gradient(to right, ${color}, transparent)`,
        }}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#888', fontSize: '13px' }}>{label}</span>
      <span style={{ color: '#e0e0e0', fontSize: '13px', fontWeight: 500 }}>{value}</span>
    </div>
  );
}
