import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../store/useAppStore'
import { calculateSunPosition } from '../utils/sunCalculator'
import { getSkyGradient } from '../utils/colorUtils'
import type { HeatmapSample } from '../types'
import SunLight from './SunLight'
import GroundPlane from './GroundPlane'
import BuildingModelComponent from './BuildingModel'
import Heatmap from './Heatmap'
import ClockIndicator from './ClockIndicator'

interface SceneViewerProps {
  className?: string
}

function SceneContent({ onSampleClick }: { onSampleClick?: (sample: HeatmapSample) => void }) {
  const {
    config,
    buildings,
    analysisResult,
    selectedBuildingId,
    updateBuilding,
    selectBuilding,
  } = useAppStore()

  const controlsRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [cameraOrbitComplete, setCameraOrbitComplete] = useState(false)
  const [hasModel, setHasModel] = useState(false)

  const sunPosition = useMemo(() => {
    return calculateSunPosition(
      config.date,
      config.time,
      config.location.latitude,
      config.location.longitude
    )
  }, [config.date, config.time, config.location.latitude, config.location.longitude])

  const skyColors = useMemo(() => {
    return getSkyGradient(config.time, config.isCloudy)
  }, [config.time, config.isCloudy])

  const { scene } = useThree()

  useEffect(() => {
    const topColor = new THREE.Color(skyColors.top)
    const bottomColor = new THREE.Color(skyColors.bottom)
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, skyColors.top)
    gradient.addColorStop(1, skyColors.bottom)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 2, 512)
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    scene.background = texture
    return () => {
      texture.dispose()
    }
  }, [skyColors, scene])

  useEffect(() => {
    if (buildings.length > 0 && !hasModel) {
      setHasModel(true)
      setCameraOrbitComplete(false)
    } else if (buildings.length === 0) {
      setHasModel(false)
      setCameraOrbitComplete(true)
    }
  }, [buildings.length, hasModel])

  useFrame((state, delta) => {
    if (config.isPlaying && controlsRef.current) {
      const newTime = config.time + delta * config.playSpeed * 0.5
      if (newTime >= 19) {
        useAppStore.getState().pausePlayback()
        useAppStore.getState().setConfig({ time: 19 })
      } else {
        useAppStore.getState().setConfig({ time: newTime })
      }
    }

    if (!cameraOrbitComplete && hasModel && controlsRef.current) {
      const controls = controlsRef.current
      const elapsed = state.clock.getElapsedTime()
      const orbitDuration = 2
      const startTime = (state.clock as any).orbitStartTime || 0
      
      if (!(state.clock as any).orbitStartTime) {
        (state.clock as any).orbitStartTime = elapsed
      }

      const progress = Math.min((elapsed - startTime) / orbitDuration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      const startAngle = -Math.PI / 4
      const endAngle = startAngle + Math.PI * 2
      const currentAngle = startAngle + (endAngle - startAngle) * eased

      const radius = 60
      const height = 25 + eased * 10

      controls.target.set(0, 5, 0)
      controls.object.position.x = Math.sin(currentAngle) * radius
      controls.object.position.y = height
      controls.object.position.z = Math.cos(currentAngle) * radius
      controls.update()

      if (progress >= 1) {
        setCameraOrbitComplete(true)
        ;(state.clock as any).orbitStartTime = null
      }
    }
  })

  const handleTransform = useCallback((id: string, position: [number, number, number], rotation: [number, number, number]) => {
    updateBuilding(id, { position, rotation })
  }, [updateBuilding])

  const handleSelect = useCallback((id: string) => {
    selectBuilding(id)
  }, [selectBuilding])

  return (
    <>
      <ambientLight intensity={0.3} />
      
      <SunLight
        sunDirection={sunPosition.directionVector}
        sunAltitude={sunPosition.altitude}
        time={config.time}
        intensity={1.5}
      />

      <GroundPlane
        size={config.gridSize}
        gridDivisions={config.sampleResolution}
      />

      <group ref={groupRef}>
        {buildings.map((building) => (
          <BuildingModelComponent
            key={building.id}
            model={building}
            isSelected={building.id === selectedBuildingId}
            onSelect={handleSelect}
            onTransform={handleTransform}
            showControls={cameraOrbitComplete}
          />
        ))}
      </group>

      {analysisResult && config.showHeatmap && (
        <Heatmap
          samples={analysisResult.samples}
          gridSize={config.gridSize}
          visible={config.showHeatmap}
          onSampleClick={onSampleClick}
          maxSunlightHours={analysisResult.maxSunlightHours}
        />
      )}

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={150}
        maxPolarAngle={Math.PI / 2 - 0.1}
        target={[0, 5, 0]}
        enabled={cameraOrbitComplete}
      />
    </>
  )
}

export default function SceneViewer({ className }: SceneViewerProps) {
  const [clickedSample, setClickedSample] = useState<HeatmapSample | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const handleSampleClick = useCallback((sample: HeatmapSample) => {
    setClickedSample(sample)
    setTooltipPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    })
    setTimeout(() => setClickedSample(null), 3000)
  }, [])

  const config = useAppStore((state) => state.config)
  const sunPosition = useMemo(() => {
    return calculateSunPosition(
      config.date,
      config.time,
      config.location.latitude,
      config.location.longitude
    )
  }, [config.date, config.time, config.location.latitude, config.location.longitude])

  return (
    <div className={`relative w-full h-full ${className || ''}`}>
      <Canvas
        shadows
        camera={{ position: [50, 30, 50], fov: 50 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        onPointerMissed={() => useAppStore.getState().selectBuilding(null)}
      >
        <SceneContent onSampleClick={handleSampleClick} />
      </Canvas>

      <ClockIndicator
        time={config.time}
        sunAltitude={sunPosition.altitude}
        isPlaying={config.isPlaying}
      />

      {clickedSample && (
        <div
          className="fixed z-50 px-6 py-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-cyan-400/50 shadow-lg shadow-cyan-500/20 animate-bounce"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y - 80,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="text-center">
            <div className="text-cyan-400 text-sm font-medium mb-1">日照时长</div>
            <div className="text-white text-2xl font-bold tabular-nums">
              {clickedSample.sunlightHours.toFixed(1)} <span className="text-lg">小时</span>
            </div>
            <div className="text-gray-400 text-xs mt-1">
              位置: ({clickedSample.x.toFixed(1)}, {clickedSample.z.toFixed(1)})
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
