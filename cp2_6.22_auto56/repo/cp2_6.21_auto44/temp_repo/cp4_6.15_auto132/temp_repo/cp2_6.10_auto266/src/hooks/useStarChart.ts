import { useState, useRef, useCallback, useEffect } from 'react';
import type { StarPosition, Particle } from '@/types';

interface StarChartState {
  offsetX: number;
  offsetY: number;
  rotation: number;
  scale: number;
  isDragging: boolean;
  particles: Particle[];
}

interface UseStarChartOptions {
  canvasWidth: number;
  canvasHeight: number;
  stars: StarPosition[];
}

export function useStarChart({ canvasWidth, canvasHeight, stars }: UseStarChartOptions) {
  const [state, setState] = useState<StarChartState>({
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    scale: 1,
    isDragging: false,
    particles: [],
  });

  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const lastTouchRef = useRef<{ distance: number; x: number; y: number } | null>(null);
  const particleIdRef = useRef(0);

  const transformPoint = useCallback(
    (x: number, y: number) => {
      const centerX = canvasWidth / 2 + state.offsetX;
      const centerY = canvasHeight / 2 + state.offsetY;
      const rad = (state.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = (x - centerX) / state.scale;
      const dy = (y - centerY) / state.scale;
      return {
        x: dx * cos + dy * sin,
        y: -dx * sin + dy * cos,
      };
    },
    [canvasWidth, canvasHeight, state.offsetX, state.offsetY, state.rotation, state.scale]
  );

  const getScreenPosition = useCallback(
    (star: StarPosition) => {
      const centerX = canvasWidth / 2 + state.offsetX;
      const centerY = canvasHeight / 2 + state.offsetY;
      const rad = (state.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const x = star.x * state.scale * cos - star.y * state.scale * sin + centerX;
      const y = star.x * state.scale * sin + star.y * state.scale * cos + centerY;
      return { x, y, radius: star.radius * state.scale };
    },
    [canvasWidth, canvasHeight, state.offsetX, state.offsetY, state.rotation, state.scale]
  );

  const hitTest = useCallback(
    (screenX: number, screenY: number): StarPosition | null => {
      for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        const pos = getScreenPosition(star);
        const dx = screenX - pos.x;
        const dy = screenY - pos.y;
        if (dx * dx + dy * dy <= pos.radius * pos.radius) {
          return star;
        }
      }
      return null;
    },
    [stars, getScreenPosition]
  );

  const addParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 1 + Math.random() * 2;
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 60 + Math.random() * 30,
        color,
        size: 2 + Math.random() * 3,
      });
    }
    setState((prev) => ({ ...prev, particles: [...prev.particles, ...newParticles] }));
  }, []);

  const updateParticles = useCallback(() => {
    setState((prev) => ({
      ...prev,
      particles: prev.particles
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.02,
          life: p.life - 1 / p.maxLife,
        }))
        .filter((p) => p.life > 0),
    }));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: state.offsetX,
      offsetY: state.offsetY,
    };
    setState((prev) => ({ ...prev, isDragging: true }));
  }, [state.offsetX, state.offsetY]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!state.isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setState((prev) => ({
        ...prev,
        offsetX: dragStartRef.current.offsetX + dx,
        offsetY: dragStartRef.current.offsetY + dy,
      }));
    },
    [state.isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setState((prev) => ({ ...prev, isDragging: false }));
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setState((prev) => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale * delta)),
    }));
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        offsetX: state.offsetX,
        offsetY: state.offsetY,
      };
      setState((prev) => ({ ...prev, isDragging: true }));
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchRef.current = {
        distance: Math.sqrt(dx * dx + dy * dy),
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  }, [state.offsetX, state.offsetY]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && state.isDragging) {
        const dx = e.touches[0].clientX - dragStartRef.current.x;
        const dy = e.touches[0].clientY - dragStartRef.current.y;
        setState((prev) => ({
          ...prev,
          offsetX: dragStartRef.current.offsetX + dx,
          offsetY: dragStartRef.current.offsetY + dy,
        }));
      } else if (e.touches.length === 2 && lastTouchRef.current) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDistance = Math.sqrt(dx * dx + dy * dy);
        const scaleDelta = newDistance / lastTouchRef.current.distance;
        setState((prev) => ({
          ...prev,
          scale: Math.max(0.5, Math.min(3, prev.scale * scaleDelta)),
        }));
        lastTouchRef.current.distance = newDistance;
      }
    },
    [state.isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    setState((prev) => ({ ...prev, isDragging: false }));
    lastTouchRef.current = null;
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (state.isDragging) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hit = hitTest(x, y);
      if (hit) {
        const pos = getScreenPosition(hit);
        addParticles(pos.x, pos.y, '#f5d742', 15);
      }
    },
    [state.isDragging, hitTest, getScreenPosition, addParticles]
  );

  const resetView = useCallback(() => {
    setState((prev) => ({
      ...prev,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      scale: 1,
    }));
  }, []);

  const rotateBy = useCallback((degrees: number) => {
    setState((prev) => ({
      ...prev,
      rotation: prev.rotation + degrees,
    }));
  }, []);

  useEffect(() => {
    if (state.particles.length === 0) return;
    const interval = setInterval(updateParticles, 16);
    return () => clearInterval(interval);
  }, [state.particles.length, updateParticles]);

  return {
    ...state,
    transformPoint,
    getScreenPosition,
    hitTest,
    addParticles,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleClick,
    resetView,
    rotateBy,
  };
}
