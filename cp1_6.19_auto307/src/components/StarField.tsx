import { useMemo, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useStarStore, Vec3 } from '../store/starStore'

const SPECTRAL_COLORS: Record<string, string> = {
  O: '#9BB0FF',
  B: '#AAD4FF',
  A: '#FFFFFF',
  F: '#FFF9E6',
  G: '#FFE899',
  K: '#FFB366',
  M: '#FF6644',
}

const SPECTRAL_PROBS: Array<[string, number]> = [
  ['O', 0.01],
  ['B', 0.04],
  ['A', 0.12],
  ['F', 0.18],
  ['G', 0.22],
  ['K', 0.28],
  ['M', 0.15],
]

const PANEL_POSITION = new THREE.Vector3(-4.2, 3.0, -3.5)
const DOME_RADIUS = 10
const DOME_HEIGHT = 6
const TOTAL_STARS = 600

function randomSpectral(): string {
  const r = Math.random()
  let acc = 0
  for (const [t, p] of SPECTRAL_PROBS) {
    acc += p
    if (r < acc) return t
  }
  return 'G'
}

interface StarData {
  position: THREE.Vector3
  color: THREE.Color
  baseSize: number
  isNamedStar: boolean
  globalIndex: number
  spectralType: string
  brightness: number
  name?: string
  commonName?: string
  distance?: string
  constellationId?: string
}

function buildStarData(): StarData[] {
  const store = useStarStore.getState()
  const constellations = store.constellations
  const result: StarData[] = []
  let globalIdx = 0

  for (const c of constellations) {
    for (const s of c.stars) {
      const [theta, phi, radius] = s.position
      const pos = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
      )
      result.push({
        position: pos,
        color: new THREE.Color(SPECTRAL_COLORS[s.spectralType]),
        baseSize: 0.08 + 0.12 * s.brightness,
        isNamedStar: true,
        globalIndex: globalIdx,
        spectralType: s.spectralType,
        brightness: s.brightness,
        name: s.name,
        commonName: s.commonName,
        distance: s.distance,
        constellationId: c.id,
      })
      globalIdx++
    }
  }

  const namedCount = result.length
  const bgCount = TOTAL_STARS - namedCount
  const radius = 9.5

  for (let i = 0; i < bgCount; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.asin(Math.sqrt(Math.random()))
    const pos = new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    )
    const st = randomSpectral()
    const br = 0.2 + Math.random() * 0.8
    result.push({
      position: pos,
      color: new THREE.Color(SPECTRAL_COLORS[st]),
      baseSize: 0.02 + 0.06 * br,
      isNamedStar: false,
      globalIndex: globalIdx,
      spectralType: st,
      brightness: br,
    })
    globalIdx++
  }
  return result
}

interface StarsProps {
  starData: StarData[]
  statsRef?: React.MutableRefObject<{ update: () => void } | null>
}

