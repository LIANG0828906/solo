import { useEffect, useRef, useCallback } from 'react';
import styles from '../../styles/ui.module.css';

export interface MobileDialProps {
  visible: boolean;
  value: number;
  onChange: (v: number) => void;
  onCommit: () => void;
}

const DIAL_SIZE = 260;
const DIAL_RADIUS = DIAL_SIZE / 2;

function drawDial(
  canvas: HTMLCanvasElement,
  angle: number,
  isDragging: boolean
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = DIAL_SIZE * dpr;
  canvas.height = DIAL_SIZE * dpr;
  canvas.style.width = `${DIAL_SIZE}px`;
  canvas.style.height = `${DIAL_SIZE}px`;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, DIAL_SIZE, DIAL_SIZE);

  const cx = DIAL_RADIUS;
  const cy = DIAL_RADIUS;

  ctx.beginPath();
  ctx.arc(cx, cy, DIAL_RADIUS - 4, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  for (let deg = 0; deg < 360; deg += 30) {
    const rad = ((deg - 90) * Math.PI) / 180;
    const isMajor = deg % 90 === 0;
    const innerR = DIAL_RADIUS - (isMajor ? 24 : 16);
    const outerR = DIAL_RADIUS - 10;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rad) * innerR, cy + Math.sin(rad) * innerR);
    ctx.lineTo(cx + Math.cos(rad) * outerR, cy + Math.sin(rad) * outerR);
    ctx.strokeStyle = isMajor ? 'var(--accent-gold)' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = isMajor ? 2.5 : 1.5;
    ctx.stroke();
  }

  const angleRad = ((angle - 90) * Math.PI) / 180;
  const pointerLength = DIAL_RADIUS - 36;
  const pointerTipX = cx + Math.cos(angleRad) * pointerLength;
  const pointerTipY = cy + Math.sin(angleRad) * pointerLength;

  const baseRad1 = angleRad + Math.PI / 2;
  const baseRad2 = angleRad - Math.PI / 2;
  const baseWidth = 12;

  ctx.beginPath();
  ctx.moveTo(pointerTipX, pointerTipY);
  ctx.lineTo(cx + Math.cos(baseRad1) * baseWidth, cy + Math.sin(baseRad1) * baseWidth);
  ctx.lineTo(cx + Math.cos(baseRad2) * baseWidth, cy + Math.sin(baseRad2) * baseWidth);
  ctx.closePath();

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, pointerLength);
  gradient.addColorStop(0, 'rgba(255, 215, 0, 0.95)');
  gradient.addColorStop(1, 'rgba(251, 191, 36, 0.7)');
  ctx.fillStyle = gradient;
  ctx.fill();

  if (isDragging) {
    ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
    ctx.shadowBlur = 16;
  }
  ctx.strokeStyle = isDragging ? '#FBBF24' : '#FFD700';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(cx, cy, 32, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 15, 30, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = "bold 22px 'Orbitron', sans-serif";
  ctx.fillStyle = '#FFD700';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${angle}°`, cx, cy);
}

export function MobileDial({
  visible,
  value,
  onChange,
  onCommit,
}: MobileDialProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const currentAngleRef = useRef(value);

  const getAngleFromPoint = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return currentAngleRef.current;

    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;

    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    return Math.round(deg);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      isDraggingRef.current = true;
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      const newAngle = getAngleFromPoint(e.clientX, e.clientY);
      currentAngleRef.current = newAngle;
      onChange(newAngle);
      drawDial(canvasRef.current!, newAngle, true);
    },
    [getAngleFromPoint, onChange]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const newAngle = getAngleFromPoint(e.clientX, e.clientY);
      currentAngleRef.current = newAngle;
      onChange(newAngle);
      drawDial(canvasRef.current!, newAngle, true);
    },
    [getAngleFromPoint, onChange]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      isDraggingRef.current = false;
      try {
        (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      drawDial(canvasRef.current!, currentAngleRef.current, false);
      onCommit();
    },
    [onCommit]
  );

  useEffect(() => {
    currentAngleRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!visible || !canvasRef.current) return;
    drawDial(canvasRef.current, value, false);
  }, [visible, value]);

  if (!visible) return null;

  return (
    <div className={styles.mobileDialWrapper}>
      <canvas
        ref={canvasRef}
        className={styles.dialCanvas}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}

export default MobileDial;
