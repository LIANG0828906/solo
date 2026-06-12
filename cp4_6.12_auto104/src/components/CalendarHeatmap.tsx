import { useMemo, useState, useRef } from 'react';
import { useStore } from '../store';
import { Movie } from '../types';

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const getRatingColor = (rating: number): string => {
  if (rating >= 9) return '#ffd700';
  if (rating >= 7) return '#4caf50';
  if (rating >= 5) return '#2196f3';
  return '#9e9e9e';
};

interface TooltipState {
  movie: Movie;
  x: number;
  y: number;
}

function CalendarHeatmap() {
  const { movies, setHighlightedId, highlightedId } = useStore();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const years = useMemo(() => {
    const yearSet = new Set<number>();

    for (const m of movies) {
      const d = new Date(m.date);
      if (!isNaN(d.getTime())) {
        yearSet.add(d.getFullYear());
      }
    }

    const currentYear = new Date().getFullYear();
    if (yearSet.size === 0) yearSet.add(currentYear);

    const minYear = Math.min(...yearSet);
    const maxYear = Math.max(currentYear, ...yearSet);
    const result: number[] = [];
    for (let y = minYear; y <= maxYear; y++) result.push(y);
    return result;
  }, [movies]);

  const moviesByYearMonthDate = useMemo(() => {
    const result = new Map<string, Movie[]>();
    for (const m of movies) {
      const date = new Date(m.date);
      if (isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!result.has(key)) result.set(key, []);
      result.get(key)!.push(m);
    }
    return result;
  }, [movies]);

  const handleDotClick = (movie: Movie, cardElement: HTMLElement) => {
    setHighlightedId(movie.id);
    setTimeout(() => setHighlightedId(null), 2000);
  };

  const handleDotHover = (e: React.MouseEvent, movie: Movie) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      movie,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHoveredDate(movie.date);
  };

  const CELL_SIZE = 32;
  const DOT_SIZE = 10;
  const YEAR_HEADER_HEIGHT = 40;
  const MONTH_LABEL_WIDTH = 40;
  const ROW_GAP = 2;

  return (
    <div className="heatmap-container" ref={containerRef}>
      <div className="heatmap-header">
        <h2 className="panel-title">观影日历</h2>
        <div className="legend">
          <span className="legend-label">评分：</span>
          <span className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#ffd700' }}></span>
            9-10
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#4caf50' }}></span>
            7-8
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#2196f3' }}></span>
            5-6
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#9e9e9e' }}></span>
            1-4
          </span>
        </div>
      </div>

      <div className="heatmap-scroll">
        <div
          className="heatmap-grid"
          style={{
            gridTemplateColumns: `${MONTH_LABEL_WIDTH}px repeat(${years.length}, auto)`,
          }}
        >
          <div className="heatmap-corner"></div>
          {years.map((y) => (
            <div key={y} className="year-label">{y}</div>
          ))}

          {MONTHS.flatMap((month, monthIdx) => {
            const label = (
              <div key={`label-${monthIdx}`} className="month-label">{month}</div>
            );
            const cells = years.map((year) => {
              const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
              const firstDay = new Date(year, monthIdx, 1).getDay();
              const weekCount = Math.ceil((daysInMonth + firstDay) / 7);

              return (
                <div
                  key={`cell-${year}-${monthIdx}`}
                  className="month-cell"
                >
                  <svg
                    width={7 * (DOT_SIZE + 2)}
                    height={weekCount * (DOT_SIZE + 2)}
                    className="dots-svg"
                  >
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const dayIdx = firstDay + i;
                      const col = dayIdx % 7;
                      const row = Math.floor(dayIdx / 7);
                      const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const dayMovies = moviesByYearMonthDate.get(`${year}-${monthIdx}-${day}`) || [];

                      if (dayMovies.length === 0) {
                        return (
                          <circle
                            key={dateStr}
                            cx={col * (DOT_SIZE + 2) + DOT_SIZE / 2 + 1}
                            cy={row * (DOT_SIZE + 2) + DOT_SIZE / 2 + 1}
                            r={DOT_SIZE / 2 - 1}
                            fill="#2a2a4e"
                            opacity={0.5}
                          />
                        );
                      }

                      const movie = dayMovies[0];
                      const isHighlighted = highlightedId === movie.id;
                      const isHovered = hoveredDate === movie.date;
                      const color = getRatingColor(movie.rating);
                      const size = isHovered || isHighlighted ? DOT_SIZE : DOT_SIZE - 2;

                      return (
                        <circle
                          key={dateStr}
                          cx={col * (DOT_SIZE + 2) + DOT_SIZE / 2 + 1}
                          cy={row * (DOT_SIZE + 2) + DOT_SIZE / 2 + 1}
                          r={size / 2}
                          fill={color}
                          className={`heatmap-dot ${isHighlighted ? 'dot-highlighted' : ''}`}
                          style={{
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            filter: isHovered || isHighlighted ? `drop-shadow(0 0 4px ${color})` : 'none',
                          }}
                          onMouseEnter={(e) => handleDotHover(e as any, movie)}
                          onMouseMove={(e) => handleDotHover(e as any, movie)}
                          onMouseLeave={() => {
                            setTooltip(null);
                            setHoveredDate(null);
                          }}
                          onClick={() => handleDotClick(movie, containerRef.current!)}
                        />
                      );
                    })}
                  </svg>
                </div>
              );
            });
            return [label, ...cells];
          })}
        </div>
      </div>

      {tooltip && (
        <div
          className="tooltip"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 8,
          }}
        >
          <div className="tooltip-title">{tooltip.movie.title}</div>
          <div className="tooltip-date">{tooltip.movie.date}</div>
          <div className="tooltip-rating" style={{ color: getRatingColor(tooltip.movie.rating) }}>
            ★ {tooltip.movie.rating}
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarHeatmap;
