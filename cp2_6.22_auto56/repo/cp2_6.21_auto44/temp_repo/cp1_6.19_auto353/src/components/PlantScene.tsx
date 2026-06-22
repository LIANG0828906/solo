import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useSimStore } from '@/store/useSimStore'

function kelvinToRGB(kelvin: number): THREE.Color {
  const temp = kelvin / 100
  let r, g, b

  if (temp <= 66) {
    r = 255
    g = Math.min(255, Math.max(0, 99.4708025861 * Math.log(temp) - 161.1195681661))
  } else {
    r = Math.min(255, Math.max(0, 329.698727446 * Math.pow(temp - 60, -0.1332047592)))
    g = Math.min(255, Math.max(0, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)))
  }

  if (temp >= 66) {
    b = 255
  } else if (temp <= 19) {
    b = 0
  } else {
    b = Math.min(255, Math.max(0, 138.5177312231 * Math.log(temp - 10) - 305.0447927307))
  }

  return new THREE.Color(r / 255, g / 255, b / 255)
}

function Leaf({ 
  position, 
  rotation, 
  scale, 
  color, 
  curvature,
  index 
}: { 
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color: string
  curvature: number
  index: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const targetColor = useRef(new THREE.Color(color))
  const currentColor = useRef(new THREE.Color(color))

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
    geo.scale(1.5, 0.1, 1)
    
    const positions = geo.attributes.position
    const originalPositions = new Float32Array(positions.array)
    
    for (let i = 0; i < positions.count; i++) {
      const y = originalPositions[i * 3 + 1]
      const x = originalPositions[i * 3]
      const z = originalPositions[i * 3 + 2]
      
      const distFromCenter = Math.sqrt(x * x + z * z)
      const edgeFactor = Math.min(1, distFromCenter / 1.5)
      const curlAmount = curvature * edgeFactor * 0.5
      
      positions.setY(i, y - curlAmount * distFromCenter)
      positions.setX(i, x * (1 - curlAmount * 0.1))
      positions.setZ(i, z * (1 - curlAmount * 0.1))
    }
    
    geo.computeVertexNormals()
    return geo
  }, [curvature])

  useEffect(() => {
    targetColor.current.set(color)
  }, [color])

  useFrame((_, delta) => {
    if (materialRef.current) {
      currentColor.current.lerp(targetColor.current, delta * 3)
      materialRef.current.color.copy(currentColor.current)
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.02 * (index % 2 === 0 ? 1 : -1)
    }
  })

  return (
    <mesh 
      ref={meshRef} 
      position={position} 
      rotation={rotation} 
      scale={scale}
      geometry={geometry}
    >
      <meshStandardMaterial 
        ref={materialRef}
        color={color} 
        side={THREE.DoubleSide}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  )
}

function Pot() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[1.2, 1, 3, 32]} />
        <meshStandardMaterial color="#8D6E63" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.8, 0]}>
        <cylinderGeometry args={[1.15, 1.15, 0.3, 32]} />
        <meshStandardMaterial color="#6D4C41" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.9, 0]}>
        <cylinderGeometry args={[1.05, 1.05, 0.2, 32]} />
        <meshStandardMaterial color="#3E2723" roughness={0.95} />
      </mesh>
    </group>
  )
}

function Stem({ height }: { height: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const targetHeight = useRef(height)
  const currentHeight = useRef(height)

  useEffect(() => {
    targetHeight.current = height
  }, [height])

  useFrame((_, delta) => {
    currentHeight.current += (targetHeight.current - currentHeight.current) * delta * 2
    if (groupRef.current) {
      groupRef.current.scale.y = currentHeight.current / 30
    }
  })

  return (
    <group ref={groupRef} position={[0, 3, 0]}>
      <mesh position={[0, 5, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 10, 16]} />
        <meshStandardMaterial color="#5D4037" roughness={0.85} />
      </mesh>
    </group>
  )
}

function Plant() {
  const { plantState, lightParams } = useSimStore()
  const leafCount = Math.floor(plantState.leafCount)
  
  const leaves = useMemo(() => {
    const result = []
    const heightScale = plantState.stemHeight / 30
    const areaScale = Math.sqrt(plantState.avgLeafArea / 25)
    
    for (let i = 0; i < leafCount; i++) {
      const angle = (i / leafCount) * Math.PI * 2
      const heightLevel = 3 + (i % 3) * 2.5 * heightScale
      const radius = 0.8 + (i % 3) * 0.3
      
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      
      const tiltX = (Math.random() - 0.5) * 0.3
      const tiltZ = (Math.random() - 0.5) * 0.3
      
      result.push({
        position: [x, heightLevel, z] as [number, number, number],
        rotation: [tiltX, angle, tiltZ] as [number, number, number],
        scale: [areaScale, areaScale, areaScale] as [number, number, number],
        index: i
      })
    }
    return result
  }, [leafCount, plantState.stemHeight, plantState.avgLeafArea])

  return (
    <group>
      <Pot />
      <Stem height={plantState.stemHeight} />
      {leaves.map((leaf, i) => (
        <Leaf
          key={i}
          position={leaf.position}
          rotation={leaf.rotation}
          scale={leaf.scale}
          color={plantState.leafColor}
          curvature={plantState.leafCurvature}
          index={leaf.index}
        />
      ))}
    </group>
  )
}

function Lighting() {
  const { lightParams } = useSimStore()
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const ambientRef = useRef<THREE.AmbientLight>(null)
  
  const targetPosition = useMemo(() => {
    const angleRad = (lightParams.angle * Math.PI) / 180
    const height = 8
    const radius = 10
    return [
      Math.cos(angleRad) * radius,
      height,
      Math.sin(angleRad) * radius
    ] as [number, number, number]
  }, [lightParams.angle])

  const lightColor = useMemo(() => {
    return kelvinToRGB(lightParams.colorTemp)
  }, [lightParams.colorTemp])

  const intensity = useMemo(() => {
    return 0.3 + (lightParams.intensity / 1000) * 2.5
  }, [lightParams.intensity])

  useFrame((_, delta) => {
    if (lightRef.current) {
      lightRef.current.position.lerp(
        new THREE.Vector3(...targetPosition),
        delta * 3
      )
      lightRef.current.intensity += (intensity - lightRef.current.intensity) * delta * 3
      lightRef.current.color.lerp(lightColor, delta * 3)
    }
    if (ambientRef.current) {
      const ambientIntensity = 0.2 + (lightParams.intensity / 1000) * 0.3
      ambientRef.current.intensity += (ambientIntensity - ambientRef.current.intensity) * delta * 3
    }
  })

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.3} color="#ffffff" />
      <directionalLight
        ref={lightRef}
        position={targetPosition}
        intensity={intensity}
        color={lightColor}
        castShadow
      />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#87CEEB" />
    </>
  )
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <circleGeometry args={[15, 64]} />
      <meshStandardMaterial color="#F5F5DC" roughness={0.9} />
    </mesh>
  )
}

export default function PlantScene() {
  return (
    <Canvas
      camera={{ position: [8, 8, 8], fov: 50 }}
      shadows
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['transparent']} />
      <Lighting />
      <Plant />
      <Ground />
      <OrbitControls 
        enablePan={false} 
        minDistance={5} 
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.2}
      />
    </Canvas>
  )
}
