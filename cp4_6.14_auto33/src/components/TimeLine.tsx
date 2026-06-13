import { useRef, useEffect } from 'react';
import './TimeLine.css';

interface TimeLineProps {
  currentYear: number;
  onYearChange: (year: number) => void;
  isSplitMode: boolean;
  disabled: boolean;
}

const AVAILABLE_YEARS = [2000, 2024];

export default function TimeLine({ currentYear, onYearChange, isSplitMode, disabled }: TimeLineProps) {
  const sliderRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sliderRef.current) {
      const percentage = ((currentYear - AVAILABLE_YEARS[0]) / (AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1] - AVAILABLE_YEARS[0])) * 100;
      sliderRef.current.style.background = `linear-gradient(to right, #00d4ff 0%, #00d4ff ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`;
    }
  }, [currentYear]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const value = Number(e.target.value);
    const snappedYear = AVAILABLE_YEARS.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
    onYearChange(snappedYear);
  };

  const handleYearClick = (year: number) => {
    if (disabled || year === currentYear) return;
    onYearChange(year);
  };

  return (
    <div className={`timeline-container ${isSplitMode ? 'split-mode' : ''}`} ref={containerRef}>
      <div className="timeline-track">
        <div className="timeline-years">
          {AVAILABLE_YEARS.map(year => (
            <div
              key={year}
              className={`year-marker ${currentYear === year ? 'active' : ''}`}
              onClick={() => handleYearClick(year)}
            >
              <div className="year-dot"></div>
              <span className="year-label">{year}年</span>
            </div>
          ))}
        </div>
        <input
          ref={sliderRef}
          type="range"
          min={AVAILABLE_YEARS[0]}
          max={AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1]}
          value={currentYear}
          onChange={handleSliderChange}
          step="1"
          disabled={disabled || isSplitMode}
          className="timeline-slider"
        />
      </div>
      <div className="current-year-display">
        <span className="year-text">{currentYear}</span>
        <span className="year-suffix">年</span>
      </div>
    </div>
  );
}
