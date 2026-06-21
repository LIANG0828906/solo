import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Calendar, Target } from 'lucide-react';
import useKanbanStore from '../store/useKanbanStore';
import type { Sprint, BurndownPoint } from '../../shared/types';

export default function SprintPanel() {
  const { sprint, setSprint } = useKanbanStore();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalStoryPoints, setTotalStoryPoints] = useState(0);

  useEffect(() => {
    fetch('/api/sprint')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setSprint(data);
          setName(data.name || '');
          setStartDate(data.startDate || '');
          setEndDate(data.endDate || '');
          setTotalStoryPoints(data.totalStoryPoints || 0);
        }
      })
      .catch(() => {});
  }, [setSprint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/sprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, startDate, endDate, totalStoryPoints }),
    });
    const data = await res.json();
    setSprint(data);
  };

  const getBurndownChartData = () => {
    if (!sprint?.dailyRemaining?.length) return [];

    const days = sprint.dailyRemaining.length;
    return sprint.dailyRemaining.map((point: BurndownPoint, idx: number) => ({
      date: point.date,
      ideal: Math.round(sprint.totalStoryPoints * (1 - idx / (days - 1))),
      actual: point.remaining,
    }));
  };

  return (
    <div className="space-y-5">
      <h2 className="font-bold text-[#2c3e50] text-base">冲刺计划</h2>

      {sprint && (
        <div className="bg-white rounded-lg p-4 space-y-2">
          <div className="font-semibold text-[#2c3e50]">{sprint.name}</div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar size={12} />
            <span>
              {sprint.startDate} ~ {sprint.endDate}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Target size={12} />
            <span>总故事点: {sprint.totalStoryPoints}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#2c3e50] mb-1">
            冲刺名称
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 focus:border-[#3498db]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2c3e50] mb-1">
            开始日期
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 focus:border-[#3498db]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2c3e50] mb-1">
            结束日期
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 focus:border-[#3498db]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2c3e50] mb-1">
            总故事点
          </label>
          <input
            type="number"
            min={0}
            value={totalStoryPoints}
            onChange={(e) => setTotalStoryPoints(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 focus:border-[#3498db]"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-[#3498db] text-white text-sm font-medium py-2 rounded-lg hover:bg-[#2980b9] transition-colors"
        >
          {sprint ? '更新冲刺' : '创建冲刺'}
        </button>
      </form>

      {sprint?.dailyRemaining?.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[#2c3e50] mb-2">
            燃尽图
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={getBurndownChartData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend
                wrapperStyle={{ fontSize: 10 }}
              />
              <Line
                type="monotone"
                dataKey="ideal"
                stroke="#94a3b8"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                name="理想"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#3498db"
                strokeWidth={2}
                name="实际"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
