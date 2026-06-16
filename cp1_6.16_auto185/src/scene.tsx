import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore, BrushMode } from './store'
import { getHSLColor, getLabelColor, pointInRectangle, pointInPolygon } from './utils'

const AxesHelper: React.FC<{ size?: number; position?: [number, number, number] }> = ({ size = 5, position = [0, -2, 0] }) => {
  return (
    <group position={position}>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, size, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#FF4444" />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, size, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#44FF44" />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, 0, size])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#4488FF" />
      </line>
    </group>
  )
}

const GridHelper: React.FC<{
  size?: number
  divisions?: number
  position?: [number, number, number]
  color?: string
}> = ({ size = 20, divisions = 20, position = [0, -2, 0], color = '#444466' }) => {
  const halfSize = size / 2
  const step = size / divisions
  const lines: JSX.Element[] = []

  for (let i = 0; i <= divisions; i++) {
    const offset = -halfSize + i * step
    const isMain = i % 5 === 0
    const opacity = isMain ? 0.5 : 0.3

    lines.push(
      <line key={`x-${i}`}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([-halfSize, 0, offset, halfSize, 0, offset])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={opacity} />
      </line>
    )
    lines.push(
      <line key={`z-${i}`}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([offset, 0, -halfSize, offset, 0, halfSize])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={opacity} />
      </line>
    )
  }

  return <group position={position}>{lines}</group>
}

interface DataSphereProps {
  position: [number, number, number]
  color: string
  isSelected: boolean
  onClick: () => void
  index: number
}

const DataSphere: React.FC<DataSphereProps> = ({ position, color, isSelected, onClick, index }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const targetScale = isSelected ? 1.5 : 1
  const targetColor = isSelected ? '#FFFFFF' : color

  useFrame(() => {
    if (meshRef.current) {
      const currentScale = meshRef.current.scale.x
      const newScale = currentScale + (targetScale - currentScale) * 0.15
      meshRef.current.scale.set(newScale, newScale, newScale)

      const material = meshRef.current.material as THREE.MeshStandardMaterial
      material.color.lerp(new THREE.Color(targetColor), 0.15)
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isSelected ? 0.5 : 0.2}
        roughness={0.5}
        metalness={0.3}
      />
    </mesh>
  )
}

interface PointCloudProps {
  onRectSelect?: (ids: string[]) => void
  onLassoSelect?: (ids: string[]) => void
}

const PointCloud: React.FC<PointCloudProps> = () => {
  const rawData = useAppStore(state => state.rawData)
  const reducedCoords = useAppStore(state => state.reducedCoords)
  const selectedIds = useAppStore(state => state.selectedIds)
  const togglePointSelection = useAppStore(state => state.togglePointSelection)
  const brushMode = useAppStore(state => state.brushMode)

  const total = rawData.length

  return (
    <group>
      {rawData.map((point, i) => {
        if (i >= reducedCoords.length) return null
        const coord = reducedCoords[i]
        const labelColor = getLabelColor(point.label)
        const baseColor = labelColor || getHSLColor(i, total)
        const isSelected = selectedIds.has(point.id)

        return (
          <DataSphere
            key={point.id}
            index={i}
            position={[coord.x, coord.y, coord.z]}
            color={baseColor}
            isSelected={isSelected}
            onClick={() => {
              if (brushMode === 'select' || brushMode === null) {
                togglePointSelection(point.id)
              }
            }}
          />
        )
      })}
    </group>
  )
}

interface CameraControllerProps {
  targetPosition: [number, number, number] | null
  onAnimationComplete: () => void
}

const CameraController: React.FC<CameraControllerProps> = ({ targetPosition, onAnimationComplete }) => {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const animatingRef = useRef(false)
  const targetCamPos = useRef<THREE.Vector3 | null>(null)
  const targetLookAt = useRef<THREE.Vector3 | null>(null)

  useEffect(() => {
    if (targetPosition) {
      animatingRef.current = true
      targetLookAt.current = new THREE.Vector3(
        targetPosition[0],
        targetPosition[1],
        targetPosition[2]
      )
      const offset = new THREE.Vector3(0, 0, 2)
      targetCamPos.current = targetLookAt.current.clone().add(offset)
    }
  }, [targetPosition])

  useFrame(() => {
    if (animatingRef.current && targetCamPos.current && targetLookAt.current) {
      camera.position.lerp(targetCamPos.current, 0.05)

      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt.current, 0.05)
        controlsRef.current.update()
      }

      const dist = camera.position.distanceTo(targetCamPos.current)
      if (dist < 0.01) {
        animatingRef.current = false
        targetCamPos.current = null
        targetLookAt.current = null
        onAnimationComplete()
      }
    }
  })

  const autoRotate = useAppStore(state => state.autoRotate)
  const setAutoRotate = useAppStore(state => state.setAutoRotate)
  const lastInteractionRef = useRef(Date.now())

  useFrame((_, delta) => {
    const now = Date.now()
    if (now - lastInteractionRef.current > 3000 && autoRotate) {
      if (controlsRef.current && !animatingRef.current) {
        controlsRef.current.autoRotate = true
        controlsRef.current.autoRotateSpeed = 5 * delta * 60
      }
    } else {
      if (controlsRef.current) {
        controlsRef.current.autoRotate = false
      }
    }
  })

  const handleStart = useCallback(() => {
    lastInteractionRef.current = Date.now()
    setAutoRotate(false)
  }, [setAutoRotate])

  const handleEnd = useCallback(() => {
    lastInteractionRef.current = Date.now()
    setTimeout(() => setAutoRotate(true), 3000)
  }, [setAutoRotate])

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.1}
      zoomSpeed={1.0}
      enablePan={true}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      }}
      onStart={handleStart}
      onEnd={handleEnd}
    />
  )
}

