import { useState, useEffect, useRef, useCallback } from 'react';
import { X, RotateCcw, Palette, Gauge } from 'lucide-react';
import type { Artwork, ColorPreset } from '@/types';
import { useGalleryStore } from '@/store/useGalleryStore';

const colorPresets: ColorPreset[] = [
  {
    id: 'neon-purple',
    name: '霓虹紫紫',
    colors: ['#9333ea', '#c026d3', '#581c87'],
  },
  {
    id: 'ocean-blue',
    name: '海洋蓝',
    colors: ['#3b82f6', '#06b6d4', '#1e3a8a'],
  },
  {
    id: 'golden-dusk',
    name: '金色黄昏',
    colors: ['#fbbf24', '#f97316', '#991b1b'],
  },
  {
    id: 'emerald-green',
    name: '翡翠绿',
    colors: ['#22c55e', '#14b8a6', '#166534'],
  },
  {
    id: 'aurora-pink',
    name: '极光粉',
    colors: ['#ec4899', '#8b5cf6', '#ffffff'],
  },
];

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

const hexToRgb = (hex: string): RGB => {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const interpolateRgb = (from: RGB, to: RGB, t: number): RGB => ({
  r: from.r + (to.r - from.r) * t,
  g: from.g + (to.g - from.g) * t,
  b: from.b + (to.b - from.b) * t,
});

const rgbToHsl = (rgb: RGB): HSL => {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToRgb = (hsl: HSL): RGB => {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
};

const hslToHex = (h: number, s: number, l: number): string => {
  const rgb = hslToRgb({ h, s, l });
  return rgbToHex(rgb.r, rgb.g, rgb.b);
};

const generatePaletteFromPrimary = (primaryHex: string): string[] => {
  const primaryHsl = rgbToHsl(hexToRgb(primaryHex));
  const { h } = primaryHsl;

  return [
    hslToHex(h, 85, 30),
    hslToHex(h, 90, 45),
    hslToHex(h, 100, 60),
    hslToHex((h + 30) % 360, 90, 55),
    hslToHex((h + 60) % 360, 85, 50),
  ];
};

const interpolateColorArrays = (
  fromColors: string[],
  toColors: string[],
  t: number
): string[] => {
  const maxLen = Math.max(fromColors.length, toColors.length);
  const result: string[] = [];

  for (let i = 0; i < maxLen; i++) {
    const fromIdx = i % fromColors.length;
    const toIdx = i % toColors.length;
    const fromRgb = hexToRgb(fromColors[fromIdx]);
    const toRgb = hexToRgb(toColors[toIdx]);
    const interpolated = interpolateRgb(fromRgb, toRgb, t);
    result.push(rgbToHex(interpolated.r, interpolated.g, interpolated.b));
  }

  return result;
};

interface ArtDetailPanelProps {
  artwork: Artwork | null;
  onClose: () => void;
}

interface ColorWheelProps {
  size: number;
  selectedColor: string;
  onColorChange: (color: string) => void;
}

function ColorWheel({ size, selectedColor, onColorChange }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 4;

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = ((angle - 1) * Math.PI) / 180;
      const endAngle = ((angle + 1) * Math.PI) / 180;

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, hslToHex(angle, 0, 100));
      gradient.addColorStop(1, hslToHex(angle, 100, 50));

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    const selHsl = rgbToHsl(hexToRgb(selectedColor));
    const selRad = (selHsl.h * Math.PI) / 180;
    const selDist = (selHsl.s / 100) * radius;
    const selX = centerX + Math.cos(selRad) * selDist;
    const selY = centerY + Math.sin(selRad) * selDist;

    ctx.beginPath();
    ctx.arc(selX, selY, 8, 0, Math.PI * 2);
    ctx.fillStyle = selectedColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    const innerRadius = radius * 0.3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = selectedColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.stroke();
  }, [size, selectedColor, centerX, centerY, radius]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  const getColorAtPosition = (clientX: number, clientY: number): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = size / rect.width;
    const scaleY = size / rect.height;
    const x = (clientX - rect.left) * scaleX - centerX;
    const y = (clientY - rect.top) * scaleY - centerY;

    const dist = Math.sqrt(x * x + y * y);
    if (dist > radius) return null;

    let angle = (Math.atan2(y, x) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    const saturation = Math.min(100, (dist / radius) * 100);
    return hslToHex(angle, saturation, 50);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    const color = getColorAtPosition(e.clientX, e.clientY);
    if (color) onColorChange(color);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const color = getColorAtPosition(e.clientX, e.clientY);
    if (color) onColorChange(color);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDraggingRef.current = true;
    const touch = e.touches[0];
    const color = getColorAtPosition(touch.clientX, touch.clientY);
    if (color) onColorChange(color);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const touch = e.touches[0];
    const color = getColorAtPosition(touch.clientX, touch.clientY);
    if (color) onColorChange(color);
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="color-wheel-canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}

export default function ArtDetailPanel({ artwork, onClose }: ArtDetailPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { updateArtworkColors, updateArtworkSpeed, resetArtwork } = useGalleryStore();

  const [currentColors, setCurrentColors] = useState<string[]>([]);
  const targetColorsRef = useRef<string[]>([]);
  const colorStartRef = useRef<string[]>([]);
  const colorAnimStartRef = useRef<number>(0);
  const colorAnimFrameRef = useRef<number | null>(null);
  const isColorAnimatingRef = useRef(false);

  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const targetSpeedRef = useRef<number>(0);
  const speedStartRef = useRef<number>(0);
  const speedAnimStartRef = useRef<number>(0);
  const speedAnimFrameRef = useRef<number | null>(null);
  const isSpeedAnimatingRef = useRef(false);

  const [selectedPrimaryColor, setSelectedPrimaryColor] = useState<string>('#9333ea');

  const COLOR_DURATION = 500;
  const SPEED_DURATION = 300;

  useEffect(() => {
    if (artwork) {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
      if (!isColorAnimatingRef.current) {
        setCurrentColors([...artwork.colorPalette]);
        targetColorsRef.current = [...artwork.colorPalette];
        colorStartRef.current = [...artwork.colorPalette];
      }
      if (!isSpeedAnimatingRef.current) {
        setCurrentSpeed(artwork.particleSpeed);
        targetSpeedRef.current = artwork.particleSpeed;
        speedStartRef.current = artwork.particleSpeed;
      }
      setSelectedPrimaryColor(artwork.colorPalette[0] || '#9333ea');
    } else {
      setIsVisible(false);
    }
  }, [artwork]);

  useEffect(() => {
    return () => {
      if (colorAnimFrameRef.current) cancelAnimationFrame(colorAnimFrameRef.current);
      if (speedAnimFrameRef.current) cancelAnimationFrame(speedAnimFrameRef.current);
    };
  }, []);

  const animateColors = useCallback(
    (artworkId: string) => {
      isColorAnimatingRef.current = true;
      const now = performance.now();
      const elapsed = now - colorAnimStartRef.current;
      const t = Math.min(1, elapsed / COLOR_DURATION);
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const interpolated = interpolateColorArrays(
        colorStartRef.current,
        targetColorsRef.current,
        easeT
      );

      const currentColors = t >= 1 ? [...targetColorsRef.current] : interpolated;

      setCurrentColors(currentColors);
      updateArtworkColors(artworkId, currentColors);

      if (t < 1) {
        colorAnimFrameRef.current = requestAnimationFrame(() => animateColors(artworkId));
      } else {
        colorAnimFrameRef.current = null;
        isColorAnimatingRef.current = false;
      }
    },
    [updateArtworkColors]
  );

  const startColorTransition = (artworkId: string, targetColors: string[]) => {
    colorStartRef.current = [...currentColors];
    targetColorsRef.current = [...targetColors];
    colorAnimStartRef.current = performance.now();

    if (colorAnimFrameRef.current) {
      cancelAnimationFrame(colorAnimFrameRef.current);
    }
    colorAnimFrameRef.current = requestAnimationFrame(() => animateColors(artworkId));
  };

  const animateSpeed = useCallback(
    (artworkId: string) => {
      isSpeedAnimatingRef.current = true;
      const now = performance.now();
      const elapsed = now - speedAnimStartRef.current;
      const t = Math.min(1, elapsed / SPEED_DURATION);
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const interpolated = speedStartRef.current + (targetSpeedRef.current - speedStartRef.current) * easeT;
      const currentSpeed = t >= 1 ? targetSpeedRef.current : interpolated;

      setCurrentSpeed(currentSpeed);
      updateArtworkSpeed(artworkId, currentSpeed);

      if (t < 1) {
        speedAnimFrameRef.current = requestAnimationFrame(() => animateSpeed(artworkId));
      } else {
        speedAnimFrameRef.current = null;
        isSpeedAnimatingRef.current = false;
      }
    },
    [updateArtworkSpeed]
  );

  const startSpeedTransition = (artworkId: string, targetSpeed: number) => {
    speedStartRef.current = currentSpeed;
    targetSpeedRef.current = targetSpeed;
    speedAnimStartRef.current = performance.now();

    if (speedAnimFrameRef.current) {
      cancelAnimationFrame(speedAnimFrameRef.current);
    }
    speedAnimFrameRef.current = requestAnimationFrame(() => animateSpeed(artworkId));
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleColorSelect = (colors: string[]) => {
    if (artwork) {
      setSelectedPrimaryColor(colors[0] || '#9333ea');
      startColorTransition(artwork.id, colors);
    }
  };

  const handleWheelColorChange = (color: string) => {
    if (!artwork) return;
    setSelectedPrimaryColor(color);
    const palette = generatePaletteFromPrimary(color);
    startColorTransition(artwork.id, palette);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (artwork) {
      const speed = parseFloat(e.target.value);
      startSpeedTransition(artwork.id, speed);
    }
  };

  const handleReset = () => {
    if (artwork) {
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 200);
      resetArtwork(artwork.id);
    }
  };

  useEffect(() => {
    if (artwork) {
      if (!isColorAnimatingRef.current) {
        setCurrentColors([...artwork.colorPalette]);
        targetColorsRef.current = [...artwork.colorPalette];
        colorStartRef.current = [...artwork.colorPalette];
      }
      if (!isSpeedAnimatingRef.current) {
        setCurrentSpeed(artwork.particleSpeed);
        targetSpeedRef.current = artwork.particleSpeed;
        speedStartRef.current = artwork.particleSpeed;
      }
      setSelectedPrimaryColor(artwork.colorPalette[0] || '#9333ea');
    }
  }, [artwork?.initialColorPalette, artwork?.initialParticleSpeed]);

  if (!artwork) return null;

  const isPresetActive = (preset: ColorPreset) => {
    const current = currentColors;
    return (
      current.length === preset.colors.length &&
      current.every((c, i) => c.toLowerCase() === preset.colors[i].toLowerCase())
    );
  };

  return (
    <>
      <div className="art-detail-overlay" data-visible={isVisible} onClick={handleClose} />

      <div className="art-detail-panel" data-visible={isVisible}>
        <div className="art-detail-header">
          <h2 className="art-detail-title">作品详情</h2>
          <button
            type="button"
            className="art-detail-close-btn"
            onClick={handleClose}
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        <div className="art-detail-content">
          <div className="art-detail-info">
            <h1 className="artwork-name">{artwork.name}</h1>
            <p className="artwork-author">作者：{artwork.author}</p>
          </div>

          <div className="art-detail-section">
            <p className="artwork-description">{artwork.description}</p>
          </div>

          <div className="art-detail-section">
            <div className="section-header">
              <Palette size={16} className="section-icon icon-purple" />
              <span className="section-label">颜色主题</span>
            </div>

            <div className="color-wheel-container">
              <ColorWheel
                size={200}
                selectedColor={selectedPrimaryColor}
                onColorChange={handleWheelColorChange}
              />
              <div className="color-palette-preview">
                {currentColors.map((color, idx) => (
                  <div
                    key={idx}
                    className="palette-preview-item"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="color-palette-list">
              {colorPresets.map((preset) => {
                const isActive = isPresetActive(preset);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`color-swatch ${isActive ? 'active' : ''}`}
                    onClick={() => handleColorSelect(preset.colors)}
                    title={preset.name}
                    style={{
                      background: `linear-gradient(135deg, ${preset.colors.join(', ')})`,
                      boxShadow: isActive ? `0 0 20px ${preset.colors[0]}50` : undefined,
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div className="art-detail-section">
            <div className="section-header">
              <Gauge size={16} className="section-icon icon-cyan" />
              <span className="section-label">粒子速度</span>
              <span className="speed-value">{currentSpeed.toFixed(1)}x</span>
            </div>
            <div className="speed-slider-container">
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={targetSpeedRef.current}
                onChange={handleSpeedChange}
                className="speed-slider-input"
              />
              <div
                className="speed-slider-thumb"
                style={{ left: `${((currentSpeed - 0.1) / (3 - 0.1)) * 100}%` }}
              />
            </div>
            <div className="speed-labels">
              <span>0.1x</span>
              <span>3.0x</span>
            </div>
          </div>

          <button
            type="button"
            className={`reset-button ${isPressed ? 'pressed' : ''}`}
            onClick={handleReset}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
          >
            <RotateCcw size={16} />
            重置作品
          </button>
        </div>
      </div>

      <style>{`
        .art-detail-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.4);
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
          z-index: 40;
          pointer-events: none;
        }
        
        .art-detail-overlay[data-visible="true"] {
          opacity: 1;
          pointer-events: auto;
        }
        
        .art-detail-panel {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          max-height: 70vh;
          background-color: rgba(15, 15, 35, 0.75);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-top-left-radius: 24px;
          border-top-right-radius: 24px;
          box-shadow: 0 -8px 40px rgba(139, 92, 246, 0.15);
          transform: translateY(100%);
          transition: transform 0.3s ease-in-out;
          z-index: 50;
          display: flex;
          flex-direction: column;
          font-family: 'Orbitron', sans-serif;
          color: #ffffff;
          overflow: hidden;
        }
        
        .art-detail-panel[data-visible="true"] {
          transform: translateY(0);
        }
        
        @media (min-width: 1200px) {
          .art-detail-panel {
            top: 0;
            right: 0;
            bottom: auto;
            left: auto;
            width: 360px;
            height: 100vh;
            max-height: none;
            border-top: none;
            border-left: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0;
            box-shadow: -8px 0 40px rgba(139, 92, 246, 0.15);
            transform: translateX(100%);
          }
          
          .art-detail-panel[data-visible="true"] {
            transform: translateX(0);
          }
        }
        
        .art-detail-header {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }
        
        .art-detail-title {
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 1px;
          margin: 0;
          background: linear-gradient(135deg, #a78bfa, #22d3ee);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .art-detail-close-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.08);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.2s ease;
        }
        
        .art-detail-close-btn:hover {
          background-color: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }
        
        .art-detail-content {
          padding: 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 28px;
          overflow-y: auto;
        }
        
        .art-detail-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .artwork-name {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin: 0;
          line-height: 1.3;
        }
        
        .artwork-author {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
          letter-spacing: 0.5px;
        }
        
        .art-detail-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        
        .artwork-description {
          font-size: 13px;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.75);
          margin: 0;
          font-weight: 300;
        }
        
        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .section-icon {
          flex-shrink: 0;
        }
        
        .icon-purple {
          color: #a78bfa;
        }
        
        .icon-cyan {
          color: #22d3ee;
        }
        
        .section-label {
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.5px;
        }
        
        .color-wheel-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 16px 0;
        }
        
        .color-wheel-canvas {
          border-radius: 50%;
          cursor: crosshair;
          touch-action: none;
          filter: drop-shadow(0 4px 12px rgba(139, 92, 246, 0.3));
        }
        
        .color-palette-preview {
          display: flex;
          gap: 8px;
        }
        
        .palette-preview-item {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }
        
        .color-palette-list {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .color-swatch {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          transition: all 0.5s ease;
          padding: 0;
        }
        
        .color-swatch:hover {
          transform: scale(1.15);
        }
        
        .color-swatch.active {
          border-color: #ffffff;
          transform: scale(1.1);
        }
        
        .speed-value {
          margin-left: auto;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .speed-slider-container {
          position: relative;
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(90deg, #8b5cf6, #06b6d4, #8b5cf6);
          background-size: 200% 100%;
          animation: flow 3s linear infinite;
        }
        
        .speed-slider-input {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          margin: 0;
        }
        
        .speed-slider-thumb {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #ffffff;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          pointer-events: none;
        }
        
        .speed-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }
        
        .reset-button {
          margin-top: auto;
          width: 100%;
          padding: 14px 20px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background-color: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 1px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          font-family: 'Orbitron', sans-serif;
          flex-shrink: 0;
        }
        
        .reset-button:hover {
          background-color: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
        }
        
        .reset-button.pressed {
          transform: scale(0.95);
        }
        
        @keyframes flow {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
      `}</style>
    </>
  );
}
