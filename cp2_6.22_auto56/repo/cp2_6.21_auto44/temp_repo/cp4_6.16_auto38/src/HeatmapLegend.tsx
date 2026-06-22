import { useEffect, useState } from 'react';
import { useAppStore } from './store';

export function HeatmapLegend() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const colors = [
    { stop: 0, color: '#1a4de6', label: '0' },
    { stop: 0.2, color: '#1ab2e6', label: '' },
    { stop: 0.4, color: '#33e680', label: '40' },
    { stop: 0.6, color: '#f2d933', label: '' },
    { stop: 0.8, color: '#f24d26', label: '80' },
    { stop: 1, color: '#e60d0d', label: '100' },
  ];

  const gradientStops = colors
    .map((c) => `${c.color} ${c.stop * 100}%`)
    .join(', ');

  return (
    <div
      style={{
        position: 'fixed',
        left: 24,
        bottom: 24,
        zIndex: 100,
        opacity: mounted ? 1 : 0,
        transform: `translateY(${mounted ? 0 : 20}px)`,
        transition: 'all 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
    >
      <div
        style={{
          background: 'rgba(15, 20, 40, 0.6)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(120, 160, 255, 0.2)',
          borderRadius: 12,
          padding: '14px 18px',
          boxShadow: `
            0 4px 20px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              stroke="#7890c0"
              strokeWidth="1.5"
            />
            <circle cx="12" cy="9" r="2.5" fill="#33e680" />
          </svg>
          <span
            style={{
              color: '#a0b8e0',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            人流密度图例
          </span>
        </div>

        <div style={{ width: 200 }}>
          <div
            style={{
              height: 10,
              borderRadius: 5,
              background: `linear-gradient(90deg, ${gradientStops})`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              marginBottom: 6,
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            {colors.filter((c) => c.label).map((c) => (
              <span
                key={c.label}
                style={{
                  color: '#6a88c8',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              >
                {c.label}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
          }}
        >
          {[
            { label: '稀疏', value: '0-20', color: '#1a4de6' },
            { label: '较少', value: '20-40', color: '#1ab2e6' },
            { label: '正常', value: '40-60', color: '#33e680' },
            { label: '拥挤', value: '60-80', color: '#f2d933' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: item.color,
                  boxShadow: `0 0 4px ${item.color}60`,
                }}
              />
              <span
                style={{
                  color: '#8098c0',
                  fontSize: 9,
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  color: '#5a7098',
                  fontSize: 8,
                  fontFamily: 'monospace',
                  marginLeft: 'auto',
                }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
