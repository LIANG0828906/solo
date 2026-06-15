import React, { useCallback, useRef, useEffect, useState } from 'react';
import { hexToRgb, hexToRgbString, hexToHsl, hslToHex } from './utils';

interface ColorPickerProps {
  label: string;
  colorKey: string;
  value: string;
  onChange: (key: string, color: string) => void;
}

const ColorPicker = React.memo(function ColorPicker({ label, colorKey, value, onChange }: ColorPickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hueCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const isHueDragging = useRef(false);
  const [hue, setHue] = useState(() => hexToHsl(value).h);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [pressing, setPressing] = useState<string | null>(null);
  const [glowActive, setGlowActive] = useState(false);

  const rgb = hexToRgb(value);
  const rgbStr = hexToRgbString(value);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    const hueColor = hslToHex({ h: hue, s: 100, l: 50 });
    ctx.fillStyle = hueColor;
    ctx.fillRect(0, 0, w, h);

    const whiteGrad = ctx.createLinearGradient(0, 0, w, 0);
    whiteGrad.addColorStop(0, 'rgba(255,255,255,1)');
    whiteGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = whiteGrad;
    ctx.fillRect(0, 0, w, h);

    const blackGrad = ctx.createLinearGradient(0, 0, 0, h);
    blackGrad.addColorStop(0, 'rgba(0,0,0,0)');
    blackGrad.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = blackGrad;
    ctx.fillRect(0, 0, w, h);
  }, [hue]);

  const drawHueStrip = useCallback(() => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    const grad = ctx.createLinearGradient(0, 0, w, 0);
    for (let i = 0; i <= 6; i++) {
      grad.addColorStop(i / 6, hslToHex({ h: i * 60, s: 100, l: 50 }));
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.beginPath();
    const hueX = (hue / 360) * w;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.roundRect(hueX - 4, 0, 8, h, 2);
    ctx.stroke();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.roundRect(hueX - 4, 0, 8, h, 2);
    ctx.stroke();
  }, [hue]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    drawHueStrip();
  }, [drawHueStrip]);

  const pickColor = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
    const sx = x / rect.width;
    const sy = y / rect.height;

    const s = Math.round(sx * 100);
    const l = Math.round((1 - sy) * 50 * (1 + sx * 0) + (1 - sx) * (100 - (1 - sy) * 50));
    const lightness = Math.round(100 - sy * 100 + (sx * sy * 50));

    const newColor = hslToHex({ h: hue, s, l: Math.max(0, Math.min(100, lightness)) });
    onChange(colorKey, newColor);
    setGlowActive(true);
    setTimeout(() => setGlowActive(false), 300);
  }, [hue, colorKey, onChange]);

  const pickHue = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const newHue = (x / rect.width) * 360;
    setHue(newHue);
    const currentHsl = hexToHsl(value);
    const newColor = hslToHex({ h: newHue, s: currentHsl.s, l: currentHsl.l });
    onChange(colorKey, newColor);
  }, [value, colorKey, onChange]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    pickColor(e);
  }, [pickColor]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    pickColor(e);
  }, [pickColor]);

  const handleCanvasMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleHueMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isHueDragging.current = true;
    pickHue(e);
  }, [pickHue]);

  const handleHueMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isHueDragging.current) return;
    pickHue(e);
  }, [pickHue]);

  const handleHueMouseUp = useCallback(() => {
    isHueDragging.current = false;
  }, []);

  useEffect(() => {
    const handleUp = () => {
      isDragging.current = false;
      isHueDragging.current = false;
    };
    window.addEventListener('mouseup', handleUp);
    return () => window.removeEventListener('mouseup', handleUp);
  }, []);

  const handleNativeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(colorKey, e.target.value);
    const hsl = hexToHsl(e.target.value);
    setHue(hsl.h);
    setGlowActive(true);
    setTimeout(() => setGlowActive(false), 300);
  }, [colorKey, onChange]);

  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setPressing(field);
      setTimeout(() => setCopiedField(null), 1500);
      setTimeout(() => setPressing(null), 100);
    });
  }, []);

  return (
    <div style={{
      marginBottom: 20,
      padding: 16,
      backgroundColor: 'rgba(22, 33, 62, 0.6)',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.08)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: glowActive ? '200%' : '0%',
        height: glowActive ? '200%' : '0%',
        backgroundColor: value,
        borderRadius: '50%',
        opacity: glowActive ? 0.15 : 0,
        transition: 'all 0.3s ease-out',
        pointerEvents: 'none',
        filter: 'blur(30px)',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          backgroundColor: value,
          boxShadow: `0 0 8px ${value}80`,
          flexShrink: 0,
        }} />
        <span style={{ color: '#e0e0e0', fontSize: 13, fontWeight: 600 }}>{label}</span>
      </div>

      <div style={{ position: 'relative', marginBottom: 8 }}>
        <canvas
          ref={canvasRef}
          width={288}
          height={160}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          style={{
            width: '100%',
            height: 120,
            borderRadius: 8,
            cursor: 'crosshair',
            display: 'block',
          }}
        />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 14,
          height: 14,
          borderRadius: '50%',
          border: '2px solid white',
          boxShadow: '0 0 4px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          transform: 'translate(-50%, -50%)',
        }} />
      </div>

      <canvas
        ref={hueCanvasRef}
        width={288}
        height={16}
        onMouseDown={handleHueMouseDown}
        onMouseMove={handleHueMouseMove}
        onMouseUp={handleHueMouseUp}
        style={{
          width: '100%',
          height: 12,
          borderRadius: 6,
          cursor: 'pointer',
          display: 'block',
          marginBottom: 10,
        }}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
          <code style={{ color: '#c0c0c0', fontSize: 11, fontFamily: 'monospace', flex: 1 }}>
            {value.toUpperCase()}
          </code>
          <button
            onClick={() => copyToClipboard(value.toUpperCase(), `${colorKey}-hex`)}
            style={{
              padding: '2px 6px',
              fontSize: 10,
              backgroundColor: copiedField === `${colorKey}-hex` ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
              color: copiedField === `${colorKey}-hex` ? '#4ade80' : '#a0a0a0',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              transform: pressing === `${colorKey}-hex` ? 'scale(0.85)' : 'scale(1)',
              transition: 'transform 0.1s ease, background-color 0.15s, color 0.15s',
            }}
          >
            {copiedField === `${colorKey}-hex` ? '✓' : 'Copy'}
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
          <code style={{ color: '#c0c0c0', fontSize: 11, fontFamily: 'monospace', flex: 1 }}>
            {rgbStr}
          </code>
          <button
            onClick={() => copyToClipboard(rgbStr, `${colorKey}-rgb`)}
            style={{
              padding: '2px 6px',
              fontSize: 10,
              backgroundColor: copiedField === `${colorKey}-rgb` ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
              color: copiedField === `${colorKey}-rgb` ? '#4ade80' : '#a0a0a0',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              transform: pressing === `${colorKey}-rgb` ? 'scale(0.85)' : 'scale(1)',
              transition: 'transform 0.1s ease, background-color 0.15s, color 0.15s',
            }}
          >
            {copiedField === `${colorKey}-rgb` ? '✓' : 'Copy'}
          </button>
        </div>
      </div>

      <input
        type="color"
        value={value}
        onChange={handleNativeChange}
        style={{
          width: '100%',
          height: 28,
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          backgroundColor: 'transparent',
        }}
      />
    </div>
  );
});

export default ColorPicker;
