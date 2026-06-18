import { useRef, useMemo, MutableRefObject } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  Html,
  Grid,
  Line,
  Edges,
} from '@react-three/drei'
import * as THREE from 'three'

export interface PipelinePoint {
  x: number
  y: number
  z: number
}

export interface PipelineData {
  id: string
  name: string
  material: string
  depth: number
  color: string
  radius: number
  points: PipelinePoint[]
  type?: string
  visible?: boolean
}

export interface LayerData {
  name: string
  color: string
  yStart: number
  yEnd: number
}

export interface UndergroundSceneProps {
  maxDepth: number
  pipelines: PipelineData[]
  layers: LayerData[]
  hoveredId: string | null
  setHoveredId: (id: string | null) => void
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  cameraResetRef: MutableRefObject<(() => void) | null>
}

const SCENE_WIDTH = 10
const SCENE_DEPTH = 10
const SCENE_HEIGHT = 5

function StratigraphyLayers({
  layers,
  maxDepth,
}: {
  layers: LayerData[]
  maxDepth: number
}) {
  const clippingPlane = useMemo(
    () => [new THREE.Plane(new THREE.Vector3(0, 1, 0), -maxDepth)],
    [maxDepth]
  )

  return (
    <group>
      {layers.map((layer, index) => {
        const height = layer.yEnd - layer.yStart
        const yCenter = (layer.yStart + layer.yEnd) / 2
        return (
          <mesh key={`layer-${index}`} position={[0, yCenter, 0]}>
            <boxGeometry args={[SCENE_WIDTH, height, SCENE_DEPTH]} />
            <meshStandardMaterial
              color={layer.color}
              side={THREE.DoubleSide}
              clippingPlanes={clippingPlane}
              clipShadows
            />
            <Edges color={layer.color} threshold={15} />
          </mesh>
        )
      })}
    </group>
  )
}

function LayerBoundaryLines({
  layers,
  maxDepth,
}: {
  layers: LayerData[]
  maxDepth: number
}) {
  const lines = useMemo(() => {
    const result: { points: [number, number, number][] }[] = []
    const halfW = SCENE_WIDTH / 2
    const halfD = SCENE_DEPTH / 2

    layers.forEach((layer) => {
      if (layer.yStart < maxDepth) {
        const y = layer.yStart
        result.push({
          points: [
            [-halfW, y, -halfD],
            [halfW, y, -halfD],
            [halfW, y, halfD],
            [-halfW, y, halfD],
            [-halfW, y, -halfD],
          ],
        })
      }
    })

    return result
  }, [layers, maxDepth])

  return (
    <group>
      {lines.map((line, i) => (
        <Line
          key={`boundary-${i}`}
          points={line.points}
          color="#00ffff"
          lineWidth={2}
        />
      ))}
    </group>
  )
}

function GroundSurface() {
  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[SCENE_WIDTH, SCENE_DEPTH]} />
      <meshStandardMaterial
        color="#8B7355"
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function PipelineMesh({
  pipeline,
  maxDepth,
  isHovered,
  isSelected,
  dimmed,
  onPointerOver,
  onPointerOut,
  onClick,
}: {
  pipeline: PipelineData
  maxDepth: number
  isHovered: boolean
  isSelected: boolean
  dimmed: boolean
  onPointerOver: () => void
  onPointerOut: () => void
  onClick: () => void
}) {
  const clippingPlane = useMemo(
    () => [new THREE.Plane(new THREE.Vector3(0, 1, 0), -maxDepth)],
    [maxDepth]
  )

  const { curve, startPoint, endPoint } = useMemo(() => {
    const threePoints = pipeline.points.map(
      (p) => new THREE.Vector3(p.x, p.y, p.z)
    )
    const curve = new THREE.CatmullRomCurve3(threePoints)
    return {
      curve,
      startPoint: threePoints[0],
      endPoint: threePoints[threePoints.length - 1],
    }
  }, [pipeline.points])

  const jointRadius = pipeline.radius * 1.5
  const baseOpacity = dimmed ? 0.6 : 1

  return (
    <group>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation()
          onPointerOver()
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          onPointerOut()
        }}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
      >
        <tubeGeometry
          args={[curve, 64, pipeline.radius, 12, false]}
        />
        <meshStandardMaterial
          color={pipeline.color}
          metalness={0.3}
          roughness={0.4}
          emissive={isHovered || isSelected ? '#4fc3f7' : '#000000'}
          emissiveIntensity={isHovered || isSelected ? 0.4 : 0}
          transparent
          opacity={baseOpacity}
          clippingPlanes={clippingPlane}
          clipShadows
        />
      </mesh>

      <mesh position={startPoint}>
        <sphereGeometry args={[jointRadius, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.6 * baseOpacity}
          clippingPlanes={clippingPlane}
        />
      </mesh>

      <mesh position={endPoint}>
        <sphereGeometry args={[jointRadius, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.6 * baseOpacity}
          clippingPlanes={clippingPlane}
        />
      </mesh>

      {isHovered && (
        <Html
          position={[
            (startPoint.x + endPoint.x) / 2,
            (startPoint.y + endPoint.y) / 2 + 0.5,
            (startPoint.z + endPoint.z) / 2,
          ]}
          center
          distanceFactor={8}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              border: '1px solid #4fc3f7',
            }}
          >
            <div style={{ fontWeight: 'bold', color: '#4fc3f7' }}>
              {pipeline.name}
            </div>
            <div>材质: {pipeline.material}</div>
            <div>埋深: {pipeline.depth.toFixed(2)}m</div>
          </div>
        </Html>
      )}
    </group>
  )
}

