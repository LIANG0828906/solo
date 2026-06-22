import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './RotationControl.module.css';

interface RotationControlProps {
  rotation: number;
  onChange: (rotation: number) => void;
  onChangeComplete: (rotation: number) => void;
  size?: number;
}

const ROTATION_STEP = 15;

export const RotationControl: React.FC<RotationControlProps> = ({
  rotation,
  onChange,
  onChangeComplete,
  size = 120,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const controlRef = useRef<HTMLDivElement>(null);
  const startAngleRef = useRef<number>(0);
  const startRotationRef = useRef<number>(0);

  const getAngleFromEvent = useCallback(
    (e: MouseEvent | React.MouseEvent): number => {
      if (!controlRef.current) return 0;
      const rect = controlRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      return (angle * 180) / Math.PI;
    },
    []
  );

  const snapToStep = (angle: number): number => {
    const snapped = Math.round(angle / ROTATION_STEP) * ROTATION_STEP;
    return ((snapped % 360) + 360) % 360;
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsDragging(true);
      startAngleRef.current = getAngleFromEvent(e);
      startRotationRef.current = rotation;
    },
    [rotation, getAngleFromEvent]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentAngle = getAngleFromEvent(e);
      const angleDelta = currentAngle - startAngleRef.current;
      const newRotation = snapToStep(startRotationRef.current + angleDelta);
      onChange(newRotation);
    };

    const handleMouseUp = (e: MouseEvent) => {
      const currentAngle = getAngleFromEvent(e);
      const angleDelta = currentAngle - startAngleRef.current;
      const finalRotation = snapToStep(startRotationRef.current + angleDelta);
      setIsDragging(false);
      onChangeComplete(finalRotation);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, getAngleFromEvent, onChange, onChangeComplete]);

  const handleDegreeClick = useCallback(
    (degree: number) => {
      const snapped = snapToStep(degree);
      onChange(snapped);
      onChangeComplete(snapped);
    },
    [onChange, onChangeComplete]
  );

  const displayRotation = ((rotation % 360) + 360) % 360;

  return (
    <div
      ref={controlRef}
      className={`${styles.rotationControl} ${isDragging ? styles.dragging : ''}`}
      style={{ width: size, height: size }}
      onMouseDown={handleMouseDown}
    >
      <svg
        className={styles.ring}
        viewBox="0 0 100 100"
        width={size}
        height={size}
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="4"
        />
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 15 - 90) * (Math.PI / 180);
          const isMajor = i % 6 === 0;
          const outerR = 45;
          const innerR = isMajor ? 38 : 41;
          return (
            <line
              key={i}
              x1={50 + outerR * Math.cos(angle)}
              y1={50 + outerR * Math.sin(angle)}
              x2={50 + innerR * Math.cos(angle)}
              y2={50 + innerR * Math.sin(angle)}
              stroke={isMajor ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}
              strokeWidth={isMajor ? 2 : 1}
            />
          );
        })}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#6c63ff"
          strokeWidth="4"
          strokeDasharray={`${(displayRotation / 360) * 283} 283`}
          transform="rotate(-90 50 50)"
          style={{ transition: isDragging ? 'none' : 'stroke-dasharray 0.3s ease-out' }}
        />
      </svg>
      <div
        className={styles.handle}
        style={{
          transform: `rotate(${displayRotation}deg)`,
        }}
      >
        <div className={styles.handleDot} />
      </div>
      <div className={styles.centerDisplay}>
        <span className={styles.degreeValue}>{Math.round(displayRotation)}°</span>
        <div className={styles.stepIndicator}>每步 {ROTATION_STEP}°</div>
      </div>
      <div className={styles.presetButtons}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <button
            key={deg}
            className={`${styles.presetBtn} ${Math.abs(displayRotation - deg) < 1 ? styles.active : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleDegreeClick(deg);
            }}
          >
            {deg}°
          </button>
        ))}
      </div>
    </div>
  );
};
