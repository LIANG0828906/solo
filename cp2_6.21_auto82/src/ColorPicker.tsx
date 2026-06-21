import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pipette, Layers, ArrowRight } from 'lucide-react';
import {
  BlendMode,
  blendColors,
  hexToHsl,
  hexToHsv,
  hsvToHex,
  isValidHex,
  PaletteColor,
} from './colorEngine';

export interface ColorPickerProps {
  currentColor: string;
  paletteColors: PaletteColor[];
  onColorChange: (hex: string) => void;
  onBlendAdd: (hex: string) => void;
  onSelectBlendColor: (idx: number, which: 1 | 2) => void;
  blendColor1Idx: number | null;
  blendColor2Idx: number | null;
}

const WHEEL_SIZE_DESKTOP = 600;
const WHEEL_SIZE_MOBILE = 400;

const BLEND_MODES: { key: BlendMode; label: string }[] = [
  { key: 'multiply', label: '正片叠底' },
  { key: 'screen', label: '滤色' },
  { key: 'overlay', label: '叠加' },
  { key: 'softLight', label: '柔光' },
];

const ColorPicker: React.FC<ColorPickerProps> = ({
  currentColor,
  paletteColors,
  onColorChange,
  onBlendAdd,
  onSelectBlendColor,
  blendColor1Idx,
  blendColor2Idx,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [wheelSize, setWheelSize] = useState(WHEEL_SIZE_DESKTOP);

  const [hsv, setHsv] = useState(() => hexToHsv(currentColor || '#00B4D8'));
  const [hexInput, setHexInput] = useState(currentColor || '#00B4D8');
  const [blendMode, setBlendMode] = useState<BlendMode>('overlay');

  useEffect(() => {
    const checkSize = () => {
      setWheelSize(window.innerWidth <= 768 ? WHEEL_SIZE_MOBILE : WHEEL_SIZE_DESKTOP);
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  useEffect(() => {
    if (currentColor && isValidHex(currentColor)) {
      setHsv(hexToHsv(currentColor));
      setHexInput(currentColor);
    }
  }, [currentColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = wheelSize * dpr;
    canvas.height = wheelSize * dpr;
    canvas.style.width = `${wheelSize}px`;
    canvas.style.height = `${wheelSize}px`;
    ctx.scale(dpr, dpr);

    const cx = wheelSize / 2;
    const cy = wheelSize / 2;
    const radius = wheelSize / 2 - 4;
    const v = hsv.v / 100;

    for (let angle = 0; angle < 360; angle += 0.5) {
      const startAngle = ((angle - 0.5) * Math.PI) / 180;
      const endAngle = ((angle + 0.5) * Math.PI) / 180;

      for (let ring = 0; ring < radius; ring += 1) {
        const s = (ring / radius) * 100;
        const hex = hsvToHex({ h: angle, s, v: hsv.v });
        ctx.fillStyle = hex;
        ctx.beginPath();
        const innerR = ring;
        const outerR = ring + 1.2;
        ctx.moveTo(cx + Math.cos(startAngle) * innerR, cy + Math.sin(startAngle) * innerR);
        ctx.arc(cx, cy, outerR, startAngle, endAngle);
        ctx.lineTo(cx + Math.cos(endAngle) * innerR, cy + Math.sin(endAngle) * innerR);
        ctx.closePath();
        ctx.fill();
        void v;
      }
    }

    const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
    grad.addColorStop(0, `rgba(255,255,255,${(1 - v) * 0.6})`);
    grad.addColorStop(1, `rgba(0,0,0,${(1 - v) * 0.9})`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }, [wheelSize, hsv.v]);

  const handlePositionFromEvent = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const cx = wheelSize / 2;
    const cy = wheelSize / 2;
    const dx = x - cx;
    const dy = y - cy;
    const radius = wheelSize / 2 - 4;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const s = Math.min(100, (dist / radius) * 100);
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    setHsv((prev) => {
      const next = { h: Math.round(angle), s: Math.round(s), v: prev.v };
      const hex = hsvToHex(next);
      setHexInput(hex);
      onColorChange(hex);
      return next;
    });
  };

  const scheduleUpdate = (clientX: number, clientY: number) => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      handlePositionFromEvent(clientX, clientY);
      rafRef.current = null;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    handlePositionFromEvent(e.clientX, e.clientY);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    scheduleUpdate(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      isDraggingRef.current = true;
      const t = e.touches[0];
      handlePositionFromEvent(t.clientX, t.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length === 0) return;
    const t = e.touches[0];
    scheduleUpdate(t.clientX, t.clientY);
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaturationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = parseInt(e.target.value, 10);
    setHsv((prev) => {
      const next = { ...prev, s };
      const hex = hsvToHex(next);
      setHexInput(hex);
      onColorChange(hex);
      return next;
    });
  };

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    setHsv((prev) => {
      const next = { ...prev, v };
      const hex = hsvToHex(next);
      setHexInput(hex);
      onColorChange(hex);
      return next;
    });
  };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = parseInt(e.target.value, 10);
    setHsv((prev) => {
      const next = { ...prev, h };
      const hex = hsvToHex(next);
      setHexInput(hex);
      onColorChange(hex);
      return next;
    });
  };

  const handleHexSubmit = () => {
    let v = hexInput.trim();
    if (!v.startsWith('#')) v = '#' + v;
    if (isValidHex(v)) {
      if (v.length === 4) {
        v = '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
      }
      const upper = v.toUpperCase();
      setHsv(hexToHsv(upper));
      onColorChange(upper);
    } else {
      setHexInput(currentColor || hsvToHex(hsv));
    }
  };

  const currentHueOnlyHex = useMemo(
    () => hsvToHex({ h: hsv.h, s: 100, v: 100 }),
    [hsv.h]
  );
  const satEndHex = useMemo(
    () => hsvToHex({ h: hsv.h, s: 100, v: hsv.v }),
    [hsv.h, hsv.v]
  );
  const currentFullHex = hsvToHex(hsv);

  const previewLabelColor = (hex: string) => {
    const hsl = hexToHsl(hex);
    return hsl.l > 60 ? '#1a1a2e' : '#ffffff';
  };

  const blendColor1 = blendColor1Idx !== null ? paletteColors[blendColor1Idx]?.hex : null;
  const blendColor2 = blendColor2Idx !== null ? paletteColors[blendColor2Idx]?.hex : null;
  const blendResult = blendColor1 && blendColor2 ? blendColors(blendColor1, blendColor2, blendMode) : null;

  const filledColors = paletteColors.filter((c) => c.hex);
  const hueRadian = (hsv.h * Math.PI) / 180;
  const cx = wheelSize / 2;
  const cy = wheelSize / 2;
  const radius = wheelSize / 2 - 4;
  const handleX = cx + Math.cos(hueRadian) * radius * (hsv.s / 100);
  const handleY = cy + Math.sin(hueRadian) * radius * (hsv.s / 100);

  const hueSliderStyle: React.CSSProperties = {
    background:
      'linear-gradient(90deg,#FF0000 0%,#FFFF00 17%,#00FF00 33%,#00FFFF 50%,#0000FF 67%,#FF00FF 83%,#FF0000 100%)',
  };

  return (
    <div className="picker-container">
      <div className="panel-title">
        <Pipette className="panel-title-icon" size={18} />
        颜色拾取器
      </div>

      <div className="picker-main">
        <div className="color-wheel-wrapper" style={{ width: wheelSize, height: wheelSize }}>
          <canvas
            ref={canvasRef}
            className="color-wheel"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          <div
            className="color-wheel-handle"
            style={{
              left: handleX,
              top: handleY,
              backgroundColor: currentFullHex,
            }}
          />
        </div>

        <div className="picker-controls">
          <div className="preview-block">
            <div
              className="preview-square"
              style={{ backgroundColor: currentFullHex, color: previewLabelColor(currentFullHex) }}
            >
              {currentFullHex}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>当前颜色</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                H {hsv.h}° · S {hsv.s}% · V {hsv.v}%
              </div>
            </div>
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>色相 H</span>
              <span className="slider-value">{hsv.h}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              value={hsv.h}
              onChange={handleHueChange}
              style={hueSliderStyle}
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>饱和度 S</span>
              <span className="slider-value">{hsv.s}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={hsv.s}
              onChange={handleSaturationChange}
              className="saturation-slider"
              style={
                {
                  '--current-hue': satEndHex,
                  background: `linear-gradient(90deg, hsl(${hsv.h}, 0%, ${hsv.v * 0.6}%) 0%, ${satEndHex} 100%)`,
                } as React.CSSProperties
              }
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>亮度 V</span>
              <span className="slider-value">{hsv.v}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={hsv.v}
              onChange={handleBrightnessChange}
              className="brightness-slider"
              style={
                {
                  '--current-color': currentHueOnlyHex,
                  background: `linear-gradient(90deg, #000000 0%, ${currentHueOnlyHex} 100%)`,
                } as React.CSSProperties
              }
            />
          </div>

          <div className="hex-input-group">
            <span className="hex-label">HEX</span>
            <input
              type="text"
              className="hex-input"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value.toUpperCase())}
              onBlur={handleHexSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleHexSubmit();
              }}
              placeholder="#00B4D8"
              maxLength={7}
            />
          </div>
        </div>
      </div>

      <div className="blend-section">
        <div className="blend-title">
          <Layers size={16} />
          颜色混合工具
        </div>

        <div className="blend-selectors">
          <div
            className={`blend-color-slot ${blendColor1Idx !== null ? 'active' : ''}`}
            onClick={() => {
              if (filledColors.length === 0) return;
              const current = blendColor1Idx ?? 0;
              const next = (current + 1) % filledColors.length;
              const realIdx = paletteColors.findIndex(
                (_, i) => paletteColors.filter((c) => c.hex).slice(0, next + 1).length === next + 1
              );
              const found = paletteColors
                .map((c, idx) => ({ c, idx }))
                .filter((x) => x.c.hex);
              if (found[next]) onSelectBlendColor(found[next].idx, 1);
            }}
          >
            <div
              className="blend-preview"
              style={{
                backgroundColor: blendColor1 || 'rgba(255,255,255,0.05)',
                border: blendColor1 ? 'none' : '1px dashed var(--border-color)',
              }}
            />
            <div className="blend-label">颜色 A</div>
            <div className="blend-hex">{blendColor1 || '点击选择'}</div>
          </div>

          <div className="blend-arrow">
            <ArrowRight size={20} />
          </div>

          <div
            className={`blend-color-slot ${blendColor2Idx !== null ? 'active' : ''}`}
            onClick={() => {
              const found = paletteColors
                .map((c, idx) => ({ c, idx }))
                .filter((x) => x.c.hex);
              if (found.length === 0) return;
              const current = blendColor2Idx !== null
                ? found.findIndex((f) => f.idx === blendColor2Idx)
                : Math.min(1, found.length - 1);
              const next = (current + 1) % found.length;
              if (found[next]) onSelectBlendColor(found[next].idx, 2);
            }}
          >
            <div
              className="blend-preview"
              style={{
                backgroundColor: blendColor2 || 'rgba(255,255,255,0.05)',
                border: blendColor2 ? 'none' : '1px dashed var(--border-color)',
              }}
            />
            <div className="blend-label">颜色 B</div>
            <div className="blend-hex">{blendColor2 || '点击选择'}</div>
          </div>
        </div>

        <div className="blend-modes">
          {BLEND_MODES.map((m) => (
            <button
              key={m.key}
              className={`blend-mode-btn ${blendMode === m.key ? 'active' : ''}`}
              onClick={() => setBlendMode(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {blendResult && (
          <div className="blend-result">
            <div
              className="blend-result-preview"
              style={{ backgroundColor: blendResult }}
            />
            <div className="blend-result-info">
              <div className="blend-result-label">混合结果</div>
              <div className="blend-result-hex">{blendResult}</div>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onBlendAdd(blendResult)}
            >
              追加到调色板
            </button>
          </div>
        )}

        {filledColors.length < 2 && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
            请先在调色板中添加至少 2 个颜色
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ColorPicker);
