import { useState, useMemo } from 'react';
import { Select, Statistic, Modal, Empty } from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import dayjs from 'dayjs';
import isLeapYear from 'dayjs/plugin/isLeapYear';
dayjs.extend(isLeapYear);
import { useStore } from '@/store';
import type { Book } from '@/types';

const TAG_COLORS = ['#6a994e', '#bc4749', '#e76f51', '#f4a261', '#2a9d8f', '#264653', '#e9c46a', '#a7c957'];
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function MonthlyPagesTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: '1px solid #f0f0f0' }}>
      <p style={{ margin: 0, fontSize: 14, color: '#333' }}>{label}: {payload[0].value} 页</p>
    </div>
  );
}

function CumulativeDaysTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: '1px solid #f0f0f0' }}>
      <p style={{ margin: 0, fontSize: 14, color: '#333' }}>{label || ''} 累计 {payload[0].value} 天</p>
    </div>
  );
}

function TagPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: data.color }} />
        <p style={{ margin: 0, fontSize: 14, color: '#333' }}>{data.tag}: {data.count} 本</p>
      </div>
    </div>
  );
}

function renderPieLabel(props: any) {
  const { cx, cy, midAngle, outerRadius, tag, count } = props;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 28;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fill="#555">
      {tag} {count}
    </text>
  );
}

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 20 };
const chartTitleStyle: React.CSSProperties = { margin: '0 0 16px 0', fontSize: 15, fontWeight: 600, color: '#333' };

