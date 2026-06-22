import { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getMemberLoad } from '@/services/timelineService';
import type { MemberLoad } from '@/types';

const COLORS = ['#3B82F6', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#EC4899', '#14B8A6'];

interface LoadChartProps {
  boardId: string;
}

export default function LoadChart({ boardId }: LoadChartProps) {
  const [data, setData] = useState<MemberLoad[]>([]);

  useEffect(() => {
    getMemberLoad(boardId).then(setData).catch(() => {});
  }, [boardId]);

  const { dates, members, chartData } = useMemo(() => {
    const dateSet = new Set(data.map((d) => d.date));
    const memberSet = new Set(data.map((d) => d.member));
    const datesArr = Array.from(dateSet).sort();
    const membersArr = Array.from(memberSet);

    const grouped = membersArr.map((member) => {
      const entry: Record<string, string | number> = { member };
      datesArr.forEach((date) => {
        const record = data.find((d) => d.date === date && d.member === member);
        entry[date] = record ? record.todo + record.inProgress + record.done : 0;
      });
      return entry;
    });

    return { dates: datesArr, members: membersArr, chartData: grouped };
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6">
        <h3 className="font-semibold text-slate-700 mb-4">成员任务负载</h3>
        <p className="text-sm text-slate-400">暂无负载数据</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="font-semibold text-slate-700 mb-4">成员任务负载</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="member" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {dates.map((date, i) => (
            <Line
              key={date}
              type="monotone"
              dataKey={date}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
