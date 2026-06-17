import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useStore } from '@/store';

const PIE_COLORS = [
  '#6C63FF', '#FF6584', '#43E97B', '#FFD93D',
  '#4FC3F7', '#FF8A65', '#BA68C8', '#81C784',
  '#FFB74D', '#64B5F6',
];

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5 animate-fade-up">
      <h3 className="font-display font-semibold text-base mb-4" style={{ color: 'var(--color-text)' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function StatsPanel() {
  const stats = useStore((s) => s.computeStats());

  const tooltipStyle = useMemo(() => ({
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    color: 'var(--color-text)',
    fontSize: '0.8125rem',
    padding: '8px 12px',
  }), []);

  const axisTickStyle = useMemo(() => ({
    fill: 'var(--color-text-secondary)',
    fontSize: 12,
  }), []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="每月博客发布数">
          {stats.monthlyPosts.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.monthlyPosts}>
                <XAxis dataKey="month" tick={axisTickStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(108,99,255,0.06)' }} />
                <Bar dataKey="count" fill="#6C63FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>暂无数据</p>
          )}
        </ChartCard>

        <ChartCard title="每月留言数">
          {stats.monthlyMessages.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.monthlyMessages}>
                <XAxis dataKey="month" tick={axisTickStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="#6C63FF" strokeWidth={2} dot={{ r: 4, fill: '#6C63FF' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>暂无数据</p>
          )}
        </ChartCard>
      </div>

      <ChartCard title="技术栈使用频次">
        {stats.techStackFreq.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.techStackFreq}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                animationDuration={600}
                animationBegin={0}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {stats.techStackFreq.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: 'var(--color-text)', fontSize: '0.8125rem' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>暂无数据</p>
        )}
      </ChartCard>
    </div>
  );
}
