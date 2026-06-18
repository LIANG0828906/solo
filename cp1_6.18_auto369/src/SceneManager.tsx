import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from './store'
import { getVoxelColor } from './voxelEngine'
import { VoxelData } from './types'

interface InstancedVoxelsProps {
  voxels: VoxelData[]
  visibleLayerCount: number
  selectedId: string | null
  onVoxelClick: (voxel: VoxelData, screenX: number, screenY: number) => void
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function InstancedVoxels({ voxels, visibleLayerCount, selectedId, onVoxelClick }: InstancedVoxelsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const edgesRef = useRef<THREE.LineSegments>(null)
  const selectedMeshRef = useRef<THREE.Mesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const [displayVoxels, setDisplayVoxels] = useState<VoxelData[]>([])
  const [animatedVisibleCount, setAnimatedVisibleCount] = useState(0)
  const [colorTransition, setColorTransition] = useState(0)
  const prevModeRef = useRef(useAppStore.getState().colorMode)
  const prevColorRef = useRef(useAppStore.getState().monochromeColor)
  const targetVisibleRef = useRef(visibleLayerCount)
  const animationStartRef = useRef<number | null>(null)
  const animationStartCountRef = useRef(0)
  const colorTransitionStartRef = useRef<number | null>(null)

  const { camera, gl } = useThree()

  const colorMode = useAppStore((s) => s.colorMode)
  const monochromeColor = useAppStore((s) => s.monochromeColor)
  const boundingBox = useAppStore((s) => s.boundingBox)

  const gridYValues = useMemo(() => {
    const set = new Set<number>()
    voxels.forEach((v) => set.add(v.gridY))
    const sorted = Array.from(set).sort((a, b) => a - b)
    return sorted
  }, [voxels])

  const yMin = boundingBox?.minY ?? 0
  const yMax = boundingBox?.maxY ?? 1

  useEffect(() => {
    if (colorMode !== prevModeRef.current || monochromeColor !== prevColorRef.current) {
      colorTransitionStartRef.current = performance.now()
      prevModeRef.current = colorMode
      prevColorRef.current = monochromeColor
    }
  }, [colorMode, monochromeColor])

  useEffect(() => {
    targetVisibleRef.current = visibleLayerCount
    if (animationStartRef.current === null) {
      animationStartRef.current = performance.now()
      animationStartCountRef.current = animatedVisibleCount
    }
  }, [visibleLayerCount])

  const getVoxelCurrentColor = useCallback((voxel: VoxelData, t: number) => {
    const prevMode = colorMode === 'original' ? 'monochrome' : colorMode === 'monochrome' ? 'gradient' : 'original'
    const currentColor = getVoxelColor(voxel, colorMode, monochromeColor, yMin, yMax)
    const prevColor = getVoxelColor(voxel, prevModeRef.current === colorMode ? (colorMode === 'original' ? 'original' : colorMode) : prevModeRef.current, prevColorRef.current, yMin, yMax)

    const eased = easeInOut(t)
    return [
      prevColor[0] + (currentColor[0] - prevColor[0]) * eased,
      prevColor[1] + (currentColor[1] - prevColor[1]) * eased,
      prevColor[2] + (currentColor[2] - prevColor[2]) * eased,
    ] as [number, number, number]
  }, [colorMode, monochromeColor, yMin, yMax])

  useFrame(() => {
    const now = performance.now()

    let needsUpdate = false
    if (animationStartRef.current !== null) {
      const elapsed = (now - animationStartRef.current) / 300
      if (elapsed >= 1) {
        setAnimatedVisibleCount(targetVisibleRef.current)
        animationStartRef.current = null
      } else {
        const eased = easeInOut(elapsed)
        const newCount = animationStartCountRef.current + (targetVisibleRef.current - animationStartCountRef.current) * eased
        setAnimatedVisibleCount(newCount)
      }
      needsUpdate = true
    }

    let colorT = 1
    if (colorTransitionStartRef.current !== null) {
      const elapsed = (now - colorTransitionStartRef.current) / 500
      if (elapsed >= 1) {
        colorTransitionStartRef.current = null
        colorT = 1
      } else {
        colorT = easeInOut(elapsed)
      }
      setColorTransition(colorT)
      needsUpdate = true
    }

    if (!meshRef.current) return

    const currentGridY = animatedVisibleCount > 0 ? gridYValues[Math.min(Math.floor(animatedVisibleCount) - 1, gridYValues.length - 1)] : -Infinity
    const nextGridY = gridYValues[Math.min(Math.floor(animatedVisibleCount), gridYValues.length - 1)]

    const visibleFraction = animatedVisibleCount - Math.floor(animatedVisibleCount)
    let instanceIdx = 0
    const selectedVoxel = voxels.find(v => v.id === selectedId)
    let selectedInstanceMatrix: THREE.Matrix4 | null = null
    let selectedVoxelData: VoxelData | null = null

    const currentVisibleList: VoxelData[] = []

    voxels.forEach((voxel) => {
      let shouldShow = false
      let showRatio = 0

      if (voxel.gridY < currentGridY) {
        shouldShow = true
        showRatio = 1
      } else if (voxel.gridY === currentGridY) {
        shouldShow = true
        showRatio = Math.min(animatedVisibleCount % 1 === 0 ? 1 : animatedVisibleCount - Math.floor(animatedVisibleCount), 1)
      } else if (voxel.gridY > currentGridY && animatedVisibleCount > Math.floor(animatedVisibleCount) && voxel.gridY === nextGridY && animatedVisibleCount % 1 > 0) {
        shouldShow = false
        showRatio = 0
      }

      if (voxel.gridY < currentGridY) {
        shouldShow = true
        showRatio = 1
      } else if (voxel.gridY === currentGridY) {
        shouldShow = animatedVisibleCount > 0
        showRatio = animatedVisibleCount % 1 === 0 ? 1 : (animatedVisibleCount - Math.floor(animatedVisibleCount))
      }

      if (voxel.gridY <= currentGridY) {
        shouldShow = true
        showRatio = 1
      } else if (animatedVisibleCount > Math.floor(animatedVisibleCount) && voxel.gridY === nextGridY) {
        shouldShow = true
        showRatio = animatedVisibleCount - Math.floor(animatedVisibleCount)
      }

      if (shouldShow && instanceIdx < meshRef.current!.count) {
        const voxelSize = 4
        const scaleFactor = voxelSize / 2.01

        dummy.position.set(
          voxel.worldX,
          voxel.worldY - (1 - showRatio) * voxelSize * 1.5,
          voxel.worldZ
        )
        dummy.scale.set(scaleFactor * showRatio, scaleFactor * showRatio, scaleFactor * showRatio)
        dummy.updateMatrix()
        meshRef.current!.setMatrixAt(instanceIdx, dummy.matrix)

        const colorArray = getVoxelCurrentColor(voxel, colorTransition)
        const color = new THREE.Color(colorArray[0], colorArray[1], colorArray[2])
        meshRef.current!.setColorAt(instanceIdx, color)

        if (voxel.id === selectedId) {
          selectedInstanceMatrix = dummy.matrix.clone()
          selectedVoxelData = voxel
        }

        currentVisibleList.push(voxel)
        instanceIdx++
      }
    })

    meshRef.current.count = instanceIdx
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }

    if (edgesRef.current && edgesRef.current.geometry) {
      const positionAttr = edgesRef.current.geometry.getAttribute('position')
      if (positionAttr) {
        const maxCount = Math.min(instanceIdx * 12, positionAttr.count)
        edgesRef.current.geometry.setDrawRange(0, maxCount)
      }
    }

    if (selectedMeshRef.current && selectedInstanceMatrix && selectedVoxelData) {
      selectedMeshRef.current.visible = true
      selectedMeshRef.current.matrixAutoUpdate = false
      selectedMeshRef.current.matrix.copy(selectedInstanceMatrix)

      const flickerSpeed = 1.25
      const t = (now / 1000) * flickerSpeed
      const pulse = 0.6 + 0.4 * Math.sin(t * Math.PI * 2)

      const mat = selectedMeshRef.current.material as THREE.MeshBasicMaterial
      const originalColor = getVoxelColor(selectedVoxelData, colorMode, monochromeColor, yMin, yMax)
      mat.color.setRGB(
        Math.min(1, originalColor[0] * 1.4 + 0.2 * pulse),
        Math.min(1, originalColor[1] * 1.4 + 0.2 * pulse),
        Math.min(1, originalColor[2] * 1.4 + 0.2 * pulse)
      )
    } else if (selectedMeshRef.current) {
      selectedMeshRef.current.visible = false
    }

    setDisplayVoxels(currentVisibleList)
  })

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!meshRef.current) return

      const rect = gl.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      )

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, camera)

      const intersects = raycaster.intersectObject(meshRef.current)
      if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
        const instanceId = intersects[0].instanceId
        if (displayVoxels[instanceId]) {
          const voxel = displayVoxels[instanceId]
          onVoxelClick(voxel, event.clientX, event.clientY)
        }
      }
    }

    gl.domElement.addEventListener('click', handleClick)
    return () => gl.domElement.removeEventListener('click', handleClick)
  }, [displayVoxels, camera, gl, onVoxelClick])

  const maxInstances = voxels.length

  const instancedGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[instancedGeometry, undefined, Math.max(1, maxInstances)]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={0xffffff}
          vertexColors
          roughness={0.6}
          metalness={0.1}
          transparent
          opacity={1}
        />
      </instancedMesh>

      <mesh ref={selectedMeshRef} visible={false}>
        <boxGeometry args={[1.08, 1.08, 1.08]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={0.8} />
      </mesh>

      <lineSegments ref={edgesRef} visible={false}>
        <edgesGeometry args={[instancedGeometry]} />
        <lineBasicMaterial color={0x222222} transparent opacity={0.3} />
      </lineSegments>
    </group>
  )
}

