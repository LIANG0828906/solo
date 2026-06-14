import { useState, useCallback, useRef, useEffect } from 'react';
import {
  MergeAnimation,
  generateId,
  MERGE_ANIMATION_DURATION,
  calculatePosition,
  calculateScale,
  calculateFlashAlpha,
} from '../utils';

type AnimationFrame = {
  x: number;
  y: number;
  scale: number;
  flashAlpha: number;
  progress: number;
  completed: boolean;
};

type UseMergeAnimationResult = {
  activeAnimations: MergeAnimation[];
  getAnimationFrame: (animation: MergeAnimation, cellSize: number, gap: number) => AnimationFrame;
  startMergeAnimation: (fromRow: number, fromCol: number, toRow: number, toCol: number, level: number) => void;
  isAnimating: boolean;
};

export const useMergeAnimation = (
  onAnimationComplete?: (animation: MergeAnimation) => void
): UseMergeAnimationResult => {
  const [activeAnimations, setActiveAnimations] = useState<MergeAnimation[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  const getAnimationFrame = useCallback((
    animation: MergeAnimation,
    cellSize: number,
    gap: number
  ): AnimationFrame => {
    const now = performance.now();
    const elapsed = now - animation.startTime;
    const progress = Math.min(elapsed / animation.duration, 1);

    const fromX = animation.fromCol * (cellSize + gap) + cellSize / 2;
    const fromY = animation.fromRow * (cellSize + gap) + cellSize / 2;
    const toX = animation.toCol * (cellSize + gap) + cellSize / 2;
    const toY = animation.toRow * (cellSize + gap) + cellSize / 2;

    const pos = calculatePosition(fromX, fromY, toX, toY, elapsed, animation.duration);
    const scale = calculateScale(elapsed, animation.duration);
    const flashAlpha = calculateFlashAlpha(elapsed, animation.duration);

    return {
      x: pos.x,
      y: pos.y,
      scale,
      flashAlpha,
      progress,
      completed: progress >= 1,
    };
  }, []);

  const updateAnimations = useCallback((timestamp: number) => {
    if (!lastFrameTimeRef.current) {
      lastFrameTimeRef.current = timestamp;
    }

    setActiveAnimations(prev => {
      const now = performance.now();
      const updated: MergeAnimation[] = [];
      const completed: MergeAnimation[] = [];

      prev.forEach(anim => {
        if (now - anim.startTime >= anim.duration) {
          completed.push(anim);
        } else {
          updated.push(anim);
        }
      });

      completed.forEach(anim => {
        if (onAnimationComplete) {
          onAnimationComplete(anim);
        }
      });

      if (updated.length === 0) {
        setIsAnimating(false);
        animationFrameRef.current = null;
      } else {
        animationFrameRef.current = requestAnimationFrame(updateAnimations);
      }

      return updated;
    });

    lastFrameTimeRef.current = timestamp;
  }, [onAnimationComplete]);

  const startMergeAnimation = useCallback((
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
    level: number
  ) => {
    const newAnimation: MergeAnimation = {
      id: generateId(),
      fromRow,
      fromCol,
      toRow,
      toCol,
      level,
      startTime: performance.now(),
      duration: MERGE_ANIMATION_DURATION,
    };

    setActiveAnimations(prev => [...prev, newAnimation]);
    setIsAnimating(true);

    if (!animationFrameRef.current) {
      lastFrameTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(updateAnimations);
    }
  }, [updateAnimations]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    activeAnimations,
    getAnimationFrame,
    startMergeAnimation,
    isAnimating,
  };
};
