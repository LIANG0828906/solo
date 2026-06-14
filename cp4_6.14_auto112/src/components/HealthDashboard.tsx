import type { HealthAnalysis, PlantStatus } from '@/types'
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip,
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

interface HealthDashboardProps {
  data: HealthAnalysis
}

export default function HealthDashboard({ data }: HealthDashboardProps) {
  const scoreColor = data.score >= 75 ? '#22c55e' : data.score >= 50 ? '#f97316' : '#ef4444'

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
    <div className="animate-fade-in-up opacity-0 flex flex-col lg:flex-row gap-6">
      <div className="lg:w-7/12 flex flex-col gap-6">
        <div
          className="p-6 animate-fade-in-up opacity-0 stagger-1"
          style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0' }}
        >
          <h3 className="mb-4" style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>
            状态分布
          </h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  paddingAngle={2}
                  onMouseEnter={(_, index) => {
                    const cells = document.querySelectorAll('.recharts-pie-sector')
                    cells.forEach((cell, i) => {
                      if (i === index) {
                        (cell as SVGElement).setAttribute(
                          'transform',
                          `translate(${Math.cos(((index * 90) / pieData.length) * Math.PI / 180) * 8}, ${Math.sin(((index * 90) / pieData.length) * Math.PI / 180) * 8})`
                        )
                      }
                    })
                  }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} style={{ transition: 'all 0.2s ease', cursor: 'pointer' }} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number, name: string, props: { payload: { percentage: number } }) => [
                    `${value} 棵 (${props.payload.percentage}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
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
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                allowDecimals={false}
              />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div
                      style={{
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 12,
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#334155', marginBottom: 4 }}>{d.fullDate}</div>
                      <div style={{ color: '#6366f1' }}>事件数: {d.count}</div>
                    </div>
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3, fill: '#818cf8', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="lg:w-3/12 flex flex-col gap-6">
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
          <div style={{ fontSize: 14, fontWeight: 400, color: '#475569', marginTop: 12 }}>
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
              <div key={status} className="flex items-center justify-between mb-2">
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
