import { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { TrendDataPoint, CALORIE_TARGET } from '../hooks/useFoodData'

interface TrendPanelProps {
  isOpen: boolean
  onClose: () => void
  trendData: TrendDataPoint[]
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  date: string
  calories: number
}

const TrendPanel = ({ isOpen, onClose, trendData }: TrendPanelProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    date: '',
    calories: 0,
  })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const padding = { top: 30, right: 30, bottom: 40, left: 50 }
  const chartWidth = 600
  const chartHeight = 220
  const width = chartWidth + padding.left + padding.right
  const height = chartHeight + padding.top + padding.bottom

  const maxCalories = Math.max(...trendData.map((d) => d.calories), CALORIE_TARGET) * 1.15
  const minCalories = Math.min(...trendData.map((d) => d.calories), 0) * 0.85

  const getPointPosition = useCallback(
    (index: number, calories: number) => {
      const x =
        padding.left +
        (index * chartWidth) / Math.max(trendData.length - 1, 1)
      const y =
        padding.top +
        chartHeight -
        ((calories - minCalories) / (maxCalories - minCalories)) * chartHeight
      return { x, y }
    },
    [trendData.length, maxCalories, minCalories]
  )

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, width, height)

    ctx.strokeStyle = '#EBEEF5'
    ctx.lineWidth = 1
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillStyle = '#909399'

    const yTicks = 5
    for (let i = 0; i <= yTicks; i++) {
      const y = padding.top + (chartHeight * i) / yTicks
      const value = Math.round(maxCalories - ((maxCalories - minCalories) * i) / yTicks)

      ctx.beginPath()
      ctx.setLineDash([4, 4])
      ctx.moveTo(padding.left, y)
      ctx.lineTo(padding.left + chartWidth, y)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${value}`, padding.left - 10, y)
    }

    const targetY = getPointPosition(0, CALORIE_TARGET).y
    ctx.strokeStyle = '#E74C3C'
    ctx.lineWidth = 1.5
    ctx.setLineDash([8, 4])
    ctx.beginPath()
    ctx.moveTo(padding.left, targetY)
    ctx.lineTo(padding.left + chartWidth, targetY)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#E74C3C'
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText(`目标 ${CALORIE_TARGET} kcal`, padding.left + chartWidth - 80, targetY - 6)

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
    gradient.addColorStop(0, 'rgba(74, 144, 217, 0.25)')
    gradient.addColorStop(1, 'rgba(74, 144, 217, 0.02)')

    ctx.beginPath()
    trendData.forEach((d, i) => {
      const { x, y } = getPointPosition(i, d.calories)
      if (i === 0) {
        ctx.moveTo(x, padding.top + chartHeight)
        ctx.lineTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    const lastPoint = getPointPosition(trendData.length - 1, trendData[trendData.length - 1]?.calories || 0)
    ctx.lineTo(lastPoint.x, padding.top + chartHeight)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.strokeStyle = '#4A90D9'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    trendData.forEach((d, i) => {
      const { x, y } = getPointPosition(i, d.calories)
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    trendData.forEach((d, i) => {
      const { x, y } = getPointPosition(i, d.calories)
      const isHovered = hoveredIndex === i

      if (isHovered) {
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(74, 144, 217, 0.2)'
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(x, y, isHovered ? 5 : 4, 0, Math.PI * 2)
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()
      ctx.strokeStyle = '#4A90D9'
      ctx.lineWidth = 2.5
      ctx.stroke()

      ctx.fillStyle = '#606266'
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(d.date, x, padding.top + chartHeight + 12)

      if (isHovered) {
        ctx.fillStyle = '#2D3436'
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        ctx.fillText(`${d.calories} kcal`, x, y - 18)
      }
    })
  }, [trendData, getPointPosition, maxCalories, minCalories, hoveredIndex, width, height])

  useEffect(() => {
    drawChart()
  }, [drawChart])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    let closestIndex: number | null = null
    let closestDistance = Infinity

    trendData.forEach((d, i) => {
      const { x, y } = getPointPosition(i, d.calories)
      const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2))
      if (distance < 25 && distance < closestDistance) {
        closestDistance = distance
        closestIndex = i
      }
    })

    setHoveredIndex(closestIndex)

    if (closestIndex !== null) {
      const { x, y } = getPointPosition(closestIndex, trendData[closestIndex].calories)
      setTooltip({
        visible: true,
        x: x,
        y: y,
        date: trendData[closestIndex].date,
        calories: trendData[closestIndex].calories,
      })
    } else {
      setTooltip((prev) => ({ ...prev, visible: false }))
    }
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
    setTooltip((prev) => ({ ...prev, visible: false }))
  }

  const avgCalories = Math.round(
    trendData.reduce((sum, d) => sum + d.calories, 0) / trendData.length
  )
  const overTargetDays = trendData.filter((d) => d.calories > CALORIE_TARGET).length

  return (
    <motion.div
      initial={false}
      animate={{ y: isOpen ? 0 : 300 }}
      transition={{ type: 'tween', duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '300px',
        background: '#FFFFFF',
        borderTop: '1px solid #E4E7ED',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.08)',
        zIndex: 500,
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      <div
        ref={containerRef}
        style={{
          height: '100%',
          padding: '20px 32px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#2D3436',
                  margin: 0,
                }}
              >
                近7天热量摄入趋势
              </h3>
              <p style={{ fontSize: '12px', color: '#909399', margin: '4px 0 0 0' }}>
                折线图展示每日总热量摄入变化
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginLeft: '32px' }}>
              <div
                style={{
                  padding: '8px 14px',
                  background: 'rgba(74,144,217,0.08)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#909399', marginBottom: '2px' }}>
                  平均热量
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#4A90D9' }}>
                  {avgCalories} <span style={{ fontSize: '10px', fontWeight: 400 }}>kcal</span>
                </div>
              </div>

              <div
                style={{
                  padding: '8px 14px',
                  background: overTargetDays > 3 ? 'rgba(231,76,60,0.08)' : 'rgba(39,174,96,0.08)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#909399', marginBottom: '2px' }}>
                  超标天数
                </div>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: overTargetDays > 3 ? '#E74C3C' : '#27AE60',
                  }}
                >
                  {overTargetDays} <span style={{ fontSize: '10px', fontWeight: 400 }}>天</span>
                </div>
              </div>

              <div
                style={{
                  padding: '8px 14px',
                  background: 'rgba(243,156,18,0.08)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#909399', marginBottom: '2px' }}>
                  目标值
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#F39C12' }}>
                  {CALORIE_TARGET} <span style={{ fontSize: '10px', fontWeight: 400 }}>kcal</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F2F6FC',
              color: '#606266',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#EBEEF5'
              e.currentTarget.style.color = '#2D3436'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F2F6FC'
              e.currentTarget.style.color = '#606266'
            }}
          >
            <FiX size={16} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              display: 'block',
            }}
          />

          {tooltip.visible && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                position: 'absolute',
                left: tooltip.x,
                top: tooltip.y - 55,
                transform: 'translateX(-50%)',
                background: '#2D3436',
                color: '#FFFFFF',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '2px' }}>
                {tooltip.date}
              </div>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>
                {tooltip.calories} kcal
                <span
                  style={{
                    marginLeft: '6px',
                    fontSize: '10px',
                    opacity: 0.8,
                    color:
                      tooltip.calories > CALORIE_TARGET ? '#FF8A80' : '#B9F6CA',
                  }}
                >
                  {tooltip.calories > CALORIE_TARGET ? '↑ 超标' : '↓ 达标'}
                </span>
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: -5,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '5px solid #2D3436',
                }}
              />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default TrendPanel
