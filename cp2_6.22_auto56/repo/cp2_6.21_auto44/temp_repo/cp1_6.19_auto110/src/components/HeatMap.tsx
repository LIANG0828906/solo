import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FaSync } from 'react-icons/fa';
import type { Seat } from '../hooks/useSseData';

interface HeatMapProps {
  open: boolean;
  onClose: () => void;
  seats: Seat[];
  rows: number;
  cols: number;
}

const HEATMAP_COLORS = [
  { pos: 0, color: [33, 150, 243] },
  { pos: 0.5, color: [255, 193, 7] },
  { pos: 1, color: [211, 47, 47] },
];

const interpolateColor = (t: number): [number, number, number] => {
  for (let i = 0; i < HEATMAP_COLORS.length - 1; i++) {
    const c1 = HEATMAP_COLORS[i];
    const c2 = HEATMAP_COLORS[i + 1];
    if (t >= c1.pos && t <= c2.pos) {
      const localT = (t - c1.pos) / (c2.pos - c1.pos);
      return [
        Math.round(c1.color[0] + (c2.color[0] - c1.color[0]) * localT),
        Math.round(c1.color[1] + (c2.color[1] - c1.color[1]) * localT),
        Math.round(c1.color[2] + (c2.color[2] - c1.color[2]) * localT),
      ];
    }
  }
  return HEATMAP_COLORS[HEATMAP_COLORS.length - 1].color as [number, number, number];
};

export const HeatMap: React.FC<HeatMapProps> = ({ open, onClose, seats, rows, cols }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showRefreshOverlay, setShowRefreshOverlay] = useState(false);
  const autoRefreshRef = useRef<number | null>(null);

  const CELL_SIZE = 30;
  const PADDING = 20;
  const canvasWidth = cols * CELL_SIZE + PADDING * 2;
  const canvasHeight = rows * CELL_SIZE + PADDING * 2;

  const renderHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || seats.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startTime = performance.now();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gridDensity: number[][] = [];
    for (let r = 0; r < rows; r++) {
      gridDensity[r] = [];
      for (let c = 0; c < cols; c++) {
        gridDensity[r][c] = 0;
      }
    }

    const checkedSeats = seats.filter(s => s.checkedIn);
    checkedSeats.forEach((seat) => {
      const radius = 2;
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const nr = seat.row + dr;
          const nc = seat.col + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            const dist = Math.sqrt(dr * dr + dc * dc);
            const contribution = Math.max(0, 1 - dist / (radius + 1));
            gridDensity[nr][nc] += contribution;
          }
        }
      }
    });

    let maxDensity = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (gridDensity[r][c] > maxDensity) {
          maxDensity = gridDensity[r][c];
        }
      }
    }

    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    for (let py = 0; py < canvas.height; py++) {
      for (let px = 0; px < canvas.width; px++) {
        const idx = (py * canvas.width + px) * 4;

        if (px < PADDING || px >= canvas.width - PADDING || py < PADDING || py >= canvas.height - PADDING) {
          data[idx] = 245;
          data[idx + 1] = 245;
          data[idx + 2] = 245;
          data[idx + 3] = 255;
          continue;
        }

        const localX = px - PADDING;
        const localY = py - PADDING;
        const colF = localX / CELL_SIZE;
        const rowF = localY / CELL_SIZE;
        const c0 = Math.floor(colF);
        const r0 = Math.floor(rowF);

        let density = 0;
        if (r0 >= 0 && r0 < rows && c0 >= 0 && c0 < cols) {
          density = gridDensity[r0][c0];
        }

        const t = maxDensity > 0 ? Math.min(1, density / maxDensity) : 0;
        const [r, g, b] = interpolateColor(t);

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    for (let r = 0; r <= rows; r++) {
      const y = PADDING + r * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(PADDING, y);
      ctx.lineTo(canvas.width - PADDING, y);
      ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
      const x = PADDING + c * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(x, PADDING);
      ctx.lineTo(x, canvas.height - PADDING);
      ctx.stroke();
    }

    const renderTime = performance.now() - startTime;
    if (renderTime > 30) {
      console.warn(`热力图渲染耗时: ${renderTime.toFixed(2)}ms，超过30ms阈值`);
    }
  }, [seats, rows, cols, canvasWidth, canvasHeight, CELL_SIZE, PADDING]);

  const triggerRefresh = useCallback(() => {
    setShowRefreshOverlay(true);
    renderHeatmap();
    setTimeout(() => setShowRefreshOverlay(false), 400);
  }, [renderHeatmap]);

  useEffect(() => {
    if (!open) {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
      return;
    }

    triggerRefresh();

    autoRefreshRef.current = window.setInterval(() => {
      triggerRefresh();
    }, 15000);

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
    };
  }, [open, triggerRefresh]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">座位热力分布图</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="legend">
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#2196F3' }} />
            <span>稀疏区域</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#FFC107' }} />
            <span>中等密度</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#D32F2F' }} />
            <span>密集区域</span>
          </div>
        </div>

        <div className="heatmap-canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
          />
          {showRefreshOverlay && <div className="heatmap-refresh-overlay" />}
        </div>

        <div className="modal-actions">
          <button
            className="refresh-btn"
            onClick={triggerRefresh}
            title="手动刷新"
          >
            <FaSync />
          </button>
        </div>
      </div>
    </div>
  );
};