interface SelectionOverlayProps {
  onSelectionEnd: (ids: string[]) => void
}

const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ onSelectionEnd }) => {
  const brushMode = useAppStore(state => state.brushMode)
  const rawData = useAppStore(state => state.rawData)
  const reducedCoords = useAppStore(state => state.reducedCoords)
  const selectPoints = useAppStore(state => state.selectPoints)

  const [isDragging, setIsDragging] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null)
  const [lassoPoints, setLassoPoints] = useState<{ x: number; y: number }[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const { camera, gl } = useThree()

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!brushMode) return
    if (e.button !== 0) return

    const rect = gl.domElement.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDragging(true)
    setStartPos({ x, y })
    setCurrentPos({ x, y })

    if (brushMode === 'lasso') {
      setLassoPoints([{ x, y }])
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !brushMode) return

    const rect = gl.domElement.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setCurrentPos({ x, y })

    if (brushMode === 'lasso') {
      setLassoPoints(prev => [...prev, { x, y }])
    }
  }

  const handlePointerUp = () => {
    if (!isDragging || !brushMode) {
      setIsDragging(false)
      return
    }

    if (brushMode === 'rectangle' && startPos && currentPos) {
      const rect = {
        x1: startPos.x,
        y1: startPos.y,
        x2: currentPos.x,
        y2: currentPos.y
      }

      const selected: string[] = []
      const viewportRect = gl.domElement.getBoundingClientRect()

      rawData.forEach((point, i) => {
        if (i >= reducedCoords.length) return
        const coord = reducedCoords[i]

        const vec = new THREE.Vector3(coord.x, coord.y, coord.z)
        vec.project(camera)

        const screenX = (vec.x * 0.5 + 0.5) * viewportRect.width
        const screenY = (-vec.y * 0.5 + 0.5) * viewportRect.height

        if (pointInRectangle(screenX, screenY, rect)) {
          selected.push(point.id)
        }
      })

      selectPoints(selected)
    }

    if (brushMode === 'lasso' && lassoPoints.length > 2) {
      const selected: string[] = []
      const viewportRect = gl.domElement.getBoundingClientRect()

      rawData.forEach((point, i) => {
        if (i >= reducedCoords.length) return
        const coord = reducedCoords[i]

        const vec = new THREE.Vector3(coord.x, coord.y, coord.z)
        vec.project(camera)

        const screenX = (vec.x * 0.5 + 0.5) * viewportRect.width
        const screenY = (-vec.y * 0.5 + 0.5) * viewportRect.height

        if (pointInPolygon(screenX, screenY, lassoPoints)) {
          selected.push(point.id)
        }
      })

      selectPoints(selected)
    }

    setIsDragging(false)
    setStartPos(null)
    setCurrentPos(null)
    setLassoPoints([])
  }

  const rectStyle = useMemo(() => {
    if (!isDragging || brushMode !== 'rectangle' || !startPos || !currentPos) {
      return null
    }

    return {
      left: Math.min(startPos.x, currentPos.x),
      top: Math.min(startPos.y, currentPos.y),
      width: Math.abs(currentPos.x - startPos.x),
      height: Math.abs(currentPos.y - startPos.y)
    }
  }, [isDragging, brushMode, startPos, currentPos])

  const lassoPath = useMemo(() => {
    if (lassoPoints.length < 2) return ''
    return lassoPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'
  }, [lassoPoints])

  return (
    <>
      <Html
        zIndexRange={[0, 0]}
        position={[0, 0, 0]}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: brushMode ? 'auto' : 'none',
          touchAction: 'none'
        }}
      >
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '100%',
            position: 'relative'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {rectStyle && (
            <div
              style={{
                position: 'absolute',
                border: '2px solid #00BFFF',
                background: 'rgba(0, 191, 255, 0.1)',
                pointerEvents: 'none',
                ...rectStyle
              }}
            />
          )}

          {brushMode === 'lasso' && lassoPoints.length > 1 && (
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            >
              <path
                d={lassoPath}
                fill="rgba(0, 255, 127, 0.1)"
                stroke="#00FF7F"
                strokeWidth={2}
              />
            </svg>
          )}
        </div>
      </Html>
    </>
  )
}

interface SceneContentProps {
  focusTarget: [number, number, number] | null
  onFocusComplete: () => void
}

const SceneContent: React.FC<SceneContentProps> = ({ focusTarget, onFocusComplete }) => {
  return (
    <>
      <color attach="background" args={[0x0B0B2A]} />
      <fog attach="fog" args={[0x0B0B2A, 10, 30]} />

      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[-10, -10, -5]} intensity={0.3} color="#00D4FF" />

      <AxesHelper size={5} position={[0, -2, 0]} />
      <GridHelper size={20} divisions={20} position={[0, -2, 0]} color="#444466" />

      <PointCloud />
      <SelectionOverlay onSelectionEnd={() => {}} />
      <CameraController
        targetPosition={focusTarget}
        onAnimationComplete={onFocusComplete}
      />
    </>
  )
}

interface SceneProps {
  focusTarget: [number, number, number] | null
  onFocusComplete: () => void
}

const Scene: React.FC<SceneProps> = ({ focusTarget, onFocusComplete }) => {
  return (
    <Canvas
      camera={{ position: [0, 2, 6], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneContent focusTarget={focusTarget} onFocusComplete={onFocusComplete} />
    </Canvas>
  )
}

export default Scene
