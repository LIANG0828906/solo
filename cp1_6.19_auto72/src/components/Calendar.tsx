import { useState, useEffect, useMemo, useRef } from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { getRecordsByMonth, getRecordByDate, getRecordsByDateRange, formatDateKey } from '../data';
import { MoodRecord, getMoodConfig, MoodLevel } from '../types';

interface CalendarProps {
  refreshSignal: number;
  onCellClick: (date: Date) => void;
}

interface TooltipState {
  x: number;
  y: number;
  record: MoodRecord;
}

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function Calendar({ refreshSignal, onCellClick }: CalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [pulseCells, setPulseCells] = useState<Set<string>>(new Set());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setPulseCells((prev) => new Set(prev));
  }, [refreshSignal]);

  const monthRecords = useMemo(
    () => getRecordsByMonth(year, month),
    [year, month, refreshSignal]
  );

  const recordMap = useMemo(() => {
    const m = new Map<string, MoodRecord>();
    monthRecords.forEach((r) => m.set(r.date, r));
    return m;
  }, [monthRecords]);

  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [year, month]);

  const weekData = useMemo(() => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const records = getRecordsByDateRange(start, end);
    const arr: { date: Date; record?: MoodRecord; level: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = formatDateKey(d);
      const r = records.find((x) => x.date === key);
      arr.push({
        date: d,
        record: r,
        level: r ? r.level : MoodLevel.Overcast,
      });
    }
    return arr;
  }, [refreshSignal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const padL = 20;
    const padR = 20;
    const padT = 16;
    const padB = 24;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    ctx.clearRect(0, 0, W, H);

    const points = weekData.map((d, i) => {
      const x = padL + (innerW * i) / Math.max(1, weekData.length - 1);
      const maxLvl = 5;
      const y = padT + (innerH * d.level) / maxLvl;
      return { x, y, level: d.level };
    });

    for (let i = 0; i <= 5; i++) {
      const y = padT + (innerH * i) / 5;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + innerW, y);
      ctx.stroke();
    }

    if (points.length >= 2) {
      const grad = ctx.createLinearGradient(0, padT, 0, padT + innerH);
      grad.addColorStop(0, '#FFA500');
      grad.addColorStop(0.33, '#778899');
      grad.addColorStop(0.66, '#4682B4');
      grad.addColorStop(1, '#8B0000');

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const p0 = points[i - 1];
        const p1 = points[i];
        const cpx = (p0.x + p1.x) / 2;
        ctx.bezierCurveTo(cpx, p0.y, cpx, p1.y, p1.x, p1.y);
      }
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(points[0].x, padT + innerH);
      ctx.lineTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const p0 = points[i - 1];
        const p1 = points[i];
        const cpx = (p0.x + p1.x) / 2;
        ctx.bezierCurveTo(cpx, p0.y, cpx, p1.y, p1.x, p1.y);
      }
      ctx.lineTo(points[points.length - 1].x, padT + innerH);
      ctx.closePath();
      const areaGrad = ctx.createLinearGradient(0, padT, 0, padT + innerH);
      areaGrad.addColorStop(0, 'rgba(255,165,0,0.18)');
      areaGrad.addColorStop(1, 'rgba(139,0,0,0.05)');
      ctx.fillStyle = areaGrad;
      ctx.fill();
    }

    points.forEach((p, i) => {
      const cfg = getMoodConfig(weekData[i].level as MoodLevel);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = cfg.color;
      ctx.fill();
    });

    const shortDays = ['一', '二', '三', '四', '五', '六', '日'];
    weekData.forEach((d, i) => {
      const x = padL + (innerW * i) / Math.max(1, weekData.length - 1);
      ctx.font = '11px -apple-system, sans-serif';
      ctx.fillStyle = '#999';
      ctx.textAlign = 'center';
      const dayIdx = d.date.getDay();
      const name = shortDays[(dayIdx + 6) % 7];
      ctx.fillText(name, x, padT + innerH + 16);
    });

    const handleMove = (e: MouseEvent) => {
      const cRect = canvas.getBoundingClientRect();
      const mx = e.clientX - cRect.left;
      const my = e.clientY - cRect.top;
      let foundIdx = -1;
      let minDist = Infinity;
      points.forEach((p, i) => {
        const dist = Math.hypot(mx - p.x, my - p.y);
        if (dist < 18 && dist < minDist) {
          minDist = dist;
          foundIdx = i;
        }
      });
      if (foundIdx >= 0 && weekData[foundIdx].record) {
        const p = points[foundIdx];
        setTooltip({
          x: p.x,
          y: p.y,
          record: weekData[foundIdx].record!,
        });
      } else {
        setTooltip(null);
      }
    };

    const handleLeave = () => setTooltip(null);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseleave', handleLeave);
    return () => {
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseleave', handleLeave);
    };
  }, [weekData]);

  const prevMonth = () => {
    setSlideDirection('left');
    setAnimKey((k) => k + 1);
    setTimeout(() => {
      if (month === 0) {
        setYear((y) => y - 1);
        setMonth(11);
      } else {
        setMonth((m) => m - 1);
      }
    }, 250);
  };

  const nextMonth = () => {
    setSlideDirection('right');
    setAnimKey((k) => k + 1);
    setTimeout(() => {
      if (month === 11) {
        setYear((y) => y + 1);
        setMonth(0);
      } else {
        setMonth((m) => m + 1);
      }
    }, 250);
  };

  const formatMonthLabel = () => `${year} 年 ${month + 1} 月`;

  const isToday = (d: Date) => {
    const t = new Date();
    return (
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth() &&
      d.getDate() === t.getDate()
    );
  };

  const handleCellClick = (d: Date) => {
    const key = formatDateKey(d);
    onCellClick(d);
    setPulseCells((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setTimeout(() => {
      setPulseCells((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 600);
  };

  const animClass =
    slideDirection === 'left'
      ? 'calendar-slide-left'
      : slideDirection === 'right'
      ? 'calendar-slide-right'
      : '';

  return (
    <div className="card">
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#444' }}>📈 本周心情趋势</h3>
          <span style={{ fontSize: 12, color: '#999' }}>近7天情绪折线</span>
        </div>
        <div style={{ position: 'relative', width: '100%', height: 120 }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          {tooltip && tooltip.record && (
            <div
              style={{
                position: 'absolute',
                left: tooltip.x,
                top: tooltip.y,
                transform: 'translate(-50%, -110%)',
                pointerEvents: 'none',
                zIndex: 10,
                animation: 'fade-in-up 0.2s ease-out',
              }}
            >
              <div
                style={{
                  background: 'rgba(30,30,40,0.92)',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: 10,
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 16 }}>{getMoodConfig(tooltip.record.level).emoji}</span>
                <span style={{ opacity: 0.85 }}>{tooltip.record.text}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button
          onClick={prevMonth}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(102,126,234,0.08)',
            color: '#667eea',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(102,126,234,0.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(102,126,234,0.08)')}
        >
          <MdChevronLeft size={20} />
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>{formatMonthLabel()}</h2>
        <button
          onClick={nextMonth}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(102,126,234,0.08)',
            color: '#667eea',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(102,126,234,0.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(102,126,234,0.08)')}
        >
          <MdChevronRight size={20} />
        </button>
      </div>

      <div
        key={animKey}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 6,
          animation:
            slideDirection === 'left'
              ? 'calendar-slide-in-left 0.5s ease-out'
              : slideDirection === 'right'
              ? 'calendar-slide-in-right 0.5s ease-out'
              : undefined,
        }}
      >
        {WEEK_DAYS.map((d) => (
          <div
            key={`head-${d}`}
            style={{
              textAlign: 'center',
              fontSize: 12,
              color: '#999',
              padding: '8px 0',
              fontWeight: 500,
            }}
          >
            {d}
          </div>
        ))}
        {calendarDays.map((d, idx) => {
          if (!d) {
            return <div key={`empty-${idx}`} />;
          }
          const key = formatDateKey(d);
          const rec = recordMap.get(key) || getRecordByDate(d);
          const cfg = rec ? getMoodConfig(rec.level) : null;
          const tdy = isToday(d);
          const cellPulse = pulseCells.has(key);
          const isHover = hoveredCell === key;

          return (
            <div
              key={key}
              onClick={() => handleCellClick(d)}
              onMouseEnter={() => setHoveredCell(key)}
              onMouseLeave={() => setHoveredCell(null)}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 12,
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: cfg
                  ? cfg.gradient
                  : isHover
                  ? 'rgba(102,126,234,0.06)'
                  : 'transparent',
                backdropFilter: cfg ? 'blur(8px)' : undefined,
                WebkitBackdropFilter: cfg ? 'blur(8px)' : undefined,
                border: tdy
                  ? '2px solid #667eea'
                  : isHover
                  ? '1px solid rgba(102,126,234,0.2)'
                  : '1px solid transparent',
                transition: 'transform 0.2s, background 0.3s',
                transform: isHover ? 'scale(1.04)' : 'scale(1)',
                animation: cellPulse ? 'pulse-glow 0.5s ease' : undefined,
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: tdy ? 700 : 500,
                  color: cfg ? '#fff' : tdy ? '#667eea' : '#555',
                  textShadow: cfg ? '0 1px 3px rgba(0,0,0,0.25)' : undefined,
                  zIndex: 2,
                }}
              >
                {d.getDate()}
              </span>
              {cfg && (
                <span style={{ fontSize: 16, marginTop: 2, zIndex: 2 }}>{cfg.emoji}</span>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ className: animClass, display: 'none' }} />
    </div>
  );
}
