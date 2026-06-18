import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { TrendingUp, Trophy } from 'lucide-react'
import { useLibraryStore } from '@/data/store'

const BAR_COLORS = ['#1E3A5F', '#2A5280', '#3B6DA6', '#5B8FC9', '#8BB4DE']

export default function Statistics() {
  const getReservationStats = useLibraryStore((s) => s.getReservationStats)
  const getTopBooks = useLibraryStore((s) => s.getTopBooks)

  const reservationStats = useMemo(() => getReservationStats(), [getReservationStats])
  const topBooks = useMemo(() => getTopBooks(5), [getTopBooks])

  const totalReservations = reservationStats.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 pb-12">
      <h1 className="font-serif text-2xl font-bold text-surface-800 mb-2">统计面板</h1>
      <p className="text-sm text-surface-500 mb-6">过去7天的借阅趋势与热门图书排行</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-card shadow-card border border-surface-100 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-xs text-surface-400">7日预约总量</p>
              <p className="text-2xl font-bold text-surface-800">{totalReservations}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-card shadow-card border border-surface-100 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-accent-50 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-accent-500" />
            </div>
            <div>
              <p className="text-xs text-surface-400">日均预约</p>
              <p className="text-2xl font-bold text-surface-800">
                {totalReservations > 0 ? (totalReservations / 7).toFixed(1) : '0'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-card shadow-card border border-surface-100 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-surface-400">最热门图书</p>
              <p className="text-lg font-bold text-surface-800 truncate">
                {topBooks.length > 0 ? topBooks[0].title : '暂无数据'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-card shadow-card border border-surface-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <h2 className="font-serif text-base font-semibold text-surface-800">
              每日预约量趋势
            </h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reservationStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#868E96' }}
                  tickLine={false}
                  axisLine={{ stroke: '#dee2e6' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#868E96' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [`${value} 次`, '预约量']}
                  labelFormatter={(label: string) => `日期: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#4A90D9"
                  strokeWidth={2.5}
                  dot={{ fill: '#4A90D9', r: 4, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, stroke: '#4A90D9', strokeWidth: 2, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-card shadow-card border border-surface-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-accent-500" />
            <h2 className="font-serif text-base font-semibold text-surface-800">
              借阅排行 TOP 5
            </h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topBooks}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: '#868E96' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="title"
                  tick={{ fontSize: 12, fill: '#495057' }}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [`${value} 次`, '借阅量']}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
                  {topBooks.map((_, index) => (
                    <Cell key={index} fill={BAR_COLORS[index] || BAR_COLORS[4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
