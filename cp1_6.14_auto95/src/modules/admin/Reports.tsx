import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getReports } from '../../api';
import Skeleton from '../../components/Skeleton';

const MONTH_COLORS = [
  '#D2A679', '#C49668', '#B68657', '#A0522D',
  '#D2A679', '#C49668', '#B68657', '#A0522D',
  '#D2A679', '#C49668', '#B68657', '#A0522D',
];

interface ReportData {
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  monthlyStats: { month: string; count: number }[];
  categoryStats: { category: string; count: number }[];
}

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getReports()
      .then((res) => res.data && setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-secondary/30 shadow-sm p-6">
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-secondary/30 shadow-sm p-8 text-center text-gray-400">
        暂无统计数据
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-secondary/30 shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">总借阅次数</p>
          <p className="text-3xl font-bold text-accent">{data?.totalLoans || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-secondary/30 shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">当前借阅中</p>
          <p className="text-3xl font-bold text-primary">{data?.activeLoans || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-secondary/30 shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">逾期数量</p>
          <p className="text-3xl font-bold text-red-500">{data?.overdueLoans || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-secondary/30 shadow-sm p-6">
        <h3 className="text-base font-bold text-accent mb-4">月度借阅统计</h3>
        {!data?.monthlyStats || data.monthlyStats.length === 0 ? (
          <p className="text-center text-gray-400 py-10">暂无数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E6D0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#A0522D" />
              <YAxis tick={{ fontSize: 12 }} stroke="#A0522D" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FAF5EE',
                  border: '1px solid #D2A679',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="count" name="借阅数量" radius={[4, 4, 0, 0]}>
                {data.monthlyStats.map((_, i) => (
                  <rect key={i} fill={MONTH_COLORS[i % MONTH_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-xl border border-secondary/30 shadow-sm p-6">
        <h3 className="text-base font-bold text-accent mb-4">分类统计</h3>
        {!data?.categoryStats || data.categoryStats.length === 0 ? (
          <p className="text-center text-gray-400 py-10">暂无数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.categoryStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E6D0" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#A0522D" />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 12 }} stroke="#A0522D" width={60} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FAF5EE',
                  border: '1px solid #D2A679',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" name="数量" radius={[0, 4, 4, 0]}>
                {data.categoryStats.map((_, i) => (
                  <rect key={i} fill={MONTH_COLORS[i % MONTH_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
