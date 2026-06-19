import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCrystalStore } from './store'

interface CrystalVertexData {
  basePos: THREE.Vector3
  direction: THREE.Vector3
  faceIndex: number
  impuritySeed: number
}

function buildCrystalBase(segments: number): CrystalVertexData[] {
  const data: CrystalVertexData[] = []
  const topVerts: THREE.Vector3[] = []
  const bottomVerts: THREE.Vector3[] = []

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const x = Math.cos(angle)
    const z = Math.sin(angle)
    topVerts.push(new THREE.Vector3(x, 1, z))
    bottomVerts.push(new THREE.Vector3(x, -1, z))
  }

  const topCenter = new THREE.Vector3(0, 1, 0)
  const bottomCenter = new THREE.Vector3(0, -1, 0)

  for (let i = 0; i < segments; i++) {
    const a = topVerts[i]
    const b = topVerts[(i + 1) % segments]
    const c = bottomVerts[(i + 1) % segments]
    const d = bottomVerts[i]
    const faceIdx = i

    data.push({ basePos: a.clone(), direction: a.clone().normalize(), faceIndex: faceIdx, impuritySeed: Math.random() })
    data.push({ basePos: b.clone(), direction: b.clone().normalize(), faceIndex: faceIdx, impuritySeed: Math.random() })
    data.push({ basePos: c.clone(), direction: c.clone().normalize(), faceIndex: faceIdx, impuritySeed: Math.random() })

    data.push({ basePos: a.clone(), direction: a.clone().normalize(), faceIndex: faceIdx, impuritySeed: Math.random() })
    data.push({ basePos: c.clone(), direction: c.clone().normalize(), faceIndex: faceIdx, impuritySeed: Math.random() })
    data.push({ basePos: d.clone(), direction: d.clone().normalize(), faceIndex: faceIdx, impuritySeed: Math.random() })
  }

  for (let i = 0; i < segments; i++) {
    const a = topVerts[i]
    const b = topVerts[(i + 1) % segments]
    data.push({ basePos: topCenter.clone(), direction: new THREE.Vector3(0, 1, 0), faceIndex: segments, impuritySeed: Math.random() })
    data.push({ basePos: a.clone(), direction: new THREE.Vector3(0, 1, 0), faceIndex: segments, impuritySeed: Math.random() })
    data.push({ basePos: b.clone(), direction: new THREE.Vector3(0, 1, 0), faceIndex: segments, impuritySeed: Math.random() })
  }

  for (let i = 0; i < segments; i++) {
    const a = bottomVerts[i]
    const b = bottomVerts[(i + 1) % segments]
    data.push({ basePos: bottomCenter.clone(), direction: new THREE.Vector3(0, -1, 0), faceIndex: segments + 1, impuritySeed: Math.random() })
    data.push({ basePos: b.clone(), direction: new THREE.Vector3(0, -1, 0), faceIndex: segments + 1, impuritySeed: Math.random() })
    data.push({ basePos: a.clone(), direction: new THREE.Vector3(0, -1, 0), faceIndex: segments + 1, impuritySeed: Math.random() })
  }

  return data
}

const IDEAL_LIGHT = new THREE.Color('#4FC3F7')
const IDEAL_DARK = new THREE.Color('#01579B')
const IMPURITY_LIGHT = new THREE.Color('#AB47BC')
const IMPURITY_DARK = new THREE.Color('#6A1B9A')

function mixColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  return a.clone().lerp(b, t)
}

