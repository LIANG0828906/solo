import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThermometerSun } from 'lucide-react'
import MapSelector from '@/components/MapSelector'
import HeatScene3D from '@/components/HeatScene3D'
import ControlPanel from '@/components/ControlPanel'
import StatsPanel from '@/components/StatsPanel'
import { useCityStore } from '@/stores/useCityStore'

export default function App() {
  const [isMobile, setIsMobile] = useState(false)
  const [mapExpanded, setMapExpanded] = useState(false)
  const selectedZoneId = useCityStore((state) => state.selectedZoneId)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isMobile) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#1E1E1E',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '60px',
            backgroundColor: '#2A2A2A',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '12px',
            cursor: 'pointer',
            borderBottom: '1px solid #333',
          }}
          onClick={() => setMapExpanded(!mapExpanded)}
        >
          <ThermometerSun size={24} color="#00BFFF" />
          <span style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>
            城市热岛效应模拟器
          </span>
          <span style={{ color: '#888', fontSize: '13px', marginLeft: 'auto' }}>
            {selectedZoneId ? '已选择区域' : '点击选择区域'}
          </span>
        </div>

        <AnimatePresence>
          {mapExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                overflow: 'hidden',
                backgroundColor: '#2A2A2A',
                borderBottom: '1px solid #333',
              }}
            >
              <div style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}>
                <MapSelector />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <HeatScene3D />
          <StatsPanel />
        </div>

        <div style={{ padding: '12px', backgroundColor: '#2C2C2C', borderTop: '1px solid #333' }}>
          <ControlPanel />
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1E1E1E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          height: '100%',
          maxHeight: '800px',
          display: 'flex',
          gap: '16px',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            flex: '0 0 40%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#2C2C2C',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <ThermometerSun size={22} color="#00BFFF" />
            <div>
              <div style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>
                城市热岛效应模拟器
              </div>
              <div style={{ color: '#888', fontSize: '11px' }}>
                Urban Heat Island Simulator
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <MapSelector />
          </div>
        </div>

        <div style={{ flex: '0 0 60%', display: 'flex', gap: '16px', minWidth: 0 }}>
          <div
            style={{
              flex: 1,
              position: 'relative',
              backgroundColor: '#1A1A2E',
              borderRadius: '8px',
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            <HeatScene3D />
            <StatsPanel />
          </div>

          <div style={{ flexShrink: 0 }}>
            <ControlPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
