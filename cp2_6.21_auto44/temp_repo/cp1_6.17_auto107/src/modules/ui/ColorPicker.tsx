import { useRef, useEffect, useCallback, useState } from 'react';
import type { HSLColor } from '@/modules/colorEngine/colorSpace';
import { hslToRgb, hslToHex } from '@/modules/colorEngine/colorSpace';
import { useGameStore } from '@/store/gameStore';

interface ColorPickerProps {
  onColorChange: (color: HSLColor) => void;
  currentColor: HSLColor;
}

export default function ColorPicker({ onColorChange, currentColor }: ColorPickerProps) {
  const hueCanvasRef = useRef<HTMLCanvasElement>(null);
  const slCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDraggingHue, setIsDraggingHue] = useState(false);
  const [isDraggingSL, setIsDraggingSL] = useState(false);
  const submitMatch = useGameStore(s => s.submitMatch);
  const currentBlockIndex = useGameStore(s => s.currentBlockIndex);
  const targetBlocks = useGameStore(s => s.targetBlocks);

  const HUE_SIZE = 180;
  const HUE_CENTER = HUE_SIZE / 2;
  const OUTER_R = 85;
  const INNER_R = 65;
  const SL_SIZE = 180;

  const drawHueRing = useCallback(() => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, HUE_SIZE, HUE_SIZE);

    for (let angle = 0; angle < 360; angle++) {
      const startRad = (angle - 1) * Math.PI / 180;
      const endRad = (angle + 1) * Math.PI / 180;
      const rgb = hslToRgb(angle, 100, 50);
      ctx.beginPath();
      ctx.arc(HUE_CENTER, HUE_CENTER, OUTER_R, startRad, endRad);
      ctx.arc(HUE_CENTER, HUE_CENTER, INNER_R, endRad, startRad, true);
      ctx.closePath();
      ctx.fillStyle = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
      ctx.fill();
    }

    const previewR = INNER_R - 8;
    const gradient = ctx.createRadialGradient(HUE_CENTER, HUE_CENTER, 0, HUE_CENTER, HUE_CENTER, previewR);
    gradient.addColorStop(0, hslToHex(currentColor.h, currentColor.s, currentColor.l));
    gradient.addColorStop(1, hslToHex(currentColor.h, currentColor.s, currentColor.l));
    ctx.beginPath();
    ctx.arc(HUE_CENTER, HUE_CENTER, previewR, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    const whiteGrad = ctx.createRadialGradient(HUE_CENTER, HUE_CENTER, 0, HUE_CENTER, HUE_CENTER, previewR);
    whiteGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
    whiteGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(HUE_CENTER, HUE_CENTER, previewR, 0, Math.PI * 2);
    ctx.fillStyle = whiteGrad;
    ctx.fill();

    const hueRad = (currentColor.h - 90) * Math.PI / 180;
    const midR = (OUTER_R + INNER_R) / 2;
    const ix = HUE_CENTER + Math.cos(hueRad) * midR;
    const iy = HUE_CENTER + Math.sin(hueRad) * midR;
    ctx.beginPath();
    ctx.arc(ix, iy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [currentColor]);

  const drawSLPanel = useCallback(() => {
    const canvas = slCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(SL_SIZE, SL_SIZE);
    const data = imageData.data;
    for (let y = 0; y < SL_SIZE; y++) {
      for (let x = 0; x < SL_SIZE; x++) {
        const s = (x / (SL_SIZE - 1)) * 100;
        const l = ((SL_SIZE - 1 - y) / (SL_SIZE - 1)) * 100;
        const rgb = hslToRgb(currentColor.h, s, l);
        const idx = (y * SL_SIZE + x) * 4;
        data[idx] = rgb.r;
        data[idx + 1] = rgb.g;
        data[idx + 2] = rgb.b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);

    const sx = (currentColor.s / 100) * (SL_SIZE - 1);
    const sy = ((100 - currentColor.l) / 100) * (SL_SIZE - 1);
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [currentColor]);

  useEffect(() => {
    drawHueRing();
  }, [drawHueRing]);

  useEffect(() => {
    drawSLPanel();
  }, [drawSLPanel]);

  const getHueFromPos = (clientX: number, clientY: number): number => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return currentColor.h;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left - HUE_CENTER;
    const y = clientY - rect.top - HUE_CENTER;
    let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    return angle;
  };

  const getSLFromPos = (clientX: number, clientY: number): { s: number; l: number } => {
    const canvas = slCanvasRef.current;
    if (!canvas) return { s: currentColor.s, l: currentColor.l };
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(SL_SIZE - 1, clientX - rect.left));
    const y = Math.max(0, Math.min(SL_SIZE - 1, clientY - rect.top));
    const s = (x / (SL_SIZE - 1)) * 100;
    const l = ((SL_SIZE - 1 - y) / (SL_SIZE - 1)) * 100;
    return { s, l };
  };

  const handleHueMouseDown = (e: React.MouseEvent) => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - HUE_CENTER;
    const y = e.clientY - rect.top - HUE_CENTER;
    const dist = Math.sqrt(x * x + y * y);
    if (dist >= INNER_R - 5 && dist <= OUTER_R + 5) {
      setIsDraggingHue(true);
      const h = getHueFromPos(e.clientX, e.clientY);
      onColorChange({ h, s: currentColor.s, l: currentColor.l });
    }
  };

  const handleSLMouseDown = (e: React.MouseEvent) => {
    setIsDraggingSL(true);
    const { s, l } = getSLFromPos(e.clientX, e.clientY);
    onColorChange({ h: currentColor.h, s, l });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingHue) {
        const h = getHueFromPos(e.clientX, e.clientY);
        onColorChange({ h, s: currentColor.s, l: currentColor.l });
      }
      if (isDraggingSL) {
        const { s, l } = getSLFromPos(e.clientX, e.clientY);
        onColorChange({ h: currentColor.h, s, l });
      }
    };
    const handleMouseUp = () => {
      setIsDraggingHue(false);
      setIsDraggingSL(false);
    };
    if (isDraggingHue || isDraggingSL) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingHue, isDraggingSL, currentColor, onColorChange]);

  const isAllMatched = currentBlockIndex >= targetBlocks.length;

  return (
    <div style={{
      width: 280,
      background: '#F5F0E8',
      borderRadius: 16,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
    }}>
      <canvas
        ref={hueCanvasRef}
        width={HUE_SIZE}
        height={HUE_SIZE}
        style={{ cursor: 'pointer', touchAction: 'none' }}
        onMouseDown={handleHueMouseDown}
      />
      <canvas
        ref={slCanvasRef}
        width={SL_SIZE}
        height={SL_SIZE}
        style={{ cursor: 'crosshair', borderRadius: 8, touchAction: 'none' }}
        onMouseDown={handleSLMouseDown}
      />
      <div style={{
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
      }}>
        当前: {hslToHex(currentColor.h, currentColor.s, currentColor.l)}
      </div>
      <button
        onClick={() => submitMatch(currentColor)}
        disabled={isAllMatched}
        style={{
          background: isAllMatched ? '#ccc' : '#FF6B6B',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 6,
          padding: '10px 32px',
          fontSize: 15,
          cursor: isAllMatched ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={e => { if (!isAllMatched) (e.target as HTMLButtonElement).style.background = '#E55A5A'; }}
        onMouseLeave={e => { if (!isAllMatched) (e.target as HTMLButtonElement).style.background = '#FF6B6B'; }}
      >
        提交
      </button>
    </div>
  );
}
