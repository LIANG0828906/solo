import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { HeatmapCell } from './DataQuery';

interface HeatmapCanvasProps {
  cells: HeatmapCell[];
  animKey: number;
}

interface CellDrawInfo {
  x: number;
  y: number;
  region: string;
  plays: number;
  color: string;
}

const GRID_COLS = 20;
const GRID_ROWS = 15;
const BASE_W = 400;
const BASE_H = 300;

export function HeatmapCanvas({ cells, animKey }: HeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const animProgressRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const [hoverCell, setHoverCell] = useState<{ x: number; y: number; plays: number; region: string } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dims, setDims] = useState({ w: BASE_W, h: BASE_H });

  useEffect(() => {
    const updateDims = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDims({ w: Math.max(rect.width, 300), h: Math.max(rect.height, 220) });
      }
    };
    updateDims();
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, [animKey]);

  const cellDrawData = useMemo(() => {
    const cellW = dims.w / GRID_COLS;
    const cellH = dims.h / GRID_ROWS;
    const playsMap = new Map<string, HeatmapCell>();
    cells.forEach(c => playsMap.set(`${c.x},${c.y}`, c));
    const maxPlays = Math.max(...cells.map(c => c.plays), 1);

    function getHeatColor(ratio: number): [number, number, number] {
      if (ratio <= 0) return [26, 26, 62];
      const clamped = Math.min(ratio, 1);
      if (clamped < 0.5) {
        const t = clamped * 2;
        return [
          Math.round(26 + t * (59 - 26)),
          Math.round(26 + t * (180 - 26)),
          Math.round(62 + t * (255 - 62))
        ];
      } else {
        const t = (clamped - 0.5) * 2;
        return [
          Math.round(59 + t * (255 - 59)),
          Math.round(180 + t * (140 - 180)),
          Math.round(255 - t * 255)
        ];
      }
    }

    const result: (CellDrawInfo | null)[][] = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      result[y] = [];
      for (let x = 0; x < GRID_COLS; x++) {
        const cell = playsMap.get(`${x},${y}`);
        if (cell) {
          const ratio = cell.plays / maxPlays;
          const [r, g, b] = getHeatColor(ratio);
          result[y][x] = {
            x: x * cellW,
            y: y * cellH,
            region: cell.region,
            plays: cell.plays,
            color: `rgb(${r},${g},${b})`
          };
        } else {
          const [r, g, b] = getHeatColor(0);
          result[y][x] = {
            x: x * cellW,
            y: y * cellH,
            region: '',
            plays: 0,
            color: `rgb(${r},${g},${b})`
          };
        }
      }
    }
    return { grid: result, cellW, cellH };
  }, [cells, dims]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const glowCanvas = glowCanvasRef.current;
    if (!canvas || !glowCanvas) return;
    const ctx = canvas.getContext('2d');
    const glowCtx = glowCanvas.getContext('2d');
    if (!ctx || !glowCtx) return;

    animProgressRef.current = 0;
    const startTime = performance.now();
    let hoverAnimProgress = 0;

    function draw(now: number) {
      timeRef.current = now;
      const elapsed = now - startTime;
      animProgressRef.current = Math.min(elapsed / 800, 1);
      const ap = 1 - Math.pow(1 - animProgressRef.current, 3);

      if (hoverCell) {
        hoverAnimProgress = Math.min(hoverAnimProgress + 0.15, 1);
      } else {
        hoverAnimProgress = Math.max(hoverAnimProgress - 0.15, 0);
      }

      ctx.clearRect(0, 0, dims.w, dims.h);
      glowCtx.clearRect(0, 0, dims.w, dims.h);

      const { grid, cellW, cellH } = cellDrawData;
      const hoverIndex = hoverCell ? `${hoverCell.x},${hoverCell.y}` : null;

      for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
          const info = grid[y][x];
          if (!info) continue;

          const cellKey = `${x},${y}`;
          const isHovered = hoverIndex === cellKey && info.plays > 0;
          const px = info.x;
          const py = info.y;
          const borderOffset = 0.5;

          let drawX = px + borderOffset;
          let drawY = py + borderOffset;
          let drawW = cellW - 1;
          let drawH = cellH - 1;

          if (isHovered) {
            const expand = 4 * hoverAnimProgress;
            drawX -= expand / 2;
            drawY -= expand / 2;
            drawW += expand;
            drawH += expand;

            glowCtx.save();
            glowCtx.shadowColor = '#00ffc3';
            glowCtx.shadowBlur = 20 * hoverAnimProgress;
            glowCtx.fillStyle = info.color;
            const r = 4;
            glowCtx.beginPath();
            glowCtx.moveTo(drawX + r, drawY);
            glowCtx.lineTo(drawX + drawW - r, drawY);
            glowCtx.quadraticCurveTo(drawX + drawW, drawY, drawX + drawW, drawY + r);
            glowCtx.lineTo(drawX + drawW, drawY + drawH - r);
            glowCtx.quadraticCurveTo(drawX + drawW, drawY + drawH, drawX + drawW - r, drawY + drawH);
            glowCtx.lineTo(drawX + r, drawY + drawH);
            glowCtx.quadraticCurveTo(drawX, drawY + drawH, drawX, drawY + drawH - r);
            glowCtx.lineTo(drawX, drawY + r);
            glowCtx.quadraticCurveTo(drawX, drawY, drawX + r, drawY);
            glowCtx.closePath();
            glowCtx.fill();
            glowCtx.restore();
          }

          const alpha = info.plays > 0 ? 0.3 + ap * 0.7 : 1;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = info.color;
          ctx.fillRect(drawX, drawY, drawW, drawH);
          ctx.globalAlpha = 1;

          ctx.strokeStyle = isHovered && hoverAnimProgress > 0.5
            ? `rgba(0,255,195,${0.3 + 0.5 * hoverAnimProgress})`
            : 'rgba(15,15,35,0.95)';
          ctx.lineWidth = isHovered ? 2 : 1;
          ctx.strokeRect(drawX, drawY, drawW, drawH);

          if (isHovered && hoverAnimProgress > 0.6) {
            const pulse = 0.5 + 0.5 * Math.sin(now / 200);
            ctx.save();
            ctx.strokeStyle = `rgba(0,255,195,${0.4 * pulse * hoverAnimProgress})`;
            ctx.lineWidth = 3;
            ctx.strokeRect(drawX - 1, drawY - 1, drawW + 2, drawH + 2);
            ctx.restore();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cellDrawData, dims, hoverCell]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = dims.w / rect.width;
    const scaleY = dims.h / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const cellW = dims.w / GRID_COLS;
    const cellH = dims.h / GRID_ROWS;
    const gx = Math.floor(mx / cellW);
    const gy = Math.floor(my / cellH);

    const { grid } = cellDrawData;
    if (gy >= 0 && gy < GRID_ROWS && gx >= 0 && gx < GRID_COLS) {
      const info = grid[gy]?.[gx];
      if (info && info.plays > 0) {
        setHoverCell({ x: gx, y: gy, plays: info.plays, region: info.region });
      } else {
        setHoverCell(null);
      }
    } else {
      setHoverCell(null);
    }
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  function handleMouseLeave() {
    setHoverCell(null);
  }

  return (
    <div
      ref={containerRef}
      key={animKey}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        animation: 'fadeSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <canvas
          ref={glowCanvasRef}
          width={dims.w}
          height={dims.h}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            filter: 'blur(6px)',
            opacity: 0.8
          }}
        />
        <canvas
          ref={canvasRef}
          width={dims.w}
          height={dims.h}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            borderRadius: 8
          }}
        />
      </div>

      {hoverCell && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(mousePos.x + 16, dims.w - 180),
            top: Math.max(mousePos.y - 70, 0),
            background: 'linear-gradient(135deg, #12122a 0%, #1a1a3e 100%)',
            border: '1px solid #00ffc3',
            borderRadius: 10,
            padding: '10px 14px',
            color: '#fff',
            fontSize: 12,
            pointerEvents: 'none',
            zIndex: 20,
            boxShadow: '0 8px 32px rgba(0,255,195,0.25), 0 0 20px rgba(0,255,195,0.15)',
            minWidth: 140,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
            paddingBottom: 6,
            borderBottom: '1px solid rgba(0,255,195,0.2)'
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#00ffc3',
              boxShadow: '0 0 8px #00ffc3',
              animation: 'pulse 1.5s ease infinite'
            }} />
            <span style={{ color: '#00ffc3', fontWeight: 700, fontSize: 13 }}>
              {hoverCell.region}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#8888aa', fontSize: 11 }}>播放量</span>
            <span style={{
              color: '#00d4ff',
              fontWeight: 700,
              fontSize: 15,
              fontVariantNumeric: 'tabular-nums'
            }}>
              {hoverCell.plays.toLocaleString()}
            </span>
          </div>
          <div style={{
            marginTop: 8,
            height: 4,
            borderRadius: 2,
            background: '#2a2a4e',
            overflow: 'hidden'
          }}>
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #00d4ff, #00ffc3)',
                borderRadius: 2,
                width: `${Math.min(100, (hoverCell.plays / (Math.max(...cells.map(c => c.plays), 1))) * 100)}%`,
                boxShadow: '0 0 8px #00ffc3'
              }}
            />
          </div>
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: 4,
        left: 8,
        right: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 9,
        color: '#666688'
      }}>
        <span>低</span>
        <div style={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          background: 'linear-gradient(90deg, #1a1a3e, #3bb4ff, #ff8c3c, #ff5a3c)',
          opacity: 0.7
        }} />
        <span>高</span>
      </div>
    </div>
  );
}
