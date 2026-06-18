import React, { useMemo, useCallback } from 'react';
import { useStore } from '../store';
import { getMoodLabel, getColor } from '../hooks/useColorSpectrum';

const ColorBar: React.FC = React.memo(() => {
  const weekData = useStore((s) => s.weekData);
  const selectDay = useStore((s) => s.selectDay);
  const selectedDayIndex = useStore((s) => s.selectedDayIndex);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const handleMouseEnter = useCallback((index: number) => {
    setHoveredIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const handleClick = useCallback((index: number) => {
    selectDay(index);
  }, [selectDay]);

  const gradientStyle = useMemo(() => {
    const stops = weekData.map((d, i) => `${d.avgColor} ${(i / weekData.length) * 100}%`);
    return { background: `linear-gradient(to right, ${stops.join(', ')})` };
  }, [weekData]);

  return (
    <div className="colorbar-wrapper">
      <div
        className="colorbar-track"
        style={gradientStyle}
      >
        {weekData.map((day, index) => {
          const isHovered = hoveredIndex === index;
          const isSelected = selectedDayIndex === index;
          return (
            <div
              key={day.date}
              className={`colorbar-segment ${isHovered ? 'hovered' : ''} ${isSelected ? 'selected' : ''}`}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick(index)}
            >
              {isHovered && (
                <div className="colorbar-tooltip">
                  <span className="tooltip-date">{day.date}</span>
                  <span className="tooltip-mood">{getMoodLabel(day.dominantMood)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="colorbar-labels">
        {weekData.map((day) => (
          <div key={day.date} className="colorbar-label">
            <span className="label-day">{day.dayLabel}</span>
          </div>
        ))}
      </div>
      <style>{`
        .colorbar-wrapper {
          width: 100%;
          min-width: 700px;
          margin-bottom: 40px;
          user-select: none;
        }
        .colorbar-track {
          position: relative;
          height: 60px;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .colorbar-segment {
          position: absolute;
          top: 0;
          height: 100%;
          width: ${100 / 7}%;
          transition: filter 0.3s ease, transform 0.3s ease;
          z-index: 1;
        }
        .colorbar-segment:nth-child(1) { left: 0%; }
        .colorbar-segment:nth-child(2) { left: ${100 / 7}%; }
        .colorbar-segment:nth-child(3) { left: ${200 / 7}%; }
        .colorbar-segment:nth-child(4) { left: ${300 / 7}%; }
        .colorbar-segment:nth-child(5) { left: ${400 / 7}%; }
        .colorbar-segment:nth-child(6) { left: ${500 / 7}%; }
        .colorbar-segment:nth-child(7) { left: ${600 / 7}%; }
        .colorbar-segment.hovered {
          filter: brightness(1.2);
          transform: scaleY(1.08);
          z-index: 2;
        }
        .colorbar-segment.selected {
          filter: brightness(1.15);
          z-index: 2;
        }
        .colorbar-segment.selected::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 3px;
          background: #fff;
          border-radius: 2px;
        }
        .colorbar-tooltip {
          position: absolute;
          top: -52px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(30, 30, 46, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 12px;
          padding: 6px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          pointer-events: none;
          z-index: 10;
          white-space: nowrap;
        }
        .tooltip-date {
          font-size: 0.8rem;
          color: #FFF;
          font-weight: 500;
        }
        .tooltip-mood {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.8);
        }
        .colorbar-labels {
          display: flex;
          margin-top: 10px;
        }
        .colorbar-label {
          flex: 1;
          text-align: center;
          font-size: 0.75rem;
          color: #888;
        }
        .label-day {
          transition: color 0.2s ease;
        }
        @media (max-width: 768px) {
          .colorbar-wrapper {
            min-width: unset;
          }
          .colorbar-track {
            flex-direction: column;
            height: auto;
            border-radius: 12px;
          }
          .colorbar-segment {
            position: relative;
            width: 100%;
            height: 40px;
            left: 0 !important;
          }
          .colorbar-labels {
            flex-direction: column;
          }
          .colorbar-label {
            text-align: left;
            padding: 4px 0;
          }
        }
      `}</style>
    </div>
  );
});

ColorBar.displayName = 'ColorBar';
export default ColorBar;
