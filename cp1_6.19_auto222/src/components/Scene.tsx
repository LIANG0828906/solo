import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { useConfigStore, EnvironmentType } from '../store/useConfigStore'

function getEnvironmentColors(environment: EnvironmentType) {
  switch (environment) {
    case 'sunset':
      return {
        top: '#FF7E5F',
        bottom: '#FEB47B',
        ambient: '#FFB366',
        keyLight: '#FFE4B5',
        fillLight: '#FF6B6B',
        rimLight: '#FFD93D',
        bgTop: '#2D1B3D',
        bgBottom: '#0D1117',
      }
    case 'neon':
      return {
        top: '#6366F1',
        bottom: '#0F0F23',
        ambient: '#6366F1',
        keyLight: '#A5B4FC',
        fillLight: '#F472B6',
        rimLight: '#34D399',
        bgTop: '#0A0A1A',
        bgBottom: '#050510',
      }
    default:
      return {
        top: '#E0E0E0',
        bottom: '#2A2A3A',
        ambient: '#FFFFFF',
        keyLight: '#FFFFFF',
        fillLight: '#C0C0C0',
        rimLight: '#E0E0E0',
        bgTop: '#1A1D2E',
        bgBottom: '#0D1117',
      }
  }
}

function SpeakerModel() {
  const groupRef = useRef<THREE.Group>(null)
  const { color, material } = useConfigStore()
  const [showIntro, setShowIntro] = useState(true)
  const introStartTime = useRef<number>(Date.now())
  const targetColor = useRef(new THREE.Color(color))
  const currentColor = useRef(new THREE.Color(color))
  const targetRoughness = useRef(0.6)
  const currentRoughness = useRef(0.6)
  const targetMetalness = useRef(0.05)
  const currentMetalness = useRef(0.05)

  const speakerMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: currentColor.current,
      roughness: currentRoughness.current,
      metalness: currentMetalness.current,
    })
  }, [])

  useEffect(() => {
    targetColor.current.set(color)
    
    switch (material) {
      case 'matte':
        targetColor.current.set(color)
        targetRoughness.current = 0.85
        targetMetalness.current = 0.1
        break
      case 'walnut':
        targetColor.current.set('#5D4037').multiply(new THREE.Color(color))
        targetRoughness.current = 0.6
        targetMetalness.current = 0.05
        break
      case 'mirror':
        targetColor.current.set('#E0E0E0').lerp(new THREE.Color(color), 0.3)
        targetRoughness.current = 0.1
        targetMetalness.current = 0.95
        break
    }
  }, [color, material])

  const coneMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.9,
      metalness: 0.1,
    })
  }, [])

  const metalMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#B0B0B0',
      roughness: 0.3,
      metalness: 0.8,
    })
  }, [])

  const knobMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#8B8B8B',
      roughness: 0.4,
      metalness: 0.6,
    })
  }, [])

  const grilleMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#0a0a0a',
      roughness: 0.95,
      metalness: 0.05,
    })
  }, [])

  useFrame((_, delta) => {
    if (groupRef.current && showIntro) {
      const elapsed = Date.now() - introStartTime.current
      const duration = 4000
      
      if (elapsed < duration) {
        const progress = elapsed / duration
        const easeProgress = 1 - Math.pow(1 - progress, 3)
        groupRef.current.rotation.y = easeProgress * Math.PI * 2
      } else {
        groupRef.current.rotation.y = Math.PI * 2
        setShowIntro(false)
      }
    }

    currentColor.current.lerp(targetColor.current, delta * 5)
    currentRoughness.current += (targetRoughness.current - currentRoughness.current) * Math.min(delta * 5, 1)
    currentMetalness.current += (targetMetalness.current - currentMetalness.current) * Math.min(delta * 5, 1)
    
    speakerMaterial.color.copy(currentColor.current)
    speakerMaterial.roughness = currentRoughness.current
    speakerMaterial.metalness = currentMetalness.current
    speakerMaterial.needsUpdate = true
  })

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 3, 1.2]} />
        <primitive object={speakerMaterial} attach="material" />
      </mesh>

      <mesh position={[0, 0, 0.61]} castShadow>
        <boxGeometry args={[1.9, 2.9, 0.05]} />
        <primitive object={grilleMaterial} attach="material" />
      </mesh>

      <mesh position={[0, 0.7, 0.65]} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.08, 64]} />
        <meshStandardMaterial color="#111111" roughness={0.8} metalness={0.2} />
      </mesh>
      
      <mesh position={[0, 0.7, 0.69]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.03, 64]} />
        <primitive object={coneMaterial} attach="material" />
      </mesh>

      <mesh position={[0, 0.7, 0.71]}>
        <circleGeometry args={[0.2, 64]} />
        <meshStandardMaterial color="#222222" roughness={0.7} metalness={0.3} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, 0.7, 0.73]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 32]} />
        <primitive object={metalMaterial} attach="material" />
      </mesh>

      <mesh position={[0, -0.6, 0.65]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.06, 64]} />
        <meshStandardMaterial color="#111111" roughness={0.8} metalness={0.2} />
      </mesh>
      
      <mesh position={[0, -0.6, 0.68]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.02, 64]} />
        <primitive object={coneMaterial} attach="material" />
      </mesh>

      <mesh position={[0, -0.6, 0.7]}>
        <circleGeometry args={[0.12, 64]} />
        <meshStandardMaterial color="#222222" roughness={0.7} metalness={0.3} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, -0.6, 0.72]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 32]} />
        <primitive object={metalMaterial} attach="material" />
      </mesh>

      <group position={[0, 1.2, 0.65]}>
        {[-0.4, 0, 0.4].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.04, 32]} />
            <primitive object={knobMaterial} attach="material" />
          </mesh>
        ))}
        {[-0.4, 0, 0.4].map((x, i) => (
          <mesh key={`line-${i}`} position={[x, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <boxGeometry args={[0.008, 0.04, 0.005]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        ))}
      </group>

      <group position={[0, -1.1, 0.65]}>
        {[-0.3, 0.3].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <ringGeometry args={[0.04, 0.055, 32]} />
            <meshStandardMaterial color="#444444" side={THREE.DoubleSide} metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        {[-0.3, 0.3].map((x, i) => (
          <mesh key={`inner-${i}`} position={[x, 0, 0.01]}>
            <circleGeometry args={[0.035, 32]} />
            <meshStandardMaterial color="#111111" side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      <mesh position={[-0.6, -1.1, 0.66]} castShadow>
        <boxGeometry args={[0.08, 0.03, 0.01]} />
        <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.4} />
      </mesh>

      <mesh position={[0, -1.55, 0]} receiveShadow>
        <boxGeometry args={[2.2, 0.1, 1.4]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} metalness={0.1} />
      </mesh>

      <mesh position={[-0.9, -1.55, 0.5]} castShadow>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
        <meshStandardMaterial color="#333333" roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh position={[0.9, -1.55, 0.5]} castShadow>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
        <meshStandardMaterial color="#333333" roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh position={[-0.9, -1.55, -0.5]} castShadow>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
        <meshStandardMaterial color="#333333" roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh position={[0.9, -1.55, -0.5]} castShadow>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
        <meshStandardMaterial color="#333333" roughness={0.8} metalness={0.2} />
      </mesh>
    </group>
  )
}

function SceneContent() {
  const { environment } = useConfigStore()
  
  const envColors = useMemo(() => getEnvironmentColors(environment), [environment])

  return (
    <>
      <ambientLight intensity={0.35} color={envColors.ambient} />
      
      <hemisphereLight
        args={[envColors.top, envColors.bottom, 0.6]}
      />
      
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        color={envColors.keyLight}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      <directionalLight
        position={[-5, 3, -5]}
        intensity={0.6}
        color={envColors.fillLight}
      />

      <pointLight
        position={[0, 5, -5]}
        intensity={0.4}
        color={envColors.rimLight}
      />

      <pointLight
        position={[-3, 2, 3]}
        intensity={0.3}
        color={envColors.fillLight}
      />

      <SpeakerModel />

      <ContactShadows
        position={[0, -1.65, 0]}
        opacity={0.5}
        scale={10}
        blur={2}
        far={4}
      />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={12}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.5}
        enableDamping
        dampingFactor={0.05}
        enableRotate={true}
        enableZoom={true}
      />
    </>
  )
}

export function Scene() {
  const { environment } = useConfigStore()

  const envColors = useMemo(() => getEnvironmentColors(environment), [environment])

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true, pixelRatio: Math.min(window.devicePixelRatio, 2) }}
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(180deg, ${envColors.bgTop} 0%, ${envColors.bgBottom} 100%)`,
      }}
    >
      <SceneContent />
    </Canvas>
  )
}

export default Scene
