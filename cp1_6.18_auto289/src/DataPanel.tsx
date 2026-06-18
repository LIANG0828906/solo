import { useEffect, useState } from 'react';
import { useEarthquakeStore } from './earthquakeStore';
import { formatDate } from './utils';

export default function DataPanel() {
  const { selectedId, earthquakes } = useEarthquakeStore();
  const [isVisible, setIsVisible] = useState(false);
  const [renderId, setRenderId] = useState<number | null>(null);

  const selected = earthquakes.find((eq) => eq.id === renderId) || null;

  useEffect(() => {
    if (selectedId !== null) {
      setRenderId(selectedId);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setRenderId(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedId]);

  if (!selected && !isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '320px',
        height: '100vh',
        padding: '24px',
        background: 'rgba(13, 17, 23, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderLeft: '1px solid rgba(255, 215, 0, 0.2)',
        transform: isVisible ? 'translateX(0)' : 'translateX(100px)',
        opacity: isVisible ? 1 : 0,
        transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#FFD700',
          borderBottom: '1px solid rgba(255, 215, 0, 0.3)',
          paddingBottom: '12px',
          letterSpacing: '1px',
        }}
      >
        地震详情
      </div>

      {selected ? (
        <>
          <InfoRow label="事件ID" value={`#${String(selected.id).padStart(4, '0')}`} />
          <InfoRow label="日期" value={formatDate(selected.timestamp)} />
          <InfoRow label="经度" value={`${selected.longitude.toFixed(2)}°`} />
          <InfoRow label="纬度" value={`${selected.latitude.toFixed(2)}°`} />
          <InfoRow label="深度" value={`${selected.depth.toFixed(1)} km`} />
          <InfoRow
            label="震级"
            value={`${selected.magnitude.toFixed(1)} 级`}
            highlight
          />
          <div
            style={{
              marginTop: 'auto',
              padding: '12px',
              background: 'rgba(255, 215, 0, 0.08)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 215, 0, 0.15)',
              fontSize: '12px',
              color: '#888',
              lineHeight: '1.6',
            }}
          >
            提示：点击空白处可关闭此面板，拖动3D场景可旋转视角，滚轮可缩放。
          </div>
        </>
      ) : null}
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <span
        style={{
          color: '#888',
          fontSize: '14px',
          fontFamily: 'monospace',
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: highlight ? '#FFD700' : '#E0E0E0',
          fontSize: highlight ? '18px' : '15px',
          fontWeight: highlight ? 700 : 500,
          fontFamily: 'monospace',
          textShadow: highlight ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none',
        }}
      >
        {value}
      </span>
    </div>
  );
}