function computeVertexColor(
  vertex: CrystalVertexData,
  temperature: number,
  concentration: number,
  impurity: number
): THREE.Color {
  const tempFactor = (temperature - 100) / 900
  const heightFactor = (vertex.basePos.y + 1) / 2

  const baseIdeal = mixColor(IDEAL_DARK, IDEAL_LIGHT, 0.3 + heightFactor * 0.4 + tempFactor * 0.3)
  const baseImpurity = mixColor(IMPURITY_DARK, IMPURITY_LIGHT, 0.4 + vertex.impuritySeed * 0.6)

  const noise = (Math.sin(vertex.basePos.x * 3 + vertex.faceIndex * 0.7) +
    Math.cos(vertex.basePos.z * 2.5 + vertex.faceIndex * 1.1) +
    Math.sin(vertex.basePos.y * 4)) * 0.5 + 0.5

  const impurityThreshold = 1 - (impurity / 100) * 0.8
  const isImpurity = noise > impurityThreshold - vertex.impuritySeed * (impurity / 200)
  const impurityAmount = isImpurity ? Math.min(1, (impurity / 100) * 0.9 + vertex.impuritySeed * 0.3) : 0

  const final = mixColor(baseIdeal, baseImpurity, impurityAmount)
  const brightness = 0.85 + concentration * 0.1
  final.multiplyScalar(brightness)
  return final
}

