import { useEffect, useRef, useState, useCallback } from 'react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  initScene,
  setRegion,
  setDepth,
  highlightParticle,
  showTrajectory,
  disposeScene
} from './scene'
import {
  useCoralReelStore,
  Microplastic,
  Region
} from './store'
import {
  DepthSlider,
  RegionButtons,
  TimeSlider,
  ParticleDetailPanel,
  DensityChart,
  FilterPanel,
  GuideOverlay,
  MobileMenu,
  StatsBar
} from './dataPanel.tsx'

type OceanSceneInstance = ReturnType<typeof initScene>

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<OceanSceneInstance | null>(null)
  const updateIntervalRef = useRef<number | null>(null)
  const [sceneReady, setSceneReady] = useState(false)

  const targetDepth = useCoralReelStore(s => s.targetDepth)
  const selectedRegion = useCoralReelStore(s => s.selectedRegion)
  const selectedParticle = useCoralReelStore(s => s.selectedParticle)
  const trackingParticle = useCoralReelStore(s => s.trackingParticle)
  const trackingActive = useCoralReelStore(s => s.trackingActive)
  const guideVisible = useCoralReelStore(s => s.guideVisible)

  const setTargetDepthStore = useCoralReelStore(s => s.setTargetDepth)
  const setCurrentDepthStore = useCoralReelStore(s => s.setCurrentDepth)
  const setSelectedRegionStore = useCoralReelStore(s => s.setSelectedRegion)
  const setSelectedParticleStore = useCoralReelStore(s => s.setSelectedParticle)
  const setTrackingParticleStore = useCoralReelStore(s => s.setTrackingParticle)
  const setTrackingActiveStore = useCoralReelStore(s => s.setTrackingActive)
  const setFilteredParticleCount = useCoralReelStore(s => s.setFilteredParticleCount)
  const updateDensityHistory = useCoralReelStore(s => s.updateDensityHistory)
  const updateTrackHistory = useCoralReelStore(s => s.updateTrackHistory)
  const setGuideVisible = useCoralReelStore(s => s.setGuideVisible)
  const setParticles = useCoralReelStore(s => s.setParticles)

  const handleParticleClick = useCallback((p: Microplastic) => {
    setSelectedParticleStore(p)
    setGuideVisible(false)
    if (sceneRef.current) {
      highlightParticle(sceneRef.current, p)
    }
  }, [setSelectedParticleStore, setGuideVisible])

  const handleParticleLongPress = useCallback((p: Microplastic) => {
    setTrackingParticleStore(p)
    setTrackingActiveStore(true)
    if (sceneRef.current) {
      showTrajectory(sceneRef.current, p)
    }
  }, [setTrackingParticleStore, setTrackingActiveStore])

  const handleParticleRelease = useCallback(() => {
    if (trackingActive) {
      setTrackingParticleStore(null)
      setTrackingActiveStore(false)
      if (sceneRef.current) {
        showTrajectory(sceneRef.current, null)
      }
    }
  }, [trackingActive, setTrackingParticleStore, setTrackingActiveStore])

  const handleDepthChange = useCallback((depth: number) => {
    setTargetDepthStore(depth)
  }, [setTargetDepthStore])

  const handleRegionChange = useCallback((region: Region) => {
    setSelectedRegionStore(region)
    setSelectedParticleStore(null)
    if (sceneRef.current) {
      setRegion(sceneRef.current, region)
      setParticles(sceneRef.current.currentParticles)
    }
  }, [setSelectedRegionStore, setSelectedParticleStore, setParticles])

  useEffect(() => {
    if (!containerRef.current) return

    try {
      const scene = initScene(containerRef.current, {
        onParticleClick: handleParticleClick,
        onParticleLongPress: handleParticleLongPress,
        onParticleRelease: handleParticleRelease
      })
      sceneRef.current = scene
      setParticles(scene.currentParticles)
      setSceneReady(true)
    } catch (error) {
      console.error('Failed to initialize scene:', error)
    }

    return () => {
      if (sceneRef.current) {
        disposeScene(sceneRef.current)
        sceneRef.current = null
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [
    handleParticleClick,
    handleParticleLongPress,
    handleParticleRelease,
    setParticles
  ])

  useEffect(() => {
    if (sceneRef.current) {
      setDepth(sceneRef.current, targetDepth)
    }
  }, [targetDepth])

  useEffect(() => {
    if (sceneRef.current) {
      highlightParticle(sceneRef.current, selectedParticle)
    }
  }, [selectedParticle])

  useEffect(() => {
    if (sceneRef.current && trackingParticle && trackingActive) {
      showTrajectory(sceneRef.current, trackingParticle)
    } else if (sceneRef.current) {
      showTrajectory(sceneRef.current, null)
    }
  }, [trackingParticle, trackingActive])

  useEffect(() => {
    if (!sceneReady || !sceneRef.current) return

    updateIntervalRef.current = window.setInterval(() => {
      if (!sceneRef.current) return
      const count = sceneRef.current.getFilteredCount()
      const density = sceneRef.current.getDensity()
      setFilteredParticleCount(count)
      updateDensityHistory(density)
      updateTrackHistory(count)
      setCurrentDepthStore(sceneRef.current.currentDepth)
    }, 200)

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
    }
  }, [
    sceneReady,
    setFilteredParticleCount,
    updateDensityHistory,
    updateTrackHistory,
    setCurrentDepthStore
  ])

  const handleGuideDismiss = useCallback(() => {
    setGuideVisible(false)
  }, [setGuideVisible])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#0A1128'
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />

      {sceneReady && (
        <>
          <StatsBar />
          <MobileMenu />
          <DepthSlider onChange={handleDepthChange} />
          <RegionButtons onSelect={handleRegionChange} />
          <TimeSlider />
          <ParticleDetailPanel />
          <DensityChart />
          <FilterPanel />
          {guideVisible && <GuideOverlay onDismiss={handleGuideDismiss} />}
        </>
      )}

      {!sceneReady && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#A8D0E6',
            textAlign: 'center',
            zIndex: 50
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌊</div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>正在加载海洋场景...</div>
          <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '8px' }}>
            初始化三维渲染引擎与粒子系统
          </div>
        </div>
      )}
    </div>
  )
}

const rootElement = document.getElementById('root')
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(<App />)
}
