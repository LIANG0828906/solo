import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import LineChart from '../components/LineChart'
import { useHealthStore } from '../store/healthStore'
import { useUserStore } from '../store/userStore'

const TYPE_CONFIG: Record<string, {
  label: string
  unit: string
  color: string
  gradientId: string
  goalKey: string
  icon: string
}> = {
  steps: {
    label: '步数',
    unit: '步',
    color: '#00d4ff',
    gradientId: 'stepsGradient',
    goalKey: 'target_steps',
    icon: 'fa-shoe-prints'
  },
  weight: {
    label: '体重',
    unit: 'kg',
    color: '#ff6b35',
    gradientId: 'weightGradient',
    goalKey: 'target_weight',
    icon: 'fa-weight'
  },
  sleep_hours: {
    label: '睡眠',
    unit: '小时',
    color: '#a855f7',
    gradientId: 'sleepGradient',
    goalKey: 'target_sleep',
    icon: 'fa-moon'
  },
  water_cups: {
    label: '饮水',
    unit: '杯',
    color: '#22c55e',
    gradientId: 'waterGradient',
    goalKey: 'target_water',
    icon: 'fa-glass-water'
  }
}

const Detail: React.FC = () => {
  const { type } = useParams<{ type: string }>()
  const navigate = useNavigate()
  const { user } = useUserStore()
  const { weekTrend, goal, fetchWeek, fetchGoal } = useHealthStore()

  useEffect(() => {
    if (user) {
      fetchWeek(user.id)
      fetchGoal(user.id)
    }
  }, [user, fetchWeek, fetchGoal])

  if (!type || !TYPE_CONFIG[type]) {
    return <div>无效的指标类型</div>
  }

  const config = TYPE_CONFIG[type]
  const chartData = weekTrend.map((item) => ({
    date: item.date,
    value: (item as any)[type] || 0
  }))

  const getGoalValue = () => {
    if (!goal) return 0
    return (goal as any)[config.goalKey] || 0
  }

  const goalValue = getGoalValue()

  const avgValue = chartData.length
    ? (chartData.reduce((acc, item) => acc + item.value, 0) / chartData.length).toFixed(1)
    : '0'

  const getDiff = (value: number) => {
    if (!goalValue) return 0
    if (type === 'weight') {
      return (value - goalValue).toFixed(1)
    }
    return (value - goalValue)
  }

  const getEncouragement = () => {
    if (!goalValue) return '继续保持！'
    if (type === 'weight') {
      const latest = chartData[chartData.length - 1]?.value || 0
      if (latest <= goalValue) return '🎉 已达到体重目标，继续保持！'
      if (latest <= goalValue * 1.05) return '💪 接近目标了，再加把劲！'
      return '📈 距离目标还有差距，继续努力！'
    }
    const avg = parseFloat(avgValue)
    if (avg >= goalValue) return '🎉 表现优秀，继续保持！'
    if (avg >= goalValue * 0.8) return '💪 接近目标了，再加把劲！'
    return '📈 需要多努力一点才能达成目标！'
  }

  return (
    <div className="detail-page">
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <i className="fas fa-arrow-left"></i> 返回
        </button>
        <h1 style={{ color: config.color }}>
          <i className={`fas ${config.icon}`}></i> {config.label}趋势
        </h1>
      </header>

      <div className="encouragement-bar">
        <span>{getEncouragement()}</span>
        <span className="avg-tag">周平均: {avgValue} {config.unit}</span>
      </div>

      <div className="chart-container glass-card">
        <LineChart
          data={chartData}
          lineColor={config.color}
          gradientId={config.gradientId}
        />
      </div>

      <div className="table-container glass-card">
        <table className="detail-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>数值 ({config.unit})</th>
              <th>与目标差值</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row, idx) => (
              <tr key={idx}>
                <td>{row.date}</td>
                <td>{row.value}</td>
                <td style={{ color: Number(getDiff(row.value)) >= 0 ? '#22c55e' : '#ff6b6b' }}>
                  {Number(getDiff(row.value)) >= 0 ? '+' : ''}{getDiff(row.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Detail
