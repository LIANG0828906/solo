import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import { useHealthStore } from '../store/healthStore'
import { useUserStore } from '../store/userStore'
import { Goal as GoalType } from '../api/health'

interface RingConfig {
  key: keyof GoalType
  label: string
  unit: string
  color: string
  dataKey: keyof GoalType
  currentKey: string
  inputLabel: string
  minValue: number
}

const RING_CONFIGS: RingConfig[] = [
  {
    key: 'target_steps',
    label: '每日步数',
    unit: '步',
    color: '#00d4ff',
    dataKey: 'target_steps',
    currentKey: 'steps',
    inputLabel: '目标步数',
    minValue: 1000
  },
  {
    key: 'target_weight',
    label: '目标体重',
    unit: 'kg',
    color: '#ff6b35',
    dataKey: 'target_weight',
    currentKey: 'weight',
    inputLabel: '目标体重 (kg)',
    minValue: 20
  },
  {
    key: 'target_sleep',
    label: '每日睡眠',
    unit: '小时',
    color: '#a855f7',
    dataKey: 'target_sleep',
    currentKey: 'sleep_hours',
    inputLabel: '目标睡眠 (小时)',
    minValue: 1
  },
  {
    key: 'target_water',
    label: '每日饮水',
    unit: '杯',
    color: '#22c55e',
    dataKey: 'target_water',
    currentKey: 'water_cups',
    inputLabel: '目标饮水 (杯)',
    minValue: 1
  }
]

const ProgressRing: React.FC<{
  progress: number
  color: string
  size?: number
}> = ({ progress, color, size = 120 }) => {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference

  return (
    <svg width={size} height={size} className="progress-ring">
      <circle
        stroke="#333333"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  )
}

const Goal: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const { goal, todayRecord, fetchGoal, fetchToday, updateGoal } = useHealthStore()
  const [editConfig, setEditConfig] = useState<RingConfig | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (user) {
      fetchGoal(user.id)
      fetchToday(user.id)
    }
  }, [user, fetchGoal, fetchToday])

  const handleEdit = (config: RingConfig) => {
    if (!goal) return
    setEditConfig(config)
    setEditValue(String((goal as any)[config.key]))
    setError('')
  }

  const handleSave = async () => {
    if (!editConfig || !goal || !user) return
    const numValue = parseFloat(editValue)
    if (isNaN(numValue)) {
      setError('请输入有效数字')
      return
    }
    if (numValue < editConfig.minValue) {
      setError(`${editConfig.inputLabel}必须大于${editConfig.minValue}`)
      return
    }
    const newGoal: GoalType = {
      ...goal,
      [editConfig.key]: numValue
    }
    await updateGoal(newGoal)
    setEditConfig(null)
  }

  const getCurrentValue = (currentKey: string): number => {
    if (!todayRecord) return 0
    return (todayRecord as any)[currentKey] || 0
  }

  const getProgress = (current: number, target: number): number => {
    if (!target) return 0
    return Math.min((current / target) * 100, 100)
  }

  const getDiffText = (current: number, target: number, config: RingConfig): string => {
    if (!target) return ''
    const diff = target - current
    if (Math.abs(diff) < 0.01) return '已达成目标 🎉'
    if (diff > 0) return `还差 ${diff.toFixed(1)} ${config.unit}`
    return `超出 ${Math.abs(diff).toFixed(1)} ${config.unit}`
  }

  return (
    <div className="goal-page">
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <i className="fas fa-arrow-left"></i> 返回
        </button>
        <h1><i className="fas fa-bullseye"></i> 目标设置</h1>
      </header>

      <div className="rings-grid">
        {RING_CONFIGS.map((config) => {
          const targetValue = goal ? (goal as any)[config.key] : 0
          const currentValue = getCurrentValue(config.currentKey)
          const progress = getProgress(currentValue, targetValue)

          return (
            <div key={config.key} className="ring-card glass-card">
              <div className="ring-content">
                <div className="ring-container">
                  <ProgressRing progress={progress} color={config.color} />
                  <div className="ring-center">
                    <span className="ring-current" style={{ color: config.color }}>
                      {currentValue}
                    </span>
                    <span className="ring-sep">/</span>
                    <span className="ring-target">{targetValue}</span>
                    <span className="ring-unit">{config.unit}</span>
                  </div>
                </div>
                <div className="ring-info">
                  <h3 style={{ color: config.color }}>{config.label}</h3>
                  <p className="ring-diff">{getDiffText(currentValue, targetValue, config)}</p>
                  <button className="btn-edit" onClick={() => handleEdit(config)}>
                    <i className="fas fa-edit"></i> 编辑
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Modal isOpen={!!editConfig} onClose={() => setEditConfig(null)}>
        {editConfig && (
          <div className="modal-body">
            <h2>编辑{editConfig.label}</h2>
            <div className="form-group">
              <label>{editConfig.inputLabel}</label>
              <input
                type="number"
                value={editValue}
                onChange={(e) => {
                  setEditValue(e.target.value)
                  setError('')
                }}
                min={editConfig.minValue}
              />
              {error && <p className="error-text">{error}</p>}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setEditConfig(null)}>取消</button>
              <button className="btn-primary" onClick={handleSave}>保存</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Goal
