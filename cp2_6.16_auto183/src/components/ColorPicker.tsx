import React, { useEffect, useRef } from 'react';
import { useColorStore } from '../store/colorStore';
import type { FavoriteColor } from '../types';

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function PickerModal() {
  const pickerState = useColorStore((s) => s.pickerState);
  const closePicker = useColorStore((s) => s.closePicker);
  const confirmPicker = useColorStore((s) => s.confirmPicker);
  const loupeRef = useRef<HTMLCanvasElement>(null);

  const visible = !!pickerState;
  const center = pickerState?.centerColor;
  const pixels = pickerState?.pixels ?? [];

  useEffect(() => {
    if (!visible || !loupeRef.current) return;
    const canvas = loupeRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const cssSize = 140;
    canvas.width = cssSize * dpr;
    canvas.height = cssSize * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, cssSize, cssSize);
    if (pixels.length === 25) {
      const pxSize = cssSize / 5;
      for (const p of pixels) {
        const { r, g, b } = p.rgb;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(p.x * pxSize, p.y * pxSize, pxSize + 0.5, pxSize + 0.5);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 5; i++) {
        ctx.beginPath();
        ctx.moveTo(i * pxSize, 0);
        ctx.lineTo(i * pxSize, cssSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * pxSize);
        ctx.lineTo(cssSize, i * pxSize);
        ctx.stroke();
      }
    }
  }, [visible, pixels]);

  const handleKey = (e: KeyboardEvent) => {
    if (!visible) return;
    if (e.key === 'Escape') closePicker();
    if (e.key === 'Enter') confirmPicker();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [visible]);

  const hex = center ? rgbToHex(center.r, center.g, center.b) : '#000000';
  const swatchBg = center
    ? `rgb(${center.r},${center.g},${center.b})`
    : 'transparent';

  return (
    <div
      className={`color-picker-overlay ${visible ? 'visible' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) closePicker();
      }}
    >
      <div className="color-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="picker-loupe">
          <canvas ref={loupeRef} />
          <div className="picker-loupe-crosshair" />
        </div>

        <div className="picker-color-preview">
          <div className="picker-swatch" style={{ background: swatchBg }} />
          <div className="picker-color-info">
            <div className="picker-color-row">
              <span>HEX</span>
              <span>{hex}</span>
            </div>
            <div className="picker-color-row">
              <span>RGB</span>
              <span>
                {center
                  ? `(${center.r}, ${center.g}, ${center.b})`
                  : '(-, -, -)'}
              </span>
            </div>
            <div className="picker-color-row">
              <span>位置</span>
              <span>
                {pickerState
                  ? `(${pickerState.canvasX}, ${pickerState.canvasY})`
                  : '(-, -)'}
              </span>
            </div>
          </div>
        </div>

        <div className="picker-actions">
          <button className="picker-btn secondary" onClick={closePicker}>
            取消
          </button>
          <button className="picker-btn primary" onClick={confirmPicker}>
            收藏此颜色
          </button>
        </div>
      </div>
    </div>
  );
}

function FavoritesDrawer() {
  const drawerOpen = useColorStore((s) => s.drawerOpen);
  const toggleDrawer = useColorStore((s) => s.toggleDrawer);
  const removeFavorite = useColorStore((s) => s.removeFavorite);
  const favorites = useColorStore((s) => s.favorites);

  const slots: (FavoriteColor | null)[] = Array.from({ length: 8 }, (_, i) => favorites[i] ?? null);

  return (
    <>
      {!drawerOpen && (
        <button className="drawer-toggle" onClick={toggleDrawer}>
          ★ 收藏颜色 ({favorites.length}/8)
        </button>
      )}
      <div className={`favorites-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-title">
            收藏的颜色 ({favorites.length}/8)
          </div>
          <button className="drawer-close" onClick={toggleDrawer}>
            ×
          </button>
        </div>
        <div className="favorites-grid">
          {slots.map((fav, i) =>
            fav ? (
              <div
                key={fav.id}
                className="favorite-card"
                style={{
                  background: `rgb(${fav.rgb.r},${fav.rgb.g},${fav.rgb.b})`,
                }}
                onClick={() => {
                  // nothing, just visual
                }}
              >
                <div className="favorite-tooltip">
                  {fav.hex} · RGB({fav.rgb.r},{fav.rgb.g},{fav.rgb.b})
                </div>
                <button
                  className="favorite-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(fav.id);
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div key={`empty-${i}`} className="favorite-card empty" />
            )
          )}
        </div>
      </div>
    </>
  );
}

const ColorPicker: React.FC = () => {
  return (
    <>
      <PickerModal />
      <FavoritesDrawer />
    </>
  );
};

export default ColorPicker;
