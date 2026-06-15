import { useRef, useMemo } from 'react'
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

interface RopeKnot {
  id: string
  position: [number, number, number]
  colorIndex: number
  isGlowing: boolean
}

interface SceneProps {
  currentStep: number
  completedParts: string[]
  skyColor: string
  onKnotClick: (knotId: string) => void
  onFireClick: () => void
  fireLevel: 0 | 1 | 2
  ropeKnots: RopeKnot[]
}

const KNOT_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71']

function createGrassTex() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 512
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#4a7c23'
  ctx.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512, y = Math.random() * 512
    ctx.fillStyle = `hsl(${90 + Math.random() * 30}, ${50 + Math.random() * 30}%, ${25 + Math.random() * 20}%)`
    ctx.fillRect(x, y, 1 + Math.random() * 2, 3 + Math.random() * 5)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(10, 10)
  return tex
}

function createFeltTex() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#d5c4a1'
  ctx.fillRect(0, 0, 256, 256)
  ctx.strokeStyle = '#b8a075'
  ctx.lineWidth = 2
  for (let i = 0; i < 8; i++) {
    const cx = 32 + (i % 4) * 64, cy = 32 + Math.floor(i / 4) * 64
    ctx.beginPath()
    ctx.moveTo(cx, cy - 15)
    ctx.lineTo(cx + 15, cy)
    ctx.lineTo(cx, cy + 15)
    ctx.lineTo(cx - 15, cy)
    ctx.closePath()
    ctx.stroke()
  }
  return new THREE.CanvasTexture(canvas)
}

function Clouds() {
  const ref = useRef<THREE.Group>(null)
  const data = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    x: (Math.random() - 0.5) * 30, y: 6 + Math.random() * 3,
    z: (Math.random() - 0.5) * 30, scale: 1 + Math.random() * 2,
    speed: 0.02 + Math.random() * 0.02
  })), [])
  useFrame((_, dt) => {
    if (ref.current) ref.current.children.forEach((c, i) => {
      c.position.x += data[i].speed * dt * 60
      if (c.position.x > 15) c.position.x = -15
    })
  })
  return (
    <group ref={ref}>
      {data.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, c.z]} scale={c.scale}>
          <planeGeometry args={[3, 1]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function Eagle() {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime() * 0.3
      ref.current.position.set(Math.cos(t) * 5, 5.5, Math.sin(t) * 5)
      ref.current.rotation.y = -t + Math.PI / 2
    }
  })
  return (
    <group ref={ref}>
      <mesh>
        <coneGeometry args={[0.4, 0.8, 3]} />
        <meshBasicMaterial color="#1a1a1a" side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function FireParticles({ level }: { level: number }) {
  const ref = useRef<THREE.Points>(null)
  const count = 30 * (level + 1)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.4
      arr[i * 3 + 1] = Math.random() * 0.5
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.4
    }
    return arr
  }, [count])
  useFrame(({ clock }) => {
    if (ref.current) {
      const pos = ref.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] += 0.02 * (level + 1)
        if (pos[i * 3 + 1] > 1 + level * 0.3) pos[i * 3 + 1] = 0
        pos[i * 3] += Math.sin(clock.elapsedTime + i) * 0.005
        pos[i * 3 + 2] += Math.cos(clock.elapsedTime + i) * 0.005
      }
      ref.current.geometry.attributes.position.needsUpdate = true
    }
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.08} color="#ff6b35" transparent opacity={0.8} />
    </points>
  )
}

function Hana() {
  const pieces = []
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const x = Math.cos(angle) * 2.8, z = Math.sin(angle) * 2.8
    const points: THREE.Vector3[] = []
    for (let j = 0; j < 5; j++) {
      for (let k = 0; k < 2; k++) {
        const px = x + (k - 0.5) * 1.25 * Math.cos(angle + Math.PI / 2)
        const py = j * 0.45
        const pz = z + (k - 0.5) * 1.25 * Math.sin(angle + Math.PI / 2)
        points.push(new THREE.Vector3(px, py, pz))
      }
    }
    pieces.push(
      <lineSegments key={i} geometry={new THREE.BufferGeometry().setFromPoints(points)} rotation={[0, -angle, 0]}>
        <lineBasicMaterial color="#8b6914" />
      </lineSegments>
    )
  }
  return <group>{pieces}</group>
}

