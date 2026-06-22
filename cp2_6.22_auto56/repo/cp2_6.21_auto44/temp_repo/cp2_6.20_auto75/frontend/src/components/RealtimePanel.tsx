import { useState, useEffect, useRef } from 'react'
import { useClimateStore } from '../store/climateStore'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { SensorType } from '../types'
import dayjs from 'dayjs'

const sensorTypeColors: Record<SensorType, string> = {
  temperature: '#e94560',
  humidity: '#00d9ff',
  wind: '#ffd700',
  light: '#ffa502',
  pm25: '#a55eea',
}

const sensorTypeLabels: Record<SensorType, string> = {
  temperature: '温度',
  humidity: '湿度',
  wind: '风速',
  light: '光照',
  pm25: 'PM2.5',
}

const sensorTypeIcons: Record<SensorType, string> = {
  temperature: '🌡️',
  humidity: '💧',
  wind: '💨',
  light: '☀️',
  pm25: '🌫️',
}

const RealtimePanel = () => {
  const sensorList = useClimateStore(state => state.sensorList)
  const addRealtimeData = useClimateStore(state => state.addRealtimeData)
  const updateSensorData = useClimateStore(state => state.updateSensorData)
  const timeRange = useClimateStore(state => state.timeRange)
  const setTimeRange = useClimateStore(state => state.setTimeRange)
  const sensorHistoryMap = useClimateStore(state => state.sensorHistoryMap)
  const selectedSensorId = useClimateStore(state => state.selectedSensorId)
  const previousValues = useClimateStore(state => state.previousValues)

  const [, forceUpdate] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const highlightIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    const interval = setInterval(() => {
      sensorList.forEach(sensor => {
      const change = (Math.random() - 0.5) * 1.2
      const newValue = parseFloat((sensor.value + change).toFixed(1))
      const prevValue = previousValues[sensor.id] || sensor.value
      const changePercent = prevValue !== 0 ? ((newValue - prevValue) / prevValue) * 100 : 0

      updateSensorData(sensor.id, { value: newValue })

      const dataId = `${sensor.id}-${Date.now()}`
      addRealtimeData({
        id: dataId,
        sensorName: sensor.name,
        sensorType: sensor.type,
        value: newValue,
        unit: sensor.unit,
        change: changePercent,
        timestamp: new Date().toISOString(),
      })

      highlightIds.current.add(dataId)

      setTimeout(() => {
        highlightIds.current.delete(dataId)
      }, 1500)
    })
    forceUpdate(n => n + 1)
    }, 3000)

    return () => clearInterval(interval)
  }, [sensorList, previousValues, updateSensorData, addRealtimeData])

  const timeRanges: Array<{ value: '1h' | '6h' | '24h' | '7d'; label: string }> = [
    { value: '1h', label: '1小时' },
    { value: '6h', label: '6小时' },
    { value: '24h', label: '24小时' },
    { value: '7d', label: '7天' },
  ]

  const getHistoryChartData = () => {
    const selectedSensor = sensorList.find(s => s.id === selectedSensorId)
    if (!selectedSensor) return []

    const history = sensorHistoryMap[selectedSensor.id]
    if (!history) return []

    return history.data.map(d => ({
      time: dayjs(d.timestamp).format(timeRange === '7d' ? 'MM-DD' : 'MM-DD HH:mm'),
      value: d.value,
    }))
  }

  const chartData = getHistoryChartData()
  const selectedSensor = sensorList.find(s => s.id === selectedSensorId)

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      overflow: 'hidden',
      minHeight: 0,
    }}>
      <div className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>
            📡 实时数据流
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 8px',
            borderRadius: 10,
            background: 'rgba(46, 213, 115, 0.15)',
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#2ed573',
              animation: 'pulse 1.5s infinite',
            }} />
            <span style={{ fontSize: 10, color: '#2ed573' }}>实时</span>
          </div>
        </div>
        <div
          ref={listRef}
          style={{
            maxHeight: 200,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {sensorList.map(sensor => {
            const prevVal = previousValues[sensor.id] || sensor.value
            const change = prevVal !== 0 ? ((sensor.value - prevVal) / prevVal) * 100 : 0
            const isPositive = change >= 0
            const isNew = Array.from(highlightIds.current).some(id => id.startsWith(sensor.id))

            return (
              <div
                key={sensor.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  background: isNew ? 'rgba(0, 217, 255, 0.15)' : 'rgba(0, 0, 0, 0.2)',
                  borderRadius: 6,
                  fontSize: 12,
                  border: isNew ? '1px solid rgba(0, 217, 255, 0.3)' : '1px solid transparent',
                  transition: 'all 0.3s ease',
                }}
                className={isNew ? 'fade-in' : ''}
              >
                <div style={{ fontSize: 14 }}>{sensorTypeIcons[sensor.type]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: '#fff',
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {sensor.name}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 65 }}>
                  <span style={{ color: sensorTypeColors[sensor.type], fontWeight: 600, fontSize: 13 }}>
                    {sensor.value.toFixed(1)}
                  </span>
                  <span style={{ color: '#a0aec0', fontSize: 10, marginLeft: 2 }}>
                    {sensor.unit}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  color: isPositive ? '#2ed573' : '#ff4757',
                  fontSize: 11,
                  minWidth: 40,
                  justifyContent: 'flex-end',
                  fontWeight: 500,
                }}>
                  <span style={{ fontSize: 12 }}>{isPositive ? '↑' : '↓'}</span>
                  <span>{Math.abs(change).toFixed(1)}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card" style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexShrink: 0 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>
            📈 历史趋势
          </h3>
          <div style={{ display: 'flex', gap: 4 }}>
            {timeRanges.map(range => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  borderRadius: 4,
                  background: timeRange === range.value ? '#00d9ff' : 'rgba(255,255,255,0.1)',
                  color: timeRange === range.value ? '#0f3460' : '#a0aec0',
                  fontWeight: timeRange === range.value ? 600 : 400,
                  border: 'none',
                }}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          {selectedSensor ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="time"
                  stroke="#718096"
                  fontSize={9}
                  tick={{ fill: '#718096' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#718096"
                  fontSize={9}
                  tick={{ fill: '#718096' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#16213e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 11,
                  }}
                  labelStyle={{ color: '#a0aec0', fontSize: 10 }}
                  formatter={(value: number) => [`${value.toFixed(1)} ${selectedSensor.unit}`, sensorTypeLabels[selectedSensor.type]]}
                />
                <Legend
                  wrapperStyle={{ color: '#a0aec0', fontSize: 11 }}
                  formatter={() => (
                    <span style={{ color: sensorTypeColors[selectedSensor.type], fontSize: 11 }}>
                      {sensorTypeIcons[selectedSensor.type]} {sensorTypeLabels[selectedSensor.type]}
                    </span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={sensorTypeColors[selectedSensor.type]}
                  strokeWidth={2.5}
                  dot={false}
                  name={sensorTypeLabels[selectedSensor.type]}
                  animationDuration={800}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: '#718096',
              fontSize: 12,
            }}>
              <div style={{ fontSize: 32, opacity: 0.5 }}>📊</div>
              <div>点击左侧传感器查看历史趋势</div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 12, flexShrink: 0 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 10 }}>
          🏷️ 指标说明
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(sensorTypeLabels).map(([type, label]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
              <span style={{ fontSize: 14 }}>{sensorTypeIcons[type as SensorType]}</span>
              <div style={{
                width: 14,
                height: 3,
                borderRadius: 2,
                background: sensorTypeColors[type as SensorType],
              }} />
              <span style={{ color: '#a0aec0' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RealtimePanel
