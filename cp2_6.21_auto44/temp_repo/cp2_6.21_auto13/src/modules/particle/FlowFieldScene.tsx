import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '@/store/useStore'
import { ParticleEngine, buildGrid, getColor, computeMaxMagnitude } from '@/modules/particle/ParticleSystem'

function ArrowsGroup() {
  const groupRef = useRef<THREE.Group>(null)
  const fieldData = useStore((s) => s.fieldData)
  const colorMap = useStore((s) => s.colorMap)
  const arrowScale = useStore((s) => s.arrowScale)

  const arrows = useMemo(() => {
    if (!fieldData) return []
    const grid = buildGrid(fieldData)
    if (!grid) return []

    const maxMag = computeMaxMagnitude(grid)
    const result: { pos: [number, number, number]; dir: [number, number, number]; length: number; color: [number, number, number] }[] = []

    for (let j = 0; j < grid.rows; j++) {
      for (let i = 0; i < grid.cols; i++) {
        const idx = (j * grid.cols + i) * 2
        const u = grid.data[idx]
        const v = grid.data[idx + 1]
        const mag = Math.sqrt(u * u + v * v)
        if (mag < 1e-8) continue

        const nx = ((i / (grid.cols - 1)) * 2 - 1) * 4
        const ny = ((j / (grid.rows - 1)) * 2 - 1) * 4
        const length = (mag / maxMag) * 0.4 * arrowScale
        const dir: [number, number, number] = [u / mag, v / mag, 0]
        const t = mag / maxMag
        const [r, g, b] = getColor(t, colorMap)

        result.push({
          pos: [nx, ny, 0],
          dir,
          length: Math.max(0.05, length),
          color: [r, g, b],
        })
      }
    }

    return result
  }, [fieldData, colorMap, arrowScale])

  useEffect(() => {
    if (!groupRef.current) return
    while (groupRef.current.children.length > 0) {
      const child = groupRef.current.children[0]
      groupRef.current.remove(child)
      if ((child as THREE.ArrowHelper).dispose) {
        (child as THREE.ArrowHelper).dispose()
      }
    }

    for (const a of arrows) {
      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(...a.dir).normalize(),
        new THREE.Vector3(...a.pos),
        a.length,
        new THREE.Color(...a.color),
        a.length * 0.3,
        a.length * 0.15,
      )
      groupRef.current.add(arrow)
    }
  }, [arrows])

  return <group ref={groupRef} />
}

function ParticlesMesh() {
  const pointsRef = useRef<THREE.Points>(null)
  const engineRef = useRef<ParticleEngine>(new ParticleEngine())
  const fieldData = useStore((s) => s.fieldData)
  const isRunning = useStore((s) => s.isRunning)
  const density = useStore((s) => s.density)
  const timeStep = useStore((s) => s.timeStep)
  const colorMap = useStore((s) => s.colorMap)
  const prevRunningRef = useRef(false)

  useEffect(() => {
    if (fieldData) {
      const grid = buildGrid(fieldData)
      engineRef.current.setGrid(grid)
    } else {
      engineRef.current.setGrid(null)
    }
  }, [fieldData])

  useEffect(() => {
    if (!isRunning && prevRunningRef.current) {
      engineRef.current.reset()
    }
    prevRunningRef.current = isRunning
  }, [isRunning])

  useFrame((_, delta) => {
    const engine = engineRef.current
    if (!engine.grid || !pointsRef.current) return

    const clampedDelta = Math.min(delta, 0.05)

    if (isRunning) {
      engine.emit(density, clampedDelta)
      engine.update(clampedDelta, timeStep)
    }

    const { positions, colors, count } = engine.getGeometryData(colorMap)

    const geom = pointsRef.current.geometry
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geom.setDrawRange(0, count)
    geom.attributes.position.needsUpdate = true
    geom.attributes.color.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={0} array={new Float32Array(0)} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={0} array={new Float32Array(0)} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={2} vertexColors sizeAttenuation={false} transparent opacity={0.9} depthWrite={false} />
    </points>
  )
}

function SceneSetup() {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(0, 0, 10)
    camera.lookAt(0, 0, 0)
  }, [camera])

  return null
}

function GridPlane() {
  const fieldData = useStore((s) => s.fieldData)
  if (!fieldData) return null

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[8, 8]} />
      <meshBasicMaterial color="#0a0a1a" transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  )
}

function SceneContent() {
  const reset = useStore((s) => s.reset)
  const fieldData = useStore((s) => s.fieldData)

  useEffect(() => {
    const handleReset = () => {
      reset()
      if (engineRef.current) engineRef.current.reset()
    }
    return () => {}
  }, [reset])

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 10]} intensity={0.8} />
      <SceneSetup />
      <GridPlane />
      {fieldData && <ArrowsGroup />}
      <ParticlesMesh />
      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={20}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI - 0.2}
        rotateSpeed={0.8}
        zoomSpeed={1.2}
      />
    </>
  )
}

const engineRef: React.MutableRefObject<ParticleEngine | null> = { current: null }

export default function FlowFieldScene() {
  const screenshotTrigger = useStore((s) => s.screenshotTrigger)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (screenshotTrigger === 0) return
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    try {
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `flowfield-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('Screenshot failed:', e)
    }
  }, [screenshotTrigger])

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Canvas
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        camera={{ fov: 50, near: 0.1, far: 100 }}
        style={{ background: 'transparent' }}
      >
        <SceneContent />
      </Canvas>
    </div>
  )
}
