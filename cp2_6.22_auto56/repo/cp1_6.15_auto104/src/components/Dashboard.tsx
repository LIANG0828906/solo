import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { getStreak, getCalendar, type CalendarDay, type StreakInfo } from '@/services/api';

export default function Dashboard() {
  const userId = useStore((s) => s.userId);
  const navigate = useNavigate();

  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [streakKey, setStreakKey] = useState(0);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1);
  const [weeklyData, setWeeklyData] = useState<{ date: string; count: number }[]>([]);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; count: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!userId) return;
    getStreak(userId).then((data) => {
      setStreak((prev) => {
        if (prev && prev.currentStreak !== data.currentStreak) {
          setStreakKey((k) => k + 1);
        }
        return data;
      });
    }).catch(() => {});
  }, [userId]);

  const fetchCalendar = useCallback(() => {
    if (!userId) return;
    getCalendar(userId, calYear, calMonth).then(setCalendarDays).catch(() => {});
  }, [userId, calYear, calMonth]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  useEffect(() => {
    const now = new Date();
    const days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const calDay = calendarDays.find((c) => c.date === dateStr);
      days.push({ date: dateStr, count: calDay?.count ?? 0 });
    }
    setWeeklyData(days);
  }, [calendarDays]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || weeklyData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 200 * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.height = '200px';

    const w = rect.width;
    const h = 200;
    const padLeft = 30;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 30;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    ctx.clearRect(0, 0, w, h);

    const maxCount = Math.max(...weeklyData.map((d) => d.count), 1);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padTop + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padTop + (chartH / 4) * i;
      const val = Math.round(maxCount - (maxCount / 4) * i);
      ctx.fillText(String(val), padLeft - 6, y + 3);
    }

    const points = weeklyData.map((d, i) => ({
      x: padLeft + (chartW / (weeklyData.length - 1)) * i,
      y: padTop + chartH - (d.count / maxCount) * chartH,
      date: d.date,
      count: d.count,
    }));

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    points.forEach((p, i) => {
      const d = new Date(weeklyData[i].date);
      ctx.fillText(`${d.getMonth() + 1}/${d.getDate()}`, p.x, h - 6);
    });

    ctx.beginPath();
    ctx.strokeStyle = '#f2a900';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
    gradient.addColorStop(0, 'rgba(242,169,0,0.15)');
    gradient.addColorStop(1, 'rgba(242,169,0,0)');
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.lineTo(points[points.length - 1].x, padTop + chartH);
    ctx.lineTo(points[0].x, padTop + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#f2a900';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a2e';
      ctx.fill();
    });

    const handleCanvasMouseMove = (e: MouseEvent) => {
      const canvasRect = canvas.getBoundingClientRect();
      const mx = e.clientX - canvasRect.left;
      const my = e.clientY - canvasRect.top;
      let found: { x: number; y: number; date: string; count: number } | null = null;
      let minDist = Infinity;
      points.forEach((p) => {
        const dist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
        if (dist < minDist && dist < 20) {
          minDist = dist;
          found = { x: p.x, y: p.y, date: p.date, count: p.count };
        }
      });
      if (found) {
        setTooltip({ x: found.x, y: found.y, date: found.date, count: found.count });
      } else {
        setTooltip(null);
      }
    };

    const handleCanvasMouseLeave = () => {
      setTooltip(null);
    };

    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseleave', handleCanvasMouseLeave);

    return () => {
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
      canvas.removeEventListener('mouseleave', handleCanvasMouseLeave);
    };
  }, [weeklyData]);

  const prevMonth = () => {
    if (calMonth === 1) {
      setCalMonth(12);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 12) {
      setCalMonth(1);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const calendarGrid: (CalendarDay & { day: number; isToday: boolean })[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const calDay = calendarDays.find((c) => c.date === dateStr);
    calendarGrid.push({
      date: dateStr,
      count: calDay?.count ?? 0,
      day: d,
      isToday: dateStr === todayStr,
    });
  }

  const emptyCells = Array.from({ length: firstDay }, (_, i) => i);

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto" style={{ background: '#1a1a2e' }}>
      <div className="glass-card rounded-xl p-6 mb-4 text-center">
        <div
          key={streakKey}
          className={`flip-number text-5xl font-bold text-gold-gradient`}
          style={{ lineHeight: 1.2 }}
        >
          {streak?.currentStreak ?? 0}
        </div>
        <div className="text-white/60 text-sm mt-2">连续打卡天数</div>
        {streak && streak.longestStreak > 0 && (
          <div className="text-white/40 text-xs mt-1">
            最长连续 {streak.longestStreak} 天
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="p-1 text-white/60 hover:text-white transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="text-white/80 text-sm font-medium">
            {calYear}年 {monthNames[calMonth - 1]}
          </span>
          <button onClick={nextMonth} className="p-1 text-white/60 hover:text-white transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['日', '一', '二', '三', '四', '五', '六'].map((w) => (
            <div key={w} className="text-center text-white/30 text-xs">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {emptyCells.map((i) => (
            <div key={`empty-${i}`} />
          ))}
          {calendarGrid.map((cell) => (
            <div key={cell.date} className="flex justify-center py-1">
              <div
                className={`w-4 h-4 rounded-full ${
                  cell.count > 0
                    ? 'bg-gradient-to-br from-gold-light to-gold'
                    : 'bg-gray-700'
                } ${cell.isToday ? 'calendar-dot-today' : ''}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 mb-4">
        <div className="text-white/60 text-xs mb-2">近7日趋势</div>
        <div className="relative">
          <canvas ref={canvasRef} className="w-full" style={{ height: '200px' }} />
          {tooltip && (
            <div
              className="absolute pointer-events-none bg-dark-100 border border-white/10 rounded px-2 py-1 text-xs text-white/80 whitespace-nowrap"
              style={{
                left: tooltip.x,
                top: tooltip.y - 32,
                transform: 'translateX(-50%)',
              }}
            >
              {tooltip.date.slice(5)} · {tooltip.count}次
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={() => navigate('/history')}
          className="text-gold/70 hover:text-gold text-sm inline-flex items-center gap-1 transition-colors"
        >
          查看历史记录
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