export default function Statistics() {
  const currentYear = dayjs().year();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');

  const { books, sessions, getStats } = useStore();
  const stats = useMemo(() => getStats(selectedYear), [getStats, selectedYear]);

  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => ({ value: currentYear - i, label: `${currentYear - i}年` })),
    [currentYear],
  );

  const summaryStats = useMemo(() => {
    const readBooks = books.filter(
      (b: Book) => b.status === 'read' && dayjs(b.updatedAt).year() === selectedYear,
    );
    const totalPages = stats.monthlyPages.reduce((sum: number, m: any) => sum + m.pages, 0);
    const yearSessions = sessions.filter((s: any) => dayjs(s.date).year() === selectedYear);
    const daysInYear = dayjs().year(selectedYear).isLeapYear() ? 366 : 365;
    const avgPagesPerDay = totalPages > 0 ? Number((totalPages / daysInYear).toFixed(1)) : 0;
    return {
      totalBooks: readBooks.length,
      totalPages,
      totalSessions: yearSessions.length,
      avgPagesPerDay,
    };
  }, [books, sessions, stats, selectedYear]);

  const monthlyPagesData = useMemo(
    () =>
      MONTH_LABELS.map((label, i) => {
        const found = stats.monthlyPages.find((m: any) => parseInt(m.month) === i + 1);
        return { month: label, pages: found?.pages ?? 0 };
      }),
    [stats],
  );

  const tagData = useMemo(
    () =>
      stats.tagDistribution.map((t: any, i: number) => ({
        ...t,
        color: TAG_COLORS[i % TAG_COLORS.length],
      })),
    [stats],
  );

  const cumulativeData = useMemo(() => {
    const monthlyCumulative: { month: string; days: number; date: string }[] = [];
    let cum = 0;
    MONTH_LABELS.forEach((label, i) => {
      const monthDays = stats.cumulativeDays.filter(
        (d: any) => dayjs(d.date).month() === i,
      );
      if (monthDays.length > 0) {
        const lastDay = monthDays[monthDays.length - 1];
        cum = lastDay.days;
        monthlyCumulative.push({ month: label, days: lastDay.days, date: lastDay.date });
      } else {
        monthlyCumulative.push({ month: label, days: cum, date: '' });
      }
    });
    return monthlyCumulative.filter(d => d.days > 0);
  }, [stats]);

  const tagBooks = useMemo(
    () => books.filter((b: Book) => b.tags?.includes(selectedTag)),
    [books, selectedTag],
  );

  const handlePieClick = (_data: any, _index: number, event: any) => {
    const payload = event?.payload;
    const tag = payload?.tag || payload?.name;
    if (tag) {
      setSelectedTag(tag);
      setModalOpen(true);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#2d4a1a' }}>年度阅读统计</h2>
        <Select
          value={selectedYear}
          onChange={(v) => setSelectedYear(v)}
          options={yearOptions}
          style={{ width: 120 }}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <div style={cardStyle}>
          <Statistic
            title="已读书籍"
            value={summaryStats.totalBooks}
            suffix="本"
            valueStyle={{ color: '#6a994e', fontWeight: 600 }}
          />
        </div>
        <div style={cardStyle}>
          <Statistic
            title="阅读页数"
            value={summaryStats.totalPages}
            suffix="页"
            valueStyle={{ color: '#6a994e', fontWeight: 600 }}
          />
        </div>
        <div style={cardStyle}>
          <Statistic
            title="阅读次数"
            value={summaryStats.totalSessions}
            suffix="次"
            valueStyle={{ color: '#6a994e', fontWeight: 600 }}
          />
        </div>
        <div style={cardStyle}>
          <Statistic
            title="日均页数"
            value={summaryStats.avgPagesPerDay}
            suffix="页/天"
            valueStyle={{ color: '#6a994e', fontWeight: 600 }}
          />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: 20,
      }}>
        <div style={cardStyle}>
          <h3 style={chartTitleStyle}>每月阅读页数</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyPagesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#888' }} axisLine={{ stroke: '#e0e0e0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#888' }} axisLine={{ stroke: '#e0e0e0' }} tickLine={false} />
              <Tooltip
                content={<MonthlyPagesTooltip />}
                cursor={{ fill: 'rgba(106, 153, 78, 0.06)' }}
                contentStyle={{ border: 'none', background: 'transparent', padding: 0 }}
                labelStyle={{ display: 'none' }}
              />
              <Bar
                dataKey="pages"
                fill="#6a994e"
                radius={[4, 4, 0, 0]}
                activeBar={{ fill: '#5a8a3e', stroke: '#6a994e', strokeWidth: 2 }}
                animationDuration={500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle}>
          <h3 style={chartTitleStyle}>标签分布 <span style={{ fontSize: 12, fontWeight: 400, color: '#888' }}>(点击查看详情)</span></h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 10, right: 40, left: 40, bottom: 10 }}>
              <Tooltip
                content={<TagPieTooltip />}
                contentStyle={{ border: 'none', background: 'transparent', padding: 0 }}
                labelStyle={{ display: 'none' }}
              />
              <Pie
                data={tagData}
                dataKey="count"
                nameKey="tag"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                label={renderPieLabel}
                onClick={handlePieClick}
                style={{ cursor: 'pointer' }}
                animationDuration={500}
              >
                {tagData.map((entry: any, i: number) => (
                  <Cell
                    key={i}
                    fill={entry.color}
                    stroke="#fff"
                    strokeWidth={2}
                    style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <h3 style={chartTitleStyle}>累计阅读天数趋势</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={cumulativeData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#888' }} axisLine={{ stroke: '#e0e0e0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#888' }} axisLine={{ stroke: '#e0e0e0' }} tickLine={false} />
              <Tooltip
                content={<CumulativeDaysTooltip />}
                cursor={{ stroke: '#6a994e', strokeWidth: 1, strokeDasharray: '4 4' }}
                contentStyle={{ border: 'none', background: 'transparent', padding: 0 }}
                labelStyle={{ display: 'none' }}
              />
              <Line
                type="monotone"
                dataKey="days"
                stroke="#6a994e"
                strokeWidth={3}
                dot={{ r: 5, fill: '#6a994e', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 8, fill: '#6a994e', stroke: '#fff', strokeWidth: 3, style: { filter: 'drop-shadow(0 0 4px rgba(106,153,78,0.5))' } }}
                animationDuration={600}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Modal
        title={`标签「${selectedTag}」相关书籍`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={520}
        destroyOnClose
      >
        {tagBooks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
            {tagBooks.map((b: Book) => (
              <div
                key={b.id}
                style={{
                  padding: 14,
                  background: '#fafaf5',
                  borderRadius: 8,
                  display: 'flex',
                  gap: 12,
                  border: '1px solid rgba(106, 153, 78, 0.1)',
                }}
              >
                <div style={{
                  width: 48,
                  height: 64,
                  borderRadius: 4,
                  background: b.coverUrl ? `url(${b.coverUrl}) center/cover` : 'linear-gradient(135deg, #e8f5e1, #f0f7eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                }}>
                  {!b.coverUrl && '📖'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#2d4a1a', marginBottom: 4 }}>{b.title}</div>
                  <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{b.author}</div>
                  <div style={{ fontSize: 12, color: '#6a994e' }}>
                    进度: {b.totalPages > 0 ? Math.round((b.currentPage / b.totalPages) * 100) : 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty description="暂无该标签下的书籍" />
        )}
      </Modal>
    </div>
  );
}
