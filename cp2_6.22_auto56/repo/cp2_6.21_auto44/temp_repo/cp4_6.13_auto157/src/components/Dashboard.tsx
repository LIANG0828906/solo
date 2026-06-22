import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  drawPieChart,
  drawLineChart,
  animateNumber,
  PIE_COLORS,
  PieSlice,
  LinePoint,
  PieDataItem,
  LineDataItem
} from '../utils/chart'

interface CategoryStat {
  category: string
  amount: number
  percentage: number
}

interface MonthlyTrend {
  month: string
  expense: number
  income: number
}

interface DashboardData {
  monthlyExpense: number
  monthlyIncome: number
  balance: number
  transactionCount: number
  categoryStats: CategoryStat[]
  monthlyTrend: MonthlyTrend[]
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [animatedVals, setAnimatedVals] = useState({
    expense: 0, income: 0, balance: 0, count: 0
  })
  const [hoverPieIdx, setHoverPieIdx] = useState<number | undefined>(undefined)
  const [hoverTooltip, setHoverTooltip] = useState<{ x: number; y: number; text: string } | null>(null)
  const [hoverLineMonth, setHoverLineMonth] = useState<string | undefined>(undefined)
  const [lineTooltip, setLineTooltip] = useState<{ x: number; y: number; month: string; expense: number } | null>(null)

