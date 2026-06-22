import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot
} from 'recharts'
import { useChartData, getEnergyRange, findPeakPoints, formatTime } from '@/core/chart'
import type { ChartDataPoint } from '@/core/chart'
import { useAppStore } from '@/utils/store'

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartDataPoint }[] }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div
        style={{
          background: '#1E293B',
          border: '1px solid #334155',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#E2E8F0'
        }}
      >
        <div>时间: {formatTime(data.time)}</div>
        <div>能量: {data.energy.toFixed(1)} kJ/mol</div>
        {data.isPeak && <div style={{ color: '#FFD700' }}>⚡ 过渡态</div>}
      </div>
    )
  }
  return null
}

function PeakDot({ point }: { point: ChartDataPoint }) {
  return (
    <motion.g>
      <motion.circle
        cx={0}
        cy={0}
        r={6}
        fill="#FFD700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.circle
        cx={0}
        cy={0}
        r={6}
        fill="none"
        stroke="#FFD700"
        strokeWidth={2}
        initial={{ r: 6, opacity: 0.8 }}
        animate={{ r: 12, opacity: 0 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          repeatDelay: 0.5
        }}
      />
    </motion.g>
  )
}

export function EnergyChart() {
  const data = useChartData()
  const { min, max } = getEnergyRange(data)
  const peaks = findPeakPoints(data)
  const currentTime = useAppStore((s) => s.currentTime)
  const reactionStatus = useAppStore((s) => s.reactionStatus)

  const gradientId = 'energyGradient'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 320,
        height: 200,
        background: '#1E1E2E',
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        border: '1px solid #2D3748'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8
        }}
      >
        <span style={{ color: '#94A3B8', fontSize: 12, fontWeight: 500 }}>
          能量变化曲线
        </span>
        <span
          style={{
            color: reactionStatus === 'playing' ? '#22C55E' : '#64748B',
            fontSize: 11
          }}
        >
          {reactionStatus === 'playing' ? '● 实时' : formatTime(currentTime)}
        </span>
      </div>

      <div style={{ width: '100%', height: 155 }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00B4D8" />
                  <stop offset="100%" stopColor="#FF6B6B" />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#2D3748"
                opacity={0.5}
              />
              <XAxis
                dataKey="time"
                tick={{ fill: '#64748B', fontSize: 10 }}
                tickLine={{ stroke: '#475569' }}
                axisLine={{ stroke: '#475569' }}
                domain={[0, 5]}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 10 }}
                tickLine={{ stroke: '#475569' }}
                axisLine={{ stroke: '#475569' }}
                domain={[min, max]}
                width={35}
                tickFormatter={(v) => v.toFixed(0)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="energy"
                stroke={`url(#${gradientId})`}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <AnimatePresence>
                {peaks.map((peak, index) => (
                  <ReferenceDot
                    key={`peak-${index}`}
                    x={peak.time}
                    y={peak.energy}
                    shape={<PeakDot point={peak} />}
                  />
                ))}
              </AnimatePresence>
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              fontSize: 12
            }}
          >
            点击开始按钮查看能量变化
          </div>
        )}
      </div>
    </motion.div>
  )
}
