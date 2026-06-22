import { useRef, useEffect, useCallback, useState } from 'react';
import { Seat } from '../types';

interface FloorPlanProps {
  seats: Seat[];
  onSeatClick: (seat: Seat) => void;
  activeCheckInSeatId: string | null;
  activeReservationSeatId: string | null;
}

const SEAT_SIZE = 40;
const SEAT_RADIUS = 8;

export default function FloorPlan({ seats, onSeatClick, activeCheckInSeatId, activeReservationSeatId }: FloorPlanProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const [canvasSize, setCanvasSize] = useState({ width: 520, height: 420 });

  const getStatusColor = (seat: Seat) => {
    if (seat.status === 'available') return '#22C55E';
    if (seat.status === 'reserved') return '#F59E0B';
    if (seat.status === 'in-use') return '#EF4444';
    return '#CBD5E1';
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const maxX = Math.max(...seats.map(s => s.x)) + SEAT_SIZE + 50;
    const maxY = Math.max(...seats.map(s => s.y)) + SEAT_SIZE + 50;
    const scale = scaleRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(scale, scale);

    ctx.fillStyle = '#F8FAFC';
    roundRect(ctx, 20, 20, maxX - 40, maxY - 40, 12);
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('自习室平面图', maxX / 2, 45);

    seats.forEach(seat => {
      const color = getStatusColor(seat);
      const isGlowActive = seat.id === activeCheckInSeatId || seat.id === activeReservationSeatId;
      
      if (isGlowActive) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
      }

      ctx.fillStyle = color;
      roundRect(ctx, seat.x, seat.y, SEAT_SIZE, SEAT_SIZE, SEAT_RADIUS);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(seat.number.toString(), seat.x + SEAT_SIZE / 2, seat.y + SEAT_SIZE / 2);
    });

    const legendY = maxY - 30;
    const legendItems = [
      { color: '#22C55E', label: '空闲' },
      { color: '#F59E0B', label: '已预约' },
      { color: '#EF4444', label: '使用中' }
    ];
    
    legendItems.forEach((item, idx) => {
      const x = 50 + idx * 120;
      ctx.fillStyle = item.color;
      roundRect(ctx, x, legendY, 16, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, x + 24, legendY + 12);
    });

    ctx.restore();
  }, [seats, activeCheckInSeatId, activeReservationSeatId]);

  const updateSize = useCallback(() => {
    const container = containerRef.current;
    const maxX = Math.max(...seats.map(s => s.x)) + SEAT_SIZE + 50;
    const maxY = Math.max(...seats.map(s => s.y)) + SEAT_SIZE + 50;
    
    if (!container) {
      scaleRef.current = 1;
      setCanvasSize({ width: Math.max(maxX, 400), height: Math.max(maxY, 400) });
      return;
    }

    const containerWidth = Math.max(container.clientWidth - 48, 400);
    const containerHeight = Math.max(container.clientHeight - 48, 400);
    const scaleX = containerWidth / maxX;
    const scaleY = containerHeight / maxY;
    const newScale = Math.min(scaleX, scaleY, 1);
    
    scaleRef.current = newScale;
    setCanvasSize({
      width: Math.max(maxX * newScale, 400),
      height: Math.max(maxY * newScale, 400)
    });
  }, [seats]);

  useEffect(() => {
    updateSize();
  }, [updateSize]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleResize = () => {
      updateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateSize]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scaleRef.current;
    const y = (e.clientY - rect.top) / scaleRef.current;

    for (const seat of seats) {
      if (
        x >= seat.x &&
        x <= seat.x + SEAT_SIZE &&
        y >= seat.y &&
        y <= seat.y + SEAT_SIZE
      ) {
        onSeatClick(seat);
        return;
      }
    }
  };

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: '400px',
        minHeight: '400px'
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleClick}
        style={{ 
          borderRadius: '12px',
          cursor: 'pointer',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
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
}