function PipelinesGroup({
  pipelines,
  maxDepth,
  hoveredId,
  selectedId,
  setHoveredId,
  setSelectedId,
}: {
  pipelines: PipelineData[]
  maxDepth: number
  hoveredId: string | null
  selectedId: string | null
  setHoveredId: (id: string | null) => void
  setSelectedId: (id: string | null) => void
}) {
  return (
    <group>
      {pipelines.map((pipeline) => {
        const isHovered = hoveredId === pipeline.id
        const isSelected = selectedId === pipeline.id
        const dimmed =
          (hoveredId !== null && !isHovered) ||
          (selectedId !== null && !isSelected)

        return (
          <PipelineMesh
            key={pipeline.id}
            pipeline={pipeline}
            maxDepth={maxDepth}
            isHovered={isHovered}
            isSelected={isSelected}
            dimmed={dimmed}
            onPointerOver={() => setHoveredId(pipeline.id)}
            onPointerOut={() => setHoveredId(null)}
            onClick={() => setSelectedId(pipeline.id)}
          />
        )
      })}
    </group>
  )
}

function ClippingPlaneIndicator({ maxDepth }: { maxDepth: number }) {
  return (
    <group position={[0, maxDepth, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[SCENE_WIDTH, SCENE_DEPTH]} />
        <meshStandardMaterial
          color="#ff6b6b"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Grid
        args={[SCENE_WIDTH, 10]}
        position={[0, 0.001, 0]}
        cellColor="#ff6b6b"
        sectionColor="#ff6b6b"
        cellSize={1}
        sectionSize={5}
        cellThickness={1}
        sectionThickness={1.5}
      />
    </group>
  )
}

function CameraController({
  cameraResetRef,
  controlsRef,
}: {
  cameraResetRef: MutableRefObject<(() => void) | null>
  controlsRef: MutableRefObject<any>
}) {
  const { camera } = useThree()

  cameraResetRef.current = () => {
    camera.position.set(8, 6, 8)
    camera.lookAt(0, 1.5, 0)
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 1.5, 0)
      controlsRef.current.update()
    }
  }

  return null
}

function FadeOverlay() {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const startTime = useRef<number | null>(null)
  const duration = 0.3

  useFrame(({ clock }) => {
    if (!materialRef.current) return
    if (startTime.current === null) {
      startTime.current = clock.getElapsedTime()
    }
    const elapsed = clock.getElapsedTime() - startTime.current
    const progress = Math.min(elapsed / duration, 1)
    materialRef.current.opacity = 1 - progress
    if (progress >= 1) {
      materialRef.current.visible = false
    }
  })

  return (
    <mesh position={[0, 2.5, 0]} renderOrder={999}>
      <boxGeometry args={[SCENE_WIDTH + 2, SCENE_HEIGHT + 2, SCENE_DEPTH + 2]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#000000"
        transparent
        opacity={1}
        side={THREE.BackSide}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  )
}

function SceneContent({
  maxDepth,
  pipelines,
  layers,
  hoveredId,
  setHoveredId,
  selectedId,
  setSelectedId,
  cameraResetRef,
}: UndergroundSceneProps) {
  const controlsRef = useRef<any>(null)

  const visiblePipelines = useMemo(
    () => pipelines.filter((p) => p.visible !== false),
    [pipelines]
  )

  return (
    <>
      <CameraController
        cameraResetRef={cameraResetRef}
        controlsRef={controlsRef}
      />

      <ambientLight intensity={0.6} />
      <directionalLight
        position={[0, 10, 0]}
        intensity={0.8}
        castShadow
      />

      <GroundSurface />
      <StratigraphyLayers layers={layers} maxDepth={maxDepth} />
      <LayerBoundaryLines layers={layers} maxDepth={maxDepth} />
      <ClippingPlaneIndicator maxDepth={maxDepth} />
      <PipelinesGroup
        pipelines={visiblePipelines}
        maxDepth={maxDepth}
        hoveredId={hoveredId}
        selectedId={selectedId}
        setHoveredId={setHoveredId}
        setSelectedId={setSelectedId}
      />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[0, 1.5, 0]}
        enablePan
        enableZoom
        enableRotate
        minDistance={2}
        maxDistance={30}
      />

      <FadeOverlay />
    </>
  )
}

export default function UndergroundScene(props: UndergroundSceneProps) {
  return (
    <Canvas
      camera={{ position: [8, 6, 8], fov: 50 }}
      gl={{
        localClippingEnabled: true,
        antialias: true,
      }}
      shadows
      onPointerMissed={() => {
        props.setHoveredId(null)
      }}
    >
      <SceneContent {...props} />
    </Canvas>
  )
}
