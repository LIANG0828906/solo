import { useMemo } from 'react';
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
import { useMarketStore } from '@/store/useMarketStore';
import { GaugeChart } from './GaugeChart';
import { ShoppingBag, TrendingUp, Award, Calendar } from 'lucide-react';

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

interface DailyData {
  date: string;
  revenue: number;
  count: number;
}

export function ReportModule() {
  const transactions = useMarketStore(s => s.transactions);

  const stats = useMemo(() => {
    const completed = transactions.filter(t => t.status === 'completed');
    const totalRevenue = completed.reduce((sum, t) => sum + t.totalPrice, 0);
    const totalCount = completed.length;
    const avgOrder = totalCount > 0 ? totalRevenue / totalCount : 0;

    const productMap = new Map<string, TopProduct>();
    completed.forEach(tx => {
      const existing = productMap.get(tx.productId);
      if (existing) {
        existing.sales += tx.quantity;
        existing.revenue += tx.totalPrice;
      } else {
        productMap.set(tx.productId, {
          name: tx.productName,
          sales: tx.quantity,
          revenue: tx.totalPrice,
        });
      }
    });
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    const dailyMap = new Map<string, DailyData>();
    completed.forEach(tx => {
      const d = new Date(tx.createdAt);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      const existing = dailyMap.get(key);
      if (existing) {
        existing.revenue += tx.totalPrice;
        existing.count += 1;
      } else {
        dailyMap.set(key, { date: key, revenue: tx.totalPrice, count: 1 });
      }
    });
    const dailyTrend = Array.from(dailyMap.values()).sort((a, b) => {
      const [am, ad] = a.date.split('/').map(Number);
      const [bm, bd] = b.date.split('/').map(Number);
      return am === bm ? ad - bd : am - bm;
    });

    return { totalRevenue, totalCount, avgOrder, topProducts, dailyTrend };
  }, [transactions]);

  const targetRevenue = Math.max(1000, Math.ceil(stats.totalRevenue / 500) * 500 + 500);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 glass-card p-4 flex items-center justify-center">
          <GaugeChart value={Math.round(stats.totalRevenue)} max={targetRevenue} label="总销售额" />
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100">
              <ShoppingBag size={28} className="text-amber-700" />
            </div>
            <div>
              <p className="text-sm text-amber-600">总交易笔数</p>
              <p className="text-2xl font-display font-bold text-amber-900">{stats.totalCount}</p>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100">
              <TrendingUp size={28} className="text-green-700" />
            </div>
            <div>
              <p className="text-sm text-amber-600">客单价</p>
              <p className="text-2xl font-display font-bold text-amber-900">
                ¥{stats.avgOrder.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-100">
              <Award size={28} className="text-purple-700" />
            </div>
            <div>
              <p className="text-sm text-amber-600">热销商品数</p>
              <p className="text-2xl font-display font-bold text-amber-900">{stats.topProducts.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Award size={20} className="text-amber-700" />
            <h3 className="text-lg font-display font-bold text-amber-900">热销商品 Top 5</h3>
          </div>
          {stats.topProducts.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-amber-600">
              暂无销售数据
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topProducts} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(245, 158, 11, 0.15)" />
                  <XAxis type="number" tick={{ fill: '#92400E', fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#92400E', fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 251, 235, 0.95)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: 8,
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'sales' ? `${value} 件` : `¥${value.toFixed(2)}`,
                      name === 'sales' ? '销量' : '销售额',
                    ]}
                  />
                  <Bar dataKey="sales" fill="#D97706" radius={[0, 4, 4, 0]} name="sales" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-amber-700" />
            <h3 className="text-lg font-display font-bold text-amber-900">销售趋势（按日）</h3>
          </div>
          {stats.dailyTrend.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-amber-600">
              暂无销售数据
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(245, 158, 11, 0.15)" />
                  <XAxis dataKey="date" tick={{ fill: '#92400E', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#92400E', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 251, 235, 0.95)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: 8,
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? `¥${value.toFixed(2)}` : `${value} 笔`,
                      name === 'revenue' ? '销售额' : '交易数',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#D97706"
                    strokeWidth={2.5}
                    dot={{ fill: '#D97706', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    name="revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#B45309"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#B45309' }}
                    name="count"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {stats.topProducts.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-lg font-display font-bold text-amber-900 mb-4">商品销售明细</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-500/20">
                  <th className="text-left py-2 px-3 text-amber-800 font-medium">排名</th>
                  <th className="text-left py-2 px-3 text-amber-800 font-medium">商品名称</th>
                  <th className="text-right py-2 px-3 text-amber-800 font-medium">销量</th>
                  <th className="text-right py-2 px-3 text-amber-800 font-medium">销售额</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((p, i) => (
                  <tr
                    key={p.name}
                    className="border-b border-amber-500/10 hover:bg-amber-100/40 transition-colors"
                  >
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${
                          i === 0
                            ? 'bg-amber-500 text-white'
                            : i === 1
                            ? 'bg-amber-300 text-amber-900'
                            : i === 2
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-amber-900 font-medium">{p.name}</td>
                    <td className="py-2 px-3 text-right text-amber-800">{p.sales} 件</td>
                    <td className="py-2 px-3 text-right text-amber-800 font-semibold">
                      ¥{p.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