function Uni() {
  const poles = []
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2
    const x = Math.cos(angle) * 2.8, z = Math.sin(angle) * 2.8
    poles.push(
      <mesh key={i} position={[x / 2, 1.5, z / 2]} rotation={[0, -angle, Math.atan2(1.4, 2.8)]}>
        <cylinderGeometry args={[0.02, 0.02, 2]} />
        <meshStandardMaterial color="#a0522d" />
      </mesh>
    )
  }
  return <group>{poles}</group>
}

function Ropes() {
  const lines = []
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const points: THREE.Vector3[] = []
    for (let j = 0; j <= 10; j++) {
      const t = j / 10, r = 0.6 + t * 2.9, py = 2.1 - t * 2.1
      points.push(new THREE.Vector3(Math.cos(angle + t * 0.5) * r, py, Math.sin(angle + t * 0.5) * r))
    }
    lines.push(
      <line key={i} geometry={new THREE.BufferGeometry().setFromPoints(points)}>
        <lineBasicMaterial color="#6b4226" />
      </line>
    )
  }
  return <group>{lines}</group>
}

function YurtPart({ part, step, completed }: { part: string; step: number; completed: string[] }) {
  const visible = completed.includes(part) || (part === 'hana' && step >= 2)
  if (!visible) return null
  if (part === 'hana') return <Hana />
  if (part === 'toono') return (
    <mesh position={[0, 2.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.6, 0.05, 8, 16]} />
      <meshStandardMaterial color="#8b4513" />
    </mesh>
  )
  if (part === 'uni') return <Uni />
  if (part === 'felt') return (
    <mesh position={[0, 1.8, 0]} scale={[1, 0.6, 1]}>
      <sphereGeometry args={[3.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#f5f0e1" side={THREE.DoubleSide} />
    </mesh>
  )
  if (part === 'ropes') return <Ropes />
  return null
}

function RopeKnots({ knots, onClick }: { knots: RopeKnot[]; onClick: (id: string) => void }) {
  const handleClick = (e: ThreeEvent<MouseEvent>, id: string) => { e.stopPropagation(); onClick(id) }
  return (
    <group>
      {knots.map((knot) => (
        <mesh key={knot.id} position={knot.position} onClick={(e) => handleClick(e, knot.id)}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial
            color={KNOT_COLORS[knot.colorIndex % 4]}
            emissive={knot.isGlowing ? KNOT_COLORS[knot.colorIndex % 4] : '#000000'}
            emissiveIntensity={knot.isGlowing ? 0.5 : 0}
          />
        </mesh>
      ))}
    </group>
  )
}

function InnerFelt() {
  const texture = useMemo(createFeltTex, [])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <circleGeometry args={[3, 32]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}

function Stove({ level, onClick }: { level: number; onClick: () => void }) {
  const handleClick = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick() }
  return (
    <group position={[0, 0.2, 0]} onClick={handleClick}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.3, 16]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.2, 8]} />
        <meshStandardMaterial color="#34495e" />
      </mesh>
      <FireParticles level={level} />
    </group>
  )
}

function SceneContent(props: SceneProps) {
  const grassTex = useMemo(createGrassTex, [])
  const { currentStep, completedParts, skyColor, onKnotClick, onFireClick, fireLevel, ropeKnots } = props

  return (
    <>
      <color attach="background" args={[skyColor]} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]} intensity={1}
        color={new THREE.Color().setHSL(0.08 + Math.sin(Date.now() * 0.00001) * 0.05, 0.6, 0.8)}
        castShadow
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial map={grassTex} />
      </mesh>

      <YurtPart part="hana" step={currentStep} completed={completedParts} />
      <YurtPart part="toono" step={currentStep} completed={completedParts} />
      <YurtPart part="uni" step={currentStep} completed={completedParts} />
      <YurtPart part="felt" step={currentStep} completed={completedParts} />
      <YurtPart part="ropes" step={currentStep} completed={completedParts} />

      <InnerFelt />
      <Stove level={fireLevel} onClick={onFireClick} />
      <RopeKnots knots={ropeKnots} onClick={onKnotClick} />

      <Clouds />
      <Eagle />

      <OrbitControls
        enableDamping dampingFactor={0.05}
        minPolarAngle={0.1} maxPolarAngle={Math.PI / 2 - 0.1}
        target={[0, 1.5, 0]}
      />
    </>
  )
}

export default function Scene(props: SceneProps) {
  return (
    <Canvas camera={{ position: [0, 3, 8], fov: 60 }} shadows style={{ width: '100%', height: '100%' }}>
      <SceneContent {...props} />
    </Canvas>
  )
}
