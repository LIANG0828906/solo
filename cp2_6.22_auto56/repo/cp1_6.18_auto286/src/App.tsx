import { useEffect, useState } from 'react'
import CityScene from './components/CityScene'
import TimeControl from './components/TimeControl'
import { useAppStore, formatTime, SEASON_LABELS } from './store/appStore'

function InfoPanel() {
  const { time, season, lightIntensity, sunAltitude, sunAzimuth } = useAppStore()

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        width: '220px',
        padding: '16px',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.125)',
        borderRadius: '12px',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        zIndex: 100,
        color: '#E0E0E0'
      }}
    >
      <div
        style={{
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '14px',
          paddingBottom: '10px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          letterSpacing: '0.5px'
        }}
      >
        光影城市
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#9090A0' }}>当前时间</span>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{formatTime(time)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#9090A0' }}>当前季节</span>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{SEASON_LABELS[season]}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#9090A0' }}>光照强度</span>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{lightIntensity.toFixed(1)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#9090A0' }}>太阳高度</span>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{sunAltitude.toFixed(1)}°</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#9090A0' }}>太阳方位</span>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{sunAzimuth.toFixed(1)}°</span>
        </div>
      </div>

      <div
        style={{
          marginTop: '14px',
          paddingTop: '10px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: '11px',
          color: '#606080',
          lineHeight: '1.5'
        }}
      >
        拖动滑块调整时间，点击按钮切换季节
      </div>
    </div>
  )
}

function TitleBar() {
  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 100
      }}
    >
      <div
        style={{
          fontSize: '22px',
          fontWeight: 700,
          color: '#E0E0E0',
          letterSpacing: '1px',
          textShadow: '0 0 20px rgba(100,150,255,0.3)'
        }}
      >
        光影城市
      </div>
      <div
        style={{
          fontSize: '12px',
          color: '#707090',
          marginTop: '4px',
          letterSpacing: '0.5px'
        }}
      >
        3D日照模拟器
      </div>
    </div>
  )
}

export default function App() {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width <= 1024) {
        setScale(0.85)
      } else {
        setScale(1)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#0A0A1A',
        overflow: 'hidden'
      }}
    >
      <CityScene />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          transform: `scale(${scale})`,
          transformOrigin: 'center center'
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          <TitleBar />
          <InfoPanel />
          <TimeControl />
        </div>
      </div>
    </div>
  )
}
