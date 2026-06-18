import { useState, useEffect, useRef } from 'react';
import { useKeyStore } from '@/store/keyStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart3, Activity } from 'lucide-react';

function AnimatedNumber({ value, label }: { value: number; label: string }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const duration = 500;
    const startTime = performance.now();

    function step(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
    prevValue.current = value;
  }, [value]);

  return (
    <div className="rounded-xl border border-vault-border bg-vault-card p-5 card-shadow">
      <div className="mb-1 text-xs font-medium text-gray-400">{label}</div>
      <div className="animate-count-up font-mono text-3xl font-bold text-white">
        {display.toLocaleString()}
      </div>
    </div>
  );
}

export default function UsageChart() {
  const keys = useKeyStore((s) => s.keys);
  const getStats = useKeyStore((s) => s.getStats);
  const getTotalUsage = useKeyStore((s) => s.getTotalUsage);
  const getActiveKeyCount = useKeyStore((s) => s.getActiveKeyCount);

  const [filterKeyId, setFilterKeyId] = useState<string>('');
  const [stats, setStats] = useState(getStats());

  useEffect(() => {
    setStats(getStats(filterKeyId || undefined));
  }, [filterKeyId, getStats, keys, useKeyStore.getState().usageLogs.length]);

  const totalUsage = getTotalUsage();
  const activeKeys = getActiveKeyCount();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const gradientOffset = () => {
    const dataMax = Math.max(...stats.map((s) => s.count));
    const dataMin = Math.min(...stats.map((s) => s.count));
    if (dataMax <= 0) return 0;
    return dataMin / dataMax;
  };

  const off = gradientOffset();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-btn">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">用量统计</h2>
            <p className="text-xs text-gray-400">最近7天API调用次数</p>
          </div>
        </div>

        <select
          value={filterKeyId}
          onChange={(e) => setFilterKeyId(e.target.value)}
          className="rounded-lg border border-vault-border bg-[#1E1E2E] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-vault-accent1"
        >
          <option value="">全部密钥</option>
          {keys.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name} ({k.prefix}...)
            </option>
          ))}
        </select>
      </div>

      <div className="chart-container p-4 sm:p-6">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={stats} barSize={36}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1={off} x2="0" y2="0">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#60A5FA" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#D1D5DB' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E1E2E',
                border: '1px solid #3A3A5E',
                borderRadius: '8px',
                color: '#E2E8F0',
                fontSize: '13px',
              }}
              labelFormatter={(label) => {
                const d = new Date(label as string);
                return d.toLocaleDateString('zh-CN', {
                  month: 'long',
                  day: 'numeric',
                });
              }}
              formatter={(value: number) => [`${value} 次`, '调用次数']}
              cursor={{ fill: 'rgba(59,130,246,0.08)' }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="url(#barGradient)">
              {stats.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.count > 0 ? 'url(#barGradient)' : '#E5E7EB'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AnimatedNumber value={totalUsage} label="总调用次数" />
        <AnimatedNumber value={activeKeys} label="活跃密钥数" />
      </div>

      {totalUsage === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-vault-border bg-vault-card/50 py-8">
          <Activity className="mb-2 h-10 w-10 text-gray-600" />
          <p className="text-sm text-gray-500">暂无调用数据</p>
          <p className="text-xs text-gray-600">生成密钥后可在此查看用量统计</p>
        </div>
      )}
    </div>
  );
}
