import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import type { PollStatistics } from '@/types';

interface StatisticsPanelProps {
  pollId: string;
  statistics: PollStatistics;
}

export default function StatisticsPanel({ statistics }: StatisticsPanelProps) {
  if (statistics.totalVotes === 0) return null;

  const barData = statistics.optionStats.map((s) => ({
    name: s.text.length > 6 ? s.text.slice(0, 6) + '…' : s.text,
    fullName: s.text,
    票数: s.votes,
    占比: `${s.percentage}%`,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-medium text-gray-500 mb-2">各选项得票数</h4>
        <div className="h-[280px] max-sm:h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '13px',
                }}
                formatter={((value: number, _name: string, props: { payload?: { fullName?: string; 占比?: string } }) => {
                  const fullName = props?.payload?.fullName ?? '';
                  const pct = props?.payload?.占比 ?? '';
                  return [`${value} 票 (${pct})`, fullName];
                }) as never}
              />
              <Bar
                dataKey="票数"
                fill="#4F46E5"
                radius={[4, 4, 0, 0]}
                animationDuration={500}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {statistics.timelineData.length > 1 && (
        <div>
          <h4 className="text-xs font-medium text-gray-500 mb-2">投票趋势</h4>
          <div className="h-[200px] max-sm:h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={statistics.timelineData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '13px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="votes"
                  stroke="#A5B4FC"
                  strokeWidth={2}
                  dot={{ fill: '#4F46E5', r: 3 }}
                  activeDot={{ r: 5, fill: '#4F46E5' }}
                  animationDuration={500}
                  animationEasing="ease-out"
                  name="累计票数"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
