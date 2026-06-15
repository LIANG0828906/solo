import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Product } from '../types';

export interface InventoryChartProps {
  products: Product[];
}

interface BarState {
  id: string;
  targetHeight: number;
  currentHeight: number;
  targetColorTop: string;
  targetColorBottom: string;
  currentColorTop: string;
  currentColorBottom: string;
  lowStock: boolean;
}

const parseRGB = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
};

const rgbToString = (r: number, g: number, b: number): string =>
  `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

const lerpColor = (from: string, to: string, t: number): string => {
  const [r1, g1, b1] = parseRGB(from);
  const [r2, g2, b2] = parseRGB(to);
  return rgbToString(
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t
  );
};

const GREEN_TOP = '#34D399';
const GREEN_BOTTOM = '#059669';
const RED_TOP = '#F87171';
const RED_BOTTOM = '#DC2626';
const COLOR_LERP_SPEED = 0.06;
const CHART_HEIGHT = 360;
const AXIS_HEIGHT = 50;
const BAR_GAP = 24;
const TOP_PADDING = 40;

const InventoryChart: React.FC<InventoryChartProps> = ({ products }) => {
  const [search, setSearch] = useState('');
  const [inputOpacity, setInputOpacity] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const barStatesRef = useRef<Map<string, BarState>>(new Map());
  const frameRef = useRef<number>(0);
  const productsRef = useRef<Product[]>([]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const lower = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(lower));
  }, [products, search]);

  useEffect(() => {
    productsRef.current = filteredProducts;
  }, [filteredProducts]);

  const handleClear = () => {
    setInputOpacity(0);
    setTimeout(() => {
      setSearch('');
      setInputOpacity(1);
    }, 200);
  };

  const getTargetColors = (stock: number): [string, string] => {
    return stock >= 5 ? [GREEN_TOP, GREEN_BOTTOM] : [RED_TOP, RED_BOTTOM];
  };

  const initOrUpdateBarStates = (items: Product[], maxHeight: number, maxStock: number) => {
    const currentStates = barStatesRef.current;
    const newIds = new Set(items.map((p) => p.id));

    items.forEach((p) => {
      const targetHeight = maxStock > 0 ? (p.stock / maxStock) * maxHeight : 0;
      const [targetColorTop, targetColorBottom] = getTargetColors(p.stock);
      const lowStock = p.stock < 5;

      const existing = currentStates.get(p.id);
      if (!existing) {
        currentStates.set(p.id, {
          id: p.id,
          targetHeight,
          currentHeight: 0,
          targetColorTop,
          targetColorBottom,
          currentColorTop: targetColorTop,
          currentColorBottom: targetColorBottom,
          lowStock,
        });
      } else {
        existing.targetHeight = targetHeight;
        existing.targetColorTop = targetColorTop;
        existing.targetColorBottom = targetColorBottom;
        existing.lowStock = lowStock;
      }
    });

    for (const key of Array.from(currentStates.keys())) {
      if (!newIds.has(key)) {
        currentStates.delete(key);
      }
    }
  };

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const items = productsRef.current;
    const chartAreaHeight = CHART_HEIGHT - AXIS_HEIGHT - TOP_PADDING;
    const baseY = TOP_PADDING + chartAreaHeight;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(width, baseY);
    ctx.stroke();

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('0', 4, baseY + 16);

    if (items.length === 0) {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据', width / 2, height / 2);
      animationRef.current = requestAnimationFrame(() => draw(ctx, width, height));
      return;
    }

    const totalGap = BAR_GAP * (items.length + 1);
    const availableWidth = width - totalGap;
    const barWidth = Math.max(20, availableWidth / items.length);

    const maxStock = Math.max(...items.map((p) => p.stock), 1);

    initOrUpdateBarStates(items, chartAreaHeight, maxStock);

    frameRef.current++;
    const wave = frameRef.current * 0.05;

    let needsNextFrame = false;

    items.forEach((p, i) => {
      const state = barStatesRef.current.get(p.id);
      if (!state) return;

      const hDiff = state.targetHeight - state.currentHeight;
      if (Math.abs(hDiff) > 0.5) {
        state.currentHeight += hDiff * 0.1;
        needsNextFrame = true;
      } else {
        state.currentHeight = state.targetHeight;
      }

      const topDiff = state.currentColorTop !== state.targetColorTop;
      const btmDiff = state.currentColorBottom !== state.targetColorBottom;
      if (topDiff || btmDiff) {
        state.currentColorTop = lerpColor(state.currentColorTop, state.targetColorTop, COLOR_LERP_SPEED);
        state.currentColorBottom = lerpColor(state.currentColorBottom, state.targetColorBottom, COLOR_LERP_SPEED);
        needsNextFrame = true;
      }

      let barYOffset = 0;
      if (state.lowStock) {
        barYOffset = Math.sin(wave + i * 0.7) * 3;
        needsNextFrame = true;
      }

      const x = BAR_GAP + i * (barWidth + BAR_GAP);
      const barHeight = state.currentHeight;
      const y = baseY - barHeight + barYOffset;

      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, state.currentColorTop);
      gradient.addColorStop(1, state.currentColorBottom);

      ctx.fillStyle = gradient;
      const radius = Math.min(6, barWidth / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, y + barHeight);
      ctx.lineTo(x, y + barHeight);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(p.stock), x + barWidth / 2, y - 8);

      ctx.fillStyle = '#6B7280';
      ctx.font = '11px system-ui, sans-serif';
      const maxNameWidth = barWidth;
      let displayName = p.name;
      if (ctx.measureText(displayName).width > maxNameWidth) {
        while (displayName.length > 0 && ctx.measureText(displayName + '...').width > maxNameWidth) {
          displayName = displayName.slice(0, -1);
        }
        displayName += '...';
      }
      ctx.fillText(displayName, x + barWidth / 2, baseY + 22);
    });

    if (needsNextFrame) {
      animationRef.current = requestAnimationFrame(() => draw(ctx, width, height));
    }
  };

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = CHART_HEIGHT;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    draw(ctx, width, height);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setupCanvas();

    const resizeObserver = new ResizeObserver(() => {
      setupCanvas();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    draw(ctx, width, height);
  }, [filteredProducts]);

  const searchContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#E8F0E8',
    borderRadius: '8px',
    padding: '10px 14px',
    marginBottom: '20px',
    gap: '10px',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '14px',
    color: '#111827',
    opacity: inputOpacity,
    transition: 'opacity 0.2s ease',
  };

  const clearButtonStyle: React.CSSProperties = {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#D1D5DB',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    flexShrink: 0,
    opacity: search ? 1 : 0,
    pointerEvents: search ? 'auto' : 'none',
  };

  const clearIconStyle: React.CSSProperties = {
    width: '14px',
    height: '14px',
    color: '#4B5563',
  };

  const canvasContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
  };

  return (
    <div>
      <div style={searchContainerStyle}>
        <input
          type="text"
          placeholder="搜索商品名称..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
        />
        <button
          style={clearButtonStyle}
          onClick={handleClear}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#9CA3AF';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#D1D5DB';
          }}
        >
          <X style={clearIconStyle} />
        </button>
      </div>
      <div ref={containerRef} style={canvasContainerStyle}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default InventoryChart;
