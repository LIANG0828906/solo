import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../stores/useAppStore'
import type { MeasurementPoint } from '../types'

interface LayerMeshProps {
  layerIndex: number
  vertices: number[]
  indices: number[]
  colors: number[]
  onClick: (point: THREE.Vector3, layerIndex: number) => void
}

function LayerMesh({ layerIndex, vertices, indices, colors, onClick }: LayerMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const targetPositions = useRef<Float32Array>(new Float32Array(vertices))

  const { geometry, edgesGeometry } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const posAttr = new THREE.Float32BufferAttribute(vertices.slice(), 3)
    const colorAttr = new THREE.Float32BufferAttribute(colors.slice(), 3)
    geo.setAttribute('position', posAttr)
    geo.setAttribute('color', colorAttr)
    geo.setIndex(indices.slice())
    geo.computeVertexNormals()

    const edges = new THREE.EdgesGeometry(geo, 20)
    return { geometry: geo, edgesGeometry: edges }
  }, [])

  useEffect(() => {
    targetPositions.current = new Float32Array(vertices)
  }, [vertices])

  useEffect(() => {
    const colorAttr = new THREE.Float32BufferAttribute(colors.slice(), 3)
    geometry.setAttribute('color', colorAttr)
    geometry.attributes.color.needsUpdate = true
  }, [colors, geometry])

  useFrame(() => {
    if (!meshRef.current) return
    const pos = geometry.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    for (let i = 0; i < arr.length; i++) {
      arr[i] += (targetPositions.current[i] - arr[i]) * 0.15
    }
    pos.needsUpdate = true
    geometry.computeVertexNormals()
  })

  const handleClick = (e: any) => {
    e.stopPropagation()
    const worldPoint = e.point.clone()
    onClick(worldPoint, layerIndex)
  }

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      >
        <meshStandardMaterial
          vertexColors
          side={THREE.DoubleSide}
          flatShading={false}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color="#5a4a3a" transparent opacity={0.25} />
      </lineSegments>
    </group>
  )
}

function GridHelper3D() {
  const gridXY = useMemo(() => {
    const size = 30
    const divisions = 30
    return new THREE.GridHelper(size, divisions, 0x444466, 0x333355)
  }, [])

  return <primitive object={gridXY} position={[0, -4, 0]} />
}

function MarkerPoint({ point, index }: { point: MeasurementPoint; index: number }) {
  return (
    <group position={point.position}>
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#e94560" emissive="#e94560" emissiveIntensity={0.4} />
      </mesh>
      <Html position={[0, 0.3, 0]} center distanceFactor={10}>
        <div
          style={{
            background: 'rgba(233, 69, 96, 0.9)',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            fontWeight: 'bold',
          }}
        >
          P{index + 1}
        </div>
      </Html>
    </group>
  )
}

function MeasurementLine({
  pointA,
  pointB,
  distance,
  angle,
}: {
  pointA: [number, number, number]
  pointB: [number, number, number]
  distance: number
  angle: number
}) {
  const points = useMemo(() => {
    const p1 = new THREE.Vector3(...pointA)
    const p2 = new THREE.Vector3(...pointB)
    return [p1, p2]
  }, [pointA, pointB])

  const midPoint = useMemo(() => {
    return [
      (pointA[0] + pointB[0]) / 2,
      (pointA[1] + pointB[1]) / 2 + 0.3,
      (pointA[2] + pointB[2]) / 2,
    ] as [number, number, number]
  }, [pointA, pointB])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    return geo
  }, [points])

  const lineObject = useMemo(() => {
    const line = new THREE.Line(geometry)
    const material = new THREE.LineDashedMaterial({
      color: '#ffffff',
      dashSize: 0.3,
      gapSize: 0.15,
      transparent: true,
      opacity: 0.9,
    })
    line.material = material
    line.computeLineDistances()
    return line
  }, [geometry])

  return (
    <group>
      <primitive object={lineObject} />
      <Html position={midPoint} center distanceFactor={10}>
        <div
          style={{
            background: 'rgba(255,255,255,0.95)',
            color: '#1a1a2e',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          距离: {distance.toFixed(2)} | 角度: {angle.toFixed(1)}°
        </div>
      </Html>
    </group>
  )
}

function CameraController() {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    camera.position.set(18, 14, 18)
    camera.lookAt(0, 0, 0)
  }, [camera])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={5}
      maxDistance={60}
      maxPolarAngle={Math.PI / 2.05}
    />
  )
}

export function Scene3D() {
  const deformationData = useAppStore((s) => s.deformationData)
  const selectedPoints = useAppStore((s) => s.selectedPoints)
  const measurementResult = useAppStore((s) => s.measurementResult)
  const addSelectedPoint = useAppStore((s) => s.addSelectedPoint)
  const clearSelectedPoints = useAppStore((s) => s.clearSelectedPoints)
  const setMeasurementResult = useAppStore((s) => s.setMeasurementResult)
  const lastClickTime = useAppStore((s) => s.lastClickTime)
  const setLastClickTime = useAppStore((s) => s.setLastClickTime)

  const handleLayerClick = (worldPoint: THREE.Vector3, layerIndex: number) => {
    const now = Date.now()
    const isDoubleClick = now - lastClickTime < 350
    setLastClickTime(now)

    const point: MeasurementPoint = {
      id: now,
      position: [worldPoint.x, worldPoint.y, worldPoint.z],
      layerIndex,
    }
    addSelectedPoint(point)

    if (isDoubleClick && selectedPoints.length >= 1) {
      setTimeout(() => {
        const current = useAppStore.getState().selectedPoints
        if (current.length >= 2) {
          const [p1, p2] = current
          const dx = p2.position[0] - p1.position[0]
          const dy = p2.position[1] - p1.position[1]
          const dz = p2.position[2] - p1.position[2]
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
          const horizontalDist = Math.sqrt(dx * dx + dz * dz)
          const angle = horizontalDist > 0.001 ? (Math.atan2(dy, horizontalDist) * 180) / Math.PI : 0
          setMeasurementResult({
            distance,
            horizontalAngle: angle,
            pointA: p1,
            pointB: p2,
          })
        }
      }, 50)
    }
  }

  const layers = deformationData?.layers || []

  return (
    <Canvas
      shadows
      camera={{ position: [18, 14, 18], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      onPointerMissed={() => {
        clearSelectedPoints()
      }}
      style={{ background: '#1a1a2e' }}
    >
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 35, 70]} />

      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-10, 8, -10]} intensity={0.4} color="#6688ff" />
      <hemisphereLight args={['#8899bb', '#2a1a0a', 0.3]} />

      <CameraController />
      <GridHelper3D />

      {layers.map((layer) => (
        <LayerMesh
          key={layer.layerIndex}
          layerIndex={layer.layerIndex}
          vertices={layer.vertices}
          indices={layer.indices}
          colors={layer.colors}
          onClick={handleLayerClick}
        />
      ))}

      {selectedPoints.map((p, i) => (
        <MarkerPoint key={p.id} point={p} index={i} />
      ))}

      {measurementResult && (
        <MeasurementLine
          pointA={measurementResult.pointA.position}
          pointB={measurementResult.pointB.position}
          distance={measurementResult.distance}
          angle={measurementResult.horizontalAngle}
        />
      )}
    </Canvas>
  )
}

export default Scene3D