  const pieCanvasRef = useRef<HTMLCanvasElement>(null)
  const lineCanvasRef = useRef<HTMLCanvasElement>(null)
  const pieSlicesRef = useRef<PieSlice[]>([])
  const linePointsRef = useRef<LinePoint[]>([])
  const pieContainerRef = useRef<HTMLDivElement>(null)
  const lineContainerRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/stats')
      const json = await res.json()
      setData(json)
      setLoading(false)
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!data) return
    animateNumber(0, data.monthlyExpense, 800, v =>
      setAnimatedVals(p => ({ ...p, expense: Math.round(v * 100) / 100 }))
    )
    animateNumber(0, data.monthlyIncome, 800, v =>
      setAnimatedVals(p => ({ ...p, income: Math.round(v * 100) / 100 }))
    )
    animateNumber(0, data.balance, 800, v =>
      setAnimatedVals(p => ({ ...p, balance: Math.round(v * 100) / 100 }))
    )
    animateNumber(0, data.transactionCount, 800, v =>
      setAnimatedVals(p => ({ ...p, count: Math.round(v) }))
    )
  }, [data])

  useEffect(() => {
    if (!pieCanvasRef.current || !data || data.categoryStats.length === 0) return
    const pieData: PieDataItem[] = data.categoryStats
    pieSlicesRef.current = drawPieChart(pieCanvasRef.current, pieData, hoverPieIdx)
  }, [data, hoverPieIdx])

  useEffect(() => {
    if (!lineCanvasRef.current || !data || data.monthlyTrend.length === 0) return
    const lineData: LineDataItem[] = data.monthlyTrend
    linePointsRef.current = drawLineChart(lineCanvasRef.current, lineData, hoverLineMonth)
  }, [data, hoverLineMonth])

  useEffect(() => {
    const onResize = () => {
      if (pieCanvasRef.current && data?.categoryStats.length) {
        pieSlicesRef.current = drawPieChart(pieCanvasRef.current, data.categoryStats, hoverPieIdx)
      }
      if (lineCanvasRef.current && data?.monthlyTrend.length) {
        linePointsRef.current = drawLineChart(lineCanvasRef.current, data.monthlyTrend, hoverLineMonth)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [data, hoverPieIdx, hoverLineMonth])

  const handlePieMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = pieCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    let foundIdx: number | undefined = undefined
    for (let i = 0; i < pieSlicesRef.current.length; i++) {
      const s = pieSlicesRef.current[i]
      const midAngle = (s.startAngle + s.endAngle) / 2
      const offsetX = Math.cos(midAngle) * s.offset
      const offsetY = Math.sin(midAngle) * s.offset
      const cx = s.centerX + offsetX
      const cy = s.centerY + offsetY
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist <= s.radius) {
        const angle = Math.atan2(dy, dx)
        const normAngle = (angle + Math.PI * 2) % (Math.PI * 2)
        const normStart = (s.startAngle + Math.PI * 2) % (Math.PI * 2)
        const normEnd = (s.endAngle + Math.PI * 2) % (Math.PI * 2)
        let hit = false
        if (normStart < normEnd) {
          hit = normAngle >= normStart && normAngle <= normEnd
        } else {
          hit = normAngle >= normStart || normAngle <= normEnd
        }
        if (hit) {
          foundIdx = i
          if (pieContainerRef.current) {
            const containerRect = pieContainerRef.current.getBoundingClientRect()
            setHoverTooltip({
              x: e.clientX - containerRect.left + 12,
              y: e.clientY - containerRect.top + 12,
              text: `${s.category}: ${s.percentage.toFixed(1)}% (¥${s.amount.toFixed(2)})`
            })
          }
          break
        }
      }
    }
    setHoverPieIdx(foundIdx)
    if (foundIdx === undefined) setHoverTooltip(null)
  }, [])

  const handlePieMouseLeave = useCallback(() => {
    setHoverPieIdx(undefined)
    setHoverTooltip(null)
  }, [])

  const handleLineMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = lineCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    let closest: LinePoint | null = null
    let closestDist = Infinity
    for (const p of linePointsRef.current) {
      const dist = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2)
      if (dist < closestDist && dist < 40) {
        closestDist = dist
        closest = p
      }
    }
    if (closest) {
      setHoverLineMonth(closest.month)
      if (lineContainerRef.current) {
        const containerRect = lineContainerRef.current.getBoundingClientRect()
        setLineTooltip({
          x: closest.x,
          y: closest.y - 10,
          month: closest.month,
          expense: closest.expense
        })
      }
    } else {
      setHoverLineMonth(undefined)
      setLineTooltip(null)
    }
  }, [])

  const handleLineMouseLeave = useCallback(() => {
    setHoverLineMonth(undefined)
    setLineTooltip(null)
  }, [])

  if (loading) {
    return (
      <div style={styles.dashboard}>
        <div style={styles.loadingText}>加载中...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={styles.dashboard}>
        <div style={styles.emptyText}>暂无数据，请先上传CSV文件</div>
      </div>
    )
  }

  return (
    <div style={styles.dashboard}>
      <div style={styles.cardsRow}>
        <MetricCard
          label="月度总支出"
          value={`¥${animatedVals.expense.toFixed(2)}`}
          color="#e74c3c"
        />
        <MetricCard
          label="月度总收入"
          value={`¥${animatedVals.income.toFixed(2)}`}
          color="#2ecc71"
        />
        <MetricCard
          label="结余"
          value={`¥${animatedVals.balance.toFixed(2)}`}
          color={animatedVals.balance >= 0 ? '#3498db' : '#e74c3c'}
        />
        <MetricCard
          label="交易笔数"
          value={String(animatedVals.count)}
          color="#2c3e50"
        />
      </div>

      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>消费类别占比</h3>
          <div ref={pieContainerRef} style={styles.pieContainer}>
            <canvas
              ref={pieCanvasRef}
              style={styles.canvas}
              onMouseMove={handlePieMouseMove}
              onMouseLeave={handlePieMouseLeave}
            />
            {hoverTooltip && (
              <div style={{
                ...styles.pieTooltip,
                left: hoverTooltip.x,
                top: hoverTooltip.y
              }}>
                {hoverTooltip.text}
              </div>
            )}
          </div>
          <div style={styles.legendContainer}>
            {data.categoryStats.map((item, idx) => (
              <div key={item.category} style={styles.legendItem}>
                <span style={{
                  ...styles.legendColor,
                  background: PIE_COLORS[idx % PIE_COLORS.length]
                }} />
                <span style={styles.legendText}>
                  {item.category} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>近12个月支出趋势</h3>
        <div ref={lineContainerRef} style={styles.lineContainer}>
          <canvas
            ref={lineCanvasRef}
            style={styles.canvas}
            onMouseMove={handleLineMouseMove}
            onMouseLeave={handleLineMouseLeave}
          />
          {lineTooltip && (
            <div style={{
              ...styles.lineTooltip,
              left: lineTooltip.x,
              top: lineTooltip.y
            }}>
              <div style={styles.lineTooltipArrow} />
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{lineTooltip.month}</div>
              <div style={{ color: '#e74c3c' }}>支出: ¥{lineTooltip.expense.toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes btnPress {
          0% { transform: scale(1); }
          50% { transform: scale(0.98); }
          100% { transform: scale(1); }
        }
        .dashboard-anim {
          animation: fadeIn 0.3s ease-in;
        }
        .card-anim {
          animation: fadeIn 0.3s ease-in;
        }
      `}</style>
    </div>
  )
}

const MetricCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: '2px solid #e8e8e8',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      padding: '24px 28px',
      flex: 1,
      minWidth: 0,
      animation: 'fadeIn 0.3s ease-in'
    }}>
      <div style={{
        fontSize: 13,
        color: '#888',
        marginBottom: 10,
        fontWeight: 500
      }}>{label}</div>
      <div style={{
        fontSize: 28,
        fontWeight: 700,
        color,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        letterSpacing: '-0.5px'
      }}>{value}</div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  dashboard: {
    marginTop: 32,
    animation: 'fadeIn 0.3s ease-in'
  } as React.CSSProperties,
  cardsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 20,
    marginBottom: 28
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 24,
    marginBottom: 24
  },
  chartCard: {
    background: '#fff',
    borderRadius: 12,
    border: '2px solid #e8e8e8',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '24px 28px'
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: 600,
    color: '#2c3e50',
    margin: 0,
    marginBottom: 20
  },
  pieContainer: {
    position: 'relative',
    width: '100%',
    height: 320,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  lineContainer: {
    position: 'relative',
    width: '100%',
    height: 340
  },
  canvas: {
    width: '100%',
    height: '100%',
    display: 'block'
  },
  pieTooltip: {
    position: 'absolute',
    background: '#fff',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 13,
    color: '#333',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: 10,
    border: '1px solid #eee'
  },
  lineTooltip: {
    position: 'absolute',
    background: '#fff',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    padding: '10px 16px',
    borderRadius: 8,
    fontSize: 13,
    color: '#2c3e50',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: 10,
    border: '1px solid #eee',
    transform: 'translate(-50%, -100%)'
  },
  lineTooltipArrow: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    transform: 'translateX(-50%) rotate(45deg)',
    width: 12,
    height: 12,
    background: '#fff',
    borderRight: '1px solid #eee',
    borderBottom: '1px solid #eee'
  },
  legendContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px 24px',
    marginTop: 8,
    padding: '16px 20px',
    background: '#fafafa',
    borderRadius: 10
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 4,
    flexShrink: 0
  },
  legendText: {
    fontSize: 14,
    color: '#555'
  },
  loadingText: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999',
    fontSize: 15
  },
  emptyText: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#bbb',
    fontSize: 15
  }
}

export default Dashboard