function Stars({ starData, statsRef }: StarsProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const groupRef = useRef<THREE.Group>(null)
  const rayLineRef = useRef<THREE.Line | null>(null)

  const selectedIndex = useStarStore((s) => s.selectedStarGlobalIndex)
  const blinkIndex = useStarStore((s) => s.blinkStarIndex)
  const blinkTrigger = useStarStore((s) => s.blinkTrigger)
  const rayFrom = useStarStore((s) => s.rayFrom)
  const rayTrigger = useStarStore((s) => s.rayTrigger)
  const setSelectedStar = useStarStore((s) => s.setSelectedStar)

  const count = starData.length
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const baseColors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const s = starData[i]
      positions[i * 3] = s.position.x
      positions[i * 3 + 1] = s.position.y
      positions[i * 3 + 2] = s.position.z
      colors[i * 3] = s.color.r
      colors[i * 3 + 1] = s.color.g
      colors[i * 3 + 2] = s.color.b
      baseColors[i * 3] = s.color.r
      baseColors[i * 3 + 1] = s.color.g
      baseColors[i * 3 + 2] = s.color.b
      sizes[i] = s.baseSize
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aBaseColor', new THREE.BufferAttribute(baseColors, 3))
    return geo
  }, [starData, count])

  const [blinkStartTime, setBlinkStartTime] = useState<number | null>(null)
  const [rayStartTime, setRayStartTime] = useState<number | null>(null)
  const [currentRayFrom, setCurrentRayFrom] = useState<THREE.Vector3 | null>(null)

  useEffect(() => {
    if (blinkIndex !== null) {
      setBlinkStartTime(performance.now())
    }
  }, [blinkTrigger, blinkIndex])

  useEffect(() => {
    if (rayFrom) {
      setCurrentRayFrom(new THREE.Vector3(rayFrom[0], rayFrom[1], rayFrom[2]))
      setRayStartTime(performance.now())
    } else {
      setCurrentRayFrom(null)
      setRayStartTime(null)
    }
  }, [rayTrigger, rayFrom])

  useFrame(({ clock }) => {
    if (statsRef?.current) statsRef.current.update()

    const t = clock.getElapsedTime()
    const geo = pointsRef.current?.geometry
    if (!geo) return
    const sizeAttr = geo.getAttribute('aSize') as THREE.BufferAttribute
    const colorAttr = geo.getAttribute('color') as THREE.BufferAttribute
    const baseColorAttr = geo.getAttribute('aBaseColor') as THREE.BufferAttribute

    const now = performance.now()
    const blinkT = blinkStartTime !== null ? (now - blinkStartTime) / 1000 : -1
    const blinkDuration = 1.5

    for (let i = 0; i < count; i++) {
      const s = starData[i]
      let size = s.baseSize
      let colorR = baseColorAttr.array[i * 3] as number
      let colorG = baseColorAttr.array[i * 3 + 1] as number
      let colorB = baseColorAttr.array[i * 3 + 2] as number

      if (selectedIndex === i) {
        const pulse = 1.0 + 0.5 * Math.abs(Math.sin(t * 4))
        size = s.baseSize * 1.5 * pulse
        colorR = Math.min(1, colorR * 2.0)
        colorG = Math.min(1, colorG * 1.8)
        colorB = Math.min(1, colorB * 1.2)
      }

      if (blinkIndex === i && blinkT >= 0 && blinkT < blinkDuration) {
        const phase = Math.floor(blinkT / 0.25) % 2
        const alpha = phase === 0 ? 1.0 : 0.3
        colorR *= alpha
        colorG *= alpha
        colorB *= alpha
      }

      sizeAttr.array[i] = size
      colorAttr.array[i * 3] = colorR
      colorAttr.array[i * 3 + 1] = colorG
      colorAttr.array[i * 3 + 2] = colorB
    }
    sizeAttr.needsUpdate = true
    colorAttr.needsUpdate = true
  })

  useEffect(() => {
    if (!currentRayFrom || !groupRef.current) {
      if (rayLineRef.current && groupRef.current) {
        groupRef.current.remove(rayLineRef.current)
      }
      if (rayLineRef.current) {
        rayLineRef.current.geometry.dispose()
        ;(rayLineRef.current.material as THREE.Material).dispose()
        rayLineRef.current = null
      }
      return
    }

    const SEG = 40
    const positions = new Float32Array((SEG + 1) * 3)
    const colors = new Float32Array((SEG + 1) * 3)
    const start = currentRayFrom
    const end = PANEL_POSITION
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG
      const pu = Math.pow(u, 0.6)
      const x = start.x + (end.x - start.x) * pu + Math.sin(u * Math.PI) * 0.5
      const y = start.y + (end.y - start.y) * pu + Math.sin(u * Math.PI) * 1.0
      const z = start.z + (end.z - start.z) * pu
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      const fade = 1.0 - u
      colors[i * 3] = 1.0 * fade
      colors[i * 3 + 1] = 0.843 * fade
      colors[i * 3 + 2] = 0.0 * fade
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      linewidth: 2,
    })
    const line = new THREE.Line(g, mat)
    line.userData.rayStart = rayStartTime ?? performance.now()
    groupRef.current.add(line)
    rayLineRef.current = line

    return () => {
      if (groupRef.current && rayLineRef.current) {
        groupRef.current.remove(rayLineRef.current)
      }
      if (line) {
        line.geometry.dispose()
        mat.dispose()
      }
    }
  }, [rayTrigger, currentRayFrom])

  useFrame(() => {
    const line = rayLineRef.current
    if (!line) return
    const mat = line.material as THREE.LineBasicMaterial
    const now = performance.now()
    const startT = (line.userData.rayStart as number) || now
    const elapsed = (now - startT) / 1000
    const duration = 1.5
    if (elapsed >= duration) {
      mat.opacity = 0
      return
    }
    let op = 1.0
    if (elapsed > duration * 0.6) {
      op = 1.0 - (elapsed - duration * 0.6) / (duration * 0.4)
    }
    const dashProgress = Math.min(1, elapsed / (duration * 0.8))
    const geo = line.geometry
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute
    const colAttr = geo.getAttribute('color') as THREE.BufferAttribute
    const total = posAttr.count
    const activeIdx = Math.floor(dashProgress * (total - 1))
    for (let i = 0; i < total; i++) {
      const fade = i <= activeIdx ? 1.0 - (i / activeIdx) * 0.9 : 0
      colAttr.array[i * 3 + 3 + 0] = i > activeIdx ? 0 : colAttr.array[i * 3 + 0] * fade
      const idxR = i * 3
      if (i > activeIdx) {
        colAttr.array[idxR] = 0
        colAttr.array[idxR + 1] = 0
        colAttr.array[idxR + 2] = 0
      } else {
        const localFade = 1.0 - (activeIdx - i) / Math.max(1, activeIdx)
        colAttr.array[idxR] = 1.0 * localFade * op
        colAttr.array[idxR + 1] = 0.843 * localFade * op
        colAttr.array[idxR + 2] = 0 * localFade
      }
    }
    colAttr.needsUpdate = true
    mat.opacity = op
  })

  const handlePointerDown = (e: any) => {
    if (e.button !== 0) return
    e.stopPropagation()
    const intersects = e.intersections as Array<{ index: number; point: THREE.Vector3 }>
    if (!intersects || intersects.length === 0) return
    const hit = intersects[0]
    if (hit.index === undefined) return
    const idx = hit.index
    const pos = starData[idx].position
    setSelectedStar(idx, [pos.x, pos.y, pos.z])
  }

  return (
    <group ref={groupRef}>
      <points
        ref={pointsRef}
        geometry={geometry}
        onPointerDown={handlePointerDown}
      >
        <pointsMaterial
          size={0.1}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.98}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

