// 数据流向（文件顶部注释）：
// useEffect → fetchPointsData → API GET /api/points → store 更新 → 组件重渲染
// UserCard 头像上传 → setUserAvatar → store.user.avatar 更新 → 卡片重渲染
// 路由：NavLink to="/" and "/exchange" → React Router → App.tsx 分发
//
// 图表数据转换：
// WeekPoints { dates[], points[] } → PointRecord[] { date, points }（X轴显示"周一"~"周日"）
// MonthPoints { dates[], points[] } → PointRecord[]（X轴只显示第1、8、15、22、29号）
//
// 依赖：@/store/useStore, @/components/Navbar, @/components/UserCard, @/components/PointChart,
//       react-virtuoso, react-router-dom, lucide-react

import { useEffect, useMemo } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { TrendingUp, CalendarDays, History, Sparkles } from 'lucide-react'
import { useStore } from '@/store/useStore'
import Navbar from '@/components/Navbar'
import UserCard from '@/components/UserCard'
import PointChart from '@/components/PointChart'
import type { PointRecord, ExchangeRecord } from '@/types'
import { cn } from '@/lib/utils'

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function getWeekdayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDay()
  return WEEKDAY_LABELS[day]
}

function shouldShowMonthLabel(dateStr: string, allDates: string[], index: number): boolean {
  const date = new Date(dateStr)
  const dayOfMonth = date.getDate()
  if (dayOfMonth === 1 || dayOfMonth === 8 || dayOfMonth === 15 || dayOfMonth === 22 || dayOfMonth === 29) {
    return true
  }
  if (index === allDates.length - 1) {
    return true
  }
  return false
}

function formatMonthDisplay(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export default function Dashboard() {
  const {
    user,
    weekPoints,
    monthPoints,
    history,
    fetchPointsData,
    setUserAvatar,
  } = useStore()

  useEffect(() => {
    fetchPointsData()
  }, [fetchPointsData])

  const weekChartData: PointRecord[] = useMemo(() => {
    if (!weekPoints) return []
    return weekPoints.dates.map((date, index) => ({
      id: `week-${index}`,
      date: getWeekdayLabel(date),
      points: weekPoints.points[index] || 0,
      description: '',
    }))
  }, [weekPoints])

  const monthChartData: PointRecord[] = useMemo(() => {
    if (!monthPoints) return []
    return monthPoints.dates.map((date, index) => ({
      id: `month-${index}`,
      date: shouldShowMonthLabel(date, monthPoints.dates, index) ? formatMonthDisplay(date) : '',
      points: monthPoints.points[index] || 0,
      description: '',
    }))
  }, [monthPoints])

  const weekTotalPoints = useMemo(() => {
    if (!weekPoints) return 0
    return weekPoints.points.reduce((sum, p) => sum + p, 0)
  }, [weekPoints])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {user && (
          <div className="mb-6">
            <UserCard
              user={user}
              onAvatarChange={setUserAvatar}
            />
          </div>
        )}

        <section className="mb-8">
          <div className="relative overflow-hidden p-8 rounded-2xl backdrop-blur-xl bg-white/70 border border-white/30 shadow-xl">
            <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
              background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.15) 0%, rgba(165, 214, 167, 0.15) 50%, rgba(46, 125, 50, 0.1) 100%)',
              padding: '2px',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }} />
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-primary/10 to-secondary/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-gradient-to-tr from-secondary/15 to-primary/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg flex-shrink-0">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">当前总积分</p>
                  <h1 className="text-5xl font-bold text-primary tracking-tight">
                    {user?.totalPoints ?? 0}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-primary/5 rounded-xl px-5 py-4 border border-primary/10">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">本周累计</p>
                  <p className="text-lg font-semibold text-gray-700">
                    <span className="text-primary">{weekTotalPoints}</span>
                    <span className="text-gray-400 ml-1 text-sm">积分</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-gray-800">当月积分趋势</h2>
            </div>
            <div className="w-full overflow-hidden">
              {monthChartData.length > 0 && (
                <PointChart
                  type="line"
                  data={monthChartData}
                  width={800}
                  height={300}
                />
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-gray-800">本周每日积分</h2>
            </div>
            <div className="w-full overflow-hidden">
              {weekChartData.length > 0 && (
                <PointChart
                  type="bar"
                  data={weekChartData}
                  width={800}
                  height={300}
                />
              )}
            </div>
          </div>
        </section>

        <section className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-gray-800">兑换历史</h2>
            </div>
            <div className="text-sm text-gray-500 bg-gray-100/60 px-3 py-1 rounded-full">
              共 <span className="font-semibold text-primary">{history.length}</span> 条
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-gray-100">
            <div className="hidden sm:grid grid-cols-12 px-4 py-3 bg-gray-50/70 text-xs font-medium text-gray-500 border-b border-gray-100">
              <div className="col-span-3">日期</div>
              <div className="col-span-6">商品</div>
              <div className="col-span-3 text-right">消耗积分</div>
            </div>

            <Virtuoso
              style={{ height: 400 }}
              totalCount={history.length}
              overscan={12}
              itemContent={(index: number) => {
                const record: ExchangeRecord = history[index]
                return (
                  <div
                    className={cn(
                      'grid grid-cols-12 items-center px-4 py-3.5 border-b border-gray-50 transition-colors duration-150 hover:bg-primary/5 cursor-default',
                      index === history.length - 1 && 'border-b-0'
                    )}
                  >
                    <div className="col-span-12 sm:col-span-3 text-sm text-gray-400 sm:text-left mb-1 sm:mb-0">
                      {record.date}
                    </div>
                    <div className="col-span-12 sm:col-span-6 font-medium text-gray-800 mb-1 sm:mb-0">
                      <span>{record.productName}</span>
                      <span className="ml-2 text-sm text-gray-400 font-normal">
                        × {record.quantity}
                      </span>
                    </div>
                    <div className="col-span-12 sm:col-span-3 sm:text-right">
                      <span className="text-red-500 font-semibold">
                        -{record.points}
                      </span>
                      <span className="ml-1 text-sm text-gray-400">积分</span>
                    </div>
                  </div>
                )
              }}
              components={{
                EmptyPlaceholder: () => (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <History className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm">暂无兑换记录</p>
                  </div>
                ),
              }}
            />
          </div>
        </section>
      </main>
    </div>
  )
}
