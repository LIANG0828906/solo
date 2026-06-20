import React, { useRef, useEffect, useCallback } from 'react';
import { ColorHSL, hslToHex, HUE_MARKS } from './types';
import { useColorStore } from './store';

interface ColorWheelProps {
  size?: number;
}

const ColorWheel: React.FC<ColorWheelProps> = ({ size = 420 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hueAnchorRef = useRef({ x: 0, y: 0 });
  const svAnchorRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef<'hue' | 'sv' | null>(null);
  const animatingRef = useRef(false);

  const currentHSL = useColorStore((s) => s.currentHSL);
  const currentHEX = useColorStore((s) => s.currentHEX);
  const setCurrentColor = useColorStore((s) => s.setCurrentColor);

  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size / 2 - 10;
  const hueRingWidth = 40;
  const innerRadius = outerRadius - hueRingWidth;
  const svTriangleRadius = innerRadius - 15;

  const hueToXY = useCallback(
    (hue: number) => {
      const rad = ((hue - 90) * Math.PI) / 180;
      const r = outerRadius - hueRingWidth / 2;
      return {
        x: centerX + r * Math.cos(rad),
        y: centerY + r * Math.sin(rad),
      };
    },
    [centerX, centerY, outerRadius, hueRingWidth]
  );

  const hsvToXY = useCallback(
    (h: number, s: number, v: number) => {
      const angle = ((h - 90) * Math.PI) / 180;
      const topX = centerX + svTriangleRadius * Math.cos(angle);
      const topY = centerY + svTriangleRadius * Math.sin(angle);
      const rightAngle = angle + (120 * Math.PI) / 180;
      const rightX = centerX + svTriangleRadius * Math.cos(rightAngle);
      const rightY = centerY + svTriangleRadius * Math.sin(rightAngle);
      const leftAngle = angle - (120 * Math.PI) / 180;
      const leftX = centerX + svTriangleRadius * Math.cos(leftAngle);
      const leftY = centerY + svTriangleRadius * Math.sin(leftAngle);

      const u = s;
      const vv = v;
      const w = 1 - u - vv;

      return {
        x: Math.max(leftX, Math.min(rightX, topX * vv + rightX * u + leftX * w)),
        y: Math.max(leftY, Math.min(rightY, topY * vv + rightY * u + leftY * w)),
      };
    },
    [centerX, centerY, svTriangleRadius]
  );

  const xyToHue = useCallback(
    (x: number, y: number) => {
      const dx = x - centerX;
      const dy = y - centerY;
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;
      return angle % 360;
    },
    [centerX, centerY]
  );

  const xyToSV = useCallback(
    (x: number, y: number, hue: number) => {
      const angle = ((hue - 90) * Math.PI) / 180;
      const topX = centerX + svTriangleRadius * Math.cos(angle);
      const topY = centerY + svTriangleRadius * Math.sin(angle);
      const rightAngle = angle + (120 * Math.PI) / 180;
      const rightX = centerX + svTriangleRadius * Math.cos(rightAngle);
      const rightY = centerY + svTriangleRadius * Math.sin(rightAngle);
      const leftAngle = angle - (120 * Math.PI) / 180;
      const leftX = centerX + svTriangleRadius * Math.cos(leftAngle);
      const leftY = centerY + svTriangleRadius * Math.sin(leftAngle);

      const denom =
        topX * (rightY - leftY) + rightX * (leftY - topY) + leftX * (topY - rightY);
      const s =
        (topX * (y - leftY) + x * (leftY - topY) + leftX * (topY - y)) / denom;
      const v =
        (x * (rightY - leftY) + rightX * (leftY - y) + leftX * (y - rightY)) / denom;

      const clampedS = Math.max(0, Math.min(1, s));
      const clampedV = Math.max(0, Math.min(1, v));

      return { s: clampedS, v: clampedV };
    },
    [centerX, centerY, svTriangleRadius]
  );

  const hsvToHsl = (h: number, s: number, v: number): ColorHSL => {
    const l = v - (v * s) / 2;
    const sHsl = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
    return {
      h: Math.round(h),
      s: Math.round(sHsl * 100),
      l: Math.round(l * 100),
    };
  };

  const hslToHsv = (h: number, s: number, l: number) => {
    const sNorm = s / 100;
    const lNorm = l / 100;
    const v = lNorm + sNorm * Math.min(lNorm, 1 - lNorm);
    const sV = v === 0 ? 0 : 2 - (2 * lNorm) / v;
    return { h, s: sV, v };
  };

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    for (let angle = 0; angle < 360; angle += 0.5) {
      const startAngle = ((angle - 0.25 - 90) * Math.PI) / 180;
      const endAngle = ((angle + 0.25 - 90) * Math.PI) / 180;

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = `hsl(${angle}, 100%, 50%)`;
      ctx.fill();
    }

    HUE_MARKS.forEach((mark) => {
      const pos = hueToXY(mark.h);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    const hue = currentHSL.h;
    const hsv = hslToHsv(currentHSL.h, currentHSL.s, currentHSL.l);
    const s = hsv.s;
    const v = hsv.v;

    const angle = ((hue - 90) * Math.PI) / 180;
    const topX = centerX + svTriangleRadius * Math.cos(angle);
    const topY = centerY + svTriangleRadius * Math.sin(angle);
    const rightAngle = angle + (120 * Math.PI) / 180;
    const rightX = centerX + svTriangleRadius * Math.cos(rightAngle);
    const rightY = centerY + svTriangleRadius * Math.sin(rightAngle);
    const leftAngle = angle - (120 * Math.PI) / 180;
    const leftX = centerX + svTriangleRadius * Math.cos(leftAngle);
    const leftY = centerY + svTriangleRadius * Math.sin(leftAngle);

    const hueColor = hslToHex(hue, 100, 50);

    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      for (let j = 0; j <= steps - i; j++) {
        const u = i / steps;
        const vv = j / steps;
        const w = 1 - u - vv;
        if (w < 0) continue;

        const x1 = topX * vv + rightX * u + leftX * w;
        const y1 = topY * vv + rightY * u + leftY * w;

        const nextI = (i + 1) / steps;
        const nextJ = (j + 1) / steps;
        const x2 = topX * nextJ + rightX * nextI + leftX * (1 - nextI - nextJ);
        const y2 = topY * nextJ + rightY * nextI + leftY * (1 - nextI - nextJ);

        const cellSize = Math.max(
          Math.abs(x2 - x1) + Math.abs(y2 - y1),
          (svTriangleRadius * 2) / steps
        );

        const sat = u;
        const val = vv;

        const valRgb = interpolateColor('#FFFFFF', hueColor, sat);
        const finalColor = interpolateColor('#000000', valRgb, 1 - val);

        ctx.beginPath();
        ctx.arc(x1, y1, cellSize * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = finalColor;
        ctx.fill();
      }
    }

    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(rightX, rightY);
    ctx.lineTo(leftX, leftY);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const huePos = hueToXY(hue);
    hueAnchorRef.current = huePos;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.arc(huePos.x, huePos.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
    ctx.strokeStyle = '#1A1A2E';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    const svPos = hsvToXY(hue, s, v);
    svAnchorRef.current = svPos;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.arc(svPos.x, svPos.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
    ctx.strokeStyle = '#1A1A2E';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }, [
    size,
    centerX,
    centerY,
    outerRadius,
    innerRadius,
    hueRingWidth,
    svTriangleRadius,
    currentHSL,
    hueToXY,
    hsvToXY,
  ]);

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const interpolateColor = (c1: string, c2: string, t: number): string => {
    const rgb1 = hexToRgb(c1);
    const rgb2 = hexToRgb(c2);
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
  };

  const getMousePos = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
      clientY = e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = useCallback(
    (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const pos = getMousePos(e);
      const distToCenter = getDistance(pos.x, pos.y, centerX, centerY);

      if (distToCenter >= innerRadius && distToCenter <= outerRadius) {
        isDraggingRef.current = 'hue';
      } else if (distToCenter <= svTriangleRadius + 20) {
        const hue = currentHSL.h;
        const angle = ((hue - 90) * Math.PI) / 180;
        const topX = centerX + svTriangleRadius * Math.cos(angle);
        const topY = centerY + svTriangleRadius * Math.sin(angle);
        const rightAngle = angle + (120 * Math.PI) / 180;
        const rightX = centerX + svTriangleRadius * Math.cos(rightAngle);
        const rightY = centerY + svTriangleRadius * Math.sin(rightAngle);
        const leftAngle = angle - (120 * Math.PI) / 180;
        const leftX = centerX + svTriangleRadius * Math.cos(leftAngle);
        const leftY = centerY + svTriangleRadius * Math.sin(leftAngle);

        const area =
          Math.abs(
            (rightX - leftX) * (topY - leftY) - (topX - leftX) * (rightY - leftY)
          ) / 2;
        const a1 =
          Math.abs(
            (rightX - leftX) * (pos.y - leftY) - (pos.x - leftX) * (rightY - leftY)
          ) / 2;
        const a2 =
          Math.abs(
            (pos.x - leftX) * (topY - leftY) - (topX - leftX) * (pos.y - leftY)
          ) / 2;
        const a3 =
          Math.abs(
            (rightX - pos.x) * (topY - pos.y) - (topX - pos.x) * (rightY - pos.y)
          ) / 2;

        if (Math.abs(a1 + a2 + a3 - area) < 50) {
          isDraggingRef.current = 'sv';
        }
      }

      if (isDraggingRef.current) {
        animatingRef.current = true;
        updateFromPointer(pos);
      }
    },
    [centerX, centerY, innerRadius, outerRadius, svTriangleRadius, currentHSL.h]
  );

  const updateFromPointer = (pos: { x: number; y: number }) => {
    if (isDraggingRef.current === 'hue') {
      const hue = xyToHue(pos.x, pos.y);
      const newHSL = { h: hue, s: currentHSL.s, l: currentHSL.l };
      setCurrentColor(newHSL);
    } else if (isDraggingRef.current === 'sv') {
      const sv = xyToSV(pos.x, pos.y, currentHSL.h);
      const newHSL = hsvToHsl(currentHSL.h, sv.s, sv.v);
      setCurrentColor(newHSL);
    }
  };

  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const pos = getMousePos(e);
      updateFromPointer(pos);
    },
    [currentHSL, setCurrentColor, xyToHue, xyToSV]
  );

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = null;
    animatingRef.current = false;
  }, []);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none',
          maxWidth: '100%',
          height: 'auto',
        }}
      />
      <div
        style={{
          width: 160,
          height: 80,
          borderRadius: 12,
          border: '2px solid #3D3D55',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: currentHEX,
          transition: 'background-color 0.3s ease',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        <span
          style={{
            fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
            fontSize: 24,
            fontWeight: 600,
            color: '#E0E0E0',
            letterSpacing: 2,
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          {currentHEX}
        </span>
      </div>
    </div>
  );
};

export default ColorWheel;
