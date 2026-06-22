import { useRef, useCallback, useMemo, useEffect } from 'react';
import type {
  Point2D,
  HallConfig,
  Showcase,
  Exhibit,
  VisitorStart,
  VisitorPath,
} from '../types';

interface UseCanvasOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

interface UseCanvasReturn {
  ctx: CanvasRenderingContext2D | null;
  clear: () => void;
  drawGrid: (hall: HallConfig, scale: number, offset: Point2D) => void;
  drawShowcase: (
    showcase: Showcase,
    scale: number,
    offset: Point2D,
    selected: boolean
  ) => void;
  drawExhibit: (
    exhibit: Exhibit,
    showcase: Showcase,
    scale: number,
    offset: Point2D,
    selected: boolean
  ) => void;
  drawVisitorStart: (
    start: VisitorStart,
    scale: number,
    offset: Point2D
  ) => void;
  drawPath: (
    path: VisitorPath,
    progress: number,
    scale: number,
    offset: Point2D
  ) => void;
  drawHeatmap: (
    heatmapCanvas: HTMLCanvasElement | null,
    opacity: number,
    offset: Point2D
  ) => void;
  worldToScreen: (
    point: Point2D,
    scale: number,
    offset: Point2D
  ) => { x: number; y: number };
  screenToWorld: (
    screenX: number,
    screenY: number,
    scale: number,
    offset: Point2D
  ) => Point2D;
}

