import { useState, useMemo } from 'react';
import { Select, Statistic, Modal } from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import dayjs from 'dayjs';
import useStore from '@/store';
import type { Book } from '@/types';

const TAG_COLORS = ['#6a994e', '#bc4749', '#e76f51', '#f4a261', '#2a9d8f', '#264653', '#e9c46a', '#a7c957'];
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function MonthlyPagesTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
      <p style={{ margin: 0, fontSize: 14 }}>{label}: {payload[0].value}页</p>
    </div>
  );
}

function CumulativeDaysTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
      <p style={{ margin: 0, fontSize: 14 }}>累计{payload[0].value}天</p>
    </div>
  );
}

function TagPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
      <p style={{ margin: 0, fontSize: 14 }}>{data.tag}: {data.count}本</p>
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
    <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
      {tag} {count}
    </text>
  );
}

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

  const cumulativeData = useMemo(
    () =>
      stats.cumulativeDays.map((d: any) => ({
        ...d,
        month: MONTH_LABELS[dayjs(d.date).month()],
      })),
    [stats],
  );

  const tagBooks = useMemo(
    () => books.filter((b: Book) => b.tags?.includes(selectedTag)),
    [books, selectedTag],
  );

  const handlePieClick = (data: any, index: number) => {
    const tag = data?.tag || data?.payload?.tag || tagData[index]?.tag;
    if (tag) {
      setSelectedTag(tag);
      setModalOpen(true);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">年度统计</h2>
        <Select value={selectedYear} onChange={setSelectedYear} options={yearOptions} className="w-28" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <Statistic
            title="已读书籍"
            value={summaryStats.totalBooks}
            suffix="本"
            valueStyle={{ color: '#6a994e', fontWeight: 600 }}
          />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <Statistic
            title="阅读页数"
            value={summaryStats.totalPages}
            suffix="页"
            valueStyle={{ color: '#6a994e', fontWeight: 600 }}
          />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <Statistic
            title="阅读次数"
            value={summaryStats.totalSessions}
            suffix="次"
            valueStyle={{ color: '#6a994e', fontWeight: 600 }}
          />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <Statistic
            title="日均页数"
            value={summaryStats.avgPagesPerDay}
            suffix="页/天"
            valueStyle={{ color: '#6a994e', fontWeight: 600 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-base font-medium mb-4">每月阅读页数</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyPagesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<MonthlyPagesTooltip />} />
              <Bar dataKey="pages" fill="#6a994e" radius={[4, 4, 0, 0]} activeBar={{ fill: '#5a8a3e', stroke: '#6a994e', strokeWidth: 2 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-base font-medium mb-4">标签分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tagData}
                dataKey="count"
                nameKey="tag"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={renderPieLabel}
                onClick={handlePieClick}
                style={{ cursor: 'pointer' }}
              >
                {tagData.map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.color} style={{ cursor: 'pointer' }} />
                ))}
              </Pie>
              <Tooltip content={<TagPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 md:col-span-2">
          <h3 className="text-base font-medium mb-4">累计阅读天数</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CumulativeDaysTooltip />} />
              <Line type="monotone" dataKey="days" stroke="#6a994e" strokeWidth={2} dot={{ r: 4, fill: '#6a994e' }} activeDot={{ r: 6, fill: '#6a994e', stroke: '#fff', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Modal
        title={`${selectedTag} 相关书籍`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <ul className="space-y-2">
          {tagBooks.map((b: Book) => (
            <li key={b.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium">{b.title}</div>
              <div className="text-sm text-gray-500">{b.author}</div>
            </li>
          ))}
          {tagBooks.length === 0 && <li className="text-gray-400 text-center py-4">暂无书籍</li>}
        </ul>
      </Modal>
    </div>
  );
}
