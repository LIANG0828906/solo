import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { useWeatherStore, WeatherType } from '../store/weatherStore'

interface ParticleData {
  basePos: THREE.Vector3
  size: number
  phase: number
  speed: number
  colorOffset: number
}

const MAX_PARTICLES = 3000

const weatherConfig: Record<WeatherType, { color: string; emissive: string }> = {
  sunny: { color: '#6BCB77', emissive: '#2E7D32' },
  cloudy: { color: '#90A955', emissive: '#4A5568' },
  rainy: { color: '#4FC3F7', emissive: '#0288D1' },
  snowy: { color: '#E0E7FF', emissive: '#6366F1' },
}

function generateParticles(count: number): ParticleData[] {
  const particles: ParticleData[] = []
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const radius = Math.pow(Math.random(), 0.6) * 6
    particles.push({
      basePos: new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta) * 0.8,
        radius * Math.cos(phi)
      ),
      size: 0.04 + Math.random() * 0.12,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.7,
      colorOffset: Math.random() * 0.3 - 0.15,
    })
  }
  return particles
}

function Particles() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tempColor = useMemo(() => new THREE.Color(), [])

  const currentWeather = useWeatherStore((s) => s.currentWeather)
  const targetDensity = useWeatherStore((s) => s.particleDensity)
  const windSpeed = useWeatherStore((s) => s.windSpeed)

  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [nearbyIds, setNearbyIds] = useState<Set<number>>(new Set())

  const particlesRef = useRef<ParticleData[]>(generateParticles(MAX_PARTICLES))
  const currentDensityRef = useRef(targetDensity)
  const densityTransitionRef = useRef({
    start: 2000,
    target: 2000,
    progress: 1,
    startTime: 0,
  })
  const colorTransitionRef = useRef({
    fromColor: new THREE.Color(weatherConfig.sunny.color),
    fromEmissive: new THREE.Color(weatherConfig.sunny.emissive),
    toColor: new THREE.Color(weatherConfig.sunny.color),
    toEmissive: new THREE.Color(weatherConfig.sunny.emissive),
    progress: 1,
    startTime: 0,
  })
  const currentWeatherRef = useRef(currentWeather)

  useEffect(() => {
    if (currentWeatherRef.current !== currentWeather) {
      const fromConfig = weatherConfig[currentWeatherRef.current]
      const toConfig = weatherConfig[currentWeather]
      colorTransitionRef.current = {
        fromColor: new THREE.Color(fromConfig.color),
        fromEmissive: new THREE.Color(fromConfig.emissive),
        toColor: new THREE.Color(toConfig.color),
        toEmissive: new THREE.Color(toConfig.emissive),
        progress: 0,
        startTime: performance.now(),
      }
      currentWeatherRef.current = currentWeather
    }
  }, [currentWeather])

  useEffect(() => {
    if (currentDensityRef.current !== targetDensity) {
      densityTransitionRef.current = {
        start: currentDensityRef.current,
        target: targetDensity,
        progress: 0,
        startTime: performance.now(),
      }
    }
  }, [targetDensity])

  const handlePointerMove = (e: any) => {
    e.stopPropagation()
    if (e.instanceId !== undefined && e.instanceId < currentDensityRef.current) {
      const id = e.instanceId
      setHoveredId(id)
      const nearby = new Set<number>()
      const particles = particlesRef.current
      const hoveredPos = particles[id].basePos
      for (let i = 0; i < Math.floor(currentDensityRef.current); i++) {
        if (i === id) continue
        const dist = particles[i].basePos.distanceTo(hoveredPos)
        if (dist < 1.2) {
          nearby.add(i)
        }
      }
      setNearbyIds(nearby)
    }
  }

  const handlePointerOut = () => {
    setHoveredId(null)
    setNearbyIds(new Set())
  }

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return

    const now = performance.now()
    const time = state.clock.elapsedTime

    const colorTrans = colorTransitionRef.current
    if (colorTrans.progress < 1) {
      colorTrans.progress = Math.min(1, (now - colorTrans.startTime) / 2000)
    }
    const t = colorTrans.progress
    const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

    const densityTrans = densityTransitionRef.current
    if (densityTrans.progress < 1) {
      densityTrans.progress = Math.min(1, (now - densityTrans.startTime) / 1000)
      const eased = 1 - Math.pow(1 - densityTrans.progress, 3)
      currentDensityRef.current =
        densityTrans.start + (densityTrans.target - densityTrans.start) * eased
    }

    const currentCount = Math.floor(currentDensityRef.current)
    mesh.count = currentCount

    const windAmplitude = windSpeed * 0.25
    const windFrequency = 0.3 + windSpeed * 0.12

    const baseColor = new THREE.Color().lerpColors(
      colorTrans.fromColor,
      colorTrans.toColor,
      easedT
    )
    const emissiveColor = new THREE.Color().lerpColors(
      colorTrans.fromEmissive,
      colorTrans.toEmissive,
      easedT
    )

    const material = mesh.material as THREE.MeshStandardMaterial
    material.emissive.copy(emissiveColor)

    const particles = particlesRef.current

    for (let i = 0; i < currentCount; i++) {
      const p = particles[i]
      const densityFactor =
        densityTrans.progress < 1
          ? Math.min(1, i / Math.max(densityTrans.target, densityTrans.start))
          : 1

      let px = p.basePos.x
      let py = p.basePos.y
      let pz = p.basePos.z

      const scale = p.size
      const rotX = time * p.speed * 0.4 + p.phase
      const rotY = time * p.speed * 0.25 + p.phase * 1.3
      let rotZ = 0

      const breathe = Math.sin(time * 1.2 + p.phase) * 0.03

      switch (currentWeatherRef.current) {
        case 'sunny':
          py += breathe
          break
        case 'cloudy':
          px += Math.sin(time * windFrequency + p.phase) * windAmplitude * 0.6
          py += breathe * 0.5
          break
        case 'rainy':
          py += Math.sin(time * 10 + p.phase * 2.5) * 0.12
          px += Math.sin(time * windFrequency + p.phase) * windAmplitude * 0.4
          break
        case 'snowy':
          const fallSpeed = 0.5 + windSpeed * 0.08
          py = p.basePos.y - ((time * fallSpeed + p.phase * 3) % 12 - 6)
          px += Math.sin(time * windFrequency * 0.4 + p.phase) * windAmplitude * 1.2
          rotZ = time * p.speed * 0.8 + p.phase
          break
      }

      if (densityTrans.progress < 1) {
        px = px * densityFactor
        py = py * densityFactor
        pz = pz * densityFactor
      }

      let finalScale = scale
      const particleColor = tempColor.copy(baseColor)
      particleColor.offsetHSL(0, 0, p.colorOffset)

      if (hoveredId === i) {
        finalScale *= 1.6
        particleColor.set('#ffffff')
      } else if (nearbyIds.has(i)) {
        finalScale *= 1.2
        particleColor.multiplyScalar(1.3)
      }

      dummy.position.set(px, py, pz)
      dummy.rotation.set(rotX, rotY, rotZ)
      dummy.scale.setScalar(finalScale)
      dummy.updateMatrix()

      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, particleColor)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true
    }
  })

  const opacity =
    currentWeather === 'rainy' ? 0.65 : currentWeather === 'snowy' ? 0.9 : 1

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, MAX_PARTICLES]}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      castShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#ffffff"
        vertexColors
        transparent={opacity < 1}
        opacity={opacity}
        metalness={0.1}
        roughness={0.8}
      />
    </instancedMesh>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[8, 8, 8]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-8, 4, -8]} intensity={0.6} color="#6366F1" />
      <pointLight position={[0, -5, 5]} intensity={0.4} color="#4FC3F7" />
      <Particles />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={15}
        enablePan={false}
      />
      <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
    </>
  )
}

export default function ParticleForest() {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 55 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#0A0A0A']} />
      <fog attach="fog" args={['#0A0A0A', 12, 25]} />
      <Scene />
    </Canvas>
  )
}
