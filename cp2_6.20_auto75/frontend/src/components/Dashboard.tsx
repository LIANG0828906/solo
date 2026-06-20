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
  const initWebSocket = useClimateStore(state => state.initWebSocket)
  const disconnectWebSocket = useClimateStore(state => state.disconnectWebSocket)
  const isConnected = useClimateStore(state => state.isConnected)
  const isReconnecting = useClimateStore(state => state.isReconnecting)
  const reconnectAttempts = useClimateStore(state => state.reconnectAttempts)
  const reconnectDelay = useClimateStore(state => state.reconnectDelay)

  useEffect(() => {
    loadInitialData()
    initWebSocket()
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'))
    }, 1000)
    return () => {
      clearInterval(timer)
      disconnectWebSocket()
    }
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
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
      overflow: 'hidden',
    }}>
      <header style={{
        height: 70,
        background: 'rgba(22, 33, 62, 0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        backdropFilter: 'blur(10px)',
        flexShrink: 0,
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
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>
            🌡️
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fff', margin: 0 }}>微气候环境监测系统</h1>
            <p style={{ fontSize: 12, color: '#a0aec0', margin: 0 }}>Microclimate Environment Monitoring</p>
          </div>
          <div style={{
            marginLeft: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 12,
            background: isConnected ? 'rgba(46, 213, 115, 0.15)' : isReconnecting ? 'rgba(255, 165, 2, 0.15)' : 'rgba(255, 71, 87, 0.15)',
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isConnected ? '#2ed573' : isReconnecting ? '#ffa502' : '#ff4757',
              animation: isConnected || isReconnecting ? 'pulse 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: 11, color: isConnected ? '#2ed573' : isReconnecting ? '#ffa502' : '#ff4757' }}>
              {isConnected ? '实时连接' : isReconnecting ? `重连中 (${reconnectAttempts}/10) - ${(reconnectDelay / 1000).toFixed(1)}s` : '模拟模式'}
            </span>
          </div>
        </div>

        <div style={{ fontSize: 20, fontWeight: 500, color: '#00d9ff', fontFamily: 'monospace', letterSpacing: 1 }}>
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

      <div style={{
        flex: 1,
        display: 'flex',
        gap: 16,
        padding: 16,
        overflow: 'hidden',
        minWidth: 0,
      }} className="dashboard-container">
        <div className="left-panel" style={{
          width: 300,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minWidth: 0,
        }}>
          <SensorList />
        </div>

        <div className="center-panel" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minWidth: 0,
        }}>
          <ClimateMap />
        </div>

        <div className="right-panel" style={{
          width: 320,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}>
          <RealtimePanel />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