function CrystalScene() {
  const meshRef = useRef<THREE.Mesh>(null)
  const geometryRef = useRef<THREE.BufferGeometry | null>(null)
  const vertexDataRef = useRef<CrystalVertexData[]>([])
  const hexGroupRef = useRef<THREE.Group>(null)
  const atomsRef = useRef<THREE.Points>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const rippleRef = useRef<THREE.Mesh>(null)
  const rippleTimeRef = useRef(0)
  const rippleActiveRef = useRef(false)
  const particleDataRef = useRef<{ pos: THREE.Vector3; vel: THREE.Vector3; life: number; maxLife: number }[]>([])
  const atomDataRef = useRef<{ basePos: THREE.Vector3; phase: number; speed: number }[]>([])
  const lastStageRef = useRef(-1)
  const particleSpawnTimer = useRef(0)
  const rotationRef = useRef(0)

  const temperature = useCrystalStore((s) => s.temperature)
  const concentration = useCrystalStore((s) => s.concentration)
  const impurity = useCrystalStore((s) => s.impurity)
  const progress = useCrystalStore((s) => s.progress)
  const lastStageTriggered = useCrystalStore((s) => s.lastStageTriggered)

  const SEGMENTS = 12

  const { baseGeometry, vertexData, atomPositions } = useMemo(() => {
    const vData = buildCrystalBase(SEGMENTS)
    const positions = new Float32Array(vData.length * 3)
    const colors = new Float32Array(vData.length * 3)
    vData.forEach((v, i) => {
      positions[i * 3] = v.basePos.x
      positions[i * 3 + 1] = v.basePos.y
      positions[i * 3 + 2] = v.basePos.z
      colors[i * 3] = 0.3
      colors[i * 3 + 1] = 0.76
      colors[i * 3 + 2] = 0.97
    })
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geom.computeVertexNormals()

    const atomPos: THREE.Vector3[] = []
    for (let i = 0; i < 40; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 0.3 + Math.random() * 0.5
      atomPos.push(
        new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        )
      )
    }

    return { baseGeometry: geom, vertexData: vData, atomPositions: atomPos }
  }, [])

  useEffect(() => {
    vertexDataRef.current = vertexData
    geometryRef.current = baseGeometry

    atomDataRef.current = atomPositions.map((p) => ({
      basePos: p.clone(),
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5
    }))
  }, [baseGeometry, vertexData, atomPositions])

  useEffect(() => {
    const handler = () => {
      rippleTimeRef.current = 0
      rippleActiveRef.current = true
    }
    window.addEventListener('crystal-stage-trigger', handler)
    return () => window.removeEventListener('crystal-stage-trigger', handler)
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current || !geometryRef.current) return

    rotationRef.current += delta * 0.15
    meshRef.current.rotation.y = rotationRef.current
    if (hexGroupRef.current) {
      hexGroupRef.current.rotation.y = -rotationRef.current * 0.8
    }

    const posAttr = geometryRef.current.getAttribute('position') as THREE.BufferAttribute
    const colorAttr = geometryRef.current.getAttribute('color') as THREE.BufferAttribute
    const positions = posAttr.array as Float32Array
    const colors = colorAttr.array as Float32Array

    const growthScale = 0.15 + progress * 1.5
    const tempEffect = 0.85 + ((temperature - 100) / 900) * 0.3
    const concEffect = 0.7 + concentration * 0.3
    const impurityEffect = 1 - (impurity / 100) * 0.25

    for (let i = 0; i < vertexDataRef.current.length; i++) {
      const v = vertexDataRef.current[i]
      const dirJitter = (v.impuritySeed - 0.5) * (impurity / 100) * 0.3
      const scale = growthScale * tempEffect * concEffect * impurityEffect
      const noiseScale = 1 + Math.sin(v.faceIndex * 1.3 + state.clock.elapsedTime * 0.3) * 0.03 * progress

      const px = v.basePos.x * (1 + dirJitter * 0.3) * scale * noiseScale
      const py = v.basePos.y * (1 + Math.abs(v.basePos.y) * (concentration - 1) * 0.15) * scale * noiseScale
      const pz = v.basePos.z * (1 - dirJitter * 0.3) * scale * noiseScale

      positions[i * 3] = px
      positions[i * 3 + 1] = py
      positions[i * 3 + 2] = pz

      const col = computeVertexColor(v, temperature, concentration, impurity)
      colors[i * 3] = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b
    }

    posAttr.needsUpdate = true
    colorAttr.needsUpdate = true
    geometryRef.current.computeVertexNormals()

    if (hexGroupRef.current) {
      const hexRadius = 1.2 + growthScale * 1.0
      hexGroupRef.current.scale.set(hexRadius, hexRadius, hexRadius)
      hexGroupRef.current.children.forEach((c, idx) => {
        const line = c as THREE.Line
        const mat = line.material as THREE.LineBasicMaterial
        mat.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 0.8 + idx) * 0.1
      })
    }

    if (atomsRef.current) {
      const pts = atomsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
      const arr = pts.array as Float32Array
      atomDataRef.current.forEach((a, i) => {
        const flicker = 0.85 + Math.sin(state.clock.elapsedTime * a.speed + a.phase) * 0.15
        arr[i * 3] = a.basePos.x * growthScale * flicker
        arr[i * 3 + 1] = a.basePos.y * growthScale * flicker
        arr[i * 3 + 2] = a.basePos.z * growthScale * flicker
      })
      pts.needsUpdate = true
      const col = atomsRef.current.material as THREE.PointsMaterial
      col.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.2
      col.size = 0.04 + concentration * 0.02
    }

    if (rippleRef.current) {
      const rippleMat = rippleRef.current.material as THREE.MeshBasicMaterial
      if (rippleActiveRef.current) {
        rippleTimeRef.current += delta
        const t = rippleTimeRef.current / 1.5
        if (t >= 1) {
          rippleActiveRef.current = false
          rippleMat.opacity = 0
        } else {
          const scale = t * 2
          rippleRef.current.scale.set(scale, scale, scale)
          rippleMat.opacity = 0.6 * (1 - t)
        }
      }
    }

    particleSpawnTimer.current += delta
    if (particleSpawnTimer.current > 0.3 && progress > 0.1) {
      particleSpawnTimer.current = 0
      const spawnCount = Math.floor(1 + (impurity / 50))
      for (let i = 0; i < spawnCount; i++) {
        if (particleDataRef.current.length >= 60) break
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const r = growthScale * (0.9 + Math.random() * 0.1)
        const pos = new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        )
        const vel = pos.clone().normalize().multiplyScalar(0.3 + Math.random() * 0.5)
        vel.y += (Math.random() - 0.3) * 0.2
        particleDataRef.current.push({
          pos,
          vel,
          life: 0,
          maxLife: 1.0 + Math.random() * 0.8
        })
      }
    }

    particleDataRef.current.forEach((p) => {
      p.life += delta
      p.pos.addScaledVector(p.vel, delta)
      p.vel.multiplyScalar(0.98)
    })
    particleDataRef.current = particleDataRef.current.filter((p) => p.life < p.maxLife)

    if (particlesRef.current) {
      const pGeom = particlesRef.current.geometry
      const pPos = pGeom.getAttribute('position') as THREE.BufferAttribute
      const pCol = pGeom.getAttribute('color') as THREE.BufferAttribute
      const pArr = pPos.array as Float32Array
      const cArr = pCol.array as Float32Array
      const maxP = 60

      for (let i = 0; i < maxP; i++) {
        if (i < particleDataRef.current.length) {
          const p = particleDataRef.current[i]
          pArr[i * 3] = p.pos.x
          pArr[i * 3 + 1] = p.pos.y
          pArr[i * 3 + 2] = p.pos.z
          const lifeRatio = p.life / p.maxLife
          const impurityCol = mixColor(IMPURITY_DARK, IMPURITY_LIGHT, 0.5 + Math.random() * 0.5)
          cArr[i * 3] = impurityCol.r
          cArr[i * 3 + 1] = impurityCol.g
          cArr[i * 3 + 2] = impurityCol.b
          ;(particlesRef.current.material as THREE.PointsMaterial).opacity = 1 - lifeRatio
        } else {
          pArr[i * 3] = 0
          pArr[i * 3 + 1] = -100
          pArr[i * 3 + 2] = 0
        }
      }
      pPos.needsUpdate = true
      pCol.needsUpdate = true
    }

    if (lastStageTriggered !== lastStageRef.current && lastStageTriggered >= 0) {
      lastStageRef.current = lastStageTriggered
      rippleTimeRef.current = 0
      rippleActiveRef.current = true
    }
  })

  const hexLines = useMemo(() => {
    const lines: JSX.Element[] = []
    const offsets = [-0.6, 0, 0.6]
    offsets.forEach((yOff, idx) => {
      const pts: THREE.Vector3[] = []
      for (let i = 0; i <= 6; i++) {
        const angle = (i / 6) * Math.PI * 2
        pts.push(new THREE.Vector3(Math.cos(angle), yOff, Math.sin(angle)))
      }
      const geom = new THREE.BufferGeometry().setFromPoints(pts)
      lines.push(
        <line key={idx} geometry={geom}>
          <lineBasicMaterial color="#4FC3F7" transparent opacity={0.33} linewidth={1} />
        </line>
      )
    })
    return lines
  }, [])

  const particleGeom = useMemo(() => {
    const positions = new Float32Array(60 * 3)
    const colors = new Float32Array(60 * 3)
    for (let i = 0; i < 60; i++) {
      positions[i * 3 + 1] = -100
      colors[i * 3] = 0.67
      colors[i * 3 + 1] = 0.28
      colors[i * 3 + 2] = 0.74
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return g
  }, [])

  const atomGeom = useMemo(() => {
    const positions = new Float32Array(40 * 3)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [])

  return (
    <>
      <ambientLight intensity={0.4} color="#8899AA" />
      <directionalLight position={[5, 5, 5]} intensity={1.0} color="#FFFFFF" />
      <directionalLight position={[-3, 2, -4]} intensity={0.5} color="#4FC3F7" />
      <pointLight position={[0, 0, 0]} intensity={0.6} color="#4FC3F7" distance={6} />

      <mesh ref={meshRef} geometry={baseGeometry}>
        <meshStandardMaterial
          vertexColors
          metalness={0.3}
          roughness={0.25}
          transparent
          opacity={0.92}
          emissive="#01579B"
          emissiveIntensity={0.15}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>

      <group ref={hexGroupRef}>{hexLines}</group>

      <points ref={atomsRef} geometry={atomGeom}>
        <pointsMaterial
          color="#FFFFFF"
          size={0.05}
          transparent
          opacity={0.7}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <mesh ref={rippleRef}>
        <ringGeometry args={[0.95, 1.0, 48]} />
        <meshBasicMaterial
          color="#4FC3F7"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <points ref={particlesRef} geometry={particleGeom}>
        <pointsMaterial
          vertexColors
          size={0.05}
          transparent
          opacity={1}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
  )
}

export default CrystalScene
