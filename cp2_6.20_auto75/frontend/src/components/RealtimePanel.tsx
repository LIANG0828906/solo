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

const RealtimePanel = () => {
  const sensorList = useClimateStore(state => state.sensorList)
  const realtimeData = useClimateStore(state => state.realtimeData)
  const addRealtimeData = useClimateStore(state => state.addRealtimeData)
  const updateSensorData = useClimateStore(state => state.updateSensorData)
  const timeRange = useClimateStore(state => state.timeRange)
  const setTimeRange = useClimateStore(state => state.setTimeRange)
  const sensorHistoryMap = useClimateStore(state => state.sensorHistoryMap)
  const fetchSensorHistory = useClimateStore(state => state.fetchSensorHistory)
  const selectedSensorId = useClimateStore(state => state.selectedSensorId)

  const [previousValues, setPreviousValues] = useState<Record<string, number>>({})
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initial: Record<string, number> = {}
    sensorList.forEach(s => {
      initial[s.id] = s.value
    })
    setPreviousValues(initial)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      sensorList.forEach(sensor => {
      const change = (Math.random() - 0.5) * 2
      const newValue = sensor.value + change
      const prevValue = previousValues[sensor.id] || sensor.value

      updateSensorData(sensor.id, { value: parseFloat(newValue.toFixed(1)) })

      const changePercent = ((newValue - prevValue) / prevValue) * 100

      addRealtimeData({
        id: `${sensor.id}-${Date.now()}`,
        sensorName: sensor.name,
        sensorType: sensor.type,
        value: newValue,
        unit: sensor.unit,
        change: changePercent,
        timestamp: new Date().toISOString(),
      })

      setPreviousValues(prev => ({ ...prev, [sensor.id]: newValue }))
    })
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
      time: dayjs(d.timestamp).format('MM-DD HH:mm'),
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
    }}>
      <div className="card" style={{ padding: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 10 }}>
          实时数据流
        </h3>
        <div
          ref={listRef}
          style={{
            maxHeight: 200,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {sensorList.map(sensor => {
            const prevVal = previousValues[sensor.id] || sensor.value
            const change = ((sensor.value - prevVal) / prevVal) * 100
            const isPositive = change >= 0

            return (
              <div
                key={sensor.id}
                className="fade-in"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                <div style={{
                  width: 3,
                  height: 16,
                  borderRadius: 2,
                  background: sensorTypeColors[sensor.type],
                }} />
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
                <div style={{ textAlign: 'right', minWidth: 70 }}>
                  <span style={{ color: '#fff', fontWeight: 500 }}>
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
              }}>
                <span>{isPositive ? '↑' : '↓'}</span>
                <span>{Math.abs(change).toFixed(1)}%</span>
              </div>
            </div>
            )
          })}
        </div>
      </div>

      <div className="card" style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
            历史趋势
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
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="time"
                  stroke="#718096"
                  fontSize={10}
                  tick={{ fill: '#718096' }}
                />
                <YAxis
                  stroke="#718096"
                  fontSize={10}
                  tick={{ fill: '#718096' }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#16213e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#a0aec0' }}
                />
                <Legend
                  wrapperStyle={{ color: '#a0aec0' }}
                  formatter={() => <span style={{ color: '#fff', fontSize: 12 }}>{sensorTypeLabels[selectedSensor.type]}</span>}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={sensorTypeColors[selectedSensor.type]}
                  strokeWidth={2}
                  dot={false}
                  name={sensorTypeLabels[selectedSensor.type]}
                  animationDuration={500}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#718096',
              fontSize: 13,
            }}>
              点击左侧传感器查看历史趋势
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 10 }}>
          指标说明
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(sensorTypeLabels).map(([type, label]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <div style={{
                width: 12,
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
