import { useRef, useEffect, useState, useCallback } from 'react';
import { Clock } from 'lucide-react';

interface TimeSliderProps {
  value: number;
  onChange: (hour: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

function formatTime(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export default function TimeSlider({
  value,
  onChange,
  min = 0,
  max = 24,
  step = 0.1,
}: TimeSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const rippleRef = useRef<HTMLSpanElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const updateValueFromClientX = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      let percent = (clientX - rect.left) / rect.width;
      percent = Math.max(0, Math.min(1, percent));
      const newValue = min + percent * (max - min);
      const stepped = Math.round(newValue / step) * step;
      onChange(Math.min(max, Math.max(min, stepped)));
    },
    [min, max, step, onChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      updateValueFromClientX(e.clientX);

      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      ripple.className = 'ripple-effect';
      target.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    },
    [updateValueFromClientX]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateValueFromClientX(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, updateValueFromClientX]);

  const hourMarks = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div className="time-slider-container">
      <div className="time-display">
        <Clock size={18} className="clock-icon" />
        <span className="time-text">{formatTime(value)}</span>
      </div>

      <div
        ref={sliderRef}
        className="slider-track"
        onMouseDown={handleMouseDown}
      >
        <div className="slider-fill" style={{ width: `${percentage}%` }} />

        <div className="slider-marks">
          {hourMarks.map((hour) => (
            <div
              key={hour}
              className={`slider-mark ${hour % 6 === 0 ? 'major' : ''}`}
              style={{ left: `${(hour / 24) * 100}%` }}
            >
              {hour % 6 === 0 && <span className="mark-label">{hour}h</span>}
            </div>
          ))}
        </div>

        <div
          className="slider-thumb"
          style={{ left: `calc(${percentage}% - 10px)` }}
        >
          <div className="thumb-inner" />
        </div>
      </div>

      <div className="time-labels">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>

      <style>{`
        .time-slider-container {
          width: 100%;
          padding: 16px 24px;
          background: rgba(42, 42, 58, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          user-select: none;
        }

        .time-display {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .clock-icon {
          color: #ff7f3f;
        }

        .time-text {
          font-family: 'JetBrains Mono', 'SF Mono', monospace;
          font-size: 20px;
          font-weight: 500;
          color: #ffffff;
          letter-spacing: 1px;
        }

        .slider-track {
          position: relative;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          cursor: pointer;
          margin-bottom: 20px;
        }

        .slider-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, #ff7f3f, #ffa07f);
          border-radius: 3px;
          transition: width 0.05s ease-out;
        }

        .slider-marks {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .slider-mark {
          position: absolute;
          top: -2px;
          width: 1px;
          height: 10px;
          background: rgba(255, 255, 255, 0.2);
        }

        .slider-mark.major {
          height: 14px;
          background: rgba(255, 255, 255, 0.4);
        }

        .mark-label {
          position: absolute;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          font-family: 'JetBrains Mono', 'SF Mono', monospace;
          color: rgba(255, 255, 255, 0.5);
          white-space: nowrap;
        }

        .slider-thumb {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          z-index: 2;
          transition: left 0.05s ease-out;
        }

        .thumb-inner {
          width: 100%;
          height: 100%;
          background: #ff7f3f;
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(255, 127, 63, 0.6), 0 0 4px rgba(255, 127, 63, 0.9);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .slider-track:hover .thumb-inner {
          transform: scale(1.15);
          box-shadow: 0 0 16px rgba(255, 127, 63, 0.8), 0 0 8px rgba(255, 127, 63, 1);
        }

        .time-labels {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-family: 'JetBrains Mono', 'SF Mono', monospace;
          color: rgba(255, 255, 255, 0.4);
        }

        .ripple-effect {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 127, 63, 0.4);
          transform: scale(0);
          animation: ripple-animation 0.6s ease-out;
          pointer-events: none;
        }

        @keyframes ripple-animation {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
