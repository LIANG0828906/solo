import { useState, useEffect } from 'react'
import SensorList from './SensorList'
import ClimateMap from './ClimateMap'
import RealtimePanel from './RealtimePanel'
import { useClimateStore } from '../store/climateStore'
import dayjs from 'dayjs'

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'))
  const aqiValue = useClimateStore(state => state.aqiValue)
  const loadInitialData = useClimateStore(state => state.loadInitialData)

  useEffect(() => {
    loadInitialData()
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return '#2ed573'
    if (aqi <= 100) return '#ffa502'
    if (aqi <= 150) return '#ff7f50'
    return '#ff4757'
  }

  const getAqiLevel = (aqi: number) => {
    if (aqi <= 50) return '优'
    if (aqi <= 100) return '良'
    if (aqi <= 150) return '轻度污染'
    return '中度污染'
  }

  const progressPercent = Math.min((aqiValue / 200) * 100, 100)
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' }}>
      <header style={{
        height: 70,
        background: 'rgba(22, 33, 62, 0.9)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #00d9ff, #e94560)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: 20,
          }}>
            🌡️
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>微气候环境监测系统</h1>
            <p style={{ fontSize: 12, color: '#a0aec0' }}>Microclimate Environment Monitoring</p>
          </div>
        </div>

        <div style={{ fontSize: 20, fontWeight: 500, color: '#00d9ff', fontFamily: 'monospace' }}>
          {currentTime}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 12, color: '#a0aec0' }}>空气质量指数</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: getAqiColor(aqiValue) }}>
              {getAqiLevel(aqiValue)}
            </span>
          </div>
          <div style={{ position: 'relative', width: 90, height: 90 }}>
            <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="45" cy="45" r={45} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
              <circle
                cx="45"
                cy="45"
                r={45}
                fill="none"
                stroke={getAqiColor(aqiValue)}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: getAqiColor(aqiValue) }}>{aqiValue}</div>
              <div style={{ fontSize: 10, color: '#a0aec0' }}>AQI</div>
            </div>
          </div>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', gap: 16, padding: 16, overflow: 'hidden' }} className="dashboard-container">
        <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SensorList />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <ClimateMap />
        </div>

        <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column' }} className="right-panel">
          <RealtimePanel />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
