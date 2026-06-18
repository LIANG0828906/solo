import { useState, useEffect, useRef, useCallback } from 'react';
import { ActionType, AnimationFrame, BodyPart, OutfitState } from '../types';
import { generatePixelMatrix } from '../engine/pixelRenderer';

function easeOutElastic(t: number): number {
  const p = 0.3;
  return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
}

function calculateIdleFrame(elapsed: number): AnimationFrame {
  const period = 2000;
  const phase = (elapsed % period) / period;
  const yOffset = Math.sin(phase * Math.PI * 2) * 2;
  return {
    yOffset,
    leftLegOffset: 0,
    rightLegOffset: 0,
    leftArmOffset: 0,
    rightArmOffset: 0,
  };
}

function calculateWalkFrame(elapsed: number): AnimationFrame {
  const stepDuration = 400;
  const phase = (elapsed % (stepDuration * 2)) / (stepDuration * 2);
  const angle = phase * Math.PI * 2;
  
  const legSwing = Math.sin(angle) * 1;
  const armSwing = Math.sin(angle + Math.PI) * 1;
  const bobY = Math.abs(Math.sin(angle * 2)) * 0.5;
  
  return {
    yOffset: -bobY,
    leftLegOffset: legSwing,
    rightLegOffset: -legSwing,
    leftArmOffset: armSwing,
    rightArmOffset: -armSwing,
  };
}

function calculateJumpFrame(elapsed: number, startTime: number): { frame: AnimationFrame; done: boolean } {
  const duration = 600;
  const t = Math.min((elapsed - startTime) / duration, 1);
  const height = easeOutElastic(t) * 10;
  
  if (t >= 1) {
    return {
      frame: {
        yOffset: 0,
        leftLegOffset: 0,
        rightLegOffset: 0,
        leftArmOffset: 0,
        rightArmOffset: 0,
      },
      done: true,
    };
  }
  
  return {
    frame: {
      yOffset: -height,
      leftLegOffset: t < 0.5 ? -0.5 : 0.5,
      rightLegOffset: t < 0.5 ? -0.5 : 0.5,
      leftArmOffset: t < 0.5 ? -1 : 0,
      rightArmOffset: t < 0.5 ? -1 : 0,
    },
    done: false,
  };
}

export function useAnimation(
  actionType: ActionType,
  outfit: OutfitState,
  flashStates: Map<BodyPart, number>,
  topPattern?: string
): string[][] {
  const [pixelMatrix, setPixelMatrix] = useState<string[][]>([]);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(performance.now());
  const jumpStartTimeRef = useRef<number>(0);
  const lastActionRef = useRef<ActionType>(actionType);

  const calculateFrame = useCallback((timestamp: number): AnimationFrame => {
    const elapsed = timestamp - startTimeRef.current;
    
    if (actionType === 'idle') {
      return calculateIdleFrame(elapsed);
    } else if (actionType === 'walk') {
      return calculateWalkFrame(elapsed);
    } else {
      const result = calculateJumpFrame(elapsed, jumpStartTimeRef.current);
      if (result.done && lastActionRef.current === 'jump') {
        startTimeRef.current = timestamp;
        jumpStartTimeRef.current = 0;
        lastActionRef.current = 'idle';
        return calculateIdleFrame(0);
      }
      return result.frame;
    }
  }, [actionType]);

  useEffect(() => {
    if (actionType === 'jump' && lastActionRef.current !== 'jump') {
      const now = performance.now();
      jumpStartTimeRef.current = now - startTimeRef.current;
      lastActionRef.current = 'jump';
    } else if (actionType !== 'jump') {
      lastActionRef.current = actionType;
    }
  }, [actionType]);

  useEffect(() => {
    startTimeRef.current = performance.now();
    jumpStartTimeRef.current = 0;
    lastActionRef.current = actionType;

    const animate = (timestamp: number) => {
      const frame = calculateFrame(timestamp);
      const matrix = generatePixelMatrix(
        outfit,
        frame,
        flashStates,
        timestamp,
        topPattern
      );
      setPixelMatrix(matrix);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [actionType, outfit, flashStates, topPattern, calculateFrame]);

  return pixelMatrix;
}
