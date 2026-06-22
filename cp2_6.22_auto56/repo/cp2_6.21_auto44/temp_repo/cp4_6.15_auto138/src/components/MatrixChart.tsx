import { useRef, useEffect, useState, useCallback } from 'react';
import type { Idea } from '../types';

interface MatrixChartProps {
  ideas: Idea[];
  onUpdateScore: (ideaId: string, feasibility: number, influence: number) => void;
  onScoresRecalculated?: () => void;
}

interface TooltipData {
  title: string;
  feasibility: number;
  influence: number;
  x: number;
  y: number;
}

const groupColors: Record<string, string> = {
  'pending': '#00bcd4',
  'in-progress': '#ff9800',
  'completed': '#4caf50'
};

function MatrixChart({ ideas, onUpdateScore, onScoresRecalculated }: MatrixChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [canvasSize] = useState({ width: 300, height: 300 });
  const padding = 40;
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const getChartCoords = useCallback((feasibility: number, influence: number) => {
    const chartWidth = canvasSize.width - padding * 2;
    const chartHeight = canvasSize.height - padding * 2;
    const x = padding + (feasibility / 100) * chartWidth;
    const y = canvasSize.height - padding - (influence / 100) * chartHeight;
    return { x, y };
  }, [canvasSize, padding]);

  const getScoreFromCoords = useCallback((x: number, y: number) => {
    const chartWidth = canvasSize.width - padding * 2;
    const chartHeight = canvasSize.height - padding * 2;
    const feasibility = Math.max(0, Math.min(100, ((x - padding) / chartWidth) * 100));
    const influence = Math.max(0, Math.min(100, ((canvasSize.height - padding - y) / chartHeight) * 100));
    return { feasibility, influence };
  }, [canvasSize, padding]);

  const drawMatrix = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    ctx.fillStyle = '#fafbfc';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * (canvasSize.width - padding * 2);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvasSize.height - padding);
      ctx.stroke();

      const y = padding + (i / 10) * (canvasSize.height - padding * 2);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvasSize.width - padding, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, canvasSize.width - padding * 2, canvasSize.height - padding * 2);

    ctx.fillStyle = '#888';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('可行性 →', canvasSize.width / 2, canvasSize.height - 12);

    ctx.save();
    ctx.translate(15, canvasSize.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('影响力 →', 0, 0);
    ctx.restore();

    ctx.fillStyle = '#aaa';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('0', padding, canvasSize.height - padding + 16);
    ctx.fillText('100', canvasSize.width - padding, canvasSize.height - padding + 16);

    ctx.textAlign = 'right';
    ctx.fillText('0', padding - 6, canvasSize.height - padding + 3);
    ctx.fillText('100', padding - 6, padding + 3);

    ideas.forEach(idea => {
      if (idea.matrixScore.feasibility === 0 && idea.matrixScore.influence === 0) {
        return;
      }

      const { x, y } = getChartCoords(idea.matrixScore.feasibility, idea.matrixScore.influence);
      const color = groupColors[idea.group] || '#999';
      const radius = draggingId === idea.id ? 10 : 7;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
      gradient.addColorStop(0, color + '40');
      gradient.addColorStop(1, color + '00');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [ideas, canvasSize, padding, getChartCoords, draggingId]);

  useEffect(() => {
    drawMatrix();
  }, [drawMatrix]);

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const dpr = window.devicePixelRatio || 1;

    const canvasX = (e.clientX - rect.left) * (canvasSize.width / rect.width);
    const canvasY = (e.clientY - rect.top) * (canvasSize.height / rect.height);

    return { x: canvasX, y: canvasY };
  }, [canvasSize]);

  const findIdeaAtPosition = useCallback((x: number, y: number): Idea | null => {
    for (let i = ideas.length - 1; i >= 0; i--) {
      const idea = ideas[i];
      if (idea.matrixScore.feasibility === 0 && idea.matrixScore.influence === 0) continue;

      const coords = getChartCoords(idea.matrixScore.feasibility, idea.matrixScore.influence);
      const distance = Math.sqrt((x - coords.x) ** 2 + (y - coords.y) ** 2);
      if (distance < 15) {
        return idea;
      }
    }
    return null;
  }, [ideas, getChartCoords]);

  const triggerScoreRecalculation = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      if (onScoresRecalculated) {
        onScoresRecalculated();
      }
    }, 500);
  }, [onScoresRecalculated]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    if (draggingId) {
      const { feasibility, influence } = getScoreFromCoords(x, y);
      onUpdateScore(draggingId, Math.round(feasibility), Math.round(influence));
      const idea = ideas.find(i => i.id === draggingId);
      if (idea) {
        setTooltip({
          title: idea.title,
          feasibility: Math.round(feasibility),
          influence: Math.round(influence),
          x: e.clientX,
          y: e.clientY
        });
      }
    } else {
      const idea = findIdeaAtPosition(x, y);
      if (idea) {
        setTooltip({
          title: idea.title,
          feasibility: Math.round(idea.matrixScore.feasibility),
          influence: Math.round(idea.matrixScore.influence),
          x: e.clientX,
          y: e.clientY
        });
      } else {
        setTooltip(null);
      }
    }
  }, [draggingId, findIdeaAtPosition, getCanvasCoords, getScoreFromCoords, onUpdateScore, ideas]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    const idea = findIdeaAtPosition(x, y);
    if (idea) {
      setDraggingId(idea.id);
      setDragStartPos({ x, y });
    }
  }, [findIdeaAtPosition, getCanvasCoords]);

  const handleMouseUp = useCallback(() => {
    if (draggingId) {
      triggerScoreRecalculation();
    }
    setDraggingId(null);
    setDragStartPos(null);
  }, [draggingId, triggerScoreRecalculation]);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    if (draggingId) {
      triggerScoreRecalculation();
    }
    setDraggingId(null);
    setDragStartPos(null);
  }, [draggingId, triggerScoreRecalculation]);

  return (
    <div ref={containerRef} className="matrix-canvas-container">
      <canvas
        ref={canvasRef}
        className="matrix-canvas"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      {tooltip && (
        <div
          className="tooltip"
          style={{
            left: tooltip.x + 15,
            top: tooltip.y - 10
          }}
        >
          <div className="tooltip-title">{tooltip.title}</div>
          <div className="tooltip-score">
            可行性: {tooltip.feasibility} | 影响力: {tooltip.influence}
          </div>
        </div>
      )}
    </div>
  );
}

export default MatrixChart;
