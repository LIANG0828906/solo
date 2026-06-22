import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { MORANDI_WALL_COLORS } from '@/models/morandiColors';

interface ControlPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  style?: React.CSSProperties;
}

export default function ControlPanel({ isOpen = true, onClose, style }: ControlPanelProps) {
  const lightIntensity = useAppStore((state) => state.lightIntensity);
  const wallColor = useAppStore((state) => state.wallColor);
  const mode = useAppStore((state) => state.mode);
  const setLightIntensity = useAppStore((state) => state.setLightIntensity);
  const setWallColor = useAppStore((state) => state.setWallColor);
  const toggleDayNight = useAppStore((state) => state.toggleDayNight);

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      className="glass-panel"
      style={{
        position: 'fixed',
        right: 16,
        top: 16,
        bottom: 54,
        width: 240,
        padding: 20,
        overflowY: 'auto',
        zIndex: 10,
        ...style,
      }}
    >
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18,
            color: 'var(--text-main)',
            opacity: 0.6,
          }}
          aria-label="关闭面板"
        >
          ✕
        </button>
      )}

      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-main)',
          marginBottom: 20,
          paddingRight: onClose ? 24 : 0,
        }}
      >
        控制面板
      </div>

      <section style={{ marginBottom: 24 }}>
        <div className="section-title">光照强度</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Sun
            size={16}
            style={{
              color: 'var(--primary-dark)',
              opacity: lightIntensity < 1 ? 0.5 : 1,
              flexShrink: 0,
            }}
          />
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.05}
            value={lightIntensity}
            onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
          <Sun
            size={20}
            style={{
              color: 'var(--primary-dark)',
              opacity: lightIntensity > 1 ? 1 : 0.5,
              flexShrink: 0,
            }}
          />
        </div>
        <div
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--primary-dark)',
            fontWeight: 500,
            marginTop: 6,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {lightIntensity.toFixed(2)}
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <div className="section-title">墙面颜色</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: 10,
            justifyItems: 'center',
          }}
        >
          {MORANDI_WALL_COLORS.map((color) => (
            <button
              key={color.value}
              className={`color-swatch ${wallColor === color.value ? 'active' : ''}`}
              style={{ background: color.value }}
              onClick={() => setWallColor(color.value)}
              title={color.name}
              aria-label={`墙面颜色 ${color.name}`}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="section-title">日夜模式</div>
        <button
          className="btn-primary"
          onClick={toggleDayNight}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 10,
          }}
        >
          {mode === 'day' ? (
            <>
              <Moon size={16} />
              <span>切换夜间模式</span>
            </>
          ) : (
            <>
              <Sun size={16} />
              <span>切换日间模式</span>
            </>
          )}
        </button>
        <div
          style={{
            fontSize: 11,
            color: 'rgba(45, 55, 72, 0.65)',
            lineHeight: 1.6,
            padding: '0 4px',
          }}
        >
          {mode === 'day'
            ? '当前：日间模式 — 窗口方向平行光 + 柔和阴影，呈现自然采光效果'
            : '当前：夜间模式 — 室内暖色点光源 + 清晰阴影，营造温馨氛围'}
        </div>
      </section>
    </aside>
  );
}
