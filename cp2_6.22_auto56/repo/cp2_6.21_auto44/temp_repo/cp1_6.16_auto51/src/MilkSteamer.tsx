import { useRef, useState, useEffect, useCallback } from 'react';
import { generateParticles } from './MilkParticle';
import type { Particle } from './MilkParticle';

interface MilkSteamerProps {
  onParticlesUpdate: (particles: Particle[]) => void;
  cupCenter: { x: number; y: number };
  cupRadius: number;
  cupPosition: { x: number; y: number };
  onDragTrajectory: (point: { x: number; y: number; angle: number }) => void;
  isDragging: boolean;
  onDraggingChange: (dragging: boolean) => void;
}

export function MilkSteamer({
  onParticlesUpdate,
  cupCenter,
  cupRadius,
  cupPosition,
  onDragTrajectory,
  isDragging,
  onDraggingChange
}: MilkSteamerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [angle, setAngle] = useState(0);
  const animationRef = useRef<number>();
  const lastEmitTime = useRef(0);

  const initialPosition = useRef({
    x: cupRadius * 0.8,
    y: cupRadius * 0.6
  });

  useEffect(() => {
    const globalCupCenterX = cupPosition.x + cupCenter.x;
    const globalCupCenterY = cupPosition.y + cupCenter.y;

    setPosition({
      x: globalCupCenterX + initialPosition.current.x,
      y: globalCupCenterY + initialPosition.current.y
    });
  }, [cupPosition, cupCenter.x, cupCenter.y, cupRadius]);

  const calculateAngle = useCallback(
    (mouseX: number, mouseY: number) => {
      const globalCupCenterX = cupPosition.x + cupCenter.x;
      const globalCupCenterY = cupPosition.y + cupCenter.y;

      const dx = mouseX - globalCupCenterX;
      const dy = mouseY - globalCupCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = cupRadius * 1.5;

      const normalizedDistance = Math.min(distance / maxDistance, 1);
      let calculatedAngle = normalizedDistance * 90;

      const mouseAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (mouseAngle > -90 && mouseAngle < 90) {
        calculatedAngle = Math.max(10, calculatedAngle);
      } else {
        calculatedAngle = Math.min(80, calculatedAngle);
      }

      return Math.max(0, Math.min(90, calculatedAngle));
    },
    [cupPosition, cupCenter.x, cupCenter.y, cupRadius]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      onDraggingChange(true);
    },
    [onDraggingChange]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      let clientX: number, clientY: number;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      setPosition({ x: clientX, y: clientY });

      const newAngle = calculateAngle(clientX, clientY);
      setAngle(newAngle);

      onDragTrajectory({ x: clientX, y: clientY, angle: newAngle });
    },
    [isDragging, calculateAngle, onDragTrajectory]
  );

  const handleMouseUp = useCallback(() => {
    onDraggingChange(false);
  }, [onDraggingChange]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (!isDragging || angle < 5) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const emitParticles = (timestamp: number) => {
      if (timestamp - lastEmitTime.current >= 50) {
        lastEmitTime.current = timestamp;

        const spoutX = position.x - 20;
        const spoutY = position.y - 10;

        const speed = 2 + (angle / 90) * 6;

        onParticlesUpdate((prev: Particle[]) =>
          generateParticles(spoutX, spoutY, angle - 90, speed, prev)
        );
      }

      animationRef.current = requestAnimationFrame(emitParticles);
    };

    animationRef.current = requestAnimationFrame(emitParticles);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDragging, angle, position.x, position.y, onParticlesUpdate]);

  const pitcherRotation = -angle * 0.8;

  return (
    <div ref={containerRef} style={{ position: 'fixed', pointerEvents: 'none', zIndex: 100 }}>
      <div
        style={{
          position: 'absolute',
          left: position.x - 40,
          top: position.y - 30,
          width: 80,
          height: 60,
          pointerEvents: 'auto',
          cursor: isDragging ? 'grabbing' : 'grab',
          transform: `rotate(${pitcherRotation}deg)`,
          transformOrigin: '60% 70%',
          transition: isDragging ? 'none' : 'transform 0.2s ease',
          userSelect: 'none',
          touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <svg width="80" height="60" viewBox="0 0 80 60">
          <ellipse
            cx="45"
            cy="35"
            rx="30"
            ry="20"
            fill="#F5F0E1"
            stroke="#3E2723"
            strokeWidth="2"
          />
          <ellipse
            cx="45"
            cy="35"
            rx="25"
            ry="15"
            fill="#E8E0D0"
          />
          <path
            d="M15 30 Q5 25 10 35 Q5 40 18 38"
            fill="#F5F0E1"
            stroke="#3E2723"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <ellipse
            cx="45"
            cy="20"
            rx="22"
            ry="8"
            fill="#D7CCC8"
            stroke="#3E2723"
            strokeWidth="1.5"
          />
          <ellipse
            cx="45"
            cy="20"
            rx="18"
            ry="5"
            fill="#F5F0E1"
          />
          <path
            d="M70 25 Q80 30 75 40 Q70 35 70 35"
            fill="none"
            stroke="#3E2723"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {isDragging && angle > 10 && (
            <text
              x="45"
              y="-5"
              textAnchor="middle"
              fill="#3E2723"
              fontSize="12"
              fontWeight="bold"
              style={{ transform: `rotate(${-pitcherRotation}deg)`, transformOrigin: 'center' }}
            >
              {Math.round(angle)}°
            </text>
          )}
        </svg>
      </div>
      {isDragging && (
        <div
          style={{
            position: 'absolute',
            left: position.x - 50,
            top: position.y + 40,
            padding: '4px 12px',
            backgroundColor: 'rgba(62, 39, 35, 0.8)',
            color: '#F5F0E1',
            borderRadius: '6px',
            fontSize: '12px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          流速: {(angle / 90 * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
}
