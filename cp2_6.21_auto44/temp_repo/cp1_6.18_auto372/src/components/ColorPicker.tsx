import { useEffect, useRef, useState } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  label: string;
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }
  return { h, s, v };
}

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export default function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const wheelRef = useRef<HTMLCanvasElement>(null);
  const svRef = useRef<HTMLCanvasElement>(null);
  const [hsv, setHsv] = useState<{ h: number; s: number; v: number }>(() =>
    /^#[0-9A-Fa-f]{6}$/.test(value) ? hexToHsv(value) : { h: 0, s: 0, v: 1 },
  );
  const draggingRef = useRef<'wheel' | 'sv' | null>(null);

  useEffect(() => {
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setHsv(hexToHsv(value));
    }
  }, [value]);

  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;
    const ctx = wheel.getContext('2d');
    if (!ctx) return;
    const w = wheel.width;
    const h = wheel.height;
    const cx = w / 2;
    const cy = h / 2;
    const outer = Math.min(cx, cy) - 2;
    const inner = outer - 18;
    ctx.clearRect(0, 0, w, h);
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = ((angle - 1) * Math.PI) / 180;
      const endAngle = ((angle + 1) * Math.PI) / 180;
      const grad = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
      grad.addColorStop(0, hsvToHex(angle, 1, 1));
      grad.addColorStop(1, hsvToHex(angle, 1, 1));
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(startAngle) * inner, cy + Math.sin(startAngle) * inner);
      ctx.arc(cx, cy, outer, startAngle, endAngle);
      ctx.lineTo(cx + Math.cos(endAngle) * inner, cy + Math.sin(endAngle) * inner);
      ctx.arc(cx, cy, inner, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }
    const hr = (hsv.h * Math.PI) / 180;
    const r = (outer + inner) / 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(hr) * r, cy + Math.sin(hr) * r, 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [hsv.h]);

  useEffect(() => {
    const sv = svRef.current;
    if (!sv) return;
    const ctx = sv.getContext('2d');
    if (!ctx) return;
    const w = sv.width;
    const h = sv.height;
    const hueHex = hsvToHex(hsv.h, 1, 1);
    const gradH = ctx.createLinearGradient(0, 0, w, 0);
    gradH.addColorStop(0, '#fff');
    gradH.addColorStop(1, hueHex);
    ctx.fillStyle = gradH;
    ctx.fillRect(0, 0, w, h);
    const gradV = ctx.createLinearGradient(0, 0, 0, h);
    gradV.addColorStop(0, 'rgba(0,0,0,0)');
    gradV.addColorStop(1, '#000');
    ctx.fillStyle = gradV;
    ctx.fillRect(0, 0, w, h);
    const px = hsv.s * w;
    const py = (1 - hsv.v) * h;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [hsv]);

  const handleWheelDown = (e: React.MouseEvent) => {
    draggingRef.current = 'wheel';
    handleWheelMove(e);
  };

  const handleWheelMove = (e: React.MouseEvent | MouseEvent) => {
    if (draggingRef.current !== 'wheel') return;
    const wheel = wheelRef.current;
    if (!wheel) return;
    const rect = wheel.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const x = e.clientX - rect.left - cx;
    const y = e.clientY - rect.top - cy;
    let angle = (Math.atan2(y, x) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    const newHsv = { ...hsv, h: angle };
    setHsv(newHsv);
    onChange(hsvToHex(newHsv.h, newHsv.s, newHsv.v));
  };

  const handleSVDown = (e: React.MouseEvent) => {
    draggingRef.current = 'sv';
    handleSVMove(e);
  };

  const handleSVMove = (e: React.MouseEvent | MouseEvent) => {
    if (draggingRef.current !== 'sv') return;
    const sv = svRef.current;
    if (!sv) return;
    const rect = sv.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const s = x / rect.width;
    const v = 1 - y / rect.height;
    const newHsv = { ...hsv, s, v };
    setHsv(newHsv);
    onChange(hsvToHex(newHsv.h, newHsv.s, newHsv.v));
  };

  useEffect(() => {
    const handleUp = () => (draggingRef.current = null);
    const handleMove = (e: MouseEvent) => {
      handleWheelMove(e);
      handleSVMove(e);
    };
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('mousemove', handleMove);
    };
  }, [hsv]);

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 13,
          color: '#555',
          fontWeight: 500,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {label}
        <div
          style={{
            width: 24,
            height: 20,
            borderRadius: 4,
            background: /^#/.test(value) ? value : '#FFF',
            border: '1px solid #DDD',
          }}
        />
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#888' }}>{value}</span>
      </div>
      <div style={{ position: 'relative', width: 200, height: 100 }}>
        <canvas
          ref={wheelRef}
          width={200}
          height={100}
          style={{ cursor: 'crosshair', position: 'absolute', left: 0, top: 0, transition: 'none' }}
          onMouseDown={handleWheelDown}
        />
        <canvas
          ref={svRef}
          width={80}
          height={80}
          style={{
            cursor: 'crosshair',
            position: 'absolute',
            left: 110,
            top: 10,
            borderRadius: 4,
            transition: 'none',
          }}
          onMouseDown={handleSVDown}
        />
      </div>
    </div>
  );
}
