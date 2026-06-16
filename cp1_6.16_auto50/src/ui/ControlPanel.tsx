import { useRef, useEffect, useState, useCallback } from 'react';

interface ControlPanelProps {
  onThrustChange: (angle: number, magnitude: number) => void;
  size?: number;
}

export function ControlPanel({ onThrustChange, size = 100 }: ControlPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const joystickRadius = size / 2;
  const stickRadius = size * 0.3;

  const getCenter = useCallback(() => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, []);

  const updateJoystick = useCallback((clientX: number, clientY: number) => {
    const center = getCenter();
    let dx = clientX - center.x;
    let dy = clientY - center.y;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = joystickRadius - stickRadius * 0.5;

    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }

    setJoystickPos({ x: dx, y: dy });

    const angle = Math.atan2(dy, dx);
    const magnitude = Math.min(1, distance / maxDistance);

    onThrustChange(angle, magnitude);
  }, [joystickRadius, stickRadius, onThrustChange, getCenter]);

  const resetJoystick = useCallback(() => {
    setJoystickPos({ x: 0, y: 0 });
    onThrustChange(0, 0);
    setIsDragging(false);
  }, [onThrustChange]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateJoystick(e.clientX, e.clientY);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        resetJoystick();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        e.preventDefault();
        updateJoystick(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault();
        resetJoystick();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, updateJoystick, resetJoystick]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateJoystick(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      setIsDragging(true);
      updateJoystick(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const magnitude = Math.sqrt(joystickPos.x ** 2 + joystickPos.y ** 2) / (joystickRadius - stickRadius * 0.5);
  const thrustPercent = Math.round(magnitude * 100);

  const getThrustColor = () => {
    const r = Math.floor(magnitude * 255);
    const g = Math.floor((1 - magnitude) * 255);
    return `rgb(${r}, ${g}, 0)`;
  };

  return (
    <div className="absolute bottom-8 left-8 select-none">
      <div
        ref={containerRef}
        className="relative rounded-full cursor-pointer"
        style={{
          width: size,
          height: size,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className="absolute rounded-full border-2 border-white/40"
          style={{
            width: size - 16,
            height: size - 16,
            left: 8,
            top: 8,
          }}
        />

        <div
          ref={joystickRef}
          className="absolute rounded-full shadow-lg"
          style={{
            width: stickRadius * 2,
            height: stickRadius * 2,
            left: size / 2 - stickRadius + joystickPos.x,
            top: size / 2 - stickRadius + joystickPos.y,
            background: magnitude > 0
              ? 'radial-gradient(circle at 30% 30%, #6ab7ff, #2563eb)'
              : 'radial-gradient(circle at 30% 30%, #94a3b8, #475569)',
            boxShadow: magnitude > 0
              ? '0 0 20px rgba(59, 130, 246, 0.5)'
              : '0 2px 8px rgba(0, 0, 0, 0.3)',
            transition: isDragging ? 'none' : 'all 0.15s ease-out',
          }}
        />

        {magnitude > 0.1 && (
          <svg
            className="absolute"
            style={{
              left: size / 2,
              top: size / 2,
              transform: `rotate(${Math.atan2(joystickPos.y, joystickPos.x)}rad)`,
              width: joystickRadius - stickRadius,
              height: 4,
              transformOrigin: 'left center',
            }}
          >
            <line
              x1="0"
              y1="2"
              x2={joystickRadius - stickRadius - 5}
              y2="2"
              stroke={getThrustColor()}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      <div className="mt-3 text-center">
        <div className="text-xs text-white/60 mb-1">推力</div>
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: 'rgba(255, 255, 255, 0.15)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${thrustPercent}%`,
              background: `linear-gradient(to right, #22c55e, #eab308, #ef4444)`,
              backgroundSize: '200% 100%',
              backgroundPosition: `${100 - thrustPercent}% 0`,
            }}
          />
        </div>
        <div className="text-xs text-white/80 mt-1 font-mono">
          {thrustPercent}%
        </div>
      </div>
    </div>
  );
}
