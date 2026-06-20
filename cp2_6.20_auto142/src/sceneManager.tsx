import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from './store'
import { THEME_COLORS, VisualElement } from './types'
import BeatBars from './elements/BeatBars'
import ParticleGalaxy from './elements/ParticleGalaxy'
import WaveSphere from './elements/WaveSphere'
import LightWall from './elements/LightWall'

function StarField() {
  const pointsRef = useRef<THREE.Points>(null)
  const count = 500

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80
      pos[i * 3 + 1] = (Math.random() - 0.5) * 80
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80
      const t = Math.random()
      const c = new THREE.Color().lerpColors(
        new THREE.Color('#ffffff'),
        new THREE.Color('#aaccff'),
        t
      )
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return { positions: pos, colors: col }
  }, [])

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.01
      pointsRef.current.rotation.x += delta * 0.005
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.08} vertexColors sizeAttenuation transparent opacity={0.6} />
    </points>
  )
}

function DynamicLight() {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const theme = useStore((s) => s.theme)
  const colors = THEME_COLORS[theme]

  useFrame((state) => {
    if (!lightRef.current) return
    const freqData = useStore.getState().frequencyData
    let bassAvg = 0
    for (let i = 0; i < 10; i++) bassAvg += freqData[i]
    bassAvg /= 10 * 255

    const t = state.clock.elapsedTime
    lightRef.current.position.x = Math.sin(t * 0.5 + bassAvg) * 5
    lightRef.current.position.y = 3 + Math.sin(t * 0.3) * 0.5
    lightRef.current.position.z = Math.cos(t * 0.5 + bassAvg) * 5
    lightRef.current.color.set(colors[0])
  })

  return <directionalLight ref={lightRef} intensity={0.5} />
}

function SceneElement({ element }: { element: VisualElement }) {
  const theme = useStore((s) => s.theme)
  const props = {
    id: element.id,
    params: element.params,
    sensitivity: element.sensitivity,
    rotationSpeed: element.rotationSpeed,
    scale: element.scale,
    theme,
  }

  switch (element.type) {
    case 'beatBars':
      return <BeatBars {...props} />
    case 'particleGalaxy':
      return <ParticleGalaxy {...props} />
    case 'waveSphere':
      return <WaveSphere {...props} />
    case 'lightWall':
      return <LightWall {...props} />
    default:
      return null
  }
}

function SceneContent() {
  const elements = useStore((s) => s.elements)
  const setSelectedId = useStore((s) => s.setSelectedId)

  return (
    <>
      <ambientLight intensity={0.2} />
      <DynamicLight />
      <StarField />
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
      {elements.map((el) => (
        <SceneElement key={el.id} element={el} />
      ))}
      <mesh visible={false} onClick={() => setSelectedId(null)}>
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial />
      </mesh>
    </>
  )
}

export default function SceneManager() {
  return (
    <Canvas
      camera={{ position: [0, 3, 8], fov: 60, near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 100%)' }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color('#0a0a1a'))
      }}
    >
      <SceneContent />
    </Canvas>
  )
}
