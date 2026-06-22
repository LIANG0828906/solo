import { useCallback, useRef, useState } from 'react';
import type { StrokePoint, StylePreset, DeviationMarker } from '../types';
import { scoreStroke } from '../utils/scoringEngine';

export interface CurrentStrokeState {
  isDrawing: boolean;
  points: StrokePoint[];
}

export interface ScoredResult {
  id: string;
  points: StrokePoint[];
  totalScore: number;
  smoothness: { score: number; label: string };
  structure: { score: number; label: string };
  pressure: { score: number; label: string };
  deviationMarkers: DeviationMarker[];
}

export interface UsePenStrokeReturn {
  currentStroke: CurrentStrokeState;
  handlePointerDown: (x: number, y: number, time?: number) => void;
  handlePointerMove: (x: number, y: number, time?: number) => void;
  handlePointerUp: (style: StylePreset) => ScoredResult | null;
  clear: () => void;
}

const MIN_POINT_DISTANCE = 3;

export const usePenStroke = (): UsePenStrokeReturn => {
  const [currentStroke, setCurrentStroke] = useState<CurrentStrokeState>({
    isDrawing: false,
    points: [],
  });

  const lastPointRef = useRef<StrokePoint | null>(null);
  const startTimeRef = useRef<number>(0);

  const handlePointerDown = useCallback((x: number, y: number, time?: number) => {
    const now = time ?? Date.now();
    const p: StrokePoint = { x, y, timestamp: now, speed: 0 };
    lastPointRef.current = p;
    startTimeRef.current = now;
    setCurrentStroke({ isDrawing: true, points: [p] });
  }, []);

  const handlePointerMove = useCallback((x: number, y: number, time?: number) => {
    const now = time ?? Date.now();
    setCurrentStroke((prev) => {
      if (!prev.isDrawing) return prev;
      const last = prev.points[prev.points.length - 1];
      if (!last) return prev;
      const dx = x - last.x;
      const dy = y - last.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MIN_POINT_DISTANCE) return prev;
      const dt = Math.max(1, now - last.timestamp);
      const speed = dist / dt;
      const p: StrokePoint = { x, y, timestamp: now, speed };
      lastPointRef.current = p;
      return { ...prev, points: [...prev.points, p] };
    });
  }, []);

  const handlePointerUp = useCallback(
    (style: StylePreset): ScoredResult | null => {
      let result: ScoredResult | null = null;
      setCurrentStroke((prev) => {
        if (!prev.isDrawing || prev.points.length < 2) {
          return { isDrawing: false, points: [] };
        }
        const scored = scoreStroke(prev.points, style);
        result = {
          id: `stroke_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          points: prev.points,
          totalScore: scored.totalScore,
          smoothness: scored.smoothness,
          structure: scored.structure,
          pressure: scored.pressure,
          deviationMarkers: scored.deviationMarkers,
        };
        return { isDrawing: false, points: [] };
      });
      return result;
    },
    []
  );

  const clear = useCallback(() => {
    lastPointRef.current = null;
    setCurrentStroke({ isDrawing: false, points: [] });
  }, []);

  return {
    currentStroke,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    clear,
  };
};
