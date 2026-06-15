import { useMemo, useState, useEffect } from 'react'
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
import { useStore } from '../store'

const COLORS = ['#e94560', '#818cf8', '#38bdf8', '#4ade80']

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: { payload: { services: { name: string; amount: number }[]; total: number } }[]
  label?: string
}) => {
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
}

const AnimatedRadar = ({ data, compareList }: {
  data: { service: string; fullMark: number; subject: string; value: number }[]
  compareList: string[]
}) => {
  const [animate, setAnimate] = useState(false)
  const { subscriptions } = useStore()

  useEffect(() => {
    setAnimate(false)
    const t = setTimeout(() => setAnimate(true), 50)
    return () => clearTimeout(t)
  }, [compareList.length])

  const services = [...new Set(data.map(d => d.service))]

  const selectedSubs = subscriptions.filter(s => compareList.includes(s.id))

  if (data.length === 0) return null

  const subjects = ['月费用', '使用频率', '满意度']
  const chartData = subjects.map(subject => {
    const row: Record<string, string | number> = { subject }
    services.forEach(svc => {
      const item = data.find(d => d.service === svc && d.subject === subject)
      row[svc] = item?.value ?? 0
    })
    return row
  })

  return (
    <div style={{
      animation: animate ? 'rotateIn 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
      opacity: animate ? 1 : 0,
      transform: animate ? 'rotate(0deg) scale(1)' : 'rotate(-30deg) scale(0.8)',
      transformOrigin: 'center center',
      transition: 'all 600ms cubic-bezier(0.34, 1.56, 0.64, 1)'
    }}>
      <ResponsiveContainer width="100%" height={420}>
        <RadarChart data={chartData} outerRadius="70%">
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#a0a0b8', fontSize: 13, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fill: '#a0a0b8', fontSize: 10 }}
            stroke="rgba(255,255,255,0.2)"
          />
          {services.map((svc, idx) => (
            <Radar
              key={svc}
              name={svc}
              dataKey={svc}
              stroke={COLORS[idx % COLORS.length]}
              fill={COLORS[idx % COLORS.length]}
              fillOpacity={0.25}
              strokeWidth={2}
              isAnimationActive={true}
              animationBegin={idx * 200}
              animationDuration={800}
            />
          ))}
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            iconType="circle"
            formatter={(value: string) => (
              <span style={{ color: '#eaeaea', fontSize: 13 }}>{value}</span>
            )}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="radar-legend">
        {selectedSubs.map((sub, idx) => (
          <div key={sub.id} className="radar-legend-item">
            <div className="radar-legend-color" style={{ background: COLORS[idx % COLORS.length] }}></div>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{sub.name}</span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              | 频率{sub.usageFrequency}/10 · 满意{sub.satisfaction}/10
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const ChartPanel = () => {
  const navigate = useNavigate()
  const { getMonthlyTrend, getCompareData, ui, clearCompare, subscriptions } = useStore()

  const trendData = useMemo(() => getMonthlyTrend(), [getMonthlyTrend])
  const compareData = useMemo(() => getCompareData(), [getCompareData])

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

  const handleClearCompare = () => {
    clearCompare()
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">
          <i className="fas fa-chart-line"></i>
          统计分析
        </h1>
        {ui.compareList.length > 0 && (
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleClearCompare}>
              <i className="fas fa-times"></i> 清除对比
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/services')}>
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
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <i className="fas fa-mouse-pointer" style={{ marginRight: 6 }}></i>
            悬停查看当月详细服务列表
          </div>
        </div>
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={trendData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#a0a0b8"
              tick={{ fill: '#a0a0b8', fontSize: 12 }}
              tickFormatter={(value) => value.slice(2)}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              stroke="#a0a0b8"
              tick={{ fill: '#a0a0b8', fontSize: 12 }}
              tickFormatter={(v) => `¥${v}`}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(233,69,96,0.05)' }} />
            <Bar
              dataKey="total"
              name="月度总花费"
              fill="url(#barGradient)"
              radius={[6, 6, 0, 0]}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="total"
              name="趋势线"
              stroke="url(#lineGradient)"
              strokeWidth={3}
              dot={{ fill: '#e94560', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#e94560', stroke: 'white', strokeWidth: 2 }}
              isAnimationActive={true}
              animationDuration={800}
              animationBegin={200}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <div className="chart-title">
            <i className="fas fa-chart-pie"></i>
            服务对比雷达图
          </div>
          {ui.compareList.length > 0 && (
            <div style={{
              padding: '6px 12px',
              borderRadius: 20,
              background: 'rgba(233, 69, 96, 0.15)',
              color: 'var(--accent-secondary)',
              fontSize: 13,
              fontWeight: 500
            }}>
              <i className="fas fa-layer-group" style={{ marginRight: 6 }}></i>
              对比中 ({ui.compareList.length}/4)
            </div>
          )}
        </div>

        {ui.compareList.length >= 2 && ui.compareList.length <= 4 ? (
          <AnimatedRadar data={compareData} compareList={ui.compareList} />
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[...subscriptions]
              .filter(s => s.status !== 'cancelled')
              .sort((a, b) => {
                const aMonthly = a.billingCycle === 'monthly' ? a.amount : a.billingCycle === 'quarterly' ? a.amount / 3 : a.amount / 12
                const bMonthly = b.billingCycle === 'monthly' ? b.amount : b.billingCycle === 'quarterly' ? b.amount / 3 : b.amount / 12
                return bMonthly - aMonthly
              })
              .map((sub, idx) => {
                const monthly = sub.billingCycle === 'monthly' ? sub.amount : sub.billingCycle === 'quarterly' ? sub.amount / 3 : sub.amount / 12
                const percent = avgMonthly > 0 ? (monthly / avgMonthly) * 50 : 0
                return (
                  <div key={sub.id} style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.05)',
                    animation: 'slideInFromTop 400ms ease-out backwards',
                    animationDelay: `${idx * 50}ms`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{sub.name}</span>
                      <span style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: COLORS[idx % COLORS.length],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 700
                      }}>
                        {idx + 1}
                      </span>
                    </div>
                    <div style={{
                      height: 6,
                      borderRadius: 3,
                      background: 'rgba(255,255,255,0.05)',
                      overflow: 'hidden',
                      marginBottom: 8
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(percent, 100)}%`,
                        background: `linear-gradient(90deg, ${COLORS[idx % COLORS.length]}, ${COLORS[(idx + 1) % COLORS.length]})`,
                        borderRadius: 3,
                        transition: 'width 800ms ease-out'
                      }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span>月均 ¥{monthly.toFixed(2)}</span>
                      <span>{((monthly / avgMonthly) * 100).toFixed(0)}%</span>
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
