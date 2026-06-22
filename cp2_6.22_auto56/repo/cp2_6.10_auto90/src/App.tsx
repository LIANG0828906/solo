import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { LockBox } from './components/LockBox'
import { Workbench } from './components/Workbench'
import { BrickWall } from './components/BrickWall'
import { BambooPanel } from './components/BambooPanel'
import { ParticleSystem } from './components/ParticleSystem'
import { SCENE_CONFIG, GLOW_CONFIG } from './utils/constants'
import { useLockStore } from './store/useLockStore'
import { playSuccessChime } from './utils/sound'

const SceneLighting: React.FC = () => {
  const { AMBIENT_LIGHT, LEFT_LIGHT, RIGHT_LIGHT } = SCENE_CONFIG

  return (
    <>
      <ambientLight
        intensity={AMBIENT_LIGHT.intensity}
        color={AMBIENT_LIGHT.color}
      />
      <directionalLight
        position={LEFT_LIGHT.position}
        intensity={LEFT_LIGHT.intensity}
        color={LEFT_LIGHT.color}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.0005}
      />
      <directionalLight
        position={RIGHT_LIGHT.position}
        intensity={RIGHT_LIGHT.intensity}
        color={RIGHT_LIGHT.color}
      />
    </>
  )
}

const GlowEffect: React.FC = () => {
  const glowActive = useLockStore(state => state.glowActive)
  const glowLightRef = useRef<THREE.PointLight>(null)
  const hasPlayedRef = useRef(false)

  useFrame(() => {
    if (glowLightRef.current && glowActive) {
      if (!hasPlayedRef.current) {
        playSuccessChime()
        hasPlayedRef.current = true
      }
      const time = Date.now() * 0.001
      glowLightRef.current.intensity = GLOW_CONFIG.intensity * (1 + Math.sin(time * 4) * 0.3)
    } else {
      hasPlayedRef.current = false
    }
  })

  if (!glowActive) return null

  return (
    <pointLight
      ref={glowLightRef}
      position={[0, 5, 0]}
      color={GLOW_CONFIG.color}
      intensity={GLOW_CONFIG.intensity}
      distance={GLOW_CONFIG.radius * 3}
      decay={1}
    />
  )
}

const SceneContent: React.FC = () => {
  return (
    <>
      <SceneLighting />
      <BrickWall />
      <Workbench />
      <LockBox />
      <ParticleSystem />
      <GlowEffect />

      <OrbitControls
        enableDamping
        dampingFactor={0.8}
        enablePan={false}
        minDistance={30}
        maxDistance={150}
        zoomSpeed={0.8}
        rotateSpeed={0.5}
        mouseButtons={{
          LEFT: null as any,
          MIDDLE: THREE.MOUSE.ROTATE,
          RIGHT: THREE.MOUSE.ROTATE
        }}
      />

      <EffectComposer>
        <Bloom
          intensity={0.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}

export const App: React.FC = () => {
  const { CAMERA } = SCENE_CONFIG

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        camera={{
          position: CAMERA.position,
          fov: CAMERA.fov,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
        frameloop="always"
      >
        <color attach="background" args={['#2a2a2a']} />
        <fog attach="fog" args={['#2a2a2a', 80, 200]} />
        <SceneContent />
      </Canvas>

      <BambooPanel />

      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        color: '#d4c294',
        fontSize: '12px',
        fontFamily: "'ZCOOL XiaoWei', serif",
        opacity: 0.7,
        textAlign: 'right',
        lineHeight: '1.8'
      }}>
        <div>右键旋转视角</div>
        <div>滚轮缩放</div>
        <div>左键拖拽木条</div>
      </div>

      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#d4c294',
        fontSize: '24px',
        fontFamily: "'ZCOOL XiaoWei', serif",
        letterSpacing: '8px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        zIndex: 100
      }}>
        古代孔明锁拆解演示
      </div>
    </div>
  )
}

export default App
