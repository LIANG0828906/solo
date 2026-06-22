import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface RangeSliderProps {
  min: Date;
  max: Date;
  value: [Date, Date];
  onChange: (value: [Date, Date]) => void;
}

export default function RangeSlider({ min, max, value, onChange }: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);

  const minTime = min.getTime();
  const maxTime = max.getTime();
  const range = maxTime - minTime;

  const startPercent = ((value[0].getTime() - minTime) / range) * 100;
  const endPercent = ((value[1].getTime() - minTime) / range) * 100;

  const getTimeFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return minTime;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return minTime + percent * range;
    },
    [minTime, range]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const newTime = getTimeFromPosition(clientX);
      const newDate = new Date(newTime);

      if (dragging === 'start') {
        if (newDate < value[1]) {
          onChange([newDate, value[1]]);
        }
      } else {
        if (newDate > value[0]) {
          onChange([value[0], newDate]);
        }
      }
    },
    [dragging, getTimeFromPosition, onChange, value]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleMouseMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="w-full py-4">
      <div
        ref={trackRef}
        className="relative w-full h-[6px] rounded-full cursor-pointer"
        style={{ backgroundColor: '#E5E7EB' }}
      >
        <div
          className="absolute h-full rounded-full"
          style={{
            left: `${startPercent}%`,
            right: `${100 - endPercent}%`,
            backgroundColor: '#3B82F6',
          }}
        />
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[14px] h-[14px] rounded-full cursor-grab active:cursor-grabbing transition-shadow',
            dragging === 'start' && 'ring-4 ring-blue-200'
          )}
          style={{
            left: `${startPercent}%`,
            backgroundColor: '#3B82F6',
          }}
          onMouseDown={() => setDragging('start')}
          onTouchStart={() => setDragging('start')}
        />
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[14px] h-[14px] rounded-full cursor-grab active:cursor-grabbing transition-shadow',
            dragging === 'end' && 'ring-4 ring-blue-200'
          )}
          style={{
            left: `${endPercent}%`,
            backgroundColor: '#3B82F6',
          }}
          onMouseDown={() => setDragging('end')}
          onTouchStart={() => setDragging('end')}
        />
      </div>
    </div>
  );
}
