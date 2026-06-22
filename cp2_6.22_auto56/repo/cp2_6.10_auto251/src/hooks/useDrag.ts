import { useState, useCallback, useRef } from 'react';
import type { DragHandlers, Point } from 'framer-motion';

interface UseDragOptions {
  onParticleTrigger?: (position: Point) => void;
  particleThreshold?: number;
}

interface UseDragReturn {
  isDragging: boolean;
  dragHandlers: DragHandlers;
  dragPosition: Point;
}

export function useDrag(options: UseDragOptions = {}): UseDragReturn {
  const { onParticleTrigger, particleThreshold = 10 } = options;
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<Point>({ x: 0, y: 0 });
  const lastParticlePosition = useRef<Point | null>(null);

  const shouldTriggerParticle = useCallback((currentPos: Point) => {
    if (!lastParticlePosition.current || !onParticleTrigger) return false;
    const dx = currentPos.x - lastParticlePosition.current.x;
    const dy = currentPos.y - lastParticlePosition.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance >= particleThreshold;
  }, [particleThreshold, onParticleTrigger]);

  const handleDragStart: DragHandlers['onDragStart'] = useCallback((event, info) => {
    setIsDragging(true);
    const pos = { x: info.point.x, y: info.point.y };
    setDragPosition(pos);
    lastParticlePosition.current = pos;
  }, []);

  const handleDrag: DragHandlers['onDrag'] = useCallback((event, info) => {
    const pos = { x: info.point.x, y: info.point.y };
    setDragPosition(pos);

    if (onParticleTrigger && shouldTriggerParticle(pos)) {
      onParticleTrigger(pos);
      lastParticlePosition.current = pos;
    }
  }, [onParticleTrigger, shouldTriggerParticle]);

  const handleDragEnd: DragHandlers['onDragEnd'] = useCallback(() => {
    setIsDragging(false);
    setDragPosition({ x: 0, y: 0 });
    lastParticlePosition.current = null;
  }, []);

  return {
    isDragging,
    dragHandlers: {
      onDragStart: handleDragStart,
      onDrag: handleDrag,
      onDragEnd: handleDragEnd,
    },
    dragPosition,
  };
}
