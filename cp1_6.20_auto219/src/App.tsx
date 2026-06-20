import { useEffect, useCallback } from 'react'
import { useSceneStore } from '@/store/SceneStore'
import Toolbar from '@/components/Toolbar'
import Scene from '@/components/Scene'
import PropertyPanel from '@/components/PropertyPanel'
import LightControl from '@/components/LightControl'

export default function App() {
  const { selectedId, isMobile, setIsMobile, setMobilePropertyOpen } = useSceneStore()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [setIsMobile])

  const handleMobilePropertyOpen = useCallback(() => {
    setMobilePropertyOpen(true)
  }, [setMobilePropertyOpen])

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      overflow: 'hidden',
      background: '#1a1a2e',
    }}>
      {!isMobile && <Toolbar />}

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Scene />
        <LightControl />

        {isMobile && <Toolbar />}

        {isMobile && selectedId && !useSceneStore.getState().mobilePropertyOpen && (
          <button
            onClick={handleMobilePropertyOpen}
            className="glow-border"
            style={{
              position: 'fixed',
              right: 12,
              bottom: 12,
              zIndex: 100,
              width: 44,
              height: 44,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              color: '#ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            属性
          </button>
        )}

        {isMobile && <MobilePropertyWrapper />}
      </div>

      {!isMobile && <PropertyPanel />}
    </div>
  )
}

function MobilePropertyWrapper() {
  const { selectedId } = useSceneStore()
  if (!selectedId) return null
  return <PropertyPanel />
}
