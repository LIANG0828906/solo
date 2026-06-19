import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { create } from 'zustand'
import * as THREE from 'three'
import { sceneManager } from './modules/scene/SceneManager'
import { pointCloudProcessor } from './modules/scene/PointCloudProcessor'
import { effectsManager } from './modules/scene/EffectsManager'
import { UIPanel } from './modules/ui/UIPanel'
import { SliderGroup } from './modules/ui/SliderGroup'

type ViewMode = 'original' | 'highlight' | 'corrosion'

interface AppState {
  mode: ViewMode
  corrosionLevel: number
  temperature: number
  lightAngle: number
  isLoading: boolean
  loadProgress: number
  loadedPoints: number
  totalPointsCount: number
  estimatedTime: number
  detectedAreas: number
  siteName: string
  discoveryYear: number
  autoRotating: boolean
  dataReady: boolean
  setMode: (m: ViewMode) => void
  setCorrosionLevel: (v: number) => void
  setTemperature: (v: number) => void
  setLightAngle: (v: number) => void
  setLoading: (v: boolean) => void
  setLoadProgress: (v: number) => void
  setLoadedPoints: (v: number) => void
  setTotalPointsCount: (v: number) => void
  setEstimatedTime: (v: number) => void
  setDetectedAreas: (v: number) => void
  setAutoRotating: (v: boolean) => void
  setDataReady: (v: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  mode: 'original',
  corrosionLevel: 30,
  temperature: 25,
  lightAngle: 50,
  isLoading: true,
  loadProgress: 0,
  loadedPoints: 0,
  totalPointsCount: 25000,
  estimatedTime: 0,
  detectedAreas: 0,
  siteName: '南海沉船遗址',
  discoveryYear: 2023,
  autoRotating: false,
  dataReady: false,
  setMode: (m) => set({ mode: m }),
  setCorrosionLevel: (v) => set({ corrosionLevel: v }),
  setTemperature: (v) => set({ temperature: v }),
  setLightAngle: (v) => set({ lightAngle: v }),
  setLoading: (v) => set({ isLoading: v }),
  setLoadProgress: (v) => set({ loadProgress: v }),
  setLoadedPoints: (v) => set({ loadedPoints: v }),
  setTotalPointsCount: (v) => set({ totalPointsCount: v }),
  setEstimatedTime: (v) => set({ estimatedTime: v }),
  setDetectedAreas: (v) => set({ detectedAreas: v }),
  setAutoRotating: (v) => set({ autoRotating: v }),
  setDataReady: (v) => set({ dataReady: v }),
}))

function SceneBackground() {
  const { scene } = useThree()
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, '#062C36')
    gradient.addColorStop(1, '#0F4C5C')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 2, 512)
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    scene.background = texture
    scene.fog = new THREE.FogExp2(new THREE.Color('#0a3a47'), 0.012)
    return () => { texture.dispose(); canvas.remove() }
  }, [scene])
  return null
}

function SceneLights() {
  return (
    <>
      <ambientLight color="#1a5a6e" intensity={0.5} />
      <directionalLight
        color="#7ec8b8"
        intensity={1.0}
        position={[5, 20, 8]}
      />
      <directionalLight
        color="#0c4a5e"
        intensity={0.3}
        position={[-3, -5, -2]}
      />
      <pointLight color="#7ec8b8" intensity={0.6} distance={30} position={[0, 8, 0]} />
    </>
  )
}

function PointCloudObject({ geometry, onPointerMoveProp }: {
  geometry: THREE.BufferGeometry | null
  onPointerMoveProp?: (point: THREE.Vector3) => void
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const store = useStore()
  const highlightCenterRef = useRef(new THREE.Vector3(999, 999, 999))
  const highlightRadiusRef = useRef(0)

  useEffect(() => {
    if (!geometry) return
    const mat = effectsManager.createMaterial()
    materialRef.current = mat
    if (pointsRef.current) {
      pointsRef.current.geometry = geometry
      pointsRef.current.material = mat
    }
    return () => { mat.dispose() }
  }, [geometry])

  const modeValue = useMemo(() => {
    return store.mode === 'original' ? 0 : store.mode === 'highlight' ? 1 : 2
  }, [store.mode])

  useFrame((state) => {
    if (!materialRef.current) return
    effectsManager.update(state.clock.elapsedTime, {
      mode: modeValue,
      corrosion: store.corrosionLevel,
      temperature: store.temperature,
      lightAngle: store.lightAngle,
      highlightCenter: highlightCenterRef.current,
      highlightRadius: highlightRadiusRef.current,
    })
  })

  const handlePointerMove = useCallback((e: any) => {
    if (!onPointerMoveProp) return
    const point = e.point as THREE.Vector3
    highlightCenterRef.current.copy(point)
    highlightRadiusRef.current = 2.0
    onPointerMoveProp(point)
    setTimeout(() => {
      highlightRadiusRef.current = 0
      highlightCenterRef.current.set(999, 999, 999)
    }, 150)
  }, [onPointerMoveProp])

  if (!geometry) return null

  return (
    <points ref={pointsRef} onPointerMove={handlePointerMove}>
      <primitive object={geometry} attach="geometry" />
    </points>
  )
}

function AutoRotateController() {
  const controlsRef = useRef<any>(null)
  const { autoRotating, setAutoRotating } = useStore()
  const startTimeRef = useRef<number | null>(null)

  useFrame(() => {
    if (!autoRotating || !controlsRef.current) return
    if (startTimeRef.current === null) startTimeRef.current = performance.now()
    const elapsed = (performance.now() - startTimeRef.current) / 1000
    if (elapsed >= 20) {
      setAutoRotating(false)
      startTimeRef.current = null
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={autoRotating}
      autoRotateSpeed={3.0}
      enableDamping
      dampingFactor={0.05}
      minDistance={5}
      maxDistance={40}
      target={[0, 1, 0]}
    />
  )
}

function UnderwaterParticles() {
  const count = 200
  const meshRef = useRef<THREE.Points>(null)
  const positionsRef = useRef<Float32Array>(new Float32Array(count * 3))

  useEffect(() => {
    const positions = positionsRef.current
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30
      positions[i * 3 + 1] = Math.random() * 15
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30
    }
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    const positions = positionsRef.current
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += 0.005
      positions[i * 3] += Math.sin(t + i) * 0.002
      if (positions[i * 3 + 1] > 15) positions[i * 3 + 1] = 0
    }
    const geom = meshRef.current.geometry
    ;(geom.attributes.position as THREE.BufferAttribute).needsUpdate = true
  })

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positionsRef.current, 3))
    return geom
  }, [])

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        color="#7ec8b840"
        size={0.06}
        transparent
        opacity={0.4}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

