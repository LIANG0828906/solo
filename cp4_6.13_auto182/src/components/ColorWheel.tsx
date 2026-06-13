import { useEffect, useRef, useState, useCallback } from 'react';
import { hsvToHex, hexToHsv, hsvToRgb, hexToRgb } from '../utils/colorUtils';

interface ColorWheelProps {
  color: string;
  onChange: (hex: string) => void;
}

const WHEEL_SIZE = 300;
const CENTER = WHEEL_SIZE / 2;
const RADIUS = WHEEL_SIZE / 2 - 10;
const SELECTOR_RADIUS = 8;

export default function ColorWheel({ color, onChange }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const [selectorPos, setSelectorPos] = useState({ x: CENTER, y: CENTER });
  const [showFeedback, setShowFeedback] = useState(false);
  const [saturation, setSaturation] = useState(1);
  const [brightness, setBrightness] = useState(1);
  const [hue, setHue] = useState(0);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);

    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = ((angle - 0.5) * Math.PI) / 180;
      const endAngle = ((angle + 0.5) * Math.PI) / 180;

      ctx.beginPath();
      ctx.moveTo(CENTER, CENTER);
      ctx.arc(CENTER, CENTER, RADIUS, startAngle, endAngle);
      ctx.closePath();

      const rgb = hsvToRgb(angle, saturation, brightness);
      ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.stroke();

    const gradient = ctx.createRadialGradient(CENTER, CENTER, 0, CENTER, CENTER, RADIUS);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(selectorPos.x, selectorPos.y, SELECTOR_RADIUS + 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(selectorPos.x, selectorPos.y, SELECTOR_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [color, selectorPos, saturation, brightness]);

  useEffect(() => {
    const hsv = hexToHsv(color);
    setHue(hsv.h);
    setSaturation(hsv.s);
    setBrightness(hsv.v);

    const angle = (hsv.h * Math.PI) / 180;
    const distance = hsv.s * RADIUS;
    const x = CENTER + Math.cos(angle) * distance;
    const y = CENTER + Math.sin(angle) * distance;
    setSelectorPos({ x, y });
  }, [color]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  const getColorFromPosition = useCallback(
    (clientX: number, clientY: number): string | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      const dx = x - CENTER;
      const dy = y - CENTER;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > RADIUS) return null;

      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle < 0) angle += 360;

      const newSaturation = Math.min(distance / RADIUS, 1);
      const newColor = hsvToHex(angle, newSaturation, brightness);

      setSelectorPos({ x, y });
      setHue(angle);
      setSaturation(newSaturation);

      return newColor;
    },
    [brightness]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    const newColor = getColorFromPosition(e.clientX, e.clientY);
    if (newColor) {
      onChange(newColor);
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 200);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const newColor = getColorFromPosition(e.clientX, e.clientY);
    if (newColor) {
      onChange(newColor);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const newColor = getColorFromPosition(touch.clientX, touch.clientY);
    if (newColor) {
      isDragging.current = true;
      onChange(newColor);
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 200);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDragging.current) return;
    const touch = e.touches[0];
    const newColor = getColorFromPosition(touch.clientX, touch.clientY);
    if (newColor) {
      onChange(newColor);
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setBrightness(v);
    const newColor = hsvToHex(hue, saturation, v);
    onChange(newColor);
  };

  const handleSaturationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = parseFloat(e.target.value);
    setSaturation(s);
    const newColor = hsvToHex(hue, s, brightness);
    onChange(newColor);
  };

  const rgb = hexToRgb(color);
  const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

  return (
    <div className="color-wheel-container">
      <div className="color-wheel-wrapper">
        <canvas
          ref={canvasRef}
          width={WHEEL_SIZE}
          height={WHEEL_SIZE}
          className={`color-wheel-canvas ${showFeedback ? 'selector-pulse' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        {showFeedback && (
          <div
            className="selector-feedback"
            style={{
              left: selectorPos.x,
              top: selectorPos.y,
            }}
          />
        )}
      </div>

      <div className="sliders-container">
        <div className="slider-row">
          <label className="slider-label">亮度</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={brightness}
            onChange={handleBrightnessChange}
            className="slider brightness-slider"
          />
          <span className="slider-value">{Math.round(brightness * 100)}%</span>
        </div>
        <div className="slider-row">
          <label className="slider-label">饱和度</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={saturation}
            onChange={handleSaturationChange}
            className="slider saturation-slider"
          />
          <span className="slider-value">{Math.round(saturation * 100)}%</span>
        </div>
      </div>

      <div className="color-values">
        <div className="color-value-item">
          <span className="value-label">HEX:</span>
          <span className="value-text">{color.toUpperCase()}</span>
        </div>
        <div className="color-value-item">
          <span className="value-label">RGB:</span>
          <span className="value-text">{rgbStr}</span>
        </div>
      </div>

      <style>{`
        .color-wheel-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .color-wheel-wrapper {
          position: relative;
          width: ${WHEEL_SIZE}px;
          height: ${WHEEL_SIZE}px;
        }

        .color-wheel-canvas {
          cursor: crosshair;
          border-radius: 50%;
          transition: transform 0.3s ease;
        }

        .color-wheel-canvas:active {
          cursor: grabbing;
        }

        .selector-pulse {
          animation: pulse 0.2s ease;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }

        .selector-feedback {
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.3);
          transform: translate(-50%, -50%) scale(0);
          animation: feedback 0.2s ease;
          pointer-events: none;
        }

        @keyframes feedback {
          0% { transform: translate(-50%, -50%) scale(0); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }

        .sliders-container {
          width: 100%;
          max-width: 300px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .slider-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .slider-label {
          width: 50px;
          font-size: 14px;
          color: #666;
        }

        .slider {
          flex: 1;
          height: 6px;
          border-radius: 3px;
          outline: none;
          -webkit-appearance: none;
          appearance: none;
          cursor: pointer;
        }

        .brightness-slider {
          background: linear-gradient(to right, #000000, ${color});
        }

        .saturation-slider {
          background: linear-gradient(to right, #ffffff, ${color});
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #667eea;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s ease;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #667eea;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider-value {
          width: 40px;
          font-size: 12px;
          color: #999;
          text-align: right;
        }

        .color-values {
          display: flex;
          gap: 24px;
          padding: 12px 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .color-value-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .value-label {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .value-text {
          font-size: 14px;
          color: #666;
          font-family: 'Courier New', monospace;
        }
      `}</style>
    </div>
  );
}