function GridFloor() {
  const gridHelper = useMemo(() => {
    const size = 400
    const divisions = 40
    const color1 = new THREE.Color(0x2a2a2a)
    const color2 = new THREE.Color(0x333333)
    return new THREE.GridHelper(size, divisions, color1, color2)
  }, [])

  return <primitive object={gridHelper} position={[0, -0.01, 0]} />
}

function SceneContent() {
  const voxels = useAppStore((s) => s.voxels)
  const visibleLayerCount = useAppStore((s) => s.visibleLayerCount)
  const selectedVoxel = useAppStore((s) => s.selectedVoxel)
  const setSelectedVoxel = useAppStore((s) => s.setSelectedVoxel)

  const onVoxelClick = useCallback((voxel: VoxelData, screenX: number, screenY: number) => {
    setSelectedVoxel({ voxel, screenX, screenY })
  }, [setSelectedVoxel])

  return (
    <>
      <color attach="background" args={[0.1176, 0.1176, 0.1176]} />
      <fog attach="fog" args={[0x1E1E1E, 300, 800]} />

      <ambientLight intensity={0.4} color={0x404040} />
      <directionalLight
        position={[50, 100, 50]}
        intensity={1.2}
        color={0xFFFFFF}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-50, 30, -50]} intensity={0.4} color={0x8888FF} />
      <hemisphereLight args={[0xFFFFFF, 0x444444, 0.3]} />

      <GridFloor />

      <InstancedVoxels
        voxels={voxels}
        visibleLayerCount={visibleLayerCount}
        selectedId={selectedVoxel?.voxel.id ?? null}
        onVoxelClick={onVoxelClick}
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        minDistance={0.5}
        maxDistance={3.0}
        makeDefault
        target={[0, 20, 0]}
      />
    </>
  )
}

export default function SceneManager() {
  const isProcessing = useAppStore((s) => s.isProcessing)
  const processingProgress = useAppStore((s) => s.processingProgress)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [60, 60, 60], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#1E1E1E' }}
      >
        <SceneContent />
      </Canvas>

      {isProcessing && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            color: 'white',
            fontSize: '20px',
            marginBottom: '20px',
            fontFamily: 'monospace',
          }}>
            正在体素化模型...
          </div>
          <div style={{
            width: '300px',
            height: '8px',
            background: '#333',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.floor(processingProgress * 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #3A8DFF, #5BA3FF)',
              transition: 'width 0.1s ease',
            }} />
          </div>
          <div style={{
            color: '#aaa',
            fontSize: '14px',
            marginTop: '10px',
            fontFamily: 'monospace',
          }}>
            {Math.floor(processingProgress * 100)}%
          </div>
        </div>
      )}
    </div>
  )
}
