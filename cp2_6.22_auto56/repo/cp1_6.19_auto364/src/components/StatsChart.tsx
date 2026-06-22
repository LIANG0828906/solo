import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { useDeckStore } from '@/stores/deckStore'

interface ChartData {
  date: string
  label: string
  accuracy: number | null
  total: number
  correct: number
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function StatsChart() {
  const reviewRecords = useDeckStore((s) => s.reviewRecords)
  const decks = useDeckStore((s) => s.decks)

  const chartData = useMemo<ChartData[]>(() => {
    const data: ChartData[] = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const record = reviewRecords.find((r) => r.date === dateStr)

      if (record && record.total > 0) {
        data.push({
          date: dateStr,
          label: formatDate(dateStr),
          accuracy: Math.round((record.correct / record.total) * 100),
          total: record.total,
          correct: record.correct
        })
      } else {
        data.push({
          date: dateStr,
          label: formatDate(dateStr),
          accuracy: null,
          total: 0,
          correct: 0
        })
      }
    }
    return data
  }, [reviewRecords])

  const totalCards = useMemo(
    () => decks.reduce((sum, d) => sum + d.cards.length, 0),
    [decks]
  )

  const totalReviews = useMemo(
    () => reviewRecords.reduce((sum, r) => sum + r.total, 0),
    [reviewRecords]
  )

  const overallAccuracy = useMemo(() => {
    const totalCorrect = reviewRecords.reduce((sum, r) => sum + r.correct, 0)
    const totalAll = reviewRecords.reduce((sum, r) => sum + r.total, 0)
    return totalAll > 0 ? Math.round((totalCorrect / totalAll) * 100) : 0
  }, [reviewRecords])

  const todayData = chartData[chartData.length - 1]

  const gradientId = 'accuracyGradient'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 32
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 6,
              background: 'linear-gradient(135deg, #f8f9fa, #9ca3af)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            学习统计
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            最近 7 天的复习正确率走势
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32
        }}
      >
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          style={{
            padding: 24,
            borderRadius: 16,
            background: 'linear-gradient(145deg, #1e1e2e, #252538)',
            border: '1px solid rgba(102, 126, 234, 0.15)'
          }}
        >
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
            今日复习
          </p>
          <p
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#f8f9fa'
            }}
          >
            {todayData?.total || 0}
          </p>
          <p style={{ fontSize: 12, color: '#22c55e', marginTop: 4 }}>
            正确 {todayData?.correct || 0} 张
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          style={{
            padding: 24,
            borderRadius: 16,
            background: 'linear-gradient(145deg, #1e1e2e, #252538)',
            border: '1px solid rgba(118, 75, 162, 0.15)'
          }}
        >
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
            累计复习
          </p>
          <p
            style={{
              fontSize: 32,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {totalReviews}
          </p>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            次复习记录
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          style={{
            padding: 24,
            borderRadius: 16,
            background: 'linear-gradient(145deg, #1e1e2e, #252538)',
            border: '1px solid rgba(34, 197, 94, 0.15)'
          }}
        >
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
            总体正确率
          </p>
          <p
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#22c55e'
            }}
          >
            {overallAccuracy}%
          </p>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            {totalReviews > 0 ? '继续保持！' : '开始复习吧'}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          style={{
            padding: 24,
            borderRadius: 16,
            background: 'linear-gradient(145deg, #1e1e2e, #252538)',
            border: '1px solid rgba(234, 179, 8, 0.15)'
          }}
        >
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
            卡片总数
          </p>
          <p
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#eab308'
            }}
          >
            {totalCards}
          </p>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            分布在 {decks.length} 个卡片组
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          padding: 32,
          borderRadius: 16,
          background: 'linear-gradient(145deg, #1e1e2e, #252538)',
          border: '1px solid rgba(102, 126, 234, 0.1)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#f8f9fa',
                marginBottom: 4
              }}
            >
              正确率曲线
            </h3>
            <p style={{ fontSize: 12, color: '#6b7280' }}>
              评分 ≥ 3 记为正确，最近 7 天数据
            </p>
          </div>
        </div>

        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#667eea" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#764ba2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#2a2a3a"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#2a2a3a' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e1e2e',
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                }}
                labelStyle={{
                  color: '#f8f9fa',
                  fontWeight: 600,
                  marginBottom: 4
                }}
                itemStyle={{ color: '#9ca3af' }}
                formatter={(value: any) => [
                  value !== null && value !== undefined ? `${value}%` : '无数据',
                  '正确率'
                ]}
                labelFormatter={(label: string) => {
                  const d = chartData.find((x) => x.label === label)
                  return d ? `${label} · 复习 ${d.total} 张，正确 ${d.correct} 张` : label
                }}
                cursor={{
                  stroke: 'rgba(102, 126, 234, 0.3)',
                  strokeWidth: 1
                }}
              />
              <Area
                type="monotone"
                dataKey="accuracy"
                stroke="url(#strokeGradient)"
                strokeWidth={3}
                fill={`url(#${gradientId})`}
                dot={{
                  fill: '#667eea',
                  stroke: '#764ba2',
                  strokeWidth: 2,
                  r: 5
                }}
                activeDot={{
                  r: 8,
                  fill: '#764ba2',
                  stroke: '#667eea',
                  strokeWidth: 2
                }}
                connectNulls
              />
              <defs>
                <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  )
}
