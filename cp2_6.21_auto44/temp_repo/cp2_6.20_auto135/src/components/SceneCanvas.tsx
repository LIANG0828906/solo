import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Html } from '@react-three/drei'
import * as THREE from 'three'
import { GeometryItem } from './GeometryItem'
import { useSceneStore, TransformMode } from '../store/sceneStore'

const TransformGizmo = () => {
  const { selectedId, geometries, transformMode, updateGeometry } = useSceneStore()
  const selected = geometries.find((g) => g.id === selectedId)
  const groupRef = useRef<THREE.Group>(null)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef<{
    axis: 'x' | 'y' | 'z' | null
    mode: TransformMode
    startPos: THREE.Vector3
    startRot: THREE.Euler
    startScale: THREE.Vector3
    mouseStart: THREE.Vector2
    planeNormal: THREE.Vector3
  } | null>(null)
  const { camera, raycaster, pointer } = useThree()
  const hoveredAxisRef = useRef<string | null>(null)

  if (!selected) return null

  const degToRad = (d: number) => (d * Math.PI) / 180

  const getWorldPosition = () => {
    return new THREE.Vector3(
      selected.position.x,
      selected.position.y,
      selected.position.z
    )
  }

  const getAxisColor = (axis: 'x' | 'y' | 'z') => {
    const isHovered = hoveredAxisRef.current === axis
    const baseColors = {
      x: isHovered ? '#ff6b6b' : '#ff4444',
      y: isHovered ? '#6bff6b' : '#44ff44',
      z: isHovered ? '#6b6bff' : '#4444ff',
    }
    return baseColors[axis]
  }

  const handleAxisPointerDown = (
    e: any,
    axis: 'x' | 'y' | 'z'
  ) => {
    e.stopPropagation()
    isDraggingRef.current = true
    e.target.setPointerCapture(e.pointerId)

    const pos = getWorldPosition()
    const planeNormal = new THREE.Vector3()
    camera.getWorldDirection(planeNormal)

    dragStartRef.current = {
      axis,
      mode: transformMode,
      startPos: pos.clone(),
      startRot: new THREE.Euler(
        degToRad(selected.rotation.x),
        degToRad(selected.rotation.y),
        degToRad(selected.rotation.z)
      ),
      startScale: new THREE.Vector3(
        selected.scale.x,
        selected.scale.y,
        selected.scale.z
      ),
      mouseStart: new THREE.Vector2(pointer.x, pointer.y),
      planeNormal: planeNormal.clone(),
    }
  }

  const handleAxisPointerMove = (e: any) => {
    e.stopPropagation()
    if (!isDraggingRef.current || !dragStartRef.current) return

    const { axis, mode, startPos, startRot, startScale } = dragStartRef.current

    const ndc = new THREE.Vector3(e.point.x, e.point.y, e.point.z)
    const startWorld = startPos.clone()

    if (mode === 'translate') {
      const delta = ndc.clone().sub(startWorld)
      const newPos = startPos.clone()
      if (axis === 'x') newPos.x = startPos.x + delta.x
      if (axis === 'y') newPos.y = startPos.y + delta.y
      if (axis === 'z') newPos.z = startPos.z + delta.z

      const clamp = (v: number) => Math.max(-10, Math.min(10, v))
      updateGeometry(selected.id, {
        position: {
          x: Number(clamp(newPos.x).toFixed(3)),
          y: Number(clamp(newPos.y).toFixed(3)),
          z: Number(clamp(newPos.z).toFixed(3)),
        },
      })
    } else if (mode === 'rotate' && axis) {
      const delta = ndc.clone().sub(startWorld)
      let angle = 0
      if (axis === 'x') angle = Math.atan2(delta.y, delta.z)
      if (axis === 'y') angle = Math.atan2(delta.x, delta.z)
      if (axis === 'z') angle = Math.atan2(delta.x, delta.y)

      const degAngle = (angle * 180) / Math.PI
      const newRot = { x: selected.rotation.x, y: selected.rotation.y, z: selected.rotation.z }
      newRot[axis] = ((degAngle % 360) + 360) % 360
      updateGeometry(selected.id, {
        rotation: {
          x: Number(newRot.x.toFixed(1)),
          y: Number(newRot.y.toFixed(1)),
          z: Number(newRot.z.toFixed(1)),
        },
      })
    } else if (mode === 'scale' && axis) {
      const delta = ndc.clone().sub(startWorld)
      let factor = 1
      if (axis === 'x') factor = 1 + delta.x * 0.5
      if (axis === 'y') factor = 1 + delta.y * 0.5
      if (axis === 'z') factor = 1 + delta.z * 0.5

      factor = Math.max(0.1, Math.min(5, factor))
      const newScale = startScale.clone()
      const startAxisValue = startScale[axis]
      newScale[axis] = startAxisValue * factor
      const clamp = (v: number) => Math.max(0.1, Math.min(5, v))
      updateGeometry(selected.id, {
        scale: {
          x: Number(clamp(newScale.x).toFixed(3)),
          y: Number(clamp(newScale.y).toFixed(3)),
          z: Number(clamp(newScale.z).toFixed(3)),
        },
      })
    }
  }

  const handleAxisPointerUp = (e: any) => {
    isDraggingRef.current = false
    dragStartRef.current = null
    try { e.target.releasePointerCapture(e.pointerId) } catch {}
  }

  const handleAxisHover = (axis: 'x' | 'y' | 'z', hovered: boolean) => {
    hoveredAxisRef.current = hovered ? axis : null
    document.body.style.cursor = hovered ? 'pointer' : 'default'
  }

  const renderTranslateHandles = () => {
    const length = 1.2
    const thickness = 0.05
    return (
      <group>
        <mesh
          onPointerDown={(e) => handleAxisPointerDown(e, 'x')}
          onPointerMove={handleAxisPointerMove}
          onPointerUp={handleAxisPointerUp}
          onPointerEnter={() => handleAxisHover('x', true)}
          onPointerLeave={() => handleAxisHover('x', false)}
          position={[length / 2, 0, 0]}
          rotation={[0, 0, -Math.PI / 2]}
        >
          <cylinderGeometry args={[thickness, thickness, length, 8]} />
          <meshBasicMaterial color={getAxisColor('x')} />
        </mesh>
        <mesh
          onPointerDown={(e) => handleAxisPointerDown(e, 'x')}
          onPointerMove={handleAxisPointerMove}
          onPointerUp={handleAxisPointerUp}
          onPointerEnter={() => handleAxisHover('x', true)}
          onPointerLeave={() => handleAxisHover('x', false)}
          position={[length + 0.1, 0, 0]}
          rotation={[0, 0, -Math.PI / 2]}
        >
          <coneGeometry args={[0.15, 0.3, 8]} />
          <meshBasicMaterial color={getAxisColor('x')} />
        </mesh>

        <mesh
          onPointerDown={(e) => handleAxisPointerDown(e, 'y')}
          onPointerMove={handleAxisPointerMove}
          onPointerUp={handleAxisPointerUp}
          onPointerEnter={() => handleAxisHover('y', true)}
          onPointerLeave={() => handleAxisHover('y', false)}
          position={[0, length / 2, 0]}
        >
          <cylinderGeometry args={[thickness, thickness, length, 8]} />
          <meshBasicMaterial color={getAxisColor('y')} />
        </mesh>
        <mesh
          onPointerDown={(e) => handleAxisPointerDown(e, 'y')}
          onPointerMove={handleAxisPointerMove}
          onPointerUp={handleAxisPointerUp}
          onPointerEnter={() => handleAxisHover('y', true)}
          onPointerLeave={() => handleAxisHover('y', false)}
          position={[0, length + 0.1, 0]}
        >
          <coneGeometry args={[0.15, 0.3, 8]} />
          <meshBasicMaterial color={getAxisColor('y')} />
        </mesh>

        <mesh
          onPointerDown={(e) => handleAxisPointerDown(e, 'z')}
          onPointerMove={handleAxisPointerMove}
          onPointerUp={handleAxisPointerUp}
          onPointerEnter={() => handleAxisHover('z', true)}
          onPointerLeave={() => handleAxisHover('z', false)}
          position={[0, 0, length / 2]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[thickness, thickness, length, 8]} />
          <meshBasicMaterial color={getAxisColor('z')} />
        </mesh>
        <mesh
          onPointerDown={(e) => handleAxisPointerDown(e, 'z')}
          onPointerMove={handleAxisPointerMove}
          onPointerUp={handleAxisPointerUp}
          onPointerEnter={() => handleAxisHover('z', true)}
          onPointerLeave={() => handleAxisHover('z', false)}
          position={[0, 0, length + 0.1]}
        >
          <coneGeometry args={[0.15, 0.3, 8]} />
          <meshBasicMaterial color={getAxisColor('z')} />
        </mesh>
      </group>
    )
  }

  const renderRotateHandles = () => {
    const radius = 1.3
    const thickness = 0.025
    return (
      <group>
        <mesh
          onPointerDown={(e) => handleAxisPointerDown(e, 'x')}
          onPointerMove={handleAxisPointerMove}
          onPointerUp={handleAxisPointerUp}
          onPointerEnter={() => handleAxisHover('x', true)}
          onPointerLeave={() => handleAxisHover('x', false)}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[radius, thickness, 16, 64]} />
          <meshBasicMaterial color={getAxisColor('x')} transparent opacity={0.9} />
        </mesh>

        <mesh
          onPointerDown={(e) => handleAxisPointerDown(e, 'y')}
          onPointerMove={handleAxisPointerMove}
          onPointerUp={handleAxisPointerUp}
          onPointerEnter={() => handleAxisHover('y', true)}
          onPointerLeave={() => handleAxisHover('y', false)}
          rotation={[0, 0, 0]}
        >
          <torusGeometry args={[radius, thickness, 16, 64]} />
          <meshBasicMaterial color={getAxisColor('y')} transparent opacity={0.9} />
        </mesh>

        <mesh
          onPointerDown={(e) => handleAxisPointerDown(e, 'z')}
          onPointerMove={handleAxisPointerMove}
          onPointerUp={handleAxisPointerUp}
          onPointerEnter={() => handleAxisHover('z', true)}
          onPointerLeave={() => handleAxisHover('z', false)}
          rotation={[0, Math.PI / 2, 0]}
        >
          <torusGeometry args={[radius, thickness, 16, 64]} />
          <meshBasicMaterial color={getAxisColor('z')} transparent opacity={0.9} />
        </mesh>
      </group>
    )
  }

  const renderScaleHandles = () => {
    const length = 1.2
    const boxSize = 0.18
    const thickness = 0.04
    return (
      <group>
        <mesh
          onPointerDown={(e) => handleAxisPointerDown(e, 'x')}
          onPointerMove={handleAxisPointerMove}
          onPointerUp={handleAxisPointerUp}
          onPointerEnter={() => handleAxisHover('x', true)}
          onPointerLeave={() => handleAxisHover('x', false)}
          position={[length / 2, 0, 0]}
          rotation={[0, 0, -Math.PI / 2]}
        >
          <cylinderGeometry args={[thickness, thickness, length, 6]} />
          <meshBasicMaterial color={getAxisColor('x')} />
        </mesh>
        <mesh
          onPointerDown={(e) => handleAxisPointerDown(e, 'x')}
          onPointerMove={handleAxisPointerMove}
          onPointerUp={handleAxisPointerUp}
          onPointerEnter={() => handleAxisHover('x', true)}
          onPointerLeave={() => handleAxisHover('x', false)}
          position={[length + 0.05, 0, 0]}
        >
          <boxGeometry args={[boxSize, boxSize, boxSize]} />
          <meshBasicMaterial color={getAxisColor('x')} />
        </mesh>

        <mesh
          onPointerDown={(e) => handleAxisPointerDown(e, 'y')}
          onPointerMove={handleAxisPointerMove}
          onPointerUp={handleAxisPointerUp}
          onPointerEnter={() => handleAxisHover('y', true)}
          onPointerLeave={() => handleAxisHover('y', false)}
          position={[0, length / 2, 0]}
        >
          <cylinderGeometry args={[thickness, thickness, length, 6]} />
          <meshBasicMaterial color={getAxisColor('y')} />
        </mesh>
        <mesh
          onPointerDown={(e) => handleAxisPointerDown(e, 'y')}
          onPointerMove={handleAxisPointerMove}
          onPointerUp={handleAxisPointerUp}
          onPointerEnter={() => handleAxisHover('y', true)}
          onPointerLeave={() => handleAxisHover('y', false)}
          position={[0, length + 0.05, 0]}
        >
          <boxGeometry args={[boxSize, boxSize, boxSize]} />
          <meshBasicMaterial color={getAxisColor('y')} />
        </mesh>

        <mesh
          onPointerDown={(e) => handleAxisPointerDown(e, 'z')}
          onPointerMove={handleAxisPointerMove}
          onPointerUp={handleAxisPointerUp}
          onPointerEnter={() => handleAxisHover('z', true)}
          onPointerLeave={() => handleAxisHover('z', false)}
          position={[0, 0, length / 2]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[thickness, thickness, length, 6]} />
          <meshBasicMaterial color={getAxisColor('z')} />
        </mesh>
        <mesh
          onPointerDown={(e) => handleAxisPointerDown(e, 'z')}
          onPointerMove={handleAxisPointerMove}
          onPointerUp={handleAxisPointerUp}
          onPointerEnter={() => handleAxisHover('z', true)}
          onPointerLeave={() => handleAxisHover('z', false)}
          position={[0, 0, length + 0.05]}
        >
          <boxGeometry args={[boxSize, boxSize, boxSize]} />
          <meshBasicMaterial color={getAxisColor('z')} />
        </mesh>
      </group>
    )
  }

  return (
    <group
      ref={groupRef}
      position={[selected.position.x, selected.position.y, selected.position.z]}
      rotation={[
        degToRad(selected.rotation.x),
        degToRad(selected.rotation.y),
        degToRad(selected.rotation.z),
      ]}
    >
      {transformMode === 'translate' && renderTranslateHandles()}
      {transformMode === 'rotate' && renderRotateHandles()}
      {transformMode === 'scale' && renderScaleHandles()}
    </group>
  )
}

