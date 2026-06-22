import { useRef, useEffect, useState } from 'react'
import { Canvas as R3FCanvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { NeonText } from '@/scenes/NeonText'
import { useEditorStore } from '@/store/useEditorStore'

const ROTATION_PERIOD = 30

interface CameraControllerProps {
  isExportingGif: boolean
  gifProgress: number
}

function CameraController({ isExportingGif, gifProgress }: CameraControllerProps) {
  const { camera } = useThree()
  const startAngleRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(performance.now())

  useFrame(() => {
    const center = new THREE.Vector3(0, 1, 0)
    const radius = 5

    let angle: number
    if (isExportingGif) {
      angle = -Math.PI * 2 * gifProgress
    } else {
      if (startAngleRef.current === null) {
        const dx = camera.position.x - center.x
        const dz = camera.position.z - center.z
        startAngleRef.current = Math.atan2(dx, dz)
        startTimeRef.current = performance.now()
      }
      const elapsed = (performance.now() - startTimeRef.current) / 1000
      angle = startAngleRef.current + (elapsed / ROTATION_PERIOD) * Math.PI * 2
    }

    camera.position.x = center.x + radius * Math.sin(angle)
    camera.position.y = 2
    camera.position.z = center.z + radius * Math.cos(angle)
    camera.lookAt(center)
  })

  return null
}

interface CanvasRefSetterProps {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>
  onReady: () => void
}

function CanvasRefSetter({ canvasRef, onReady }: CanvasRefSetterProps) {
  const { gl } = useThree()
  useEffect(() => {
    if (gl && gl.domElement) {
      canvasRef.current = gl.domElement
      gl.domElement.id = 'neon-canvas'
      onReady()
    }
  }, [gl, canvasRef, onReady])
  return null
}

function SceneBackground() {
  const meshRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 1.5,
    )
    gradient.addColorStop(0, '#1a0a2e')
    gradient.addColorStop(1, '#0a0a0e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial
      mat.map = texture
      mat.needsUpdate = true
    }

    return () => {
      texture.dispose()
    }
  }, [])

  return (
    <mesh ref={meshRef} position={[0, 0, -20]} scale={[80, 50, 1]}>
      <planeGeometry />
      <meshBasicMaterial side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

function GridFloor() {
  const gridRef = useRef<THREE.GridHelper>(null)

  useEffect(() => {
    if (gridRef.current) {
      const mat = gridRef.current.material as THREE.LineBasicMaterial
      mat.transparent = true
      mat.opacity = 0.08
      mat.color.set('#ffffff')
    }
  }, [])

  return (
    <gridHelper
      ref={gridRef}
      args={[40, 80, '#ffffff', '#ffffff']}
      position={[0, -1.5, 0]}
    />
  )
}

interface AppCanvasProps {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>
  isExportingGif: boolean
  gifProgress: number
}

export function AppCanvas({ canvasRef, isExportingGif, gifProgress }: AppCanvasProps) {
  const glowIntensity = useEditorStore((s) => s.glowIntensity)
  const [ready, setReady] = useState(false)

  const bloomThreshold = Math.max(0, 0.2 - (glowIntensity - 0.5) * 0.1)

  return (
    <R3FCanvas
      camera={{ position: [0, 2, 5], fov: 50, near: 0.1, far: 1000 }}
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%' }}
    >
      <CanvasRefSetter canvasRef={canvasRef} onReady={() => setReady(true)} />

      <color attach="background" args={['#0a0a0e']} />
      <fog attach="fog" args={['#0a0a0e', 8, 30]} />

      <ambientLight intensity={0.2} />
      <pointLight position={[0, 4, 2]} intensity={0.6} color="#ffffff" />
      <pointLight position={[-4, 2, -2]} intensity={0.3} color="#00ffff" />
      <pointLight position={[4, 2, -2]} intensity={0.3} color="#ff00ff" />

      <SceneBackground />
      <GridFloor />

      {ready && <NeonText />}

      <CameraController isExportingGif={isExportingGif} gifProgress={gifProgress} />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={glowIntensity * 0.8}
          luminanceThreshold={bloomThreshold}
          luminanceSmoothing={0.1}
          mipmapBlur
          radius={0.6}
        />
      </EffectComposer>
    </R3FCanvas>
  )
}
