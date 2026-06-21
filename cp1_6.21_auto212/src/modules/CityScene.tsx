import { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { DayNightMode, WeatherType } from '../types'

type LightMode = 'off' | 'on' | 'dusk'

interface BuildingProps {
  position: [number, number, number]
  width: number
  depth: number
  height: number
  bottomColor: string
  topColor: string
  lightColor: string
  lightMode: LightMode
  isHovered: boolean
  onPointerOver: () => void
  onPointerOut: () => void
  animateScale: number
  flickerPhase: number
}

function Building({
  position,
  width,
  depth,
  height,
  bottomColor,
  topColor,
  lightColor,
  lightMode,
  isHovered,
  onPointerOver,
  onPointerOut,
  animateScale,
  flickerPhase,
}: BuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BoxGeometry(width, height, depth)
    const colors = new Float32Array(geo.attributes.position.count * 3)
    const colorTop = new THREE.Color(topColor)
    const colorBottom = new THREE.Color(bottomColor)
    
    const positions = geo.attributes.position.array as Float32Array
    
    for (let i = 0; i < geo.attributes.position.count; i++) {
      const y = positions[i * 3 + 1]
      const t = (y + height / 2) / height
      const color = colorBottom.clone().lerp(colorTop, t)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.7,
      metalness: 0.3,
    })
    
    return { geometry: geo, material: mat }
  }, [width, height, depth, bottomColor, topColor])

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()
    
    if (meshRef.current) {
      meshRef.current.scale.setScalar(animateScale)
    }

    if (lightRef.current) {
      const mat = lightRef.current.material as THREE.MeshBasicMaterial
      if (lightMode === 'on') {
        const flicker = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(time * Math.PI + flickerPhase))
        mat.opacity = flicker * 0.8
      } else if (lightMode === 'dusk') {
        mat.opacity = 0.4
      } else {
        mat.opacity = 0
      }
    }

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = isHovered ? 0.3 : 0
    }
  })

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        geometry={geometry}
        material={material}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      />

      <mesh
        ref={lightRef}
        position={[0, height - 0.25, 0]}
      >
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshBasicMaterial
          color={lightColor}
          transparent
          opacity={0}
        />
      </mesh>

      <mesh
        ref={glowRef}
        position={[0, height / 2, 0]}
      >
        <boxGeometry args={[width * 1.2, height * 1.2, depth * 1.2]} />
        <meshBasicMaterial
          color="#FBBF24"
          transparent
          opacity={0}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

interface ParticleSystemProps {
  type: 'rain' | 'snow'
  count: number
  fadeIn: boolean
}

