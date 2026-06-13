import { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { CheckIn, ReadingStatus } from '@/shared/types';

interface CalendarCanvasProps {
  startDate: string;
  endDate: string;
  checkIns: CheckIn[];
  memberId: string;
  onDateClick?: (date: string) => void;
}

const COLORS: Record<ReadingStatus, string> = {
  unread: '#F5F5F4',
  reading: '#FED7AA',
  finished20: '#FDBA74',
  finished50: '#F97316',
};

const CalendarCanvas = ({
  startDate,
  endDate,
  checkIns,
  memberId,
  onDateClick,
}: CalendarCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(40);
  const [gap, setGap] = useState(4);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const animationRef = useRef<number>();
  const scaleRef = useRef<Record<string, number>>({});

  const getDaysBetween = useCallback(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      days.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [startDate, endDate]);

  const getCheckInStatus = useCallback(
    (date: string): ReadingStatus => {
      const checkIn = checkIns.find(
        (c) => c.date === date && c.memberId === memberId
      );
      if (!checkIn) return 'unread';
      if (checkIn.status === 'reading') return 'reading';
      if (checkIn.pages >= 50) return 'finished50';
      if (checkIn.pages >= 20) return 'finished20';
      return 'reading';
    },
    [checkIns, memberId]
  );

  const getColor = (status: ReadingStatus) => {
    return COLORS[status] || COLORS.unread;
  };

  const triggerConfetti = (date: string) => {
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#F97316', '#FED7AA', '#FDBA74']
    });
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const days = getDaysBetween();
    const cols = 7;
    const rows = Math.ceil(days.length / cols);
    const width = cols * cellSize + (cols - 1) * gap;
    const height = rows * cellSize + (rows - 1) * gap;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    days.forEach((date, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * (cellSize + gap);
      const y = row * (cellSize + gap);

      const status = getCheckInStatus(date);
      const color = getColor(status);
      const isHovered = hoveredDate === date;
      const currentScale = scaleRef.current[date] || 1;
      const targetScale = isHovered ? 1.1 : 1;
      const newScale = currentScale + (targetScale - currentScale) * 0.15;
      scaleRef.current[date] = newScale;

      const offset = (cellSize * newScale - cellSize) / 2;
      const drawX = x - offset;
      const drawY = y - offset;
      const drawSize = cellSize * newScale;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(drawX, drawY, drawSize, drawSize, 6);

      if (isHovered) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
      }

      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();

      const dayNum = new Date(date).getDate();
      ctx.fillStyle = status === 'finished50' ? '#FFFFFF' : '#57534E';
      ctx.font = `${Math.floor(cellSize * 0.35)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dayNum.toString(), x + cellSize / 2, y + cellSize / 2);
    });

    const needsAnimation = Object.values(scaleRef.current).some(
      (s) => Math.abs(s - 1) > 0.001
    );
    if (needsAnimation || hoveredDate) {
      animationRef.current = requestAnimationFrame(draw);
    }
  }, [cellSize, gap, getDaysBetween, getCheckInStatus, hoveredDate]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX / dpr;
      const y = (e.clientY - rect.top) * scaleY / dpr;

      const days = getDaysBetween();
      const cols = 7;
      let foundDate: string | null = null;

      days.forEach((date, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const cellX = col * (cellSize + gap);
        const cellY = row * (cellSize + gap);

        if (
          x >= cellX &&
          x < cellX + cellSize &&
          y >= cellY &&
          y < cellY + cellSize
        ) {
          foundDate = date;
        }
      });

      if (foundDate !== hoveredDate) {
        setHoveredDate(foundDate);
      }
    },
    [cellSize, gap, getDaysBetween, hoveredDate]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredDate(null);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onDateClick) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX / dpr;
      const y = (e.clientY - rect.top) * scaleY / dpr;

      const days = getDaysBetween();
      const cols = 7;

      days.forEach((date, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const cellX = col * (cellSize + gap);
        const cellY = row * (cellSize + gap);

        if (
          x >= cellX &&
          x < cellX + cellSize &&
          y >= cellY &&
          y < cellY + cellSize
        ) {
          triggerConfetti(date);
          onDateClick(date);
        }
      });
    },
    [cellSize, gap, getDaysBetween, onDateClick]
  );

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const cols = 7;
      const newGap = 4;
      const newCellSize = Math.floor((containerWidth - (cols - 1) * newGap) / cols);
      setCellSize(Math.max(30, Math.min(newCellSize, 60)));
      setGap(newGap);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    draw();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="cursor-pointer select-none"
        style={{ display: 'block' }}
      />
    </div>
  );
};

export default CalendarCanvas;
