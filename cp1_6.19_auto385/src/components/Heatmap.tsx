import { useRef, useEffect, useState, useMemo } from 'react';
import { useAttendanceStore } from '../store/attendanceStore';
import type { PunchRecord } from '../types';

interface HeatmapCell {
  day: number;
  hour: number;
  records: PunchRecord[];
}

interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  hour: number;
  day: number;
  records: PunchRecord[];
}

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const Heatmap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { records } = useAttendanceStore();
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    hour: 0,
    day: 0,
    records: [],
  });

  const cellSize = 32;
  const padding = { top: 30, left: 50, right: 20, bottom: 20 };
  const gap = 2;

  const heatmapData = useMemo(() => {
    const data: HeatmapCell[][] = [];
    
    const last7Days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    for (let day = 0; day < 7; day++) {
      data[day] = [];
      for (let hour = 0; hour < 24; hour++) {
        const cellRecords = records.filter(r => {
          const recordDate = r.date;
          return recordDate === last7Days[day] && r.hour === hour;
        });
        data[day][hour] = { day, hour, records: cellRecords };
      }
    }
    return data;
  }, [records]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = padding.left + 24 * (cellSize + gap) + padding.right;
    const height = padding.top + 7 * (cellSize + gap) + padding.bottom;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, 0, width, height);

    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    for (let hour = 0; hour < 24; hour++) {
      if (hour % 3 === 0) {
        const x = padding.left + hour * (cellSize + gap) + cellSize / 2;
        ctx.fillText(`${hour}:00`, x, 18);
      }
    }

    ctx.textAlign = 'right';
    for (let day = 0; day < 7; day++) {
      const y = padding.top + day * (cellSize + gap) + cellSize / 2 + 4;
      ctx.fillText(DAYS[day], padding.left - 8, y);
    }

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const cell = heatmapData[day][hour];
        const x = padding.left + hour * (cellSize + gap);
        const y = padding.top + day * (cellSize + gap);

        if (cell.records.length > 0) {
          const gradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
          const intensity = Math.min(cell.records.length / 3, 1);
          const green = Math.floor(199 - intensity * 80);
          gradient.addColorStop(0, `rgb(129, ${green}, 132)`);
          gradient.addColorStop(1, `rgb(46, ${Math.floor(125 - intensity * 30)}, 60)`);
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = '#F5F5F5';
        }

        ctx.beginPath();
        ctx.roundRect(x, y, cellSize, cellSize, 4);
        ctx.fill();
      }
    }
  }, [heatmapData]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hour = Math.floor((x - padding.left) / (cellSize + gap));
    const day = Math.floor((y - padding.top) / (cellSize + gap));

    if (hour >= 0 && hour < 24 && day >= 0 && day < 7) {
      const cell = heatmapData[day][hour];
      if (cell.records.length > 0) {
        setTooltip({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          hour,
          day,
          records: cell.records,
        });
      } else {
        setTooltip(prev => ({ ...prev, visible: false }));
      }
    } else {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>考勤热力图</h3>
      <div style={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={styles.canvas}
        />
      </div>
      {tooltip.visible && (
        <div
          style={{
            ...styles.tooltip,
            left: tooltip.x + 15,
            top: tooltip.y - 10,
          }}
        >
          <div style={styles.tooltipTitle}>
            {DAYS[tooltip.day]} {tooltip.hour}:00 - {tooltip.hour + 1}:00
          </div>
          {tooltip.records.map((r, i) => (
            <div key={i} style={styles.tooltipItem}>
              {r.employeeName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative' as const,
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '16px',
  },
  canvasWrapper: {
    overflowX: 'auto' as const,
  },
  canvas: {
    display: 'block',
    cursor: 'pointer',
  },
  tooltip: {
    position: 'fixed' as const,
    backgroundColor: '#37474F',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    zIndex: 1000,
    pointerEvents: 'none' as const,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  tooltipTitle: {
    fontWeight: 600,
    marginBottom: '6px',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
    paddingBottom: '4px',
  },
  tooltipItem: {
    padding: '2px 0',
    opacity: 0.9,
  },
};

export default Heatmap;
