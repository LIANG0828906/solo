import { useState, useMemo } from 'react';
import type { DailyStats } from '../types';
import { formatDateCN } from '../utils/constants';

interface HeatMapProps {
  data: DailyStats[];
  year: number;
}

interface CellData {
  date: Date;
  completed: number;
  total: number;
  rate: number;
}

const CELL_SIZE = 6;
const CELL_GAP = 2;
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function HeatMap({ data, year }: HeatMapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

  const cellsData = useMemo(() => {
    const map = new Map<string, DailyStats>();
    data.forEach(d => map.set(d.date, d));

    const startDate = new Date(year, 0, 1);
    const startDay = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1;
    startDate.setDate(startDate.getDate() - startDay);

    const endDate = new Date(year, 11, 31);
    const endDay = endDate.getDay() === 0 ? 6 : endDate.getDay() - 1;
    endDate.setDate(endDate.getDate() + (6 - endDay));

    const cells: CellData[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const key = current.toISOString().split('T')[0];
      const stat = map.get(key);
      const yearMatch = current.getFullYear() === year;
      cells.push({
        date: new Date(current),
        completed: stat?.completed ?? 0,
        total: stat?.total ?? 0,
        rate: yearMatch && stat ? (stat.total > 0 ? stat.completed / stat.total : 0) : -1,
      });
      current.setDate(current.getDate() + 1);
    }
    return cells;
  }, [data, year]);

  const getColor = (rate: number) => {
    if (rate < 0) return '#2a2a3e';
    if (rate === 0) return '#3a3a4e';
    if (rate <= 0.25) return '#5a8a6a';
    if (rate <= 0.5) return '#4a9a6a';
    if (rate <= 0.75) return '#3aaa6a';
    return '#2db84c';
  };

  const weeks = Math.ceil(cellsData.length / 7);
  const width = weeks * (CELL_SIZE + CELL_GAP);
  const height = 7 * (CELL_SIZE + CELL_GAP);

  const monthPositions = useMemo(() => {
    const positions: { name: string; x: number }[] = [];
    let lastMonth = -1;
    cellsData.forEach((cell, idx) => {
      const weekIdx = Math.floor(idx / 7);
      const month = cell.date.getMonth();
      if (month !== lastMonth && cell.date.getFullYear() === year) {
        if (cell.date.getDate() <= 7) {
          positions.push({
            name: MONTH_NAMES[month],
            x: weekIdx * (CELL_SIZE + CELL_GAP),
          });
        }
        lastMonth = month;
      }
    });
    return positions;
  }, [cellsData, year]);

  const handleMouseEnter = (e: React.MouseEvent, cell: CellData) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    let content = `${formatDateCN(cell.date)}\n`;
    if (cell.rate < 0) {
      content += '不在本年范围内';
    } else {
      content += `完成 ${cell.completed}/${cell.total} 个习惯`;
    }
    setTooltip({
      x: rect.left - containerRect.left + CELL_SIZE / 2,
      y: rect.top - containerRect.top - 8,
      content,
    });
  };

  const handleMouseLeave = () => setTooltip(null);

  return (
    <div className="heatmap-container">
      <div className="heatmap-wrapper">
        <div className="heatmap-months" style={{ paddingLeft: 0, width, position: 'relative', height: 18 }}>
          {monthPositions.map((m, i) => (
            <span key={i} className="heatmap-month-label" style={{ left: m.x }}>
              {m.name}
            </span>
          ))}
        </div>
        <div className="heatmap-body">
          <div className="heatmap-weekdays">
            <span>一</span><span></span><span>三</span><span></span>
            <span>五</span><span></span><span>日</span>
          </div>
          <svg
            width={width}
            height={height}
            onMouseLeave={handleMouseLeave}
            className="heatmap-svg"
          >
            {cellsData.map((cell, idx) => {
              const weekIdx = Math.floor(idx / 7);
              const dayIdx = idx % 7;
              const x = weekIdx * (CELL_SIZE + CELL_GAP);
              const y = dayIdx * (CELL_SIZE + CELL_GAP);
              return (
                <rect
                  key={idx}
                  x={x}
                  y={y}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={1}
                  ry={1}
                  fill={getColor(cell.rate)}
                  className="heatmap-cell"
                  onMouseEnter={(e) => handleMouseEnter(e as unknown as React.MouseEvent, cell)}
                />
              );
            })}
          </svg>
        </div>
        <div className="heatmap-legend">
          <span className="legend-label">少</span>
          <span className="legend-cell" style={{ backgroundColor: '#3a3a4e' }} />
          <span className="legend-cell" style={{ backgroundColor: '#5a8a6a' }} />
          <span className="legend-cell" style={{ backgroundColor: '#4a9a6a' }} />
          <span className="legend-cell" style={{ backgroundColor: '#3aaa6a' }} />
          <span className="legend-cell" style={{ backgroundColor: '#2db84c' }} />
          <span className="legend-label">多</span>
        </div>
      </div>
      {tooltip && (
        <div className="heatmap-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.content.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HeatMap;
