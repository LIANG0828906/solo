import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import GalaxyScene from './scene/GalaxyScene'
import ControlPanel from './ui/ControlPanel'
import InfoCard from './ui/InfoCard'
import { generateStarSystems, StarData, PlanetData } from './scene/StarSystem'

const App: React.FC = () => {
  const { stars } = useMemo(() => generateStarSystems(), [])
  const controlsRef = useRef<any>(null)

  const [brightnessThreshold, setBrightnessThreshold] = useState(0)
  const [showPlanets, setShowPlanets] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [showOrbits, setShowOrbits] = useState(true)
  const [selectedStarId, setSelectedStarId] = useState<string | null>(null)
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetData | null>(null)
  const [hoveredStar, setHoveredStar] = useState<StarData | null>(null)
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleResetCamera = () => {
    setSelectedStarId(null)
    setTimeout(() => {
      if (controlsRef.current) {
        controlsRef.current.reset()
      }
    }, 1300)
  }

  const handleSelectStar = (id: string | null) => {
    setSelectedStarId(id)
    if (id && controlsRef.current) {
      controlsRef.current.enabled = false
    } else if (!id && controlsRef.current) {
      setTimeout(() => {
        if (controlsRef.current) controlsRef.current.enabled = true
      }, 1300)
    }
  }

  const handleHoverPlanet = (planet: PlanetData | null, pos?: { x: number; y: number }) => {
    if (planet) {
      setHoveredPlanet(planet)
      setHoveredStar(null)
      if (pos) setHoverPos(pos)
    } else if (hoveredPlanet) {
      setHoveredPlanet(null)
    }
  }

  const handleHoverStar = (star: StarData | null, pos?: { x: number; y: number }) => {
    if (star) {
      setHoveredStar(star)
      setHoveredPlanet(null)
      if (pos) setHoverPos(pos)
    } else if (hoveredStar) {
      setHoveredStar(null)
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 8, 22], fov: 60, near: 0.1, far: 200 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0B001A', 0)
          gl.toneMapping = 0
        }}
        frameloop="always"
      >
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          minDistance={2}
          maxDistance={30}
          enablePan={false}
        />
        <GalaxyScene
          stars={stars}
          brightnessThreshold={brightnessThreshold}
          showPlanets={showPlanets}
          showLabels={showLabels}
          showOrbits={showOrbits}
          selectedStarId={selectedStarId}
          onSelectStar={handleSelectStar}
          onHoverPlanet={handleHoverPlanet}
          onHoverStar={handleHoverStar}
        />
      </Canvas>

      {hoveredStar && (
        <InfoCard
          position={hoverPos}
          type="star"
          data={{
            name: hoveredStar.name,
            spectralType: hoveredStar.spectralType,
            brightness: hoveredStar.brightness,
            planetCount: hoveredStar.planets.length,
          } as any}
          visible={true}
        />
      )}

      {hoveredPlanet && (
        <InfoCard
          position={hoverPos}
          type="planet"
          data={{
            name: hoveredPlanet.name,
            distance: hoveredPlanet.distance,
            temperature: hoveredPlanet.temperature,
          }}
          visible={true}
        />
      )}

      <ControlPanel
        brightnessThreshold={brightnessThreshold}
        onBrightnessChange={setBrightnessThreshold}
        showPlanets={showPlanets}
        onShowPlanetsChange={setShowPlanets}
        showLabels={showLabels}
        onShowLabelsChange={setShowLabels}
        showOrbits={showOrbits}
        onShowOrbitsChange={setShowOrbits}
        onResetCamera={handleResetCamera}
      />

      <div
        style={{
          position: 'fixed',
          top: 24,
          left: 24,
          zIndex: 50,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#ffffff',
            textShadow: '0 0 20px rgba(126,87,194,0.6)',
            letterSpacing: 2,
            fontFamily: "'Segoe UI', sans-serif",
            marginBottom: 6,
          }}
        >
          🌌 星系探索者
        </div>
        <div
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: 1,
            fontFamily: "'Segoe UI', sans-serif",
          }}
        >
          Galaxy Explorer
        </div>
      </div>

      {selectedStarId && (
        <div
          onClick={handleResetCamera}
          style={{
            position: 'fixed',
            top: 24,
            right: isMobile ? 24 : 280,
            zIndex: 60,
            background: 'rgba(15,15,30,0.85)',
            border: '1px solid #7E57C2',
            borderRadius: 8,
            padding: '10px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: "'Segoe UI', sans-serif",
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ color: '#FFD54F' }}>✕</span>
          <span style={{ color: '#ffffff', fontSize: 14 }}>退出聚焦</span>
        </div>
      )}
    </div>
  )
}

export default App
