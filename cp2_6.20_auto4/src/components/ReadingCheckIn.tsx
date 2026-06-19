import { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import {
  format,
  subDays,
  startOfMonth,
  getDay,
  getDaysInMonth,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { CheckInRecord } from '@/types';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

type DurationLevel = 'none' | 'low' | 'medium' | 'high';

function getDurationLevel(duration: number): DurationLevel {
  if (duration <= 0) return 'none';
  if (duration <= 30) return 'low';
  if (duration <= 60) return 'medium';
  return 'high';
}

const LEVEL_STYLES: Record<DurationLevel, string> = {
  none: 'bg-cream-dark text-text-light',
  low: 'bg-green-heatmap-1 text-text',
  medium: 'bg-green-heatmap-3 text-white',
  high: 'bg-green-heatmap-4 text-white',
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ReadingCheckIn() {
  const { checkInRecords: records, fetchRecords, submitRecord, updateRecord } = useStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [startPage, setStartPage] = useState(0);
  const [endPage, setEndPage] = useState(0);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const recordsMap = useMemo(() => {
    const map = new Map<string, CheckInRecord>();
    records.forEach((r) => map.set(r.date, r));
    return map;
  }, [records]);

  const calendarDays = useMemo(() => {
    const firstDay = startOfMonth(currentMonth);
    const daysInMonth = getDaysInMonth(currentMonth);
    let startDow = getDay(firstDay);
    startDow = startDow === 0 ? 6 : startDow - 1;
    const days: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [currentMonth]);

  const handleDayClick = (day: number) => {
    const dateStr = format(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day),
      'yyyy-MM-dd'
    );
    const existing = recordsMap.get(dateStr);
    setSelectedDate(dateStr);
    if (existing) {
      setEditingId(existing.id);
      setDuration(existing.duration);
      setStartPage(existing.startPage);
      setEndPage(existing.endPage);
      setNote(existing.note);
    } else {
      setEditingId(null);
      setDuration(0);
      setStartPage(0);
      setEndPage(0);
      setNote('');
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (editingId) {
      await updateRecord(editingId, { date: selectedDate, duration, startPage, endPage, note });
    } else {
      await submitRecord({ date: selectedDate, duration, startPage, endPage, note });
    }
    setModalOpen(false);
  };

  const prevMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const nextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const trendData = useMemo(() => {
    const today = new Date();
    const labels: string[] = [];
    const data: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      labels.push(format(d, 'M/d'));
      const record = recordsMap.get(dateStr);
      data.push(record ? record.duration : 0);
    }
    return { labels, data };
  }, [recordsMap]);

  const chartData = {
    labels: trendData.labels,
    datasets: [
      {
        data: trendData.data,
        borderColor: '#FF8C42',
        backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } } }) => {
          const { chart } = context;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(255,140,66,0.1)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(255,140,66,0.4)');
          gradient.addColorStop(1, 'rgba(255,140,66,0.02)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: '#FF8C42',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: unknown }) => `${ctx.raw} min`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 10, font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.06)' },
        ticks: {
          font: { size: 11 },
          callback: (val: unknown) => `${val}m`,
        },
      },
    },
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-cream-dark transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-cream-dark transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {WEEKDAYS.map((d) => (
            <div key={d} className="font-medium text-text-muted py-1">
              {d}
            </div>
          ))}
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dateStr = format(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day),
              'yyyy-MM-dd'
            );
            const record = recordsMap.get(dateStr);
            const level = getDurationLevel(record?.duration ?? 0);
            const today = isToday(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(day)}
                className={cn(
                  'aspect-square flex items-center justify-center rounded text-sm transition-colors',
                  LEVEL_STYLES[level],
                  today && 'ring-2 ring-orange'
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-[300px]">
        <h3 className="text-lg font-semibold mb-4">30-Day Trend</h3>
        <div className="h-[280px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md animate-fade-in shadow-xl z-10">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-semibold mb-4">{selectedDate}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-light mb-1">Duration (min)</label>
                <input
                  type="number"
                  min={0}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-text-light mb-1">Start Page</label>
                  <input
                    type="number"
                    min={0}
                    value={startPage}
                    onChange={(e) => setStartPage(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-text-light mb-1">End Page</label>
                  <input
                    type="number"
                    min={0}
                    value={endPage}
                    onChange={(e) => setEndPage(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-text-light mb-1">Note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange resize-none"
                />
              </div>
              <button
                onClick={handleSubmit}
                className="w-full bg-orange text-white py-2 rounded-lg font-medium hover:bg-orange-dark transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
