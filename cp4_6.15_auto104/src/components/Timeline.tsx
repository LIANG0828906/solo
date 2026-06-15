import { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useStormStore } from '@/store/useStormStore';
import { getYearRange } from '@/data/stormDataLoader';

export default function Timeline() {
  const {
    yearRange,
    setYearRange,
    playbackYear,
    isPlaying,
    togglePlay,
    setPlaybackYear,
    playbackSpeed,
    setPlaybackSpeed,
  } = useStormStore();

  const [minYear, maxYear] = getYearRange();
  const rangeRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'start' | 'end' | 'playhead' | null>(null);

  const yearToPosition = (year: number, width: number) => {
    return ((year - minYear) / (maxYear - minYear)) * width;
  };

  const positionToYear = (pos: number, width: number) => {
    const ratio = Math.max(0, Math.min(1, pos / width));
    return Math.round(minYear + ratio * (maxYear - minYear));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging || !rangeRef.current) return;
      const rect = rangeRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const year = positionToYear(x, rect.width);

      if (dragging === 'start') {
        setYearRange([Math.min(year, yearRange[1] - 1), yearRange[1]]);
      } else if (dragging === 'end') {
        setYearRange([yearRange[0], Math.max(year, yearRange[0] + 1)]);
      } else if (dragging === 'playhead') {
        setPlaybackYear(year);
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, yearRange, setYearRange, setPlaybackYear, minYear, maxYear]);

  const handleSkipBack = () => {
    setPlaybackYear(Math.max(minYear, playbackYear - 1));
  };

  const handleSkipForward = () => {
    setPlaybackYear(Math.min(maxYear, playbackYear + 1));
  };

  return (
    <div className="timeline-container">
      <div className="timeline-controls">
        <button
          className="timeline-skip-btn"
          onClick={handleSkipBack}
          title="上一年"
        >
          <SkipBack size={16} />
        </button>
        <button
          className={`timeline-play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlay}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button
          className="timeline-skip-btn"
          onClick={handleSkipForward}
          title="下一年"
        >
          <SkipForward size={16} />
        </button>
      </div>

      <div className="timeline-year-display">
        <span className="year-label">年份</span>
        <span className="year-value">{playbackYear}</span>
      </div>

      <div className="timeline-range" ref={rangeRef}>
        <div className="timeline-track">
          <div
            className="timeline-active-range"
            style={{
              left: `${yearToPosition(yearRange[0], 100)}%`,
              width: `${yearToPosition(yearRange[1], 100) - yearToPosition(yearRange[0], 100)}%`,
            }}
          />
        </div>

        <div className="timeline-ticks">
          {Array.from({ length: 13 }, (_, i) => {
            const year = minYear + Math.round((i / 12) * (maxYear - minYear));
            return (
              <div key={year} className="timeline-tick">
                <span className="tick-label">{year}</span>
              </div>
            );
          })}
        </div>

        <div
          className="timeline-handle start-handle"
          style={{ left: `${yearToPosition(yearRange[0], 100)}%` }}
          onMouseDown={(e) => {
            e.preventDefault();
            setDragging('start');
          }}
          title={`起始年份: ${yearRange[0]}`}
        >
          <div className="handle-tooltip">{yearRange[0]}</div>
        </div>

        <div
          className="timeline-handle end-handle"
          style={{ left: `${yearToPosition(yearRange[1], 100)}%` }}
          onMouseDown={(e) => {
            e.preventDefault();
            setDragging('end');
          }}
          title={`结束年份: ${yearRange[1]}`}
        >
          <div className="handle-tooltip">{yearRange[1]}</div>
        </div>

        <div
          className={`timeline-playhead ${isPlaying ? 'active' : ''}`}
          style={{ left: `${yearToPosition(playbackYear, 100)}%` }}
          onMouseDown={(e) => {
            e.preventDefault();
            setDragging('playhead');
          }}
        >
          <div className="playhead-line" />
          <div className="playhead-dot" />
        </div>
      </div>

      <div className="timeline-speed">
        <span className="speed-label">速度</span>
        <select
          className="speed-select"
          value={playbackSpeed}
          onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
        >
          <option value={800}>0.5x</option>
          <option value={500}>1x</option>
          <option value={300}>2x</option>
          <option value={150}>4x</option>
          <option value={80}>8x</option>
        </select>
      </div>
    </div>
  );
}
