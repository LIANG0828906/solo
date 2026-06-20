import { useState } from 'react'
import { useClimateStore } from '../store/climateStore'
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip, CartesianGrid } from 'recharts'
import type { SensorData, SensorType } from '../types'
import dayjs from 'dayjs'

const sensorTypeIcons: Record<SensorType, string> = {
  temperature: '🌡️',
  humidity: '💧',
  wind: '💨',
  light: '☀️',
  pm25: '🌫️',
}

const sensorTypeLabels: Record<SensorType, string> = {
  temperature: '温度',
  humidity: '湿度',
  wind: '风速',
  light: '光照',
  pm25: 'PM2.5',
}

const sensorTypeColors: Record<SensorType, string> = {
  temperature: '#e94560',
  humidity: '#00d9ff',
  wind: '#ffd700',
  light: '#ffa502',
  pm25: '#a55eea',
}

const SensorCard = ({ sensor }: { sensor: SensorData }) => {
  const [isHovered, setIsHovered] = useState(false)
  const selectedSensorId = useClimateStore(state => state.selectedSensorId)
  const setSelectedSensor = useClimateStore(state => state.setSelectedSensor)
  const sensorHistoryMap = useClimateStore(state => state.sensorHistoryMap)
  const timeRange = useClimateStore(state => state.timeRange)

  const isExpanded = selectedSensorId === sensor.id
  const history = sensorHistoryMap[sensor.id]?.data || []

  const statusColors = {
    online: '#2ed573',
    warning: '#ffa502',
    offline: '#ff4757',
  }

  const statusLabels = {
    online: '在线',
    warning: '警告',
    offline: '离线',
  }

  const handleClick = () => {
    setSelectedSensor(isExpanded ? null : sensor.id)
  }

  const miniChartData = history.slice(-24).map((d, i) => ({
    name: i,
    value: d.value,
  }))

  const expandedChartData = history.map(d => ({
    time: dayjs(d.timestamp).format('HH:mm'),
    value: d.value,
  }))

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isExpanded ? 'rgba(0, 217, 255, 0.08)' : '#16213e',
        borderRadius: 8,
        padding: 14,
        cursor: 'pointer',
        border: `1px solid ${isExpanded ? '#00d9ff' : 'rgba(255,255,255,0.1)'}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transformOrigin: 'center center',
        zIndex: isHovered ? 10 : 1,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 28 }}>{sensorTypeIcons[sensor.type]}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {sensor.name}
            {sensor.isVirtual && <span style={{ fontSize: 10, marginLeft: 6, color: '#ffd700' }}>[虚拟]</span>}
          </div>
          <div style={{ color: '#a0aec0', fontSize: 11, marginTop: 2 }}>
            {sensorTypeLabels[sensor.type]}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: statusColors[sensor.status],
              boxShadow: `0 0 8px ${statusColors[sensor.status]}`,
              animation: sensor.status === 'online' ? 'pulse 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: 10, color: statusColors[sensor.status] }}>
              {statusLabels[sensor.status]}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 24, fontWeight: 'bold', color: sensorTypeColors[sensor.type] }}>
          {sensor.value.toFixed(1)}
          <span style={{ fontSize: 12, color: '#a0aec0', marginLeft: 4, fontWeight: 400 }}>{sensor.unit}</span>
        </span>
        <span style={{ fontSize: 10, color: '#718096' }}>
          {dayjs(sensor.lastUpdate).format('HH:mm:ss')}
        </span>
      </div>

      {(isHovered || isExpanded) && miniChartData.length > 1 && (
        <div style={{
          height: isExpanded ? 140 : 50,
          marginTop: 10,
          paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          transition: 'height 0.3s ease',
        }} className="fade-in">
          {!isExpanded ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={miniChartData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={sensorTypeColors[sensor.type]}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, color: '#a0aec0' }}>
                历史数据 - {timeRange === '1h' ? '最近1小时' : timeRange === '6h' ? '最近6小时' : timeRange === '24h' ? '最近24小时' : '最近7天'}
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={expandedChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="time"
                    stroke="#718096"
                    fontSize={9}
                    tick={{ fill: '#718096' }}
                  />
                  <YAxis
                    stroke="#718096"
                    fontSize={9}
                    tick={{ fill: '#718096' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#16213e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      color: '#fff',
                      fontSize: 11,
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)} ${sensor.unit}`, sensorTypeLabels[sensor.type]]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={sensorTypeColors[sensor.type]}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const SensorList = () => {
  const sensorList = useClimateStore(state => state.sensorList)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflow: 'hidden', minHeight: 0 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 4px',
        flexShrink: 0,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>
          传感器列表
          <span style={{ fontSize: 12, color: '#a0aec0', marginLeft: 8 }}>{sensorList.length} 个</span>
        </h3>
      </div>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        paddingRight: 4,
        minHeight: 0,
      }}>
        {sensorList.map(sensor => (
          <SensorCard key={sensor.id} sensor={sensor} />
        ))}
      </div>
    </div>
  )
}

export default SensorList
