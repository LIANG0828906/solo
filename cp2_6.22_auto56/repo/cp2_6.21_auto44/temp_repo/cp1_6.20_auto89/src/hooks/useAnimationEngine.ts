import { useState, useEffect, useRef, useCallback } from 'react';
import { Keyframe, EasingType, CubicBezierParams, InterpolatedProperties } from '../types';
import { easingFunctions, createCustomBezierEasing } from '../utils/easing';
import { interpolateKeyframes } from '../utils/interpolation';

interface UseAnimationEngineProps {
  keyframes: Keyframe[];
  easingType: EasingType;
  bezierParams?: CubicBezierParams;
  duration?: number;
}

interface UseAnimationEngineReturn {
  currentTime: number;
  isPlaying: boolean;
  interpolatedProps: InterpolatedProperties;
  play: () => void;
  pause: () => void;
  reset: () => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
}

export const useAnimationEngine = ({
  keyframes,
  easingType,
  bezierParams,
  duration = 2000,
}: UseAnimationEngineProps): UseAnimationEngineReturn => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const getEasingFn = useCallback(() => {
    if (easingType === 'cubic-bezier' && bezierParams) {
      return createCustomBezierEasing(bezierParams);
    }
    return easingFunctions[easingType];
  }, [easingType, bezierParams]);

  const interpolatedProps = interpolateKeyframes(
    keyframes,
    currentTime,
    getEasingFn()
  );

  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp - pausedTimeRef.current;
    }

    const elapsed = timestamp - startTimeRef.current;
    const progress = (elapsed % duration) / duration * 100;

    setCurrentTime(progress);
    animationRef.current = requestAnimationFrame(animate);
  }, [duration]);

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        pausedTimeRef.current = (currentTime / 100) * duration;
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate, currentTime, duration]);

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const setTimeManually = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(100, time));
    setCurrentTime(clampedTime);
    pausedTimeRef.current = (clampedTime / 100) * duration;
    if (!isPlaying) {
      startTimeRef.current = 0;
    }
  }, [duration, isPlaying]);

  return {
    currentTime,
    isPlaying,
    interpolatedProps,
    play,
    pause,
    reset,
    togglePlay,
    setCurrentTime: setTimeManually,
  };
};
