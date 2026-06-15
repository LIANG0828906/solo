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
  isRecording: boolean;
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
  isRecording,
  onSeek,
  flashMarkerId,
  editMode,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const [hoverPointId, setHoverPointId] = useState<string | null>(null);
  const animTimeRef = useRef<number>(0);
  const stopLoopRef = useRef<(() => void) | null>(null);
  const canvasSizeRef = useRef({ w: 0, h: 0 });

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
    (normX: number, normY: number, threshold: number = 0.035): PitchPoint | null => {
      const { w, h } = canvasSizeRef.current;
      if (w === 0 || h === 0) return null;

      const pixelThresholdX = threshold;
      const pixelThresholdY = threshold * (w / h) * 0.5;

      let closest: PitchPoint | null = null;
      let minDist = threshold;

      for (const p of pitchCurve) {
        const dx = (p.x - normX) / pixelThresholdX;
        const dy = (p.y - normY) / pixelThresholdY;
        const dist = Math.sqrt(dx * dx + dy * dy);
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
    (normX: number, threshold: number = 0.025): Marker | null => {
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
      const { normX, normY } = getCanvasCoords(e);

      if (editMode) {
        const nearby = findNearbyPoint(normX, normY);
        if (nearby) {
          setDraggingPointId(nearby.id);
          setHoverPointId(nearby.id);
        } else {
          const waveH = canvasSizeRef.current.h * 0.5;
          const canvasY = normY * canvasSizeRef.current.h;
          if (canvasY <= waveH) {
            const newPoint: PitchPoint = {
              id: generateId(),
              x: Math.max(0, Math.min(1, normX)),
              y: Math.max(0, Math.min(1, normY / 0.5)),
            };
            onPitchCurveChange([...pitchCurve, newPoint]);
            setDraggingPointId(newPoint.id);
            setHoverPointId(newPoint.id);
          }
        }
      } else if (duration > 0) {
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
      const { normX, normY } = getCanvasCoords(e);

      if (draggingPointId) {
        const waveH = canvasSizeRef.current.h * 0.5;
        const canvasY = normY * canvasSizeRef.current.h;
        const clampedY = canvasY <= waveH ? normY / 0.5 : 0.5;
        onPitchCurveChange(
          pitchCurve.map((p) =>
            p.id === draggingPointId
              ? {
                  ...p,
                  x: Math.max(0, Math.min(1, normX)),
                  y: Math.max(0, Math.min(1, clampedY)),
                }
              : p
          )
        );
      } else if (draggingMarkerId && duration > 0) {
        const newTime = Math.max(0, Math.min(duration, normX * duration));
        onMarkersChange(
          markers.map((m) => (m.id === draggingMarkerId ? { ...m, time: newTime } : m))
        );
      } else if (editMode) {
        const nearby = findNearbyPoint(normX, normY);
        setHoverPointId(nearby ? nearby.id : null);
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
      editMode,
      findNearbyPoint,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingPointId(null);
    setDraggingMarkerId(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setDraggingPointId(null);
    setDraggingMarkerId(null);
    setHoverPointId(null);
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!editMode) return;
      const { normX, normY } = getCanvasCoords(e);
      const nearby = findNearbyPoint(normX, normY, 0.05);
      if (nearby) {
        onPitchCurveChange(pitchCurve.filter((p) => p.id !== nearby.id));
        if (hoverPointId === nearby.id) {
          setHoverPointId(null);
        }
      }
    },
    [editMode, getCanvasCoords, findNearbyPoint, onPitchCurveChange, pitchCurve, hoverPointId]
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
      canvasSizeRef.current = { w: canvas.width, h: canvas.height };
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);
    window.addEventListener('resize', resizeCanvas);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
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
      canvasSizeRef.current = { w, h };

      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(0, 0);
      drawGrid(ctx, w, waveH, 'rgba(74, 222, 128, 0.06)');
      drawWaveform(ctx, timeData, w, waveH);

      if (editMode) {
        drawPitchCurve(ctx, pitchCurve, w, waveH, false);
        drawControlHandles(ctx, pitchCurve, w, waveH, draggingPointId, hoverPointId);
      }

      drawPlayhead(ctx, currentTime, duration, w, waveH);
      ctx.restore();

      ctx.save();
      ctx.translate(0, waveH);
      ctx.fillStyle = 'rgba(10, 10, 20, 0.35)';
      ctx.fillRect(0, 0, w, specH);
      drawSpectrum(ctx, freqData, w, specH, animTimeRef.current);
      ctx.restore();

      ctx.strokeStyle = 'rgba(0, 210, 255, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, waveH);
      ctx.lineTo(w, waveH);
      ctx.stroke();

      if (markers.length > 0 && duration > 0) {
        drawMarkerDiamonds(ctx, markers, w, duration, flashMarkerId, currentTime);
      }

      if (isRecording) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 107, 107, 0.9)';
        ctx.shadowColor = '#ff6b6b';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(w * 0.03, h * 0.05, Math.min(8, w * 0.015), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = '#ff6b6b';
        ctx.font = `${Math.min(14, w * 0.018)}px system-ui, sans-serif`;
        ctx.fillText('REC', w * 0.03 + 20, h * 0.055);
        ctx.restore();
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
    hoverPointId,
    isRecording,
  ]);

  const getCursor = (): string => {
    if (draggingPointId || draggingMarkerId) return 'grabbing';
    if (editMode && hoverPointId) return 'grab';
    if (editMode) return 'crosshair';
    return 'pointer';
  };

  return (
    <div ref={containerRef} className="visualizer-container">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: getCursor() }}
      />
    </div>
  );
}
