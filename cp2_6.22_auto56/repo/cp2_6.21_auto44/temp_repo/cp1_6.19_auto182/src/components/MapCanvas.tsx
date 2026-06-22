import { useState, useRef, useEffect, useCallback } from 'react';
import { Waypoint, SegmentData, RouteData, scoreToColor } from '../utils/scoreEngine';

interface MapCanvasProps {
  route: RouteData | null;
  previewWaypoints?: Waypoint[] | null;
  opacity?: number;
}

interface HoverInfo {
  segmentIndex: number;
  segment: SegmentData;
  score: number;
  x: number;
  y: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDING = 60;
const HOVER_THRESHOLD = 12;

function waypointsToCanvasCoords(waypoints: Waypoint[]): { x: number; y: number }[] {
  if (waypoints.length === 0) return [];

  const minLat = Math.min(...waypoints.map((w) => w.lat));
  const maxLat = Math.max(...waypoints.map((w) => w.lat));
  const minLng = Math.min(...waypoints.map((w) => w.lng));
  const maxLng = Math.max(...waypoints.map((w) => w.lng));

  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  const drawWidth = CANVAS_WIDTH - 2 * PADDING;
  const drawHeight = CANVAS_HEIGHT - 2 * PADDING;

  const scaleX = drawWidth / lngRange;
  const scaleY = drawHeight / latRange;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = PADDING + (drawWidth - lngRange * scale) / 2;
  const offsetY = PADDING + (drawHeight - latRange * scale) / 2;

  return waypoints.map((w) => ({
    x: offsetX + (w.lng - minLng) * scale,
    y: offsetY + (maxLat - w.lat) * scale,
  }));
}

function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    const ddx = px - x1;
    const ddy = py - y1;
    return Math.sqrt(ddx * ddx + ddy * ddy);
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  const ddx = px - projX;
  const ddy = py - projY;
  return Math.sqrt(ddx * ddx + ddy * ddy);
}

export default function MapCanvas({ route, previewWaypoints, opacity = 1 }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#F0F7E6';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = '#E8F0DC';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    if (previewWaypoints && previewWaypoints.length > 1) {
      const coords = waypointsToCanvasCoords(previewWaypoints);
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#9E9E9E';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(coords[0].x, coords[0].y);
      for (let i = 1; i < coords.length; i++) {
        ctx.lineTo(coords[i].x, coords[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    if (route && route.waypoints.length > 1) {
      const coords = waypointsToCanvasCoords(route.waypoints);
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4;

      for (let i = 0; i < coords.length - 1; i++) {
        const score = route.scores?.[i] ?? 50;
        ctx.strokeStyle = scoreToColor(score);
        ctx.beginPath();
        ctx.moveTo(coords[i].x, coords[i].y);
        ctx.lineTo(coords[i + 1].x, coords[i + 1].y);
        ctx.stroke();
      }

      for (let i = 0; i < coords.length; i++) {
        ctx.beginPath();
        ctx.arc(coords[i].x, coords[i].y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#2E7D32';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (coords.length > 0) {
        const start = coords[0];
        ctx.beginPath();
        ctx.arc(start.x, start.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#43A047';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        const end = coords[coords.length - 1];
        ctx.beginPath();
        ctx.arc(end.x, end.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#E53935';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(end.x, end.y - 8);
        ctx.lineTo(end.x + 12, end.y - 4);
        ctx.lineTo(end.x, end.y);
        ctx.closePath();
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }

      ctx.restore();
    }
  }, [route, previewWaypoints, opacity]);

  useEffect(() => {
    let lastTime = 0;
    const frameInterval = 1000 / 30;

    const loop = (timestamp: number) => {
      const delta = timestamp - lastTime;
      if (delta >= frameInterval) {
        lastTime = timestamp - (delta % frameInterval);
        draw();
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [draw]);

  useEffect(() => {
    const handleResize = () => {
      draw();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!route || route.waypoints.length < 2 || !route.segments?.length) {
        setHoverInfo(null);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const coords = waypointsToCanvasCoords(route.waypoints);
      let closestDist = Infinity;
      let closestIndex = -1;

      for (let i = 0; i < coords.length - 1; i++) {
        const dist = pointToSegmentDistance(
          mx,
          my,
          coords[i].x,
          coords[i].y,
          coords[i + 1].x,
          coords[i + 1].y
        );
        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = i;
        }
      }

      if (closestDist <= HOVER_THRESHOLD && closestIndex >= 0 && closestIndex < route.segments.length) {
        setHoverInfo({
          segmentIndex: closestIndex,
          segment: route.segments[closestIndex],
          score: route.scores?.[closestIndex] ?? 0,
          x: e.clientX,
          y: e.clientY,
        });
      } else {
        setHoverInfo(null);
      }
    },
    [route]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      />
      {hoverInfo && (
        <div
          style={{
            position: 'fixed',
            left: hoverInfo.x + 12,
            top: hoverInfo.y - 12,
            background: '#FFFFFF',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            padding: 12,
            fontSize: 13,
            zIndex: 1000,
            pointerEvents: 'none',
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            路段 {hoverInfo.segmentIndex + 1} 评分
          </div>
          <div>坡度: {hoverInfo.segment.slope}%</div>
          <div>树荫率: {hoverInfo.segment.treeCoverage}%</div>
          <div>路面平整度: {hoverInfo.segment.surfaceQuality}%</div>
          <div>车流量: {hoverInfo.segment.trafficVolume}%</div>
          <div>综合评分: {hoverInfo.score}</div>
        </div>
      )}
    </div>
  );
}