export default function App() {
  const store = useStore()
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
  const [pendingMode, setPendingMode] = useState<ViewMode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const loadChunks = useCallback(async () => {
    const totalChunks = pointCloudProcessor.getTotalChunks()
    const pointsPerChunk = pointCloudProcessor.getPointsPerChunk()
    const totalPts = totalChunks * pointsPerChunk
    store.setTotalPointsCount(totalPts)
    store.setLoading(true)
    store.setLoadProgress(0)

    const startTime = performance.now()

    for (let i = 0; i < totalChunks; i++) {
      const chunk = pointCloudProcessor.generateChunk(i)
      const loaded = pointCloudProcessor.appendChunk(chunk)
      const progress = ((i + 1) / totalChunks) * 100
      const elapsed = (performance.now() - startTime) / 1000
      const rate = (i + 1) / elapsed
      const remaining = rate > 0 ? Math.round((totalChunks - i - 1) / rate) : 0

      store.setLoadProgress(progress)
      store.setLoadedPoints(loaded)
      store.setEstimatedTime(remaining)
      await new Promise(r => setTimeout(r, 300))
    }

    const processed = pointCloudProcessor.processLoadedData()
    const geom = pointCloudProcessor.createGeometry()
    setGeometry(geom)
    store.setDetectedAreas(processed.artifactRegionCount)
    store.setLoading(false)
    store.setDataReady(true)
    store.setAutoRotating(true)
  }, [])

  useEffect(() => {
    loadChunks()
    return () => { pointCloudProcessor.reset() }
  }, [loadChunks])

  const handlePointerMove = useCallback((point: THREE.Vector3) => {
    if (!store.dataReady) return
    const newHighlights = pointCloudProcessor.highlightArtifactNear(point, 2.0)
    if (newHighlights > 0) {
      store.setDetectedAreas(store.detectedAreas + newHighlights)
    }
  }, [store.dataReady, store.detectedAreas])

  const handleModeChange = useCallback((newMode: ViewMode) => {
    if (newMode === store.mode) return
    setPendingMode(newMode)
    effectsManager.startDissolve(() => {
      store.setMode(newMode)
      setPendingMode(null)
    })
  }, [store.mode])

  const sliderConfigs = useMemo(() => [
    {
      key: 'corrosionLevel',
      label: '腐蚀程度',
      color: '#8B4513',
      value: store.corrosionLevel,
      onChange: store.setCorrosionLevel,
    },
    {
      key: 'temperature',
      label: '温度',
      color: '#FF6347',
      value: store.temperature,
      onChange: store.setTemperature,
    },
    {
      key: 'lightAngle',
      label: '光照角度',
      color: '#FFD700',
      value: store.lightAngle,
      onChange: store.setLightAngle,
    },
  ], [store.corrosionLevel, store.temperature, store.lightAngle])

  const modeForUI = pendingMode ?? store.mode

  return (
    <div ref={containerRef} style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #062C36, #0F4C5C)',
      fontFamily: 'Roboto, sans-serif',
    }}>
      <Canvas
        camera={{
          position: [0, 6, 18],
          fov: 60,
          near: 0.1,
          far: 500,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        raycaster={{ params: { Points: { threshold: 0.5 } } }}
      >
        <SceneBackground />
        <SceneLights />
        <PointCloudObject
          geometry={geometry}
          onPointerMoveProp={handlePointerMove}
        />
        <UnderwaterParticles />
        <AutoRotateController />
      </Canvas>

      <UIPanel
        siteName={store.siteName}
        discoveryYear={store.discoveryYear}
        totalPoints={store.loadedPoints}
        detectedAreas={store.detectedAreas}
        currentMode={modeForUI}
        onModeChange={handleModeChange}
        isLoading={store.isLoading}
        loadProgress={store.loadProgress}
        loadedPoints={store.loadedPoints}
        totalPointsCount={store.totalPointsCount}
        estimatedTime={store.estimatedTime}
      />

      {!store.isLoading && <SliderGroup sliders={sliderConfigs} />}
    </div>
  )
}
