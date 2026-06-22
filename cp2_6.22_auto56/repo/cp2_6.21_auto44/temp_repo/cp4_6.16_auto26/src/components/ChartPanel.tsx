import { useMemo, useState, useEffect, memo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts'
import { useStore, getMonthlyAmount } from '../store'

const COLORS = ['#e94560', '#818cf8', '#38bdf8', '#4ade80']

const STABLE_OBJECTS = {
  xTickStyle: { fill: '#a0a0b8', fontSize: 12 },
  yTickStyle: { fill: '#a0a0b8', fontSize: 12 },
  polarTickStyle: { fill: '#a0a0b8', fontSize: 13, fontWeight: 500 },
  polarRadiusTickStyle: { fill: '#a0a0b8', fontSize: 10 },
  axisLineStroke: { stroke: 'rgba(255,255,255,0.1)' },
  radiusAxisStroke: 'rgba(255,255,255,0.2)',
  gridStroke: 'rgba(255,255,255,0.05)',
  polarGridStroke: 'rgba(255,255,255,0.1)',
  cursorFill: { fill: 'rgba(233,69,96,0.05)' },
  dotStyle: { fill: '#e94560', strokeWidth: 2, r: 4 },
  activeDotStyle: { r: 6, fill: '#e94560', stroke: 'white', strokeWidth: 2 },
  legendWrapperStyle: { paddingTop: 20 },
  compareBadgeStyle: {
    padding: '6px 12px',
    borderRadius: 20,
    background: 'rgba(233, 69, 96, 0.15)',
    color: 'var(--accent-secondary)',
    fontSize: 13,
    fontWeight: 500
  },
  headerActionStyle: { display: 'flex', gap: 12 },
  chartHintStyle: { fontSize: 12, color: 'var(--text-secondary)' }
}

const STABLE_FUNCTIONS = {
  xTickFormatter: (value: string) => value.slice(2),
  yTickFormatter: (v: number) => `¥${v}`,
  legendFormatter: (value: string) => <span style={{ color: '#eaeaea', fontSize: 13 }}>{value}</span>
}

interface TooltipPayload {
  payload: { services: { name: string; amount: number }[]; total: number }
}

const CustomTooltip = memo(function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="custom-tooltip">
        <div className="tooltip-title">
          <i className="fas fa-calendar-alt" style={{ marginRight: 6 }}></i>
          {label}
        </div>
        <div className="tooltip-total">
          ¥{data.total.toFixed(2)}
        </div>
        {data.services.length > 0 && (
          <div className="tooltip-service-list">
            {data.services.map((svc, i) => (
              <div key={i} className="tooltip-service-item">
                <span>{svc.name}</span>
                <span>¥{svc.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  return null
})

interface TrendChartProps {
  data: { month: string; total: number; services: { name: string; amount: number }[] }[]
}

const TrendChart = memo(function TrendChart({ data }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#818cf8" stopOpacity={0.9} />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e94560" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={STABLE_OBJECTS.gridStroke} vertical={false} />
        <XAxis
          dataKey="month"
          stroke="#a0a0b8"
          tick={STABLE_OBJECTS.xTickStyle}
          tickFormatter={STABLE_FUNCTIONS.xTickFormatter}
          axisLine={STABLE_OBJECTS.axisLineStroke}
        />
        <YAxis
          stroke="#a0a0b8"
          tick={STABLE_OBJECTS.yTickStyle}
          tickFormatter={STABLE_FUNCTIONS.yTickFormatter}
          axisLine={STABLE_OBJECTS.axisLineStroke}
        />
        <Tooltip content={<CustomTooltip />} cursor={STABLE_OBJECTS.cursorFill} />
        <Bar
          dataKey="total"
          name="月度总花费"
          fill="url(#barGradient)"
          radius={[6, 6, 0, 0]}
          isAnimationActive
          animationDuration={800}
          animationEasing="ease-out"
        />
        <Line
          type="monotone"
          dataKey="total"
          name="趋势线"
          stroke="url(#lineGradient)"
          strokeWidth={3}
          dot={STABLE_OBJECTS.dotStyle}
          activeDot={STABLE_OBJECTS.activeDotStyle}
          isAnimationActive
          animationDuration={800}
          animationBegin={200}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
})

interface CompareServiceItem {
  id: string
  name: string
  usageFrequency: number
  satisfaction: number
  monthlyCost: number
}

interface RadarChartPanelProps {
  services: CompareServiceItem[]
  onUpdateScore: (id: string, field: 'usageFrequency' | 'satisfaction', value: number) => void
}

const RadarChartPanel = memo(function RadarChartPanel({ services, onUpdateScore }: RadarChartPanelProps) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    setAnimate(false)
    const t = setTimeout(() => setAnimate(true), 80)
    return () => clearTimeout(t)
  }, [services.length])

  const maxCost = useMemo(() => {
    return Math.max(...services.map(s => s.monthlyCost), 1)
  }, [services])

  const chartData = useMemo(() => {
    const subjects = ['月费用', '使用频率', '满意度']
    return subjects.map(subject => {
      const row: Record<string, string | number> = { subject }
      services.forEach(svc => {
        let value = 0
        switch (subject) {
          case '月费用':
            value = Math.round((svc.monthlyCost / maxCost) * 10)
            break
          case '使用频率':
            value = svc.usageFrequency
            break
          case '满意度':
            value = svc.satisfaction
            break
        }
        row[svc.name] = value
      })
      return row
    })
  }, [services, maxCost])

  const handleFrequencyChange = useCallback((svc: CompareServiceItem, value: number) => {
    onUpdateScore(svc.id, 'usageFrequency', value)
  }, [onUpdateScore])

  const handleSatisfactionChange = useCallback((svc: CompareServiceItem, value: number) => {
    onUpdateScore(svc.id, 'satisfaction', value)
  }, [onUpdateScore])

  const colorItems = useMemo(() =>
    services.map((svc, idx) => ({
      ...svc,
      color: COLORS[idx % COLORS.length]
    })),
    [services]
  )

  return (
    <div>
      <div className="radar-chart-wrap">
        <div className={`radar-chart-graphic ${animate ? 'radar-in' : ''}`}>
          <ResponsiveContainer width="100%" height={380}>
            <RadarChart data={chartData} outerRadius="70%">
              <PolarGrid stroke={STABLE_OBJECTS.polarGridStroke} />
              <PolarAngleAxis
                dataKey="subject"
                tick={STABLE_OBJECTS.polarTickStyle}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 10]}
                tick={STABLE_OBJECTS.polarRadiusTickStyle}
                stroke={STABLE_OBJECTS.radiusAxisStroke}
              />
              {services.map((svc, idx) => (
                <Radar
                  key={svc.id}
                  name={svc.name}
                  dataKey={svc.name}
                  stroke={COLORS[idx % COLORS.length]}
                  fill={COLORS[idx % COLORS.length]}
                  fillOpacity={0.25}
                  strokeWidth={2.5}
                  isAnimationActive
                  animationBegin={idx * 200 + 200}
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              ))}
              <Legend
                wrapperStyle={STABLE_OBJECTS.legendWrapperStyle}
                iconType="circle"
                formatter={STABLE_FUNCTIONS.legendFormatter}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="radar-editor">
        <div className="radar-editor-title">
          <i className="fas fa-sliders"></i>
          调整评分（实时更新雷达图）
        </div>
        <div className="radar-editor-list">
          {colorItems.map(svc => (
            <div key={svc.id} className="radar-editor-item">
              <div
                className="radar-editor-color"
                style={{ background: svc.color }}
              ></div>
              <div className="radar-editor-name">{svc.name}</div>
              <div className="radar-editor-scores">
                <div className="radar-editor-score">
                  <label>使用频率</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={svc.usageFrequency}
                    onChange={(e) => handleFrequencyChange(svc, Number(e.target.value))}
                  />
                  <span className="radar-editor-value">{svc.usageFrequency}</span>
                </div>
                <div className="radar-editor-score">
                  <label>满意度</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={svc.satisfaction}
                    onChange={(e) => handleSatisfactionChange(svc, Number(e.target.value))}
                  />
                  <span className="radar-editor-value">{svc.satisfaction}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

const ChartPanel = () => {
  const navigate = useNavigate()
  const { getMonthlyTrend, ui, clearCompare, subscriptions, updateSubscription } = useStore()

  const trendData = useMemo(() => getMonthlyTrend(), [getMonthlyTrend])

  const compareServices = useMemo<CompareServiceItem[]>(() => {
    return subscriptions
      .filter(s => ui.compareList.includes(s.id))
      .map(s => ({
        id: s.id,
        name: s.name,
        usageFrequency: s.usageFrequency,
        satisfaction: s.satisfaction,
        monthlyCost: getMonthlyAmount(s.amount, s.billingCycle)
      }))
  }, [subscriptions, ui.compareList])

  const totalSpend = useMemo(
    () => trendData.reduce((sum, m) => sum + m.total, 0),
    [trendData]
  )
  const avgMonthly = useMemo(
    () => totalSpend / Math.max(trendData.length, 1),
    [totalSpend, trendData]
  )
  const peakMonth = useMemo(() => {
    if (trendData.length === 0) return null
    return trendData.reduce((max, m) => m.total > max.total ? m : max, trendData[0])
  }, [trendData])

  const handleUpdateScore = useCallback((id: string, field: 'usageFrequency' | 'satisfaction', value: number) => {
    updateSubscription(id, { [field]: value })
  }, [updateSubscription])

  const handleClearCompare = useCallback(() => {
    clearCompare()
  }, [clearCompare])

  const handleNavigateServices = useCallback(() => {
    navigate('/services')
  }, [navigate])

  const hasCompareData = ui.compareList.length >= 2 && ui.compareList.length <= 4

  const activeSubscriptions = useMemo(() =>
    [...subscriptions]
      .filter(s => s.status !== 'cancelled')
      .sort((a, b) => {
        const aMonthly = getMonthlyAmount(a.amount, a.billingCycle)
        const bMonthly = getMonthlyAmount(b.amount, b.billingCycle)
        return bMonthly - aMonthly
      })
      .slice(0, 10),
    [subscriptions]
  )

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">
          <i className="fas fa-chart-line"></i>
          统计分析
        </h1>
        {ui.compareList.length > 0 && (
          <div style={STABLE_OBJECTS.headerActionStyle}>
            <button className="btn btn-secondary btn-sm" onClick={handleClearCompare}>
              <i className="fas fa-times"></i> 清除对比
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleNavigateServices}>
              <i className="fas fa-list-check"></i> 管理对比项
            </button>
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">12个月总支出</span>
            <div className="stat-card-icon green">
              <i className="fas fa-sack-dollar"></i>
            </div>
          </div>
          <div className="stat-card-value">¥{totalSpend.toFixed(0)}</div>
          <div className="stat-card-sub">过去12个月累计花费</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">月均花费</span>
            <div className="stat-card-icon blue">
              <i className="fas fa-chart-column"></i>
            </div>
          </div>
          <div className="stat-card-value">¥{avgMonthly.toFixed(2)}</div>
          <div className="stat-card-sub">12个月平均值</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">消费峰值</span>
            <div className="stat-card-icon orange">
              <i className="fas fa-fire"></i>
            </div>
          </div>
          <div className="stat-card-value">¥{peakMonth?.total.toFixed(2) || '0'}</div>
          <div className="stat-card-sub">{peakMonth?.month || '—'}</div>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <div className="chart-title">
            <i className="fas fa-chart-area"></i>
            近12个月花费趋势
          </div>
          <div style={STABLE_OBJECTS.chartHintStyle}>
            <i className="fas fa-mouse-pointer" style={{ marginRight: 6 }}></i>
            悬停查看当月详细服务列表
          </div>
        </div>
        <TrendChart data={trendData} />
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <div className="chart-title">
            <i className="fas fa-chart-pie"></i>
            服务对比雷达图
          </div>
          {ui.compareList.length > 0 && (
            <div style={STABLE_OBJECTS.compareBadgeStyle}>
              <i className="fas fa-layer-group" style={{ marginRight: 6 }}></i>
              对比中 ({ui.compareList.length}/4)
            </div>
          )}
        </div>

        {hasCompareData ? (
          <RadarChartPanel
            services={compareServices}
            onUpdateScore={handleUpdateScore}
          />
        ) : (
          <div className="compare-empty">
            <i className="fas fa-radar"></i>
            {ui.compareList.length === 0 ? (
              <p>
                请前往 <Link to="/services">服务管理</Link> 页面，勾选 2-4 个服务后点击"对比分析"
              </p>
            ) : ui.compareList.length === 1 ? (
              <p>
                已选择 1 个服务，还需要至少 1 个。请前往 <Link to="/services">服务管理</Link> 继续选择。
              </p>
            ) : (
              <p>
                最多只能对比 4 个服务。请前往 <Link to="/services">服务管理</Link> 取消部分选择。
              </p>
            )}
            <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/services" className="btn btn-primary btn-sm">
                <i className="fas fa-arrow-right"></i> 选择对比服务
              </Link>
            </div>
          </div>
        )}
      </div>

      {subscriptions.length > 0 && (
        <div className="chart-section">
          <div className="chart-header">
            <div className="chart-title">
              <i className="fas fa-pie-chart"></i>
              费用分布概览
            </div>
          </div>
          <div className="cost-distribution-grid">
            {activeSubscriptions.map((sub, idx) => {
              const monthly = getMonthlyAmount(sub.amount, sub.billingCycle)
              const percent = avgMonthly > 0 ? (monthly / avgMonthly) * 50 : 0
              const color = COLORS[idx % COLORS.length]
              const nextColor = COLORS[(idx + 1) % COLORS.length]
              return (
                <div
                  key={sub.id}
                  className="cost-distribution-card"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="cost-distribution-header">
                    <span>{sub.name}</span>
                    <span
                      className="cost-distribution-rank"
                      style={{ background: color }}
                    >
                      {idx + 1}
                    </span>
                  </div>
                  <div className="cost-distribution-bar">
                    <div
                      className="cost-distribution-bar-fill"
                      style={{
                        width: `${Math.min(percent, 100)}%`,
                        background: `linear-gradient(90deg, ${color}, ${nextColor})`
                      }}
                    ></div>
                  </div>
                  <div className="cost-distribution-footer">
                    <span>月均 ¥{monthly.toFixed(2)}</span>
                    <span>{avgMonthly > 0 ? ((monthly / avgMonthly) * 100).toFixed(0) : 0}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

export default ChartPanel
