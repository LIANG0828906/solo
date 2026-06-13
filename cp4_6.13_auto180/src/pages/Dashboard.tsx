import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@/store'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'
import ChartBar from '@/components/ChartBar'
import type { Summary, LeaveRequest } from '../../shared/types'

function CardSkeleton() {
  return (
    <div
      className="card bg-white rounded-xl p-5 flex items-center gap-4 animate-pulse"
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06)', minWidth: 320 }}
    >
      <div className="rounded-xl w-12 h-12 bg-gray-200" />
      <div className="flex-1">
        <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
        <div className="h-6 w-20 bg-gray-200 rounded mt-2" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { summary, leaves, period, setSummary, setLeaves, setPeriod, showToast } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/summary?period=${period}`).then((r) => r.json()),
      fetch('/api/leaves?status=待审批').then((r) => r.json()),
    ])
      .then(([summaryData, leavesData]: [Summary, { leaves: LeaveRequest[] }]) => {
        setSummary(summaryData)
        setLeaves(leavesData.leaves)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [period, setSummary, setLeaves])

  const pendingLeaves = useMemo(
    () => leaves.filter((l) => l.status === '待审批'),
    [leaves],
  )

  const handleApprove = async (id: string, status: '已通过' | '已拒绝') => {
    const res = await fetch(`/api/leaves/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setLeaves(leaves.map((l) => (l.id === id ? { ...l, status } : l)))
      showToast(status === '已通过' ? '已通过' : '已驳回')
    }
  }

  const cards = useMemo(() => {
    if (!summary) return []
    return [
      { label: '总工时', value: summary.totalHours, icon: Clock, unit: 'h' },
      { label: '平均每日工时', value: summary.avgDailyHours, icon: Clock, unit: 'h' },
      { label: '出勤天数', value: summary.attendanceDays, icon: CheckCircle, unit: '天' },
      { label: '请假天数', value: summary.leaveDays, icon: AlertCircle, unit: '天' },
    ]
  }, [summary])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold" style={{ color: '#1565c0' }}>
          {summary?.periodLabel || '加载中...'}
        </h2>
        <div className="flex gap-2">
          <button
            className={`period-btn px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              period === 'week' ? 'text-white' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
            style={period === 'week' ? { backgroundColor: '#1976d2' } : {}}
            onClick={() => setPeriod('week')}
          >
            本周
          </button>
          <button
            className={`period-btn px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              period === 'month' ? 'text-white' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
            style={period === 'month' ? { backgroundColor: '#1976d2' } : {}}
            onClick={() => setPeriod('month')}
          >
            本月
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />
          : cards.map((card, i) => (
              <div
                key={i}
                className="card bg-white rounded-xl p-5 flex items-center gap-4"
                style={{
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  minWidth: 320,
                }}
              >
                <div
                  className="flex items-center justify-center rounded-xl w-12 h-12"
                  style={{ backgroundColor: '#e3f2fd' }}
                >
                  <card.icon size={24} style={{ color: '#1976d2' }} />
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">{card.label}</div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="font-bold"
                      style={{ color: '#1976d2', fontSize: i === 0 ? 80 : 28 }}
                    >
                      {card.value}
                    </span>
                    <span className="text-sm text-gray-400">{card.unit}</span>
                  </div>
                </div>
              </div>
            ))}
      </div>

      <div
        className="card bg-white rounded-xl p-6"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
      >
        <h3 className="text-base font-semibold mb-4" style={{ color: '#333' }}>
          每日工时分布
        </h3>
        {loading ? (
          <div className="animate-pulse" style={{ height: 280 }}>
            <div className="h-full bg-gray-100 rounded-lg" />
          </div>
        ) : summary ? (
          <ChartBar data={summary.dailyHours} period={period} />
        ) : (
          <div className="text-center text-gray-400 py-8">加载中...</div>
        )}
      </div>

      <div
        className="card bg-white rounded-xl p-6"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
      >
        <h3 className="text-base font-semibold mb-4" style={{ color: '#333' }}>
          待审批请假
        </h3>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse p-4 rounded-lg border border-gray-100"
              >
                <div className="flex gap-3">
                  <div className="flex-1">
                    <div className="h-4 w-16 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-32 bg-gray-100 rounded mt-2" />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-14 h-8 bg-gray-200 rounded" />
                    <div className="w-14 h-8 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : pendingLeaves.length === 0 ? (
          <div className="text-center text-gray-400 py-8">暂无待审批请假</div>
        ) : (
          <div className="space-y-3">
            {pendingLeaves.map((leave) => (
              <div
                key={leave.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 transition-colors duration-200"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm" style={{ color: '#333' }}>
                      {leave.type}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#fff3e0', color: '#e65100' }}
                    >
                      待审批
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {leave.startDate} 至 {leave.endDate} · {leave.reason}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    className="approve-btn px-4 py-1.5 rounded-lg text-white text-sm font-medium transition-all duration-200"
                    style={{ backgroundColor: '#4caf50' }}
                    onClick={() => handleApprove(leave.id, '已通过')}
                    onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.filter = '')}
                  >
                    通过
                  </button>
                  <button
                    className="reject-btn px-4 py-1.5 rounded-lg text-white text-sm font-medium transition-all duration-200"
                    style={{ backgroundColor: '#f44336' }}
                    onClick={() => handleApprove(leave.id, '已拒绝')}
                    onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.filter = '')}
                  >
                    驳回
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