function Dome() {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(DOME_RADIUS, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2)
    return g
  }, [])
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial
        color="#C8C8D0"
        transparent
        opacity={0.08}
        side={THREE.BackSide}
        roughness={1}
        metalness={0}
      />
    </mesh>
  )
}

function GroundGrid() {
  const size = DOME_RADIUS * 2
  const div = 20
  return (
    <gridHelper
      args={[size, div, '#E8E8E8', '#3A3A4A']}
      position={[0, 0.01, 0]}
    >
      <meshBasicMaterial attach="material" color="#E8E8E8" transparent opacity={0.35} />
    </gridHelper>
  )
}

function GlowGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
      <circleGeometry args={[DOME_RADIUS, 64]} />
      <meshBasicMaterial color="#0F172A" transparent opacity={0.6} />
    </mesh>
  )
}

interface CameraControllerProps {
  controlsRef: React.MutableRefObject<any>
}

function CameraController({ controlsRef }: CameraControllerProps) {
  const { camera } = useThree()
  const flyToTarget = useStarStore((s) => s.flyToTarget)
  const flyToLookAt = useStarStore((s) => s.flyToLookAt)
  const isFlying = useStarStore((s) => s.isFlying)
  const setFlyComplete = useStarStore((s) => s.setFlyComplete)

  const flyStartRef = useRef<{
    startTime: number
    fromPos: THREE.Vector3
    fromTarget: THREE.Vector3
    toPos: THREE.Vector3
    toTarget: THREE.Vector3
  } | null>(null)

  useEffect(() => {
    if (isFlying && flyToTarget && flyToLookAt) {
      flyStartRef.current = {
        startTime: performance.now(),
        fromPos: camera.position.clone(),
        fromTarget: controlsRef.current?.target
          ? controlsRef.current.target.clone()
          : new THREE.Vector3(0, 2, 0),
        toPos: new THREE.Vector3(flyToTarget[0], flyToTarget[1], flyToTarget[2]),
        toTarget: new THREE.Vector3(flyToLookAt[0], flyToLookAt[1], flyToLookAt[2]),
      }
      if (controlsRef.current) {
        controlsRef.current.enabled = false
      }
    }
  }, [isFlying, flyToTarget, flyToLookAt])

  useFrame(() => {
    const fly = flyStartRef.current
    if (!fly) return
    const elapsed = (performance.now() - fly.startTime) / 1000
    const duration = 2.0
    if (elapsed >= duration) {
      camera.position.copy(fly.toPos)
      if (controlsRef.current) {
        controlsRef.current.target.copy(fly.toTarget)
        controlsRef.current.enabled = true
        controlsRef.current.update()
      }
      flyStartRef.current = null
      setFlyComplete()
      return
    }
    const t = elapsed / duration
    const eased = 1 - Math.pow(1 - t, 3)
    camera.position.lerpVectors(fly.fromPos, fly.toPos, eased)
    if (controlsRef.current) {
      controlsRef.current.target.lerpVectors(fly.fromTarget, fly.toTarget, eased)
      controlsRef.current.update()
    }
  })

  return null
}

interface SceneProps {
  statsRef?: React.MutableRefObject<{ update: () => void } | null>
}

export default function StarField({ statsRef }: SceneProps) {
  const controlsRef = useRef<any>(null)
  const loaded = useStarStore((s) => s.constellationsLoaded)
  const loadConstellations = useStarStore((s) => s.loadConstellations)

  const [starData, setStarData] = useState<StarData[] | null>(null)

  useEffect(() => {
    if (!loaded) {
      loadConstellations().then(() => {})
    }
  }, [loaded, loadConstellations])

  useEffect(() => {
    if (loaded) {
      const d = buildStarData()
      setStarData(d)
    }
  }, [loaded])

  return (
    <Canvas
      camera={{ position: [0, 3, 6], fov: 60, near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: 'linear-gradient(180deg, #050913 0%, #0F172A 50%, #16213E 100%)' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0F172A')
      }}
    >
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 8, 0]} intensity={0.25} color="#C9A96E" />
      <Dome />
      <GlowGround />
      <GroundGrid />
      {starData && <Stars starData={starData} statsRef={statsRef} />}
      <OrbitControls
        ref={controlsRef}
        enablePan
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        panSpeed={0.6}
        zoomSpeed={0.8}
        minDistance={2}
        maxDistance={18}
        maxPolarAngle={Math.PI / 2 + 0.05}
        target={[0, 2, 0]}
      />
      <CameraController controlsRef={controlsRef} />
    </Canvas>
  )
}
