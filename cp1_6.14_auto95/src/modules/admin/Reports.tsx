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
  monthly: { month: string; borrowed: number; returned: number }[];
  byCategory: { category: string; count: number }[];
}

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getReports()
      .then(setData)
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
      <div className="bg-white rounded-xl border border-secondary/30 shadow-sm p-6">
        <h3 className="text-base font-bold text-accent mb-4">月度借还统计</h3>
        {data.monthly.length === 0 ? (
          <p className="text-center text-gray-400 py-10">暂无数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthly}>
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
              <Bar dataKey="borrowed" name="借出" radius={[4, 4, 0, 0]}>
                {data.monthly.map((_, i) => (
                  <rect key={i} fill={MONTH_COLORS[i % MONTH_COLORS.length]} />
                ))}
              </Bar>
              <Bar dataKey="returned" name="归还" fill="#A0522D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-xl border border-secondary/30 shadow-sm p-6">
        <h3 className="text-base font-bold text-accent mb-4">分类统计</h3>
        {data.byCategory.length === 0 ? (
          <p className="text-center text-gray-400 py-10">暂无数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.byCategory} layout="vertical">
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
                {data.byCategory.map((_, i) => (
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
