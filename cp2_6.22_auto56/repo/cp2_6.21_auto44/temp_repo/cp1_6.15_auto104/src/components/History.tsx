import { useState, useEffect, useCallback } from 'react';
import { CalendarX } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { getCheckIns, type CheckIn } from '@/services/api';

function generateMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    options.push({ value, label });
  }
  return options;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

const monthOptions = generateMonthOptions();
const currentMonth = monthOptions[0]?.value ?? '';

export default function History() {
  const userId = useStore((s) => s.userId);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [records, setRecords] = useState<CheckIn[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async (resetPage?: boolean) => {
    if (!userId) return;
    const currentPage = resetPage ? 1 : page;
    setLoading(true);
    try {
      const result = await getCheckIns(userId, selectedMonth, currentPage, 50);
      if (resetPage || currentPage === 1) {
        setRecords(result.data);
      } else {
        setRecords((prev) => [...prev, ...result.data]);
      }
      setTotal(result.pagination.total);
    } catch {
      if (resetPage || currentPage === 1) setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedMonth, page]);

  useEffect(() => {
    setPage(1);
    fetchRecords(true);
  }, [selectedMonth, userId]);

  useEffect(() => {
    if (page > 1) fetchRecords();
  }, [page]);

  const hasMore = records.length < total;

  const loadMore = () => {
    setPage((p) => p + 1);
  };

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto" style={{ background: '#1a1a2e' }}>
      <h1 className="text-lg font-medium text-white/90 mb-4">打卡记录</h1>

      <div className="mb-4">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-dark-100 text-white/80 text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-gold/40"
        >
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {records.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <CalendarX size={48} className="mb-3" />
          <span>暂无打卡记录</span>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((record, index) => (
            <div
              key={record.id}
              className="glass-card history-item rounded-xl p-4 flex items-center justify-between"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex-1">
                <div className="text-white/80 text-sm font-medium">
                  {record.ritualName}
                  <span
                    className={`ml-2 inline-block text-xs px-2 py-0.5 rounded-full ${
                      record.ritualType === 'morning'
                        ? 'bg-morning-gradient text-dark'
                        : 'bg-evening-gradient text-white/80'
                    }`}
                  >
                    {record.ritualType === 'morning' ? '晨间' : '晚间'}
                  </span>
                </div>
                <div className="text-white/40 text-xs mt-1">
                  {formatDate(record.date)}
                </div>
              </div>
              <div className="text-white/50 text-xs">
                {record.time}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="text-center mt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="text-gold/70 hover:text-gold text-sm transition-colors disabled:opacity-50"
          >
            {loading ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}
    </div>
  );
}
