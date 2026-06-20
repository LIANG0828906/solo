import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import { useHealthStore } from '../store/healthStore'
import { useUserStore } from '../store/userStore'

const CARD_CONFIGS = [
  {
    key: 'steps',
    icon: 'fa-shoe-prints',
    label: '步数',
    unit: '步',
    color: '#00d4ff',
    path: '/detail/steps',
    getValue: (r: any) => r?.steps || 0
  },
  {
    key: 'weight',
    icon: 'fa-weight',
    label: '体重',
    unit: 'kg',
    color: '#ff6b35',
    path: '/detail/weight',
    getValue: (r: any) => r?.weight || 0
  },
  {
    key: 'sleep_hours',
    icon: 'fa-moon',
    label: '睡眠',
    unit: '小时',
    color: '#a855f7',
    path: '/detail/sleep_hours',
    getValue: (r: any) => r?.sleep_hours || 0
  },
  {
    key: 'water_cups',
    icon: 'fa-glass-water',
    label: '饮水',
    unit: '杯',
    color: '#22c55e',
    path: '/detail/water_cups',
    getValue: (r: any) => r?.water_cups || 0
  }
]

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const { todayRecord, fetchToday, fetchWeek, fetchGoal } = useHealthStore()

  useEffect(() => {
    if (user) {
      fetchToday(user.id)
      fetchWeek(user.id)
      fetchGoal(user.id)
    }
  }, [user, fetchToday, fetchWeek, fetchGoal])

  const calculateBMI = () => {
    const goal = useHealthStore.getState().goal
    if (!goal || !todayRecord?.weight) return null
    const height = 1.7
    const bmi = todayRecord.weight / (height * height)
    return bmi.toFixed(1)
  }

  const avgValue = (key: string) => {
    const trend = useHealthStore.getState().weekTrend
    if (!trend.length) return 0
    const sum = trend.reduce((acc, item) => acc + (item as any)[key], 0)
    return (sum / trend.length).toFixed(1)
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>健康数据仪表盘</h1>
        <div className="header-actions">
          <button className="btn-outline" onClick={() => navigate('/goal')}>
            <i className="fas fa-bullseye"></i> 目标设置
          </button>
        </div>
      </header>

      <div className="stats-row">
        {calculateBMI() && (
          <div className="stat-box">
            <span className="stat-label">BMI</span>
            <span className="stat-value">{calculateBMI()}</span>
          </div>
        )}
        <div className="stat-box">
          <span className="stat-label">本周平均步数</span>
          <span className="stat-value">{avgValue('steps')}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">本周平均睡眠</span>
          <span className="stat-value">{avgValue('sleep_hours')}h</span>
        </div>
      </div>

      <div className="card-grid">
        {CARD_CONFIGS.map((config) => (
          <Card
            key={config.key}
            icon={config.icon}
            label={config.label}
            value={config.getValue(todayRecord)}
            unit={config.unit}
            color={config.color}
            onClick={() => navigate(config.path)}
          />
        ))}
      </div>
    </div>
  )
}

export default Dashboard
