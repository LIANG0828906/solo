import { useState } from 'react'
import { useClimateStore } from '../store/climateStore'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'
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

const SensorCard = ({ sensor }: { sensor: SensorData }) => {
  const [isHovered, setIsHovered] = useState(false)
  const selectedSensorId = useClimateStore(state => state.selectedSensorId)
  const setSelectedSensor = useClimateStore(state => state.setSelectedSensor)
  const sensorHistoryMap = useClimateStore(state => state.sensorHistoryMap)

  const isExpanded = selectedSensorId === sensor.id
  const history = sensorHistoryMap[sensor.id]?.data || []

  const statusColors = {
    online: '#2ed573',
    warning: '#ffa502',
    offline: '#ff4757',
  }

  const handleClick = () => {
    setSelectedSensor(isExpanded ? null : sensor.id)
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: '#16213e',
        borderRadius: 8,
        padding: 14,
        cursor: 'pointer',
        border: `1px solid ${isExpanded ? '#00d9ff' : 'rgba(255,255,255,0.1)'}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
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
            {sensor.isVirtual && <span style={{ fontSize: 10, marginLeft: 6, color: '#00d9ff' }}>[虚拟]</span>}
          </div>
          <div style={{ color: '#a0aec0', fontSize: 11, marginTop: 2 }}>
            {sensorTypeLabels[sensor.type]}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
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
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>
          {sensor.value.toFixed(1)}
          <span style={{ fontSize: 12, color: '#a0aec0', marginLeft: 4 }}>{sensor.unit}</span>
        </span>
        <span style={{ fontSize: 10, color: '#718096' }}>
          {dayjs(sensor.lastUpdate).format('HH:mm:ss')}
        </span>
      </div>

      {(isHovered || isExpanded) && history.length > 0 && (
        <div style={{
          height: isExpanded ? 100 : 50,
          marginTop: 10,
          paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          transition: 'height 0.3s ease',
        }} className="fade-in">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history.slice(-24)}>
              <YAxis hide domain={['auto', 'auto']} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={sensor.type === 'temperature' ? '#e94560' : '#00d9ff'}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

const SensorList = () => {
  const sensorList = useClimateStore(state => state.sensorList)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflow: 'hidden' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 4px',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
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
      }}>
        {sensorList.map(sensor => (
          <SensorCard key={sensor.id} sensor={sensor} />
        ))}
      </div>
    </div>
  )
}

export default SensorList
