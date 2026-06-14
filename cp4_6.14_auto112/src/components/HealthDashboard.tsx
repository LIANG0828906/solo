import { useState, useEffect, useRef } from 'react'
import type { HealthAnalysis, PlantStatus } from '@/types'
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, LabelList,
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts'

const statusColors: Record<PlantStatus, string> = {
  healthy: '#22c55e',
  thirsty: '#f97316',
  low_light: '#eab308',
  pest: '#ef4444',
}

const statusLabels: Record<PlantStatus, string> = {
  healthy: '健康',
  thirsty: '缺水',
  low_light: '缺光',
  pest: '虫害',
}

const eventTypeLabels: Record<string, string> = {
  water: '浇水',
  fertilize: '施肥',
  repot: '换盆',
  prune: '修剪',
}

interface HealthDashboardProps {
  data: HealthAnalysis
}

export default function HealthDashboard({ data }: HealthDashboardProps) {
  const scoreColor = data.score >= 75 ? '#22c55e' : data.score >= 50 ? '#f97316' : '#ef4444'
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null)
  const [tooltipExpanded, setTooltipExpanded] = useState(false)
  const [activeTooltipDate, setActiveTooltipDate] = useState<string | null>(null)
  const lastTooltipDateRef = useRef<string | null>(null)

  useEffect(() => {
    if (activeTooltipDate !== lastTooltipDateRef.current) {
      lastTooltipDateRef.current = activeTooltipDate
      setTooltipExpanded(false)
    }
  }, [activeTooltipDate])

  const pieData = data.statusDistribution.map((d) => ({
    name: statusLabels[d.status as PlantStatus] || d.status,
    value: d.count,
    percentage: d.percentage,
    color: statusColors[d.status as PlantStatus] || '#94a3b8',
  }))

  const lineData = data.eventFrequency.map((d) => ({
    date: d.date.slice(5),
    count: d.count,
    fullDate: d.date,
    events: d.events,
  }))

  return (
    <div
      className="animate-fade-in-up opacity-0 flex flex-col gap-6 md:flex-row"
      style={{ alignItems: 'flex-start' }}
    >
      <div className="flex flex-col gap-6 md:w-7/12 w-full">
        <div
          className="p-6 animate-fade-in-up opacity-0 stagger-1"
          style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0' }}
        >
          <h3 className="mb-4" style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>
            状态分布
          </h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart onMouseLeave={() => setActivePieIndex(null)}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  paddingAngle={2}
                  activeIndex={activePieIndex ?? -1}
                  activeShape={(props: any) => {
                    const RADIAN = Math.PI / 180
                    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props
                    const x = cx + (outerRadius + 16) * Math.cos(-midAngle * RADIAN)
                    const y = cy + (outerRadius + 16) * Math.sin(-midAngle * RADIAN)
                    return (
                      <g style={{ pointerEvents: 'none' }}>
                        <path
                          d={describeArc(cx, cy, outerRadius + 8, startAngle, endAngle, innerRadius + 8)}
                          fill={fill}
                          style={{ transition: 'all 0.25s ease' }}
                        />
                        <text
                          x={x}
                          y={y}
                          fill={fill}
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          fontSize={13}
                          fontWeight={700}
                        >
                          {`${payload.name} ${(percent * 100).toFixed(0)}%`}
                        </text>
                      </g>
                    )
                  }}
                  onMouseEnter={(_, index) => setActivePieIndex(index)}
                  onMouseLeave={() => setActivePieIndex(null)}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.color}
                      stroke="#fff"
                      strokeWidth={1}
                      style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
                    />
                  ))}
                  <LabelList
                    type="inner"
                    dataKey="name"
                    className="hidden"
                    position="center"
                  />
                </Pie>
                <RechartsTooltip
                  formatter={(value: number, _name: string, props: { payload: { percentage: number; name: string } }) => [
                    `${value} 棵 (${props.payload.percentage}%)`,
                    props.payload.name,
                  ]}
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 13,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 flex-wrap">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                <span style={{ fontSize: 12, color: '#64748b' }}>{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="p-6 animate-fade-in-up opacity-0 stagger-2"
          style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0' }}
        >
          <h3 className="mb-4" style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>
            过去30天事件频率
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={lineData}
              onMouseMove={(e) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  const d = e.activePayload[0].payload
                  if (d.fullDate !== activeTooltipDate) {
                    setActiveTooltipDate(d.fullDate)
                  }
                }
              }}
              onMouseLeave={() => setActiveTooltipDate(null)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                interval={4}
                tickMargin={8}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                allowDecimals={false}
                tickMargin={8}
              />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length || !payload[0]) return null
                  const d = payload[0].payload

                  const displayCount = tooltipExpanded ? d.events.length : Math.min(5, d.events.length)
                  const showExpand = d.events.length > 5

                  return (
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        padding: '10px 14px',
                        fontSize: 12,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        maxWidth: 300,
                        minWidth: 200,
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                        {d.fullDate}
                      </div>
                      <div style={{ color: '#6366f1', fontWeight: 600, marginBottom: 8 }}>
                        事件数: {d.count}
                      </div>
                      {d.events && d.events.length > 0 && (
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 6 }}>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>事件详情:</div>
                          <div
                            style={{
                              maxHeight: tooltipExpanded ? 200 : 'none',
                              overflowY: tooltipExpanded ? 'auto' : 'visible',
                            }}
                          >
                            {d.events.slice(0, displayCount).map((e: { type: string; notes: string; id?: string }, i: number) => (
                              <div
                                key={e.id || i}
                                style={{
                                  padding: '2px 0',
                                  color: '#64748b',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 4,
                                }}
                              >
                                <span style={{ flexShrink: 0 }}>•</span>
                                <span style={{ flex: 1, minWidth: 0 }}>
                                  <span style={{ fontWeight: 500, color: '#475569' }}>
                                    {eventTypeLabels[e.type] || e.type}
                                  </span>
                                  {e.notes ? (
                                    <span style={{ marginLeft: 4 }}>
                                      {e.notes.length > 18 ? e.notes.slice(0, 18) + '...' : e.notes}
                                    </span>
                                  ) : null}
                                </span>
                              </div>
                            ))}
                          </div>
                          {showExpand && (
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setTooltipExpanded(!tooltipExpanded)
                              }}
                              style={{
                                marginTop: 6,
                                fontSize: 11,
                                color: '#166534',
                                background: '#f0fdf4',
                                border: 'none',
                                padding: '4px 10px',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontWeight: 500,
                                width: '100%',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#dcfce7')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                            >
                              {tooltipExpanded ? `收起 ↑` : `展开全部 (${d.events.length}条) ↓`}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#818cf8', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-col gap-6 md:w-5/12 w-full">
        <div
          className="p-6 text-center animate-fade-in-up opacity-0 stagger-3"
          style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0' }}
        >
          <h3 className="mb-2" style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>
            总体健康评分
          </h3>
          <div style={{ fontSize: 80, fontWeight: 800, color: scoreColor, lineHeight: 1.1 }}>
            {data.score}
          </div>
          <div style={{ fontSize: 14, fontWeight: 400, color: '#475569', marginTop: 12, lineHeight: 1.6 }}>
            {data.suggestion}
          </div>
        </div>

        <div
          className="p-6 animate-fade-in-up opacity-0 stagger-4"
          style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0' }}
        >
          <h3 className="mb-3" style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
            状态统计
          </h3>
          {data.statusDistribution.map((d) => {
            const status = d.status as PlantStatus
            return (
              <div key={status} className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[status] }} />
                  <span style={{ fontSize: 13, color: '#475569' }}>{statusLabels[status]}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                  {d.count} 棵 ({d.percentage}%)
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function describeArc(x: number, y: number, r: number, startAngle: number, endAngle: number, innerR: number) {
  const start = polarToCartesian(x, y, r, endAngle)
  const end = polarToCartesian(x, y, r, startAngle)
  const innerStart = polarToCartesian(x, y, innerR, endAngle)
  const innerEnd = polarToCartesian(x, y, innerR, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return [
    'M', start.x, start.y,
    'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
    'L', innerEnd.x, innerEnd.y,
    'A', innerR, innerR, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
    'Z',
  ].join(' ')
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians)),
  }
}
