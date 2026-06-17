import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import {
  createMobiusStrip,
  updateSurfaceVertices,
  GRID_WIDTH,
  GRID_HEIGHT,
  wireframeVertexShader,
  wireframeFragmentShader,
  type SurfaceParams,
} from '@/utils/surfaceGeometry'
import { useStore } from '@/store/useStore'

interface SceneProps {
  params: SurfaceParams
  isPlaying: boolean
}

export function Scene({ params, isPlaying }: SceneProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const wireframeRef = useRef<THREE.Mesh>(null)
  const controlsRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)
  const { gl, scene, camera } = useThree()

  const resetTrigger = useStore((state) => state.resetTrigger)
  const screenshotTrigger = useStore((state) => state.screenshotTrigger)
  const initialCamera = useStore((state) => state.initialCamera)
  const setFps = useStore((state) => state.setFps)

  const geometry = useMemo(() => {
    return createMobiusStrip(GRID_WIDTH, GRID_HEIGHT, params)
  }, [])

  const wireframeUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: 0.5 },
      uOpacity: { value: 0.3 },
    }),
    []
  )

  useEffect(() => {
    if (geometry) {
      updateSurfaceVertices(geometry, GRID_WIDTH, GRID_HEIGHT, params)
    }
  }, [params, geometry])

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }, [resetTrigger])

  useEffect(() => {
    if (screenshotTrigger > 0) {
      handleScreenshot()
    }
  }, [screenshotTrigger])

  const handleScreenshot = () => {
    const link = document.createElement('a')
    link.download = `mathviz_screenshot_${Date.now()}.png`
    link.href = gl.domElement.toDataURL('image/png')
    link.click()
  }

  let lastTime = performance.now()
  let frameCount = 0
  let fpsAccumulator = 0

  useFrame((state, delta) => {
    const currentTime = performance.now()
    frameCount++
    fpsAccumulator += delta

    if (fpsAccumulator >= 1) {
      const fps = Math.round(frameCount / fpsAccumulator)
      setFps(fps)
      frameCount = 0
      fpsAccumulator = 0
    }

    if (wireframeRef.current) {
      const material = wireframeRef.current.material as THREE.ShaderMaterial
      material.uniforms.uTime.value += delta
    }

    if (isPlaying && groupRef.current) {
      groupRef.current.rotation.y += delta * (20 * (Math.PI / 180))
    }
  })

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} color="#00E5FF" />

      <gridHelper args={[20, 20, '#2D2D3F', '#1A1A2E']} position={[0, -3, 0]} />

      <group ref={groupRef}>
        <mesh ref={meshRef} geometry={geometry}>
          <meshStandardMaterial
            vertexColors
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            flatShading
          />
        </mesh>

        <mesh ref={wireframeRef} geometry={geometry}>
          <shaderMaterial
            vertexShader={wireframeVertexShader}
            fragmentShader={wireframeFragmentShader}
            uniforms={wireframeUniforms}
            transparent
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        panSpeed={1}
        minDistance={2.5}
        maxDistance={25}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />
    </>
  )
}
