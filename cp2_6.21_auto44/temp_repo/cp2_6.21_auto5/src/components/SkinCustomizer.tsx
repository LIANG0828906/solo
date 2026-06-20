import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Skin, SKIN_PALETTE, ACCESSORY_STYLES } from '../types';

const ACCESSORY_OPTIONS: Array<{ value: Skin['accessory']; label: string }> = [
  { value: 'none', label: '无' },
  { value: 'glasses', label: '眼镜' },
  { value: 'helmet', label: '头盔' },
  { value: 'cape', label: '披风' },
];

const SkinCustomizer: React.FC = () => {
  const currentSkin = useGameStore((s) => s.currentSkin);
  const setSkin = useGameStore((s) => s.setSkin);

  return (
    <div className="skin-panel">
      <h3 style={{ color: '#00f5d4', fontSize: '14px', marginBottom: '4px' }}>角色颜色</h3>
      <div className="color-grid">
        {SKIN_PALETTE.map((color) => {
          const isActive = currentSkin.bodyColor === color;
          return (
            <div
              key={color}
              className={`color-swatch${isActive ? ' active' : ''}`}
              style={{
                backgroundColor: color,
                ...(isActive ? { animation: 'colorPulse 2s ease-in-out infinite' } : {}),
              }}
              onClick={() => setSkin({ ...currentSkin, bodyColor: color })}
            />
          );
        })}
      </div>

      <h3 style={{ color: '#00f5d4', fontSize: '14px', marginBottom: '4px' }}>配饰</h3>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {ACCESSORY_OPTIONS.map(({ value, label }) => {
          const isSelected = currentSkin.accessory === value;
          return (
            <button
              key={value}
              className="btn-secondary"
              style={
                isSelected
                  ? { borderColor: '#ff006e', color: '#ff006e' }
                  : undefined
              }
              onClick={() => setSkin({ ...currentSkin, accessory: value })}
            >
              {label}
            </button>
          );
        })}
      </div>

      {currentSkin.accessory !== 'none' && (
        <>
          <h3 style={{ color: '#00f5d4', fontSize: '14px', marginBottom: '4px' }}>配饰样式</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {Array.from({ length: ACCESSORY_STYLES[currentSkin.accessory] }, (_, i) => {
              const isActive = currentSkin.accessoryStyle === i;
              return (
                <button
                  key={i}
                  className="btn-secondary"
                  style={
                    isActive
                      ? { borderColor: '#ff006e', color: '#ff006e' }
                      : undefined
                  }
                  onClick={() => setSkin({ ...currentSkin, accessoryStyle: i })}
                >
                  样式 {i + 1}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export function renderSkinPreview(
  ctx: CanvasRenderingContext2D,
  skin: Skin,
  x: number,
  y: number,
  scale: number,
): void {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = skin.bodyColor;
  ctx.fillRect(-6 * scale, -4 * scale, 12 * scale, 20 * scale);

  ctx.beginPath();
  ctx.arc(0, -9 * scale, 5 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  const joints = [
    [-6 * scale, -4 * scale],
    [6 * scale, -4 * scale],
    [-6 * scale, 16 * scale],
    [6 * scale, 16 * scale],
    [0, 6 * scale],
  ];
  for (const [jx, jy] of joints) {
    ctx.beginPath();
    ctx.arc(jx, jy, 1.5 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  if (skin.accessory === 'glasses') {
    const lensColors = ['#ff006e', '#00f5d4', '#b5179e'];
    const lensColor = lensColors[skin.accessoryStyle] ?? '#ff006e';
    ctx.fillStyle = lensColor;
    ctx.fillRect(-4 * scale, -11 * scale, 3 * scale, 2 * scale);
    ctx.fillRect(1 * scale, -11 * scale, 3 * scale, 2 * scale);
    ctx.strokeStyle = lensColor;
    ctx.lineWidth = 0.5 * scale;
    ctx.beginPath();
    ctx.moveTo(-1 * scale, -10 * scale);
    ctx.lineTo(1 * scale, -10 * scale);
    ctx.stroke();
  }

  if (skin.accessory === 'helmet') {
    const helmetColors = ['#3a86ff', '#8338ec', '#fb5607'];
    ctx.strokeStyle = helmetColors[skin.accessoryStyle] ?? '#3a86ff';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(0, -9 * scale, 6 * scale, Math.PI, 0);
    ctx.stroke();
  }

  if (skin.accessory === 'cape') {
    const capeColors = ['#ff006e', '#8338ec', '#ffbe0b'];
    ctx.fillStyle = capeColors[skin.accessoryStyle] ?? '#ff006e';
    ctx.beginPath();
    ctx.moveTo(6 * scale, -2 * scale);
    ctx.quadraticCurveTo(14 * scale, 6 * scale, 10 * scale, 16 * scale);
    ctx.lineTo(6 * scale, 16 * scale);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export default SkinCustomizer;
