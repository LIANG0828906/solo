import { useEffect, useState } from 'react';
import { useAppStore } from './store';

export function Tooltip() {
  const tooltip = useAppStore((state) => state.tooltip);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (tooltip.visible) {
      requestAnimationFrame(() => setMounted(true));
    } else {
      setMounted(false);
    }
  }, [tooltip.visible]);

  if (!tooltip.visible && !mounted) return null;

  const getHeatColor = (density: number): string => {
    const d = density / 100;
    if (d < 0.2) {
      const t = d / 0.2;
      return interpolateColor('#1a4de6', '#1ab2e6', t);
    } else if (d < 0.4) {
      const t = (d - 0.2) / 0.2;
      return interpolateColor('#1ab2e6', '#33e680', t);
    } else if (d < 0.6) {
      const t = (d - 0.4) / 0.2;
      return interpolateColor('#33e680', '#f2d933', t);
    } else if (d < 0.8) {
      const t = (d - 0.6) / 0.2;
      return interpolateColor('#f2d933', '#f24d26', t);
    } else {
      const t = (d - 0.8) / 0.2;
      return interpolateColor('#f24d26', '#e60d0d', t);
    }
  };

  const interpolateColor = (color1: string, color2: string, t: number): string => {
    const hex = (x: string) => parseInt(x, 16);
    const r1 = hex(color1.slice(1, 3));
    const g1 = hex(color1.slice(3, 5));
    const b1 = hex(color1.slice(5, 7));
    const r2 = hex(color2.slice(1, 3));
    const g2 = hex(color2.slice(3, 5));
    const b2 = hex(color2.slice(5, 7));
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const heatColor = getHeatColor(tooltip.density);
  const peakColor = getHeatColor(tooltip.historicalPeak);

  const offsetX = 15;
  const offsetY = -10;
  
  let left = tooltip.position.x + offsetX;
  let top = tooltip.position.y + offsetY;

  if (typeof window !== 'undefined') {
    const tooltipWidth = 240;
    const tooltipHeight = 140;
    if (left + tooltipWidth > window.innerWidth - 10) {
      left = tooltip.position.x - tooltipWidth - offsetX;
    }
    if (top < 10) {
      top = 10;
    }
    if (top + tooltipHeight > window.innerHeight - 10) {
      top = window.innerHeight - tooltipHeight - 10;
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 200,
        pointerEvents: 'none',
        opacity: mounted && tooltip.visible ? 1 : 0,
        transform: `translateY(${mounted && tooltip.visible ? 0 : 8}px)`,
        transition: 'all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
    >
      <div
        style={{
          background: 'rgba(12, 18, 36, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${heatColor}50`,
          borderRadius: 12,
          padding: '14px 18px',
          minWidth: 220,
          boxShadow: `
            0 4px 24px rgba(0, 0, 0, 0.5),
            0 0 30px ${heatColor}20,
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
            paddingBottom: 10,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: heatColor,
              boxShadow: `0 0 8px ${heatColor}`,
            }}
          />
          <span
            style={{
              color: '#e8f0ff',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 180,
            }}
          >
            {tooltip.buildingName}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  color: '#7890c0',
                  fontSize: 10,
                  letterSpacing: 1,
                }}
              >
                当前人流密度
              </span>
              <span
                style={{
                  color: heatColor,
                  fontSize: 10,
                  fontWeight: 600,
                  fontFamily: 'monospace',
                }}
              >
                实时
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${tooltip.density}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${heatColor}80, ${heatColor})`,
                    borderRadius: 3,
                    boxShadow: `0 0 6px ${heatColor}80`,
                    transition: 'width 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  }}
                />
              </div>
              <span
                style={{
                  color: heatColor,
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  minWidth: 36,
                  textAlign: 'right',
                  textShadow: `0 0 10px ${heatColor}50`,
                }}
              >
                {tooltip.density}
              </span>
            </div>
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  color: '#7890c0',
                  fontSize: 10,
                  letterSpacing: 1,
                }}
              >
                历史峰值
              </span>
              <span
                style={{
                  color: '#8fa8d0',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              >
                24H MAX
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  flex: 1,
                  height: 4,
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${tooltip.historicalPeak}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${peakColor}40, ${peakColor}80)`,
                    borderRadius: 2,
                  }}
                />
              </div>
              <span
                style={{
                  color: peakColor,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  minWidth: 36,
                  textAlign: 'right',
                }}
              >
                {tooltip.historicalPeak}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
