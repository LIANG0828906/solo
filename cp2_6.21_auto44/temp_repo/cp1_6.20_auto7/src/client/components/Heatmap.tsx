import React, { useEffect, useRef, useCallback } from 'react';
import type { HeatmapPoint } from '../types';

interface HeatmapProps {
  data: HeatmapPoint[];
  width?: number;
  height?: number;
  minValue?: number;
  maxValue?: number;
}

export const Heatmap: React.FC<HeatmapProps> = ({
  data,
  width = 800,
  height = 300,
  minValue = 0,
  maxValue = 100
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastRenderTimeRef = useRef<number>(0);
  const dataRef = useRef<HeatmapPoint[]>(data);
  const gridDataRef = useRef<number[][]>([]);

  const GRID_SIZE = 20;
  const COLS = Math.ceil(width / GRID_SIZE);
  const ROWS = Math.ceil(height / GRID_SIZE);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const initializeGrid = useCallback(() => {
    const grid: number[][] = [];
    for (let i = 0; i < ROWS; i++) {
      grid[i] = [];
      for (let j = 0; j < COLS; j++) {
        grid[i][j] = 0;
      }
    }
    gridDataRef.current = grid;
  }, [COLS, ROWS]);

  const aggregateData = useCallback(() => {
    const grid = gridDataRef.current;
    const now = Date.now();
    const timeWindow = 60000;

    for (let i = 0; i < ROWS; i++) {
      for (let j = 0; j < COLS; j++) {
        grid[i][j] *= 0.95;
      }
    }

    dataRef.current.forEach((point) => {
      if (now - point.timestamp < timeWindow) {
        const col = Math.min(Math.floor(point.x / GRID_SIZE), COLS - 1);
        const row = Math.min(Math.floor(point.y / GRID_SIZE), ROWS - 1);
        if (row >= 0 && col >= 0 && row < ROWS && col < COLS) {
          grid[row][col] = Math.min(grid[row][col] + point.value, maxValue);
        }
      }
    });
  }, [COLS, ROWS, maxValue]);

  const getColor = useCallback((value: number, min: number, max: number): string => {
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
    
    const r = Math.floor(26 + normalized * 233);
    const g = Math.floor(26 + normalized * 69);
    const b = Math.floor(46 + normalized * 96);
    const a = 0.3 + normalized * 0.7;

    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }, []);

  const render = useCallback((timestamp: number) => {
    const minFps = 6;
    const maxInterval = 1000 / minFps;

    if (timestamp - lastRenderTimeRef.current < maxInterval) {
      animationFrameRef.current = requestAnimationFrame(render);
      return;
    }

    lastRenderTimeRef.current = timestamp;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    aggregateData();
    const grid = gridDataRef.current;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * GRID_SIZE, 0);
      ctx.lineTo(i * GRID_SIZE, height);
      ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * GRID_SIZE);
      ctx.lineTo(width, i * GRID_SIZE);
      ctx.stroke();
    }

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const value = grid[row][col];
        if (value > minValue) {
          const color = getColor(value, minValue, maxValue);
          const x = col * GRID_SIZE;
          const y = row * GRID_SIZE;
          
          const gradient = ctx.createRadialGradient(
            x + GRID_SIZE / 2, y + GRID_SIZE / 2, 0,
            x + GRID_SIZE / 2, y + GRID_SIZE / 2, GRID_SIZE
          );
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x - GRID_SIZE / 2, y - GRID_SIZE / 2, GRID_SIZE * 2, GRID_SIZE * 2);
        }
      }
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '12px monospace';
    ctx.fillText('时间 →', width - 60, height - 10);

    animationFrameRef.current = requestAnimationFrame(render);
  }, [width, height, minValue, maxValue, aggregateData, getColor, COLS, ROWS]);

  useEffect(() => {
    initializeGrid();
    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [initializeGrid, render]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-[#16213e] border border-white/10">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block w-full"
        style={{ aspectRatio: `${width}/${height}` }}
      />
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#e94560] animate-pulse" />
        <span className="text-xs text-gray-400">实时反馈热力图</span>
      </div>
      <div className="absolute bottom-3 left-3 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-4 h-2 rounded bg-gradient-to-r from-[#1a1a2e] to-[#e94560]" />
          <span>低密度 → 高密度</span>
        </div>
      </div>
    </div>
  );
};
