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
    goalKey: 'target_steps' as const,
    getValue: (r: any) => r?.steps || 0
  },
  {
    key: 'weight',
    icon: 'fa-weight',
    label: '体重',
    unit: 'kg',
    color: '#ff6b35',
    path: '/detail/weight',
    goalKey: 'target_weight' as const,
    getValue: (r: any) => r?.weight || 0,
    invertProgress: true
  },
  {
    key: 'sleep_hours',
    icon: 'fa-moon',
    label: '睡眠',
    unit: '小时',
    color: '#a855f7',
    path: '/detail/sleep_hours',
    goalKey: 'target_sleep' as const,
    getValue: (r: any) => r?.sleep_hours || 0
  },
  {
    key: 'water_cups',
    icon: 'fa-glass-water',
    label: '饮水',
    unit: '杯',
    color: '#22c55e',
    path: '/detail/water_cups',
    goalKey: 'target_water' as const,
    getValue: (r: any) => r?.water_cups || 0
  }
]

interface StatusResult {
  text: string
  warn: boolean
}

const isReached = (_key: string, value: number, target: number, invert?: boolean): boolean => {
  if (target <= 0) return false
  if (invert) return value > 0 && value <= target
  return value >= target
}

const getStatusText = (
  key: string, current: number, target: number, unit: string, invert?: boolean
): StatusResult => {
  if (target <= 0) return { text: '暂无目标设置', warn: false }
  if (current <= 0) return { text: `今日还未记录${key === 'weight' ? '体重' : ''}`, warn: true }

  const diff = current - target

  if (invert) {
    if (current <= target) {
      return { text: '体重控制良好 👍', warn: false }
    }
    const over = Math.abs(diff).toFixed(1)
    return { text: `比目标重 ${over}kg，继续加油`, warn: false }
  }

  if (diff >= 0) {
    return { text: '太棒了，已达标！🎉', warn: false }
  }
  const remaining = Math.abs(diff)
  const formatted = remaining % 1 === 0 ? remaining : remaining.toFixed(1)
  return { text: `还差 ${formatted}${unit}达成目标`, warn: false }
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const { todayRecord, goal, weekTrend, fetchToday, fetchWeek, fetchGoal } = useHealthStore()

  useEffect(() => {
    if (user) {
      fetchToday(user.id)
      fetchWeek(user.id)
      fetchGoal(user.id)
    }
  }, [user, fetchToday, fetchWeek, fetchGoal])

  const calculateBMI = () => {
    if (!goal || !todayRecord?.weight) return null
    const height = 1.7
    const bmi = todayRecord.weight / (height * height)
    return bmi.toFixed(1)
  }

  const avgValue = (key: string) => {
    if (!weekTrend.length) return 0
    const sum = weekTrend.reduce((acc, item) => acc + (item as any)[key], 0)
    return (sum / weekTrend.length).toFixed(1)
  }

  const checkConsecutiveUnreached = (
    key: string, target: number, invert?: boolean
  ): boolean => {
    if (target <= 0 || weekTrend.length < 3) return false
    const last3 = weekTrend.slice(-3)
    return last3.every((day) =>
      !isReached(key, (day as any)[key] || 0, target, invert)
    )
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
        {CARD_CONFIGS.map((config) => {
          const currentValue = config.getValue(todayRecord)
          const targetValue = goal ? (goal as any)[config.goalKey] : 0
          let progress = 0
          if (targetValue > 0) {
            if (config.invertProgress) {
              progress = currentValue > 0 && currentValue <= targetValue ? 100 : Math.max(0, 100 - ((currentValue - targetValue) / targetValue) * 100)
            } else {
              progress = (currentValue / targetValue) * 100
            }
          }

          const status = getStatusText(config.key, currentValue, targetValue, config.unit, config.invertProgress)
          const consecutiveWarn = !status.warn
            ? !isReached(config.key, currentValue, targetValue, config.invertProgress) &&
              checkConsecutiveUnreached(config.key, targetValue, config.invertProgress)
            : false

          return (
            <Card
              key={config.key}
              icon={config.icon}
              label={config.label}
              value={currentValue}
              unit={config.unit}
              color={config.color}
              progress={progress}
              status={status.text}
              statusWarn={status.warn || consecutiveWarn}
              onClick={() => navigate(config.path)}
            />
          )
        })}
      </div>
    </div>
  )
}

export default Dashboard
