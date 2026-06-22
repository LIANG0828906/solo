import { useRef, useState, useEffect, useCallback } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

export default function RangeSlider({ min, max, value, onChange }: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return min;
      const rect = track.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(min + percent * (max - min));
    },
    [min, max]
  );

  const handleMouseDown = (type: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(type);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragging) return;
      const v = getValueFromPosition(e.clientX);
      if (dragging === 'min') {
        onChange([Math.min(v, value[1] - (min === max ? 0 : 0)), value[1]] as [number, number]);
        const newMin = Math.min(v, value[1]);
        onChange([newMin, value[1]]);
      } else {
        const newMax = Math.max(v, value[0]);
        onChange([value[0], newMax]);
      }
    };
    const handleUp = () => setDragging(null);

    if (dragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, value, onChange, getValueFromPosition]);

  const minPercent = ((value[0] - min) / (max - min || 1)) * 100;
  const maxPercent = ((value[1] - min) / (max - min || 1)) * 100;

  return (
    <div className="slider-container">
      <div className="slider-label">
        <span>{value[0]}</span>
        <span>{value[1]}</span>
      </div>
      <div className="slider-track" ref={trackRef}>
        <div
          className="slider-fill"
          style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
        />
        <div
          className="slider-thumb"
          style={{ left: `${minPercent}%` }}
          onMouseDown={handleMouseDown('min')}
        />
        <div
          className="slider-thumb"
          style={{ left: `${maxPercent}%` }}
          onMouseDown={handleMouseDown('max')}
        />
      </div>
    </div>
  );
}
