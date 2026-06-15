import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  PitchPoint,
  Marker,
  drawGrid,
  drawWaveform,
  drawSpectrum,
  drawPitchCurve,
  drawControlHandles,
  drawMarkerDiamonds,
  drawPlayhead,
  startAnimationLoop,
} from '../utils/drawHelpers';

interface AudioVisualizerProps {
  timeData: Uint8Array;
  freqData: Uint8Array;
  pitchCurve: PitchPoint[];
  onPitchCurveChange: (points: PitchPoint[]) => void;
  markers: Marker[];
  onMarkersChange: (markers: Marker[]) => void;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  flashMarkerId: string | null;
  editMode: boolean;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export default function AudioVisualizer({
  timeData,
  freqData,
  pitchCurve,
  onPitchCurveChange,
  markers,
  onMarkersChange,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  flashMarkerId,
  editMode,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const animTimeRef = useRef<number>(0);
  const stopLoopRef = useRef<(() => void) | null>(null);

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0, normX: 0, normY: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      return {
        x,
        y,
        normX: x / canvas.width,
        normY: y / canvas.height,
      };
    },
    []
  );

  const findNearbyPoint = useCallback(
    (normX: number, normY: number, threshold: number = 0.03): PitchPoint | null => {
      let closest: PitchPoint | null = null;
      let minDist = threshold;
      for (const p of pitchCurve) {
        const dist = Math.sqrt((p.x - normX) ** 2 + (p.y - normY) ** 2);
        if (dist < minDist) {
          minDist = dist;
          closest = p;
        }
      }
      return closest;
    },
    [pitchCurve]
  );

  const findNearbyMarker = useCallback(
    (normX: number, threshold: number = 0.02): Marker | null => {
      if (duration <= 0) return null;
      const clickTime = normX * duration;
      let closest: Marker | null = null;
      let minDist = threshold * duration;
      for (const m of markers) {
        const dist = Math.abs(m.time - clickTime);
        if (dist < minDist) {
          minDist = dist;
          closest = m;
        }
      }
      return closest;
    },
    [markers, duration]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (duration <= 0) return;
      const { normX, normY } = getCanvasCoords(e);

      if (editMode) {
        const nearby = findNearbyPoint(normX, normY);
        if (nearby) {
          setDraggingPointId(nearby.id);
        } else {
          const newPoint: PitchPoint = {
            id: generateId(),
            x: Math.max(0, Math.min(1, normX)),
            y: Math.max(0, Math.min(1, normY)),
          };
          onPitchCurveChange([...pitchCurve, newPoint]);
          setDraggingPointId(newPoint.id);
        }
      } else {
        const nearbyMarker = findNearbyMarker(normX);
        if (nearbyMarker) {
          setDraggingMarkerId(nearbyMarker.id);
        } else {
          const clickTime = normX * duration;
          onSeek(clickTime);
        }
      }
    },
    [
      duration,
      editMode,
      getCanvasCoords,
      findNearbyPoint,
      findNearbyMarker,
      onPitchCurveChange,
      pitchCurve,
      onSeek,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (draggingPointId) {
        const { normX, normY } = getCanvasCoords(e);
        onPitchCurveChange(
          pitchCurve.map((p) =>
            p.id === draggingPointId
              ? { ...p, x: Math.max(0, Math.min(1, normX)), y: Math.max(0, Math.min(1, normY)) }
              : p
          )
        );
      } else if (draggingMarkerId && duration > 0) {
        const { normX } = getCanvasCoords(e);
        const newTime = Math.max(0, Math.min(duration, normX * duration));
        onMarkersChange(
          markers.map((m) => (m.id === draggingMarkerId ? { ...m, time: newTime } : m))
        );
      }
    },
    [
      draggingPointId,
      draggingMarkerId,
      duration,
      getCanvasCoords,
      onPitchCurveChange,
      pitchCurve,
      onMarkersChange,
      markers,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingPointId(null);
    setDraggingMarkerId(null);
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!editMode || duration <= 0) return;
      const { normX, normY } = getCanvasCoords(e);
      const nearby = findNearbyPoint(normX, normY, 0.05);
      if (nearby) {
        onPitchCurveChange(pitchCurve.filter((p) => p.id !== nearby.id));
      }
    },
    [editMode, duration, getCanvasCoords, findNearbyPoint, onPitchCurveChange, pitchCurve]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    stopLoopRef.current?.();
    stopLoopRef.current = startAnimationLoop((timestamp) => {
      animTimeRef.current = timestamp / 1000;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const waveH = h * 0.5;
      const specH = h * 0.5;

      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(0, 0);
      drawGrid(ctx, w, waveH, 'rgba(74, 222, 128, 0.06)');
      drawWaveform(ctx, timeData, w, waveH);
      if (editMode) {
        drawPitchCurve(ctx, pitchCurve, w, waveH);
        drawControlHandles(ctx, pitchCurve, w, waveH, draggingPointId);
      }
      drawPlayhead(ctx, currentTime, duration, w, waveH);
      ctx.restore();

      ctx.save();
      ctx.translate(0, waveH);
      ctx.fillStyle = 'rgba(10, 10, 20, 0.3)';
      ctx.fillRect(0, 0, w, specH);
      drawSpectrum(ctx, freqData, w, specH, animTimeRef.current);
      ctx.restore();

      ctx.strokeStyle = 'rgba(0, 210, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, waveH);
      ctx.lineTo(w, waveH);
      ctx.stroke();

      if (markers.length > 0 && duration > 0) {
        drawMarkerDiamonds(ctx, markers, w, duration, flashMarkerId, currentTime);
      }
    }, 30);

    return () => {
      stopLoopRef.current?.();
    };
  }, [
    timeData,
    freqData,
    pitchCurve,
    markers,
    currentTime,
    duration,
    flashMarkerId,
    editMode,
    draggingPointId,
  ]);

  const getCursor = (): string => {
    if (draggingPointId || draggingMarkerId) return 'grabbing';
    if (editMode) return 'crosshair';
    return 'default';
  };

  return (
    <div ref={containerRef} className="visualizer-container">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: getCursor() }}
      />
    </div>
  );
}
