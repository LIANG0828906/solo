import React, { useRef, useEffect, useCallback } from 'react';
import { KEYBOARD_LAYOUT, KEYBOARD_ROWS, KEYBOARD_COLS } from '../data/keyboardLayout';
import { KeyColor } from '../types';

interface KeyboardMapProps {
  colorScheme: Record<string, KeyColor>;
  selectedKeyId: string | null;
  onSelectKey: (keyId: string) => void;
}

interface ComputedKey {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

const GAP = 2;
const CORNER_RADIUS = 4;
const PADDING = 16;

export const KeyboardMap: React.FC<KeyboardMapProps> = ({
  colorScheme,
  selectedKeyId,
  onSelectKey,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const computedKeysRef = useRef<ComputedKey[]>([]);
  const unitSizeRef = useRef<number>(1);

  const drawKeyboard = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const baseUnitByWidth = (containerWidth - PADDING * 2 - GAP * (KEYBOARD_COLS - 1)) / KEYBOARD_COLS;
    const baseUnitByHeight = (containerHeight - PADDING * 2 - GAP * (KEYBOARD_ROWS - 1)) / KEYBOARD_ROWS;
    const unitSize = Math.max(8, Math.min(baseUnitByWidth, baseUnitByHeight));
    unitSizeRef.current = unitSize;

    const boardWidth = unitSize * KEYBOARD_COLS + GAP * (KEYBOARD_COLS - 1) + PADDING * 2;
    const boardHeight = unitSize * KEYBOARD_ROWS + GAP * (KEYBOARD_ROWS - 1) + PADDING * 2;

    canvas.width = boardWidth * dpr;
    canvas.height = boardHeight * dpr;
    canvas.style.width = `${boardWidth}px`;
    canvas.style.height = `${boardHeight}px`;
    ctx.scale(dpr, dpr);

    // 键盘底座
    const baseGrad = ctx.createLinearGradient(0, 0, 0, boardHeight);
    baseGrad.addColorStop(0, '#F0F0F0');
    baseGrad.addColorStop(1, '#D0D0D0');
    ctx.fillStyle = baseGrad;
    roundRect(ctx, 0, 0, boardWidth, boardHeight, 10);
    ctx.fill();

    // 底座阴影/边框
    ctx.strokeStyle = '#B8B8B8';
    ctx.lineWidth = 1;
    roundRect(ctx, 0.5, 0.5, boardWidth - 1, boardHeight - 1, 10);
    ctx.stroke();

    const computed: ComputedKey[] = [];

    KEYBOARD_LAYOUT.forEach((key) => {
      const w = unitSize * key.width + GAP * (key.width - 1);
      const h = unitSize;
      const x = PADDING + key.col * (unitSize + GAP);
      const y = PADDING + key.row * (unitSize + GAP);
      const kc = colorScheme[key.id];
      computed.push({
        id: key.id,
        label: key.label,
        x,
        y,
        w,
        h,
        color: kc?.color ?? '#FFFFFF',
      });

      const isSelected = key.id === selectedKeyId;
      drawKey(ctx, x, y, w, h, computed[computed.length - 1].color, key.label, isSelected);
    });

    computedKeysRef.current = computed;
  }, [colorScheme, selectedKeyId]);

  const drawKey = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    label: string,
    isSelected: boolean
  ) => {
    // 按键底部阴影
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    roundRect(ctx, x + 1, y + 2, w, h, CORNER_RADIUS);
    ctx.fill();

    // 按键主体
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, lightenColor(color, 0.1));
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, w, h, CORNER_RADIUS);
    ctx.fill();

    // 按键边框
    ctx.strokeStyle = isSelected ? '#4A88FF' : 'rgba(0,0,0,0.25)';
    ctx.lineWidth = isSelected ? 2.5 : 1;
    roundRect(ctx, x + (isSelected ? 0.25 : 0.5), y + (isSelected ? 0.25 : 0.5),
      w - (isSelected ? 0.5 : 1), h - (isSelected ? 0.5 : 1), CORNER_RADIUS);
    ctx.stroke();

    // 选中发光
    if (isSelected) {
      ctx.save();
      ctx.shadowColor = 'rgba(80, 140, 255, 0.6)';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = 'rgba(100, 160, 255, 0.8)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, x, y, w, h, CORNER_RADIUS);
      ctx.stroke();
      ctx.restore();
    }

    // 标签文字
    if (label) {
      const fontSize = Math.max(8, Math.min(14, w * 0.22, h * 0.42));
      ctx.fillStyle = getTextColor(color);
      ctx.font = `600 ${fontSize}px 'Segoe UI', -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + w / 2, y + h / 2);
    }
  };

  const lightenColor = (hex: string, amount: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const nr = Math.min(255, Math.round(r + (255 - r) * amount));
    const ng = Math.min(255, Math.round(g + (255 - g) * amount));
    const nb = Math.min(255, Math.round(b + (255 - b) * amount));
    return `rgb(${nr}, ${ng}, ${nb})`;
  };

  const getTextColor = (bgHex: string): string => {
    const r = parseInt(bgHex.slice(1, 3), 16);
    const g = parseInt(bgHex.slice(3, 5), 16);
    const b = parseInt(bgHex.slice(5, 7), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.55 ? '#1a1a1a' : '#f0f0f0';
  };

  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) * scaleX / dpr;
    const y = (e.clientY - rect.top) * scaleY / dpr;

    for (const k of computedKeysRef.current) {
      if (x >= k.x && x <= k.x + k.w && y >= k.y && y <= k.y + k.h) {
        onSelectKey(k.id);
        break;
      }
    }
  };

  useEffect(() => {
    drawKeyboard();
    const handleResize = () => drawKeyboard();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawKeyboard]);

  return (
    <div ref={containerRef} className="canvas-wrapper">
      <canvas ref={canvasRef} onClick={handleClick} />
    </div>
  );
};

export default KeyboardMap;