function ParticleSystem({ type, count, fadeIn }: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const velocitiesRef = useRef<Float32Array>(new Float32Array(count * 3))
  const [opacity, setOpacity] = useState(0)

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100
      pos[i * 3 + 1] = Math.random() * 40
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100
      
      vel[i * 3] = type === 'snow' ? (Math.random() - 0.5) * 2 : 0
      vel[i * 3 + 1] = type === 'rain' ? -15 : -5
      vel[i * 3 + 2] = type === 'snow' ? (Math.random() - 0.5) * 2 : 0
    }
    
    return { positions: pos, velocities: vel }
  }, [count, type])

  useEffect(() => {
    velocitiesRef.current = velocities
  }, [velocities])

  useEffect(() => {
    if (fadeIn) {
      const start = Date.now()
      const duration = 500
      const targetOpacity = type === 'rain' ? 0.3 : 0.6
      
      const animate = () => {
        const elapsed = Date.now() - start
        const progress = Math.min(elapsed / duration, 1)
        setOpacity(targetOpacity * progress)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    } else {
      const start = Date.now()
      const duration = 500
      const startOpacity = type === 'rain' ? 0.3 : 0.6
      
      const animate = () => {
        const elapsed = Date.now() - start
        const progress = Math.min(elapsed / duration, 1)
        setOpacity(startOpacity * (1 - progress))
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    }
  }, [fadeIn, type])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    
    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array
    
    for (let i = 0; i < count; i++) {
      posArr[i * 3] += velocitiesRef.current[i * 3] * delta
      posArr[i * 3 + 1] += velocitiesRef.current[i * 3 + 1] * delta
      posArr[i * 3 + 2] += velocitiesRef.current[i * 3 + 2] * delta
      
      if (posArr[i * 3 + 1] < -2) {
        posArr[i * 3] = (Math.random() - 0.5) * 100
        posArr[i * 3 + 1] = 40
        posArr[i * 3 + 2] = (Math.random() - 0.5) * 100
      }
      
      if (type === 'snow') {
        velocitiesRef.current[i * 3] += (Math.random() - 0.5) * 0.1
        velocitiesRef.current[i * 3] = Math.max(-2, Math.min(2, velocitiesRef.current[i * 3]))
      }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={type === 'rain' ? '#3B82F6' : '#FFFFFF'}
        size={type === 'rain' ? 0.15 : 0.25}
        transparent
        opacity={opacity}
        sizeAttenuation
      />
    </points>
  )
}

interface DynamicSkyProps {
  mode: DayNightMode
}

function DynamicSky({ mode }: DynamicSkyProps) {
  const { scene } = useThree()
  const topColorRef = useRef(new THREE.Color('#87CEEB'))
  const bottomColorRef = useRef(new THREE.Color('#FFE4B5'))
  const targetTopRef = useRef(new THREE.Color('#87CEEB'))
  const targetBottomRef = useRef(new THREE.Color('#FFE4B5'))
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const textureRef = useRef<THREE.CanvasTexture | null>(null)
  const needsUpdateRef = useRef(true)

  useEffect(() => {
    const colors: Record<DayNightMode, { top: string; bottom: string }> = {
      day: { top: '#87CEEB', bottom: '#FFE4B5' },
      night: { top: '#0F172A', bottom: '#1E293B' },
      dusk: { top: '#FF7F50', bottom: '#FFD700' },
    }
    
    targetTopRef.current.set(colors[mode].top)
    targetBottomRef.current.set(colors[mode].bottom)
    needsUpdateRef.current = true
  }, [mode])

  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    
    canvasRef.current = canvas
    ctxRef.current = ctx
    textureRef.current = texture
    scene.background = texture
    
    return () => {
      texture.dispose()
    }
  }, [scene])

  useFrame((_, delta) => {
    const topChanged = !topColorRef.current.equals(targetTopRef.current)
    const bottomChanged = !bottomColorRef.current.equals(targetBottomRef.current)
    
    if (topChanged || bottomChanged || needsUpdateRef.current) {
      topColorRef.current.lerp(targetTopRef.current, delta * 2)
      bottomColorRef.current.lerp(targetBottomRef.current, delta * 2)
      
      if (ctxRef.current && canvasRef.current && textureRef.current) {
        const ctx = ctxRef.current
        const gradient = ctx.createLinearGradient(0, 0, 0, 256)
        gradient.addColorStop(0, '#' + topColorRef.current.getHexString())
        gradient.addColorStop(1, '#' + bottomColorRef.current.getHexString())
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 2, 256)
        textureRef.current.needsUpdate = true
      }
      
      needsUpdateRef.current = false
    }
  })

  return null
}

interface GroundProps {
  mode: DayNightMode
}

function Ground({ mode }: GroundProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    
    const targetColor = mode === 'night' ? '#0F172A' : mode === 'dusk' ? '#334155' : '#475569'
    mat.color.lerp(new THREE.Color(targetColor), delta * 2)
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[120, 120]} />
      <meshStandardMaterial color="#475569" transparent opacity={0.8} />
    </mesh>
  )
}

interface GridFloorProps {
  mode: DayNightMode
}

