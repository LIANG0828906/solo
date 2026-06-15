
import { useEffect, useRef, useState, useCallback } from 'react';
import { drawWalnut } from '../utils/walnutRenderer';

interface WalnutViewerProps {
  textureSeed: number;
  size?: number;
  autoRotate?: boolean;
  interactive?: boolean;
}

export function WalnutViewer({ textureSeed, size = 300, autoRotate = false, interactive = true }: WalnutViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotationY, setRotationY] = useState(0);
  const [rotationX, setRotationX] = useState(0);
  const [scale, setScale] = useState(1);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const animationRef = useRef<number>();

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWalnut(ctx, {
      rotationY,
      rotationX,
      scale,
      textureSeed,
      size,
    });
  }, [rotationY, rotationX, scale, textureSeed, size]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    if (autoRotate && !isDragging.current) {
      let startTime: number;
      const animate = (time: number) => {
        if (!startTime) startTime = time;
        const elapsed = time - startTime;
        setRotationY((elapsed / 30) % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [autoRotate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    isDragging.current = true;
    lastX.current = e.clientX;
    lastY.current = e.clientY;
    if (autoRotate && animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !interactive) return;
    
    const deltaX = e.clientX - lastX.current;
    const deltaY = e.clientY - lastY.current;
    
    setRotationY(prev => prev + deltaX * 0.5);
    setRotationX(prev => {
      const next = prev + deltaY * 0.3;
      return Math.max(-30, Math.min(30, next));
    });
    
    lastX.current = e.clientX;
    lastY.current = e.clientY;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!interactive) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  return (
    <div style={{ display: 'inline-block', cursor: interactive ? 'grab' : 'default' }}>
      <canvas
        ref={canvasRef}
        width={size * 1.2}
        height={size * 1.2}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ 
          display: 'block',
          cursor: isDragging.current ? 'grabbing' : (interactive ? 'grab' : 'default'),
        }}
      />
    </div>
  );
}