export const useCanvas = ({ canvasRef }: UseCanvasOptions): UseCanvasReturn => {
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      ctxRef.current = canvas.getContext('2d');
    }
  }, [canvasRef]);

  const ctx = useMemo(() => ctxRef.current, [canvasRef]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const context = ctxRef.current;
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  }, [canvasRef]);

  const worldToScreen = useCallback(
    (point: Point2D, scale: number, offset: Point2D) => ({
      x: point.x * scale + offset.x,
      y: point.y * scale + offset.y,
    }),
    []
  );

  const screenToWorld = useCallback(
    (screenX: number, screenY: number, scale: number, offset: Point2D): Point2D => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const x = (screenX - rect.left - offset.x) / scale;
      const y = (screenY - rect.top - offset.y) / scale;

      return { x, y };
    },
    [canvasRef]
  );

  const drawGrid = useCallback(
    (hall: HallConfig, scale: number, offset: Point2D) => {
      const context = ctxRef.current;
      const canvas = canvasRef.current;
      if (!context || !canvas) return;

      context.save();
      context.strokeStyle = 'rgba(200, 200, 200, 0.3)';
      context.lineWidth = 1;

      const { width, height, gridSize } = hall;
      const cols = Math.ceil(width / gridSize);
      const rows = Math.ceil(height / gridSize);

      for (let i = 0; i <= cols; i++) {
        const x = i * gridSize * scale + offset.x;
        context.beginPath();
        context.moveTo(x, offset.y);
        context.lineTo(x, height * scale + offset.y);
        context.stroke();
      }

      for (let j = 0; j <= rows; j++) {
        const y = j * gridSize * scale + offset.y;
        context.beginPath();
        context.moveTo(offset.x, y);
        context.lineTo(width * scale + offset.x, y);
        context.stroke();
      }

      context.strokeStyle = '#333';
      context.lineWidth = 2;
      context.strokeRect(
        offset.x,
        offset.y,
        width * scale,
        height * scale
      );

      context.restore();
    },
    [canvasRef]
  );

  const drawShowcase = useCallback(
    (showcase: Showcase, scale: number, offset: Point2D, selected: boolean) => {
      const context = ctxRef.current;
      if (!context) return;

      const { position, width, depth, rotation, color } = showcase;
      const centerX = position.x * scale + offset.x;
      const centerY = position.y * scale + offset.y;
      const halfWidth = (width * scale) / 2;
      const halfDepth = (depth * scale) / 2;

      context.save();
      context.translate(centerX, centerY);
      context.rotate((rotation * Math.PI) / 180);

      context.fillStyle = color + '80';
      context.strokeStyle = color;
      context.lineWidth = 2;

      context.beginPath();
      context.rect(-halfWidth, -halfDepth, width * scale, depth * scale);
      context.fill();
      context.stroke();

      if (selected) {
        context.strokeStyle = '#FFD700';
        context.lineWidth = 3;
        context.strokeRect(-halfWidth, -halfDepth, width * scale, depth * scale);

        const handleRadius = 8;
        const handleDistance = Math.max(halfWidth, halfDepth) + 20;

        context.fillStyle = '#FFD700';
        context.beginPath();
        context.arc(handleDistance, 0, handleRadius, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = '#FFD700';
        context.lineWidth = 2;
        context.setLineDash([5, 5]);
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(handleDistance, 0);
        context.stroke();
        context.setLineDash([]);
      }

      context.restore();
    },
    []
  );

  const drawExhibit = useCallback(
    (
      exhibit: Exhibit,
      showcase: Showcase,
      scale: number,
      offset: Point2D,
      selected: boolean
    ) => {
      const context = ctxRef.current;
      if (!context) return;

      const { position, type, color } = exhibit;
      const { position: showcasePos, rotation } = showcase;

      const rad = (rotation * Math.PI) / 180;
      const rotatedX = position.x * Math.cos(rad) - position.y * Math.sin(rad);
      const rotatedY = position.x * Math.sin(rad) + position.y * Math.cos(rad);

      const worldX = showcasePos.x + rotatedX;
      const worldY = showcasePos.y + rotatedY;
      const screenX = worldX * scale + offset.x;
      const screenY = worldY * scale + offset.y;
      const size = 15;

      context.save();

      if (selected) {
        context.strokeStyle = '#FFD700';
        context.lineWidth = 3;
        context.beginPath();
        context.arc(screenX, screenY, size + 5, 0, Math.PI * 2);
        context.stroke();
      }

      context.fillStyle = color;
      context.strokeStyle = '#333';
      context.lineWidth = 2;

      switch (type) {
        case 'sculpture':
          context.beginPath();
          context.arc(screenX, screenY, size, 0, Math.PI * 2);
          context.fill();
          context.stroke();
          break;

        case 'painting':
          context.beginPath();
          context.rect(screenX - size, screenY - size * 0.7, size * 2, size * 1.4);
          context.fill();
          context.stroke();
          break;

        case 'jewelry':
          context.beginPath();
          context.moveTo(screenX, screenY - size);
          context.lineTo(screenX + size, screenY);
          context.lineTo(screenX, screenY + size);
          context.lineTo(screenX - size, screenY);
          context.closePath();
          context.fill();
          context.stroke();
          break;
      }

      context.restore();
    },
    []
  );

  const drawVisitorStart = useCallback(
    (start: VisitorStart, scale: number, offset: Point2D) => {
      const context = ctxRef.current;
      if (!context) return;

      const { position, radius } = start;
      const screenX = position.x * scale + offset.x;
      const screenY = position.y * scale + offset.y;
      const screenRadius = radius * scale;

      context.save();

      const gradient = context.createRadialGradient(
        screenX,
        screenY,
        0,
        screenX,
        screenY,
        screenRadius * 2
      );
      gradient.addColorStop(0, 'rgba(76, 175, 80, 0.8)');
      gradient.addColorStop(0.5, 'rgba(76, 175, 80, 0.4)');
      gradient.addColorStop(1, 'rgba(76, 175, 80, 0)');

      context.fillStyle = gradient;
      context.beginPath();
      context.arc(screenX, screenY, screenRadius * 2, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = '#4CAF50';
      context.strokeStyle = '#2E7D32';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      context.fillStyle = '#FFF';
      context.font = 'bold 12px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('S', screenX, screenY);

      context.restore();
    },
    []
  );

  const drawPath = useCallback(
    (path: VisitorPath, progress: number, scale: number, offset: Point2D) => {
      const context = ctxRef.current;
      if (!context || path.points.length < 2) return;

      const clampedProgress = Math.max(0, Math.min(1, progress));
      const totalPoints = path.points.length;
      const endIndex = Math.floor((totalPoints - 1) * clampedProgress);
      const remainder = ((totalPoints - 1) * clampedProgress) % 1;

      context.save();
      context.strokeStyle = 'rgba(255, 213, 79, 0.6)';
      context.lineWidth = 4;
      context.lineCap = 'round';
      context.lineJoin = 'round';

      context.beginPath();

      const firstPoint = path.points[0];
      const firstScreen = {
        x: firstPoint.position.x * scale + offset.x,
        y: firstPoint.position.y * scale + offset.y,
      };
      context.moveTo(firstScreen.x, firstScreen.y);

      for (let i = 1; i <= endIndex; i++) {
        const point = path.points[i];
        const screen = {
          x: point.position.x * scale + offset.x,
          y: point.position.y * scale + offset.y,
        };
        context.lineTo(screen.x, screen.y);
      }

      if (remainder > 0 && endIndex < totalPoints - 1) {
        const current = path.points[endIndex];
        const next = path.points[endIndex + 1];

        const currentScreen = {
          x: current.position.x * scale + offset.x,
          y: current.position.y * scale + offset.y,
        };
        const nextScreen = {
          x: next.position.x * scale + offset.x,
          y: next.position.y * scale + offset.y,
        };

        const interpolated = {
          x: currentScreen.x + (nextScreen.x - currentScreen.x) * remainder,
          y: currentScreen.y + (nextScreen.y - currentScreen.y) * remainder,
        };

        context.lineTo(interpolated.x, interpolated.y);
      }

      context.stroke();

      if (endIndex >= 0) {
        const lastPoint = path.points[Math.min(endIndex, totalPoints - 1)];
        const lastScreen = {
          x: lastPoint.position.x * scale + offset.x,
          y: lastPoint.position.y * scale + offset.y,
        };

        context.fillStyle = '#FFD54F';
        context.beginPath();
        context.arc(lastScreen.x, lastScreen.y, 6, 0, Math.PI * 2);
        context.fill();
      }

      context.restore();
    },
    []
  );

  const drawHeatmap = useCallback(
    (heatmapCanvas: HTMLCanvasElement | null, opacity: number, offset: Point2D) => {
      const context = ctxRef.current;
      const canvas = canvasRef.current;
      if (!context || !canvas || !heatmapCanvas) return;

      context.save();
      context.globalAlpha = opacity;
      context.drawImage(
        heatmapCanvas,
        offset.x,
        offset.y,
        canvas.width,
        canvas.height
      );
      context.restore();
    },
    [canvasRef]
  );

  return {
    ctx,
    clear,
    drawGrid,
    drawShowcase,
    drawExhibit,
    drawVisitorStart,
    drawPath,
    drawHeatmap,
    worldToScreen,
    screenToWorld,
  };
};
