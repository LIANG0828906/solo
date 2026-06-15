import { useEffect, useRef, useState } from 'react'
import { useFoodStore } from '../store/foodStore'

interface CircleProgressProps {
  label: string
  current: number
  target: number
  colorStart: string
  colorEnd: string
  unit: string
}

function CircleProgress({ label, current, target, colorStart, colorEnd, unit }: CircleProgressProps) {
  const [animatedOffset, setAnimatedOffset] = useState(283)
  const [shake, setShake] = useState(false)
  const prevOverRef = useRef(false)

  const radius = 45
  const circumference = 2 * Math.PI * radius
  const ratio = Math.min(current / target, 1.5)
  const progress = Math.min(ratio, 1)
  const offset = circumference * (1 - progress)
  const isOver = ratio > 1

  const gradientId = `gradient-${label}`

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedOffset(offset)
    }, 100)
    return () => clearTimeout(timer)
  }, [offset])

  useEffect(() => {
    if (isOver) {
      setShake(true)
      const t = setTimeout(() => setShake(false), 500)
      return () => clearTimeout(t)
    }
    prevOverRef.current = isOver
  }, [isOver, current])

  const strokeColor = isOver
    ? '#F44336'
    : `url(#${gradientId})`

  return (
    <div className={`nutrient-circle card ${shake ? 'warning-shake' : ''}`}>
      <div className="circle-svg">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorStart} />
              <stop offset="100%" stopColor={colorEnd} />
            </linearGradient>
          </defs>
          <circle className="circle-bg" cx="50" cy="50" r={radius} />
          <circle
            className="circle-progress"
            cx="50"
            cy="50"
            r={radius}
            stroke={strokeColor}
            strokeDasharray={circumference}
            strokeDashoffset={animatedOffset}
          />
        </svg>
        <div className="circle-label">
          <div className="circle-label-value">{Math.round(current)}</div>
          <div className="circle-label-target">/ {target}{unit}</div>
        </div>
      </div>
      <div className="nutrient-name">
        {label}
        {isOver && (
          <span
            className="nutrient-warning-icon"
            title={`已超出目标 ${Math.round((ratio - 1) * 100)}%`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </span>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { target, getDayNutrition } = useFoodStore()
  const today = new Date()
  const nutrition = getDayNutrition(today)

  const calorieOver = nutrition.calories > target.calories
  const [calShake, setCalShake] = useState(false)
  const prevCalOverRef = useRef(false)

  useEffect(() => {
    if (calorieOver && !prevCalOverRef.current) {
      setCalShake(true)
      const t = setTimeout(() => setCalShake(false), 500)
      return () => clearTimeout(t)
    }
    prevCalOverRef.current = calorieOver
  }, [calorieOver])

  return (
    <div>
      <div className="dashboard-grid">
        <div className={`calorie-card card ${calShake ? 'warning-shake' : ''}`}>
          <div style={{ fontSize: '13px', color: '#616161', marginBottom: '4px', fontWeight: 500 }}>
            今日热量
            {calorieOver && (
              <span title="已超出目标热量">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px', marginLeft: '4px' }}>
                  <path d="M12 9v4M12 17h.01" />
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </span>
            )}
          </div>
          <div className="calorie-value">{Math.round(nutrition.calories)}</div>
          <div className="calorie-unit">千卡</div>
          <div className="calorie-target">目标 {target.calories} 千卡</div>
        </div>

        <CircleProgress
          label="蛋白质"
          current={nutrition.protein}
          target={target.protein}
          colorStart="#4CAF50"
          colorEnd="#81C784"
          unit="g"
        />

        <CircleProgress
          label="碳水"
          current={nutrition.carbs}
          target={target.carbs}
          colorStart="#2196F3"
          colorEnd="#64B5F6"
          unit="g"
        />

        <CircleProgress
          label="脂肪"
          current={nutrition.fat}
          target={target.fat}
          colorStart="#FF8C00"
          colorEnd="#FFB74D"
          unit="g"
        />
      </div>
    </div>
  )
}
