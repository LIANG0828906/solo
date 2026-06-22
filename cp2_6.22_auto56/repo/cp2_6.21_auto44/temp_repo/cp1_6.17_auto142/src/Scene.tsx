import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { useForestStore } from './store'
import {
  TreeParticle,
  WeatherParticle,
  generateWeatherParticles,
  updateWeatherParticles,
  generateForest,
  interpolateTreeColors,
} from './forestSim'

const INITIAL_CAMERA_POSITION = new THREE.Vector3(60, 50, 80)
const INITIAL_CAMERA_TARGET = new THREE.Vector3(0, 10, 0)
const MAX_TREE_PARTICLES = 12000
const MAX_WEATHER_PARTICLES = 250

interface TreePointsProps {
  trees: TreeParticle[]
  particleSize: number
}

function TreePoints({ trees, particleSize }: TreePointsProps) {
  const pointsRef = useRef<THREE.Points>(null)

  const initialBuffers = useMemo(() => {
    const positions = new Float32Array(MAX_TREE_PARTICLES * 3)
    const colors = new Float32Array(MAX_TREE_PARTICLES * 3)
    const sizes = new Float32Array(MAX_TREE_PARTICLES)
    return { positions, colors, sizes }
  }, [])

  useFrame(() => {
    if (!pointsRef.current) return

    const { positions, colors, sizes } = initialBuffers
    let totalCount = 0
    const colorObj = new THREE.Color()

    trees.forEach(tree => {
      tree.particles.forEach(particle => {
        if (totalCount >= MAX_TREE_PARTICLES) return
        positions[totalCount * 3] = particle.x
        positions[totalCount * 3 + 1] = particle.y
        positions[totalCount * 3 + 2] = particle.z

        colorObj.set(particle.color)
        colors[totalCount * 3] = colorObj.r
        colors[totalCount * 3 + 1] = colorObj.g
        colors[totalCount * 3 + 2] = colorObj.b

        sizes[totalCount] = particle.size * particleSize
        totalCount++
      })
    })

    const geometry = pointsRef.current.geometry
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute
    const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute
    const sizeAttr = geometry.getAttribute('size') as THREE.BufferAttribute

    posAttr.needsUpdate = true
    colorAttr.needsUpdate = true
    sizeAttr.needsUpdate = true

    geometry.setDrawRange(0, totalCount)
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={MAX_TREE_PARTICLES}
          array={initialBuffers.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={MAX_TREE_PARTICLES}
          array={initialBuffers.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={MAX_TREE_PARTICLES}
          array={initialBuffers.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={particleSize * 0.15}
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  )
}

function TreeHalo({ trees }: { trees: TreeParticle[] }) {
  return (
    <>
      {trees.map(tree => (
        <mesh
          key={`halo-${tree.id}`}
          position={[tree.baseX, 0.1, tree.baseZ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0, 8, 32]} />
          <meshBasicMaterial
            color="#00FF88"
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  )
}

interface WeatherPointsProps {
  humidity: number
}

function WeatherPoints({ humidity }: WeatherPointsProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const weatherParticlesRef = useRef<WeatherParticle[]>([])

  const initialBuffers = useMemo(() => {
    const positions = new Float32Array(MAX_WEATHER_PARTICLES * 3)
    const colors = new Float32Array(MAX_WEATHER_PARTICLES * 3)
    const sizes = new Float32Array(MAX_WEATHER_PARTICLES)
    return { positions, colors, sizes }
  }, [])

  useEffect(() => {
    weatherParticlesRef.current = generateWeatherParticles(humidity)
  }, [humidity])

  useFrame((_, delta) => {
    if (!pointsRef.current) return

    weatherParticlesRef.current = updateWeatherParticles(weatherParticlesRef.current, delta)

    const { positions, colors, sizes } = initialBuffers
    const count = Math.min(weatherParticlesRef.current.length, MAX_WEATHER_PARTICLES)

    for (let i = 0; i < count; i++) {
      const p = weatherParticlesRef.current[i]
      positions[i * 3] = p.x
      positions[i * 3 + 1] = p.y
      positions[i * 3 + 2] = p.z
      colors[i * 3] = 0.7
      colors[i * 3 + 1] = 0.9
      colors[i * 3 + 2] = 1.0
      sizes[i] = p.size
    }

    const geometry = pointsRef.current.geometry
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute
    const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute
    const sizeAttr = geometry.getAttribute('size') as THREE.BufferAttribute

    posAttr.needsUpdate = true
    colorAttr.needsUpdate = true
    sizeAttr.needsUpdate = true

    geometry.setDrawRange(0, count)
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={MAX_WEATHER_PARTICLES}
          array={initialBuffers.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={MAX_WEATHER_PARTICLES}
          array={initialBuffers.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={MAX_WEATHER_PARTICLES}
          array={initialBuffers.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.3}
        transparent
        opacity={0.3}
        sizeAttenuation
      />
    </points>
  )
}

function GroundGrid() {
  return (
    <gridHelper
      args={[100, 100, '#2D3436', '#2D3436']}
      position={[0, 0, 0]}
    />
  )
}

interface CameraControllerProps {
  controlsRef: React.MutableRefObject<any>
}

function CameraController({ controlsRef }: CameraControllerProps) {
  const { camera } = useThree()
  const [isAnimating, setIsAnimating] = useState(false)
  const startPosRef = useRef(new THREE.Vector3())
  const startTargetRef = useRef(new THREE.Vector3())
  const startTimeRef = useRef(0)
  const ANIMATION_DURATION = 0.5

  useEffect(() => {
    const handleDoubleClick = () => {
      if (!controlsRef.current) return
      startPosRef.current.copy(camera.position)
      startTargetRef.current.copy(controlsRef.current.target)
      startTimeRef.current = performance.now()
      setIsAnimating(true)
    }

    window.addEventListener('dblclick', handleDoubleClick)
    return () => window.removeEventListener('dblclick', handleDoubleClick)
  }, [camera, controlsRef])

  useFrame(() => {
    if (!isAnimating || !controlsRef.current) return

    const elapsed = (performance.now() - startTimeRef.current) / 1000
    const t = Math.min(elapsed / ANIMATION_DURATION, 1)
    const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

    camera.position.lerpVectors(startPosRef.current, INITIAL_CAMERA_POSITION, easeT)
    controlsRef.current.target.lerpVectors(startTargetRef.current, INITIAL_CAMERA_TARGET, easeT)
    controlsRef.current.update()

    if (t >= 1) {
      setIsAnimating(false)
    }
  })

  return null
}

function SceneContent() {
  const trees = useForestStore(state => state.trees)
  const humidity = useForestStore(state => state.humidity)
  const setTrees = useForestStore(state => state.setTrees)
  const setParticleCount = useForestStore(state => state.setParticleCount)
  const envParams = useForestStore(state => state.getEnvParams())
  const controlsRef = useRef<any>(null)

  const [displayTrees, setDisplayTrees] = useState<TreeParticle[]>([])
  const [interpolationProgress, setInterpolationProgress] = useState(1)
  const [targetTemp, setTargetTemp] = useState(envParams.temperature)
  const [previousParams, setPreviousParams] = useState(envParams)
  const TRANSITION_DURATION = 1.0

  const particleSize = useMemo(() => {
    return trees.length > 80 ? 1.5 : 2.0
  }, [trees.length])

  const totalParticles = useMemo(() => {
    return trees.reduce((sum, tree) => sum + tree.particles.length, 0)
  }, [trees])

  useEffect(() => {
    setParticleCount(totalParticles)
  }, [totalParticles, setParticleCount])

  useEffect(() => {
    const paramsChanged =
      previousParams.light !== envParams.light ||
      previousParams.humidity !== envParams.humidity ||
      previousParams.temperature !== envParams.temperature

    if (paramsChanged) {
      if (
        previousParams.light !== envParams.light ||
        previousParams.humidity !== envParams.humidity
      ) {
        const newForest = generateForest(envParams, 50, 10000)
        setTrees(newForest)
      } else {
        setTargetTemp(envParams.temperature)
        setInterpolationProgress(0)
      }
      setPreviousParams(envParams)
    }
  }, [envParams, previousParams, setTrees])

  useEffect(() => {
    if (trees.length === 0) {
      const initialForest = generateForest(envParams, 50, 10000)
      setTrees(initialForest)
    }
  }, [envParams, trees.length, setTrees])

  useFrame((_, delta) => {
    if (interpolationProgress < 1) {
      const newProgress = Math.min(interpolationProgress + delta / TRANSITION_DURATION, 1)
      setInterpolationProgress(newProgress)
      setDisplayTrees(interpolateTreeColors(trees, targetTemp, newProgress))
    } else {
      setDisplayTrees(trees)
    }
  })

  return (
    <>
      <color attach="background" args={['#0B0E11']} />
      <fog attach="fog" args={['#0B0E11', 80, 150]} />

      <ambientLight intensity={0.3 + (envParams.light / 100) * 0.4} />
      <directionalLight
        position={[50, 80, 30]}
        intensity={0.5 + (envParams.light / 100) * 0.5}
        color="#FFF8E7"
      />

      <Stars radius={200} depth={50} count={2000} factor={4} fade speed={0.5} />

      <GroundGrid />
      <TreePoints trees={displayTrees} particleSize={particleSize} />
      <TreeHalo trees={displayTrees} />
      <WeatherPoints humidity={humidity} />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={20}
        maxDistance={150}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 10, 0]}
      />
      <CameraController controlsRef={controlsRef} />
    </>
  )
}

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [60, 50, 80], fov: 60, near: 0.1, far: 500 }}
      gl={{ antialias: true, alpha: false }}
      style={{
        background: 'linear-gradient(180deg, #0B0E11 0%, #1A202A 100%)',
      }}
    >
      <SceneContent />
    </Canvas>
  )
}
