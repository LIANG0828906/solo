import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../store/useAppStore'

const PARTICLE_COUNT = 15000

export default function ParticleScene() {
  const pointsRef = useRef<THREE.Points>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const coreGlowRef = useRef<THREE.Mesh>(null)
  const trajectoryLineRef = useRef<THREE.Line>(null)
  const pulseGroupRef = useRef<THREE.Group>(null)
  
  const { scene } = useThree()
  
  const particles = useAppStore((state) => state.particles)
  const trajectory = useAppStore((state) => state.trajectory)
  const showTrajectory = useAppStore((state) => state.showTrajectory)
  const mode = useAppStore((state) => state.mode)
  const pulseWaves = useAppStore((state) => state.pulseWaves)
  const initParticles = useAppStore((state) => state.initParticles)
  const updateParticles = useAppStore((state) => state.updateParticles)
  const addHistoryPoint = useAppStore((state) => state.addHistoryPoint)
  const addTrajectoryPoint = useAppStore((state) => state.addTrajectoryPoint)
  const setMode = useAppStore((state) => state.setMode)
  const setFps = useAppStore((state) => state.setFps)
  const addPulseWave = useAppStore((state) => state.addPulseWave)
  const updatePulseWaves = useAppStore((state) => state.updatePulseWaves)
  const addEventMarker = useAppStore((state) => state.addEventMarker)
  const updateEventMarkers = useAppStore((state) => state.updateEventMarkers)
  const history = useAppStore((state) => state.history)

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const col = new Float32Array(PARTICLE_COUNT * 3)
    return [pos, col]
  }, [])

  useEffect(() => {
    initParticles(PARTICLE_COUNT)
  }, [initParticles])

  const bgColorRef = useRef(new THREE.Color('#0A0E27'))
  const targetBgColorRef = useRef(new THREE.Color('#0A0E27'))

  useEffect(() => {
    if (mode === 'focus') {
      targetBgColorRef.current.set('#1A0A2E')
    } else if (mode === 'diverge') {
      targetBgColorRef.current.set('#2E0A0A')
    } else {
      targetBgColorRef.current.set('#0A0E27')
    }
  }, [mode])

  const frameCountRef = useRef(0)
  const fpsTimeRef = useRef(performance.now())
  const metricsTimeRef = useRef(0)
  const lastMetricsRef = useRef({ focus: 0.5, emotion: 0.5, transition: 0.3 })
  const peakCheckTimeRef = useRef(0)

  useFrame((_state, delta) => {
    const now = performance.now()
    
    frameCountRef.current++
    if (now - fpsTimeRef.current >= 1000) {
      setFps(Math.round(frameCountRef.current * 1000 / (now - fpsTimeRef.current)))
      frameCountRef.current = 0
      fpsTimeRef.current = now
    }

    bgColorRef.current.lerp(targetBgColorRef.current, delta * 0.5)
    scene.background = bgColorRef.current

    metricsTimeRef.current += delta
    if (metricsTimeRef.current >= 1 / 30) {
      metricsTimeRef.current = 0
      
      const t = now / 1000
      const focus = 0.5 + 0.3 * Math.sin(t * 0.1) + 0.1 * Math.sin(t * 0.37)
      const emotion = 0.5 + 0.3 * Math.sin(t * 0.15 + 1) + 0.15 * Math.sin(t * 0.42)
      const transition = 0.3 + 0.2 * Math.sin(t * 0.2 + 2) + 0.1 * Math.sin(t * 0.53)
      
      const clampedFocus = Math.max(0, Math.min(1, focus))
      const clampedEmotion = Math.max(0, Math.min(1, emotion))
      const clampedTransition = Math.max(0, Math.min(1, transition))

      const prev = lastMetricsRef.current
      const focusChange = Math.abs(clampedFocus - prev.focus)
      const emotionChange = Math.abs(clampedEmotion - prev.emotion)
      const transitionChange = Math.abs(clampedTransition - prev.transition)

      if (focusChange > 0.2) {
        addEventMarker({
          timestamp: now,
          duration: 3,
          type: 'focus',
          value: clampedFocus,
        })
        addPulseWave({
          timestamp: now,
          duration: 0.8,
          color: '#4FC3F7',
          direction: { x: 1, y: 0.3, z: 0.5 },
        })
      }
      if (emotionChange > 0.2) {
        addEventMarker({
          timestamp: now,
          duration: 3,
          type: 'emotion',
          value: clampedEmotion,
        })
        addPulseWave({
          timestamp: now,
          duration: 0.8,
          color: '#FF7043',
          direction: { x: -0.5, y: 0.2, z: 1 },
        })
      }
      if (transitionChange > 0.2) {
        addEventMarker({
          timestamp: now,
          duration: 3,
          type: 'transition',
          value: clampedTransition,
        })
        addPulseWave({
          timestamp: now,
          duration: 0.8,
          color: '#81C784',
          direction: { x: 0.3, y: -0.5, z: -0.8 },
        })
      }

      lastMetricsRef.current = { focus: clampedFocus, emotion: clampedEmotion, transition: clampedTransition }

      addHistoryPoint({
        timestamp: now,
        focus: clampedFocus,
        emotion: clampedEmotion,
        transition: clampedTransition,
      })

      const recentHistory = history.filter(h => now - h.timestamp <= 10000)
      if (recentHistory.length > 0) {
        const avgFocus = recentHistory.reduce((sum, h) => sum + h.focus, 0) / recentHistory.length
        if (avgFocus > 0.6 && mode !== 'focus') {
          setMode('focus')
        } else if (avgFocus < 0.3 && mode !== 'diverge') {
          setMode('diverge')
        } else if (avgFocus >= 0.3 && avgFocus <= 0.6 && mode !== 'default') {
          setMode('default')
        }
      }

      peakCheckTimeRef.current += 1 / 30
      if (peakCheckTimeRef.current >= 1) {
        peakCheckTimeRef.current = 0
        
        const last5Sec = history.filter(h => now - h.timestamp <= 5000)
        if (last5Sec.length > 0) {
          const maxEmotion = Math.max(...last5Sec.map(h => h.emotion))
          const latestPoint = last5Sec[last5Sec.length - 1]
          
          if (latestPoint.emotion >= maxEmotion * 0.95) {
            const avgPos = particles.reduce(
              (acc, p) => ({
                x: acc.x + p.x / particles.length,
                y: acc.y + p.y / particles.length,
                z: acc.z + p.z / particles.length,
              }),
              { x: 0, y: 0, z: 0 }
            )

            let label = '波动思考'
            if (latestPoint.focus > 0.7) label = '深度沉浸'
            else if (latestPoint.focus < 0.3) label = '游离发散'

            const lastTraj = trajectory[trajectory.length - 1]
            if (!lastTraj || now - lastTraj.timestamp > 3000) {
              addTrajectoryPoint({
                timestamp: now,
                position: avgPos,
                focus: latestPoint.focus,
                emotion: latestPoint.emotion,
                transition: latestPoint.transition,
                label,
              })
            }
          }
        }
      }

      updateParticles(1 / 30, clampedFocus, clampedEmotion, clampedTransition, mode)
    }

    if (pointsRef.current && particles.length > 0) {
      const positionsAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
      const colorsAttr = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute
      
      for (let i = 0; i < Math.min(particles.length, PARTICLE_COUNT); i++) {
        const p = particles[i]
        positionsAttr.setXYZ(i, p.x, p.y, p.z)
        
        const color = new THREE.Color(p.color)
        colorsAttr.setXYZ(i, color.r, color.g, color.b)
      }
      positionsAttr.needsUpdate = true
      colorsAttr.needsUpdate = true
    }

    if (coreRef.current) {
      const scale = 1 + Math.sin(now * 0.002) * 0.05
      coreRef.current.scale.setScalar(scale)
    }
    if (coreGlowRef.current) {
      const glowScale = 1.2 + Math.sin(now * 0.003) * 0.1
      coreGlowRef.current.scale.setScalar(glowScale)
      const mat = coreGlowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.3 + Math.sin(now * 0.003) * 0.1
    }

    updatePulseWaves(delta)
    updateEventMarkers(delta)

    if (pulseGroupRef.current) {
      while (pulseGroupRef.current.children.length > pulseWaves.length) {
        pulseGroupRef.current.remove(pulseGroupRef.current.children[0])
      }
      while (pulseGroupRef.current.children.length < pulseWaves.length) {
        const ringGeo = new THREE.RingGeometry(0.5, 0.6, 32)
        const ringMat = new THREE.MeshBasicMaterial({
          color: '#ffffff',
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
        })
        const ring = new THREE.Mesh(ringGeo, ringMat)
        pulseGroupRef.current.add(ring)
      }

      pulseWaves.forEach((wave, i) => {
        const ring = pulseGroupRef.current?.children[i] as THREE.Mesh
        if (ring) {
          const progress = (now - wave.timestamp) / (wave.duration * 1000)
          const scale = 0.5 + progress * 5
          ring.scale.setScalar(scale)
          
          const mat = ring.material as THREE.MeshBasicMaterial
          mat.color.set(wave.color)
          mat.opacity = Math.max(0, 0.8 * (1 - progress))
          
          const dir = new THREE.Vector3(wave.direction.x, wave.direction.y, wave.direction.z).normalize()
          ring.position.copy(dir.multiplyScalar(scale * 0.5))
          ring.lookAt(dir.multiplyScalar(2))
        }
      })
    }

    if (trajectoryLineRef.current && showTrajectory && trajectory.length > 1) {
      const points = trajectory.map(t => new THREE.Vector3(t.position.x, t.position.y, t.position.z))
      const curve = new THREE.CatmullRomCurve3(points)
      const curvePoints = curve.getPoints(100)
      const positions = new Float32Array(curvePoints.length * 3)
      
      curvePoints.forEach((p, i) => {
        positions[i * 3] = p.x
        positions[i * 3 + 1] = p.y
        positions[i * 3 + 2] = p.z
      })
      
      const geometry = trajectoryLineRef.current.geometry
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.attributes.position.needsUpdate = true
    }

  })

  const gridColor = useMemo(() => {
    if (mode === 'focus') return '#AAAAAA'
    if (mode === 'diverge') return '#333333'
    return '#555555'
  }, [mode])

  return (
    <>
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={20}
        makeDefault
      />
      
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      
      <gridHelper
        args={[20, 20, gridColor, gridColor]}
        position={[0, -2, 0]}
      />

      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={PARTICLE_COUNT}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.15}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <mesh ref={coreRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={0.8}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      <mesh ref={coreGlowRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial
          color="#FFD700"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      <group ref={pulseGroupRef} />

      {showTrajectory && trajectory.length > 1 && (
        <line ref={trajectoryLineRef as any}>
          <bufferGeometry />
          <lineBasicMaterial
            color="#1E90FF"
            transparent
            opacity={0.6}
            linewidth={2}
          />
        </line>
      )}
    </>
  )
}
