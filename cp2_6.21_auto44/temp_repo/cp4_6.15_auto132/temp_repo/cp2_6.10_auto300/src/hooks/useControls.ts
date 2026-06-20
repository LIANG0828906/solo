import { useEffect, useRef, useState, useCallback } from 'react';

interface Controls {
  moveDirection: [number, number];
  isDashing: boolean;
  dashCooldown: number;
  canDash: boolean;
}

export function useControls(): Controls {
  const [moveDirection, setMoveDirection] = useState<[number, number]>([0, 0]);
  const [isDashing, setIsDashing] = useState(false);
  const [dashCooldown, setDashCooldown] = useState(0);
  const [canDash, setCanDash] = useState(true);

  const isDragging = useRef(false);
  const dragStart = useRef<[number, number]>([0, 0]);
  const dragCurrent = useRef<[number, number]>([0, 0]);
  const lastTime = useRef(Date.now());

  const handleMouseDown = useCallback((e: MouseEvent) => {
    isDragging.current = true;
    dragStart.current = [e.clientX, e.clientY];
    dragCurrent.current = [e.clientX, e.clientY];
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;

    dragCurrent.current = [e.clientX, e.clientY];

    const dx = dragCurrent.current[0] - dragStart.current[0];
    const dy = dragCurrent.current[1] - dragStart.current[1];

    const maxDist = 100;
    const clampedDx = Math.max(-1, Math.min(1, dx / maxDist));
    const clampedDy = Math.max(-1, Math.min(1, dy / maxDist));

    setMoveDirection([clampedDx, clampedDy]);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    setMoveDirection([0, 0]);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && canDash && !isDashing) {
      e.preventDefault();
      setIsDashing(true);
      setCanDash(false);
      setDashCooldown(2);

      setTimeout(() => {
        setIsDashing(false);
      }, 200);

      setTimeout(() => {
        setCanDash(true);
      }, 2000);
    }
  }, [canDash, isDashing]);

  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleKeyDown]);

  useEffect(() => {
    const updateCooldown = () => {
      const now = Date.now();
      const delta = (now - lastTime.current) / 1000;
      lastTime.current = now;

      if (dashCooldown > 0) {
        setDashCooldown((prev) => Math.max(0, prev - delta));
      }
    };

    const interval = setInterval(updateCooldown, 50);
    return () => clearInterval(interval);
  }, [dashCooldown]);

  return {
    moveDirection,
    isDashing,
    dashCooldown,
    canDash,
  };
}