function GridFloor({ mode }: GridFloorProps) {
  const gridRef = useRef<THREE.GridHelper>(null)

  useFrame((_, delta) => {
    if (!gridRef.current) return
    const mat = gridRef.current.material as THREE.LineBasicMaterial
    
    const targetColor = mode === 'night' ? '#1E293B' : mode === 'dusk' ? '#334155' : '#64748B'
    mat.color.lerp(new THREE.Color(targetColor), delta * 2)
  })

  return (
    <gridHelper
      ref={gridRef}
      args={[120, 40, '#64748B', '#475569']}
      position={[0, 0, 0]}
    />
  )
}

interface BuildingData {
  position: [number, number, number]
  width: number
  depth: number
  height: number
  bottomColor: string
  topColor: string
  lightColor: string
  flickerPhase: number
}

const colorPalettes = [
  { bottom: '#334155', top: '#94A3B8' },
  { bottom: '#1E293B', top: '#6366F1' },
  { bottom: '#334155', top: '#EC4899' },
  { bottom: '#1E293B', top: '#10B981' },
  { bottom: '#334155', top: '#FBBF24' },
]

const lightColors = ['#FBBF24', '#EC4899', '#10B981', '#6366F1']

function generateBuildings(count: number): BuildingData[] {
  const buildings: BuildingData[] = []
  const gridSize = 80
  const halfSize = gridSize / 2
  
  const gridCols = 15
  const gridRows = 10
  const cellWidth = gridSize / gridCols
  const cellDepth = gridSize / gridRows
  
  for (let i = 0; i < count; i++) {
    const col = i % gridCols
    const row = Math.floor(i / gridCols)
    
    const offsetX = (Math.random() - 0.5) * cellWidth * 0.5
    const offsetZ = (Math.random() - 0.5) * cellDepth * 0.5
    
    const baseX = -halfSize + cellWidth * (col + 0.5) + offsetX
    const baseZ = -halfSize + cellDepth * (row + 0.5) + offsetZ
    
    const width = 2 + Math.random() * 5
    const depth = 2 + Math.random() * 5
    const height = 5 + Math.random() * 25
    
    const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)]
    const lightColor = lightColors[Math.floor(Math.random() * lightColors.length)]
    
    buildings.push({
      position: [baseX, 0, baseZ],
      width,
      depth,
      height,
      bottomColor: palette.bottom,
      topColor: palette.top,
      lightColor,
      flickerPhase: Math.random() * Math.PI * 2,
    })
  }
  
  return buildings
}

interface CitySceneContentProps {
  dayNightMode: DayNightMode
  weather: WeatherType
  regenerateTrigger: number
  onBuildingHover: (data: { height: number; lightOn: boolean } | null) => void
}

