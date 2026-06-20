import React, { useEffect, useRef, useCallback } from 'react';
import type { Seat } from '../hooks/useSseData';

interface SeatMapProps {
  seats: Seat[];
  rows: number;
  cols: number;
  onSeatClick: (seatId: string) => void;
}

const SEAT_SIZE = 20;
const SEAT_GAP = 2;
const SEAT_RADIUS = 4;

interface AnimatedSeat {
  id: string;
  startTime: number;
  duration: number;
  isManual: boolean;
  x: number;
  y: number;
}

export const SeatMap: React.FC<SeatMapProps> = ({ seats, rows, cols, onSeatClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatedSeatsRef = useRef<AnimatedSeat[]>([]);
  const prevCheckedIdsRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);

  const canvasWidth = cols * SEAT_SIZE + (cols + 1) * SEAT_GAP;
  const canvasHeight = rows * SEAT_SIZE + (rows + 1) * SEAT_GAP;

  const getSeatPosition = useCallback((row: number, col: number) => {
    const x = SEAT_GAP + col * (SEAT_SIZE + SEAT_GAP);
    const y = SEAT_GAP + row * (SEAT_SIZE + SEAT_GAP);
    return { x, y };
  }, []);

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now = performance.now();

    seats.forEach((seat) => {
      const { x, y } = getSeatPosition(seat.row, seat.col);

      const anim = animatedSeatsRef.current.find(a => a.id === seat.id);
      let scale = 1;

      if (anim && now - anim.startTime < anim.duration) {
        const t = (now - anim.startTime) / anim.duration;
        if (!anim.isManual) {
          if (t < 0.5) {
            scale = 1 + 0.1 * (t * 2);
          } else {
            scale = 1.1 - 0.1 * ((t - 0.5) * 2);
          }
        }
      }

      const drawSize = SEAT_SIZE * scale;
      const drawX = x + (SEAT_SIZE - drawSize) / 2;
      const drawY = y + (SEAT_SIZE - drawSize) / 2;

      if (seat.checkedIn) {
        const gradient = ctx.createLinearGradient(drawX, drawY, drawX, drawY + drawSize);
        gradient.addColorStop(0, '#4CAF50');
        gradient.addColorStop(1, '#81C784');
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = '#E3F2FD';
      }

      drawRoundedRect(ctx, drawX, drawY, drawSize, drawSize, SEAT_RADIUS);
      ctx.fill();
    });

    animatedSeatsRef.current = animatedSeatsRef.current.filter((anim) => {
      const elapsed = now - anim.startTime;
      if (elapsed >= anim.duration) return false;

      if (anim.isManual) {
        const t = elapsed / anim.duration;
        const radius = 30 * t;
        const alpha = 1 - t;

        ctx.strokeStyle = `rgba(244, 208, 63, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          anim.x + SEAT_SIZE / 2,
          anim.y + SEAT_SIZE / 2,
          radius,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      return true;
    });

    if (animatedSeatsRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(draw);
    }
  }, [seats, getSeatPosition]);

  useEffect(() => {
    const currentCheckedIds = new Set(seats.filter(s => s.checkedIn).map(s => s.id));
    const newCheckedIds: string[] = [];

    currentCheckedIds.forEach((id) => {
      if (!prevCheckedIdsRef.current.has(id)) {
        newCheckedIds.push(id);
      }
    });

    newCheckedIds.forEach((id) => {
      const seat = seats.find(s => s.id === id);
      if (seat) {
        const { x, y } = getSeatPosition(seat.row, seat.col);
        animatedSeatsRef.current.push({
          id,
          startTime: performance.now(),
          duration: 300,
          isManual: false,
          x,
          y,
        });
      }
    });

    prevCheckedIdsRef.current = currentCheckedIds;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [seats, draw, getSeatPosition]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    for (const seat of seats) {
      const { x, y } = getSeatPosition(seat.row, seat.col);
      if (
        clickX >= x && clickX <= x + SEAT_SIZE &&
        clickY >= y && clickY <= y + SEAT_SIZE
      ) {
        if (!seat.checkedIn) {
          onSeatClick(seat.id);
          animatedSeatsRef.current.push({
            id: seat.id,
            startTime: performance.now(),
            duration: 800,
            isManual: true,
            x,
            y,
          });
          animatedSeatsRef.current.push({
            id: seat.id + '_pulse',
            startTime: performance.now(),
            duration: 300,
            isManual: false,
            x,
            y,
          });
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(draw);
        }
        break;
      }
    }
  };

  return (
    <div className="card seat-map-wrapper">
      <h3 className="section-title">座位签到区域</h3>
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onClick={handleCanvasClick}
          style={{
            maxWidth: '100%',
            height: 'auto',
            cursor: 'pointer',
          }}
        />
      </div>
      <p style={{ fontSize: '12px', color: '#616161', marginTop: '8px' }}>
        点击座位可手动标记签到（模拟扫码失败补录）
      </p>
    </div>
  );
};