const LightsSetup = () => {
  const { lights } = useSceneStore()
  return (
    <>
      <ambientLight intensity={lights.ambientIntensity} />
      <pointLight
        position={[
          lights.pointPosition.x,
          lights.pointPosition.y,
          lights.pointPosition.z,
        ]}
        intensity={lights.pointIntensity}
        color="#ffffff"
        distance={50}
        decay={2}
      />
      <pointLightHelper
        position={[
          lights.pointPosition.x,
          lights.pointPosition.y,
          lights.pointPosition.z,
        ]}
      />
    </>
  )
}

export const SceneCanvas = () => {
  const { geometries, setTransformMode, removeGeometry, selectedId } = useSceneStore()
  const useLOD = geometries.length > 30

  return (
    <Canvas
      camera={{ position: [6, 6, 8], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      onKeyDown={(e) => {
        if (e.key === 'r' || e.key === 'R') setTransformMode('rotate')
        if (e.key === 's' || e.key === 'S') setTransformMode('scale')
        if (e.key === 'w' || e.key === 'W') setTransformMode('translate')
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
          removeGeometry(selectedId)
        }
      }}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 20, 50]} />

      <LightsSetup />

      <Grid
        position={[0, -0.01, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#2a2a4e"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#3a3a6e"
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid
      />

      {geometries.map((g) => (
        <GeometryItem key={g.id} data={g} useLOD={useLOD} />
      ))}

      <TransformGizmo />

      <OrbitControls
        makeDefault
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2 + 0.1}
      />
    </Canvas>
  )
}
