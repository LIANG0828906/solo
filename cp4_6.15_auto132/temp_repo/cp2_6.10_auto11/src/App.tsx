import { useState, useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { useStore } from './store/useStore'
import { useSimulation } from './hooks/useSimulation'
import Waterwheel from './components/Waterwheel'
import Millstone from './components/Millstone'

function Stream() {
  const meshRef = useRef<THREE.Mesh>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 }
    }),
    []
  )

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial
      material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  const vertexShader = `
    uniform float uTime;
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      vUv = uv;
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      
      float elevation = sin(modelPosition.x * 2.0 + uTime * 1.5) * 0.05;
      elevation += sin(modelPosition.z * 3.0 + uTime * 2.0) * 0.03;
      
      modelPosition.y += elevation;
      vElevation = elevation;
      
      gl_Position = projectionMatrix * viewMatrix * modelPosition;
    }
  `

  const fragmentShader = `
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      float depth = vElevation * 5.0 + 0.5;
      vec3 color1 = vec3(0.3, 0.6, 0.9);
      vec3 color2 = vec3(0.1, 0.3, 0.7);
      vec3 finalColor = mix(color1, color2, depth);
      gl_FragColor = vec4(finalColor, 0.7);
    }
  `

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
      <planeGeometry args={[30, 30, 50, 50]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function StoneBase() {
  return (
    <mesh position={[3, 0.25, 0]} receiveShadow castShadow>
      <boxGeometry args={[4, 0.5, 4]} />
      <meshStandardMaterial color="#6b7b7b" roughness={0.8} />
    </mesh>
  )
}

function Shed() {
  return (
    <group position={[3, 0.5, 0]}>
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 2, 3]} />
        <meshStandardMaterial color="#5d3a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.2, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <coneGeometry args={[2.5, 1.5, 4]} />
        <meshStandardMaterial color="#8b4513" roughness={0.8} />
      </mesh>
    </group>
  )
}

function Scene() {
  const gateOpening = useStore((state) => state.gateOpening)
  const bladeAngle = useStore((state) => state.bladeAngle)
  const gearRatio = useStore((state) => state.gearRatio)

  const { waterSpeed, rotationSpeed, poundingFrequency, poundingDepth, impulse } = useSimulation(
    gateOpening,
    bladeAngle,
    gearRatio
  )

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <hemisphereLight args={['#87ceeb', '#6b7b7b', 0.3]} />
      <OrbitControls enableDamping dampingFactor={0.05} minDistance={5} maxDistance={30} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#3d5c3d" roughness={1} />
      </mesh>
      <Stream />
      <StoneBase />
      <Shed />
      <Waterwheel
        waterSpeed={waterSpeed}
        gateOpening={gateOpening}
        bladeAngle={bladeAngle}
        position={[-1, 1.5, 0]}
      />
      <Millstone
        rotationSpeed={rotationSpeed}
        gearRatio={gearRatio}
        poundingFrequency={poundingFrequency}
        poundingDepth={poundingDepth}
        impulse={impulse}
        position={[4, 0.5, 0]}
      />
    </>
  )
}

function ControlPanel() {
  const { gateOpening, bladeAngle, gearRatio, setGateOpening, setBladeAngle, setGearRatio } =
    useStore()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const gearRatios: Array<3 | 5 | 8 | 10> = [3, 5, 8, 10]

  const panelVariants = {
    expanded: { width: isMobile ? 280 : '100%', height: isMobile ? 320 : 'auto' },
    collapsed: { width: isMobile ? 60 : '100%', height: isMobile ? 60 : 'auto' }
  }

  return (
    <motion.div
      initial={false}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      variants={panelVariants}
      transition={{ type: 'spring', damping: 0.3, stiffness: 300 }}
      style={{
        position: 'fixed',
        [isMobile ? 'left' : 'bottom']: isMobile ? 20 : 0,
        [isMobile ? 'top' : 'bottom']: isMobile ? '50%' : 0,
        transform: isMobile ? 'translateY(-50%)' : 'none',
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: isMobile ? 16 : 0,
        padding: isCollapsed ? 0 : 24,
        zIndex: 100,
        overflow: 'hidden'
      }}
    >
      {isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#333',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20
          }}
        >
          {isCollapsed ? '⚙' : '×'}
        </button>
      )}

      {!isCollapsed && (
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 32 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: 'white', display: 'block', marginBottom: 8, fontSize: 14 }}>
              闸门开度: {gateOpening}%
            </label>
            <motion.input
              type="range"
              min="0"
              max="100"
              value={gateOpening}
              onChange={(e) => setGateOpening(Number(e.target.value))}
              style={{ width: '100%', height: 8, borderRadius: 4, cursor: 'pointer' }}
              transition={{ type: 'spring', damping: 0.3 }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ color: 'white', display: 'block', marginBottom: 8, fontSize: 14 }}>
              叶片角度: {bladeAngle}°
            </label>
            <motion.input
              type="range"
              min="5"
              max="45"
              value={bladeAngle}
              onChange={(e) => setBladeAngle(Number(e.target.value))}
              style={{ width: '100%', height: 8, borderRadius: 4, cursor: 'pointer' }}
              transition={{ type: 'spring', damping: 0.3 }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ color: 'white', display: 'block', marginBottom: 8, fontSize: 14 }}>
              齿轮比
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {gearRatios.map((ratio) => (
                <motion.button
                  key={ratio}
                  onClick={() => setGearRatio(ratio)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', damping: 0.3 }}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    borderRadius: 6,
                    border: 'none',
                    background: gearRatio === ratio ? '#4a90d9' : '#333',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: gearRatio === ratio ? 'bold' : 'normal'
                  }}
                >
                  1:{ratio}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function StatsPanel() {
  const { poundingFrequency, impulse, fps } = useSimulation(
    useStore((state) => state.gateOpening),
    useStore((state) => state.bladeAngle),
    useStore((state) => state.gearRatio)
  )

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '12px 20px',
          borderRadius: 8,
          zIndex: 100,
          fontFamily: 'monospace'
        }}
      >
        <div style={{ color: fps < 50 ? '#ff0000' : '#00ff00', fontSize: 18, fontWeight: 'bold' }}>
          FPS: {fps}
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '16px 24px',
          borderRadius: 8,
          zIndex: 100,
          color: 'white'
        }}
      >
        <div style={{ marginBottom: 8, fontSize: 14 }}>
          捣击频率: <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{poundingFrequency.toFixed(2)} Hz</span>
        </div>
        <div style={{ fontSize: 14 }}>
          冲量: <span style={{ color: '#ffd700', fontWeight: 'bold' }}>{impulse.toFixed(2)} N·s</span>
        </div>
      </div>
    </>
  )
}

export default function App() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [8, 6, 10], fov: 50 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#87ceeb']} />
        <fog attach="fog" args={['#87ceeb', 20, 50]} />
        <Scene />
      </Canvas>
      <StatsPanel />
      <ControlPanel />
    </div>
  )
}
