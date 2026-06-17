import React, { useMemo } from 'react'
import { useStandStore, TIME_SLOTS } from '@/store/standStore'
import { X, TrendingUp, Calendar, Award, Clock } from 'lucide-react'

interface StatsSummary {
  totalDays: number
  avgRevenue: number
  topCategory: string
  bestTimeSlot: string
  totalRevenue: number
  categoryBreakdown: { category: string; count: number; revenue: number }[]
  timeSlotBreakdown: { slot: string; count: number; revenue: number; avgRevenue: number }[]
}

const StatsPanel: React.FC = () => {
  const records = useStandStore((s) => s.records)
  const showStats = useStandStore((s) => s.showStats)
  const setShowStats = useStandStore((s) => s.setShowStats)

  const summary = useMemo((): StatsSummary | null => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentRecords = records.filter((r) => new Date(r.createdAt) >= thirtyDaysAgo)

    if (recentRecords.length === 0) return null

    const totalRevenue = recentRecords.reduce((sum, r) => sum + r.revenue, 0)
    const avgRevenue = totalRevenue / recentRecords.length

    const categoryMap = new Map<string, { count: number; revenue: number }>()
    recentRecords.forEach((r) => {
      r.categories.forEach((cat) => {
        const existing = categoryMap.get(cat) || { count: 0, revenue: 0 }
        categoryMap.set(cat, {
          count: existing.count + 1,
          revenue: existing.revenue + r.revenue,
        })
      })
    })

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.revenue - a.revenue)

    const topCategory = categoryBreakdown[0]?.category || '暂无数据'

    const timeSlotMap = new Map<string, { count: number; revenue: number }>()
    recentRecords.forEach((r) => {
      const existing = timeSlotMap.get(r.timeSlot) || { count: 0, revenue: 0 }
      timeSlotMap.set(r.timeSlot, {
        count: existing.count + 1,
        revenue: existing.revenue + r.revenue,
      })
    })

    const timeSlotBreakdown = Array.from(timeSlotMap.entries())
      .map(([slot, data]) => ({
        slot,
        ...data,
        avgRevenue: data.count > 0 ? data.revenue / data.count : 0,
      }))
      .sort((a, b) => b.avgRevenue - a.avgRevenue)

    const bestTimeSlot = timeSlotBreakdown[0]?.slot
      ? TIME_SLOTS[timeSlotBreakdown[0].slot as keyof typeof TIME_SLOTS]?.label || timeSlotBreakdown[0].slot
      : '暂无数据'

    return {
      totalDays: recentRecords.length,
      avgRevenue,
      topCategory,
      bestTimeSlot,
      totalRevenue,
      categoryBreakdown,
      timeSlotBreakdown,
    }
  }, [records])

  if (!showStats) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={() => setShowStats(false)}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .stats-panel {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>

      <div
        className="stats-panel w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#FFFFFF' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: '#E5E7EB', background: 'linear-gradient(135deg, #E67E22 0%, #F39C12 100%)' }}
        >
          <div>
            <h2 className="text-xl font-bold text-white">30天经营数据报表</h2>
            <p className="text-sm text-white/80 mt-1">
              最近30天的经营数据汇总分析
            </p>
          </div>
          <button
            onClick={() => setShowStats(false)}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        <div className="p-6">
          {summary ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: '#F8F9F9' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={18} style={{ color: '#E67E22' }} />
                    <span className="text-sm" style={{ color: '#7F8C8D' }}>
                      总出摊次数
                    </span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#E67E22' }}>
                    {summary.totalDays}
                    <span className="text-sm font-normal ml-1" style={{ color: '#7F8C8D' }}>次</span>
                  </p>
                </div>

                <div
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: '#F8F9F9' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={18} style={{ color: '#E67E22' }} />
                    <span className="text-sm" style={{ color: '#7F8C8D' }}>
                      总收入
                    </span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#E67E22' }}>
                    ¥{summary.totalRevenue.toFixed(0)}
                  </p>
                </div>

                <div
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: '#F8F9F9' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={18} style={{ color: '#E67E22' }} />
                    <span className="text-sm" style={{ color: '#7F8C8D' }}>
                      平均收入
                    </span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#E67E22' }}>
                    ¥{summary.avgRevenue.toFixed(0)}
                    <span className="text-sm font-normal ml-1" style={{ color: '#7F8C8D' }}>/次</span>
                  </p>
                </div>

                <div
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: '#F8F9F9' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={18} style={{ color: '#E67E22' }} />
                    <span className="text-sm" style={{ color: '#7F8C8D' }}>
                      收入最高品类
                    </span>
                  </div>
                  <p className="text-2xl font-bold truncate" style={{ color: '#E67E22' }}>
                    {summary.topCategory}
                  </p>
                </div>
              </div>

              <div
                className="p-5 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={20} className="text-white" />
                  <span className="font-medium text-white">推荐出摊时段</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {summary.bestTimeSlot}
                </p>
                <p className="text-sm text-white/70 mt-2">
                  基于过去30天的平均收入计算得出
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-3" style={{ color: '#2C3E50' }}>
                  品类收入排行
                </h3>
                <div className="space-y-2">
                  {summary.categoryBreakdown.slice(0, 5).map((item, index) => (
                    <div key={item.category} className="flex items-center gap-3">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: index === 0 ? '#E67E22' : index === 1 ? '#F39C12' : index === 2 ? '#F1C40F' : '#BDC3C7',
                          color: 'white',
                        }}
                      >
                        {index + 1}
                      </span>
                      <span className="flex-1 text-sm" style={{ color: '#2C3E50' }}>
                        {item.category}
                      </span>
                      <span className="text-sm font-medium" style={{ color: '#E67E22' }}>
                        ¥{item.revenue.toFixed(0)}
                      </span>
                      <span className="text-xs" style={{ color: '#95A5A6' }}>
                        ({item.count}次)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3" style={{ color: '#2C3E50' }}>
                  时段收入分析
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {summary.timeSlotBreakdown.map((item) => (
                    <div
                      key={item.slot}
                      className="p-3 rounded-xl text-center"
                      style={{
                        backgroundColor: item.slot === summary.bestTimeSlot.split(' ')[0]
                          ? 'rgba(230, 126, 34, 0.1)'
                          : '#F8F9F9',
                        border: item.slot === summary.bestTimeSlot.split(' ')[0]
                          ? '2px solid #E67E22'
                          : '1px solid #E5E7EB',
                      }}
                    >
                      <p className="text-sm font-medium" style={{ color: '#2C3E50' }}>
                        {TIME_SLOTS[item.slot as keyof typeof TIME_SLOTS]?.label || item.slot}
                      </p>
                      <p className="text-lg font-bold mt-1" style={{ color: '#E67E22' }}>
                        ¥{item.avgRevenue.toFixed(0)}
                      </p>
                      <p className="text-xs" style={{ color: '#95A5A6' }}>
                        平均 / {item.count}次
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg" style={{ color: '#7F8C8D' }}>
                最近30天暂无经营数据
              </p>
              <p className="text-sm mt-2" style={{ color: '#95A5A6' }}>
                开始记录您的第一个摊位吧！
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t" style={{ borderColor: '#E5E7EB' }}>
          <button
            onClick={() => setShowStats(false)}
            className="w-full py-3 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              backgroundColor: '#2C3E50',
              color: '#FFFFFF',
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export default StatsPanel