function CitySceneContent({
  dayNightMode,
  weather,
  regenerateTrigger,
  onBuildingHover,
}: CitySceneContentProps) {
  const [buildings, setBuildings] = useState<BuildingData[]>(() => generateBuildings(150))
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [animScales, setAnimScales] = useState<number[]>(() => Array(150).fill(1))
  const [particleCount, setParticleCount] = useState({ rain: 800, snow: 600 })
  const [particleFadeIn, setParticleFadeIn] = useState(true)
  const lastLowFpsTimeRef = useRef(0)
  const frameCountRef = useRef(0)
  const lastFpsCheckRef = useRef(performance.now())

  const lightMode: LightMode = dayNightMode === 'night' ? 'on' : dayNightMode === 'dusk' ? 'dusk' : 'off'

  useEffect(() => {
    const indices: number[] = []
    const available = Array.from({ length: buildings.length }, (_, i) => i)
    
    for (let i = 0; i < 10 && available.length > 0; i++) {
      const idx = Math.floor(Math.random() * available.length)
      indices.push(available[idx])
      available.splice(idx, 1)
    }
    
    const newBuildings = [...buildings]
    indices.forEach(idx => {
      const building = { ...newBuildings[idx] }
      const heightDelta = (Math.random() - 0.5) * 10
      building.height = Math.max(5, Math.min(30, building.height + heightDelta))
      
      const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)]
      building.bottomColor = palette.bottom
      building.topColor = palette.top
      
      newBuildings[idx] = building
    })
    
    setBuildings(newBuildings)
    
    const startTime = Date.now()
    const duration = 1000
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const scales = [...animScales]
      indices.forEach(idx => {
        const t = progress * Math.PI
        scales[idx] = 0.7 + 0.3 * Math.sin(t)
      })
      setAnimScales(scales)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }, [regenerateTrigger])

  useEffect(() => {
    setParticleFadeIn(false)
    const timer = setTimeout(() => {
      setParticleFadeIn(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [weather])

  useFrame(() => {
    frameCountRef.current++
    const now = performance.now()
    const elapsed = now - lastFpsCheckRef.current
    
    if (elapsed >= 1000) {
      const fps = (frameCountRef.current * 1000) / elapsed
      frameCountRef.current = 0
      lastFpsCheckRef.current = now
      
      if (fps < 25) {
        if (lastLowFpsTimeRef.current === 0) {
          lastLowFpsTimeRef.current = now
        } else if (now - lastLowFpsTimeRef.current >= 5000) {
          setParticleCount(prev => ({
            rain: Math.max(100, Math.floor(prev.rain / 2)),
            snow: Math.max(100, Math.floor(prev.snow / 2)),
          }))
          lastLowFpsTimeRef.current = 0
        }
      } else {
        lastLowFpsTimeRef.current = 0
      }
    }
  })

  const handlePointerOver = useCallback((index: number) => {
    setHoveredIndex(index)
    onBuildingHover({
      height: buildings[index].height,
      lightOn: lightMode !== 'off',
    })
  }, [buildings, lightMode, onBuildingHover])

  const handlePointerOut = useCallback(() => {
    setHoveredIndex(null)
    onBuildingHover(null)
  }, [onBuildingHover])

  return (
    <>
      <DynamicSky mode={dayNightMode} />
      
      <ambientLight intensity={dayNightMode === 'night' ? 0.2 : dayNightMode === 'dusk' ? 0.5 : 0.8} />
      <directionalLight
        position={[30, 50, 30]}
        intensity={dayNightMode === 'night' ? 0.3 : dayNightMode === 'dusk' ? 0.6 : 1}
        castShadow
      />
      
      <Ground mode={dayNightMode} />
      <GridFloor mode={dayNightMode} />
      
      {buildings.map((building, index) => (
        <Building
          key={index}
          position={building.position}
          width={building.width}
          depth={building.depth}
          height={building.height}
          bottomColor={building.bottomColor}
          topColor={building.topColor}
          lightColor={building.lightColor}
          lightMode={lightMode}
          isHovered={hoveredIndex === index}
          onPointerOver={() => handlePointerOver(index)}
          onPointerOut={handlePointerOut}
          animateScale={animScales[index] || 1}
          flickerPhase={building.flickerPhase}
        />
      ))}
      
      {weather === 'rain' && particleFadeIn && (
        <ParticleSystem type="rain" count={particleCount.rain} fadeIn={particleFadeIn} />
      )}
      {weather === 'snow' && particleFadeIn && (
        <ParticleSystem type="snow" count={particleCount.snow} fadeIn={particleFadeIn} />
      )}
      
      <OrbitControls
        enablePan={false}
        minDistance={10}
        maxDistance={100}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2 + Math.PI / 6}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  )
}

interface CitySceneProps {
  dayNightMode: DayNightMode
  weather: WeatherType
  regenerateTrigger: number
  onBuildingHover: (data: { height: number; lightOn: boolean } | null) => void
}

function CityScene({
  dayNightMode,
  weather,
  regenerateTrigger,
  onBuildingHover,
}: CitySceneProps) {
  return (
    <Canvas
      camera={{ position: [30, 25, 30], fov: 60 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true }}
    >
      <CitySceneContent
        dayNightMode={dayNightMode}
        weather={weather}
        regenerateTrigger={regenerateTrigger}
        onBuildingHover={onBuildingHover}
      />
    </Canvas>
  )
}

export default CityScene
