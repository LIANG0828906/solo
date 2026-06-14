import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import ObservationChamber from './ObservationChamber'
import SeaCreatureManager from './SeaCreatureManager'
import { useStore, Coral } from '@/store/useStore'
import { createNoise2D } from '@/utils/noise'
import axios from 'axios'

interface CoralInstance {
  id: string
  coralId: string
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: number
  color: string
  type: string
}

function Terrain() {
  const meshRef = useRef<THREE.Mesh>(null)
  const noise2D = useMemo(() => createNoise2D(123), [])
  const noise2D2 = useMemo(() => createNoise2D(456), [])
  const size = 400
  const segments = 256

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments)
    const positions = geo.attributes.position
    const colors = new Float32Array(positions.count * 3)

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)

      const height1 = noise2D(x * 0.008, y * 0.008) * 25
      const height2 = noise2D2(x * 0.02, y * 0.02) * 8
      const height3 = noise2D(x * 0.05, y * 0.05) * 2
      const height = height1 + height2 + height3

      positions.setZ(i, -80 + height)

      const depthFactor = Math.max(0, Math.min(1, (-height - 5) / 40))
      const r = 0.05 + depthFactor * 0.1
      const g = 0.15 + depthFactor * 0.25
      const b = 0.25 + depthFactor * 0.35

      colors[i * 3] = r
      colors[i * 3 + 1] = g
      colors[i * 3 + 2] = b
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [noise2D, noise2D2])

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  )
}

function SeaGrass() {
  const groupRef = useRef<THREE.Group>(null)
  const noise2D = useMemo(() => createNoise2D(789), [])
  const instances = useMemo(() => {
    const data: { position: THREE.Vector3; rotation: number; height: number; color: string }[] = []
    for (let i = 0; i < 300; i++) {
      const x = (Math.random() - 0.5) * 300
      const z = (Math.random() - 0.5) * 300
      const h = noise2D(x * 0.008, z * 0.008) * 25 + noise2D(x * 0.02, z * 0.02) * 8
      const y = -80 + h
      if (y > -50 && Math.random() > 0.5) {
        data.push({
          position: new THREE.Vector3(x, y, z),
          rotation: Math.random() * Math.PI * 2,
          height: 1 + Math.random() * 4,
          color: `hsl(${100 + Math.random() * 40}, ${60 + Math.random() * 30}%, ${25 + Math.random() * 20}%)`
        })
      }
    }
    return data
  }, [noise2D])

  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.elapsedTime
    groupRef.current.children.forEach((child, i) => {
      const sway = Math.sin(time * 1.5 + i * 0.5) * 0.15
      child.rotation.z = sway
    })
  })

  return (
    <group ref={groupRef}>
      {instances.map((inst, i) => (
        <mesh key={i} position={inst.position} rotation={[0, inst.rotation, 0]}>
          <cylinderGeometry args={[0.05, 0.15, inst.height, 4]} />
          <meshStandardMaterial color={inst.color} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

function Corals() {
  const [coralInstances, setCoralInstances] = useState<CoralInstance[]>([])
  const corals = useStore((s) => s.corals)
  const setCorals = useStore((s) => s.actions.setCorals)
  const selectedCreatureId = useStore((s) => s.selectedCreatureId)
  const setSelectedCreatureId = useStore((s) => s.actions.setSelectedCreatureId)
  const noise2D = useMemo(() => createNoise2D(321), [])
  const noise2D2 = useMemo(() => createNoise2D(654), [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/corals')
        const data: Coral[] = res.data
        setCorals(data)

        const instances: CoralInstance[] = []
        data.forEach((coral) => {
          for (let i = 0; i < 8; i++) {
            const x = (Math.random() - 0.5) * 250
            const z = (Math.random() - 0.5) * 250
            const h1 = noise2D(x * 0.008, z * 0.008) * 25
            const h2 = noise2D2(x * 0.02, z * 0.02) * 8
            const y = -80 + h1 + h2

            if (y > -70) {
              instances.push({
                id: `${coral.id}-${i}`,
                coralId: coral.id,
                position: new THREE.Vector3(x, y, z),
                rotation: new THREE.Euler(0, Math.random() * Math.PI * 2, 0),
                scale: 0.6 + Math.random() * 1.2,
                color: coral.color,
                type: coral.id
              })
            }
          }
        })
        setCoralInstances(instances)
      } catch (e) {
        console.error('Failed to fetch corals:', e)
      }
    }
    fetchData()
  }, [setCorals, noise2D, noise2D2])

  const renderCoralShape = (type: string, scale: number, color: string) => {
    switch (type) {
      case 'braincoral':
        return (
          <mesh>
            <sphereGeometry args={[scale * 0.8, 16, 12]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
        )
      case 'staghorn':
        return (
          <group>
            {[0, 0.5, -0.5, 0.3, -0.3].map((offset, i) => (
              <mesh key={i} position={[offset * scale, scale * 0.5, offset * scale * 0.5]} rotation={[0, 0, offset * 0.5]}>
                <cylinderGeometry args={[scale * 0.08, scale * 0.12, scale * 1.5, 6]} />
                <meshStandardMaterial color={color} roughness={0.8} />
              </mesh>
            ))}
            <mesh position={[0, scale * 0.3, 0]}>
              <cylinderGeometry args={[scale * 0.15, scale * 0.2, scale * 0.8, 6]} />
              <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
          </group>
        )
      case 'tablecoral':
        return (
          <group>
            <mesh position={[0, scale * 0.4, 0]}>
              <cylinderGeometry args={[scale * 0.1, scale * 0.15, scale * 0.8, 8]} />
              <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
            <mesh position={[0, scale * 0.85, 0]}>
              <cylinderGeometry args={[scale * 1.0, scale * 0.9, scale * 0.15, 16]} />
              <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
          </group>
        )
      case 'fan coral':
        return (
          <group>
            <mesh position={[0, scale * 0.3, 0]}>
              <cylinderGeometry args={[scale * 0.08, scale * 0.12, scale * 0.6, 6]} />
              <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
            <mesh position={[0, scale * 1.0, 0]}>
              <ringGeometry args={[scale * 0.3, scale * 1.2, 16]} />
              <meshStandardMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.85} />
            </mesh>
          </group>
        )
      case 'mushroom':
        return (
          <mesh position={[0, scale * 0.2, 0]}>
            <sphereGeometry args={[scale * 0.8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
        )
      default:
        return (
          <mesh>
            <sphereGeometry args={[scale * 0.8, 16, 12]} />
            <meshStandardMaterial color={color} />
          </mesh>
        )
    }
  }

  return (
    <group>
      {coralInstances.map((inst) => (
        <group
          key={inst.id}
          position={inst.position}
          rotation={inst.rotation}
          onClick={(e) => {
            e.stopPropagation()
            setSelectedCreatureId(selectedCreatureId === inst.coralId ? null : inst.coralId)
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'default'
          }}
        >
          {selectedCreatureId === inst.coralId && (
            <mesh>
              <sphereGeometry args={[inst.scale * 2, 32, 32]} />
              <meshBasicMaterial
                color="#4dd0e1"
                transparent
                opacity={0.2}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
          {renderCoralShape(inst.type, inst.scale, inst.color)}
        </group>
      ))}
    </group>
  )
}

function WaterParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  const count = 1500

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const siz = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 350
      pos[i * 3 + 1] = -Math.random() * 110
      pos[i * 3 + 2] = (Math.random() - 0.5) * 350
      siz[i] = 0.1 + Math.random() * 0.3
    }
    return [pos, siz]
  }, [])

  useFrame((state) => {
    if (!pointsRef.current) return
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    const time = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      positions[i * 3] += Math.sin(time * 0.2 + i * 0.01) * 0.01
      positions[i * 3 + 1] += Math.sin(time * 0.15 + i * 0.015) * 0.008
      positions[i * 3 + 2] += Math.cos(time * 0.1 + i * 0.02) * 0.01
      if (positions[i * 3 + 1] > 0) positions[i * 3 + 1] = -110
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#aaddff"
        size={0.2}
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  )
}

function DepthLighting() {
  const { scene } = useThree()
  const depth = useStore((s) => s.depth)
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const dirRef = useRef<THREE.DirectionalLight>(null)

  useFrame(() => {
    const depthFactor = Math.min(1, depth / 80)
    const shallowColor = new THREE.Color(0x87ceeb)
    const midColor = new THREE.Color(0x1a4d7a)
    const deepColor = new THREE.Color(0x0a1f2e)

    let bgColor: THREE.Color
    if (depthFactor < 0.3) {
      bgColor = shallowColor.clone().lerp(midColor, depthFactor / 0.3)
    } else {
      bgColor = midColor.clone().lerp(deepColor, (depthFactor - 0.3) / 0.7)
    }
    scene.background = bgColor
    scene.fog = new THREE.FogExp2(bgColor.getHex(), 0.008 + depthFactor * 0.012)

    if (ambientRef.current) {
      const ambientIntensity = Math.max(0.15, 0.8 - depthFactor * 0.6)
      ambientRef.current.intensity = ambientIntensity
      ambientRef.current.color.copy(bgColor).offsetHSL(0.05, 0.1, 0.1)
    }
    if (dirRef.current) {
      dirRef.current.intensity = Math.max(0.2, 1.2 - depthFactor * 1.0)
      const lightColor = new THREE.Color(0xffffee).lerp(new THREE.Color(0x66ccff), depthFactor)
      dirRef.current.color.copy(lightColor)
    }
  })

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.8} color="#88ccff" />
      <directionalLight
        ref={dirRef}
        position={[50, 80, 50]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, -20, 0]} intensity={0.4} color="#4dd0e1" distance={100} />
    </>
  )
}

function ClickHandler() {
  const setSelectedCreatureId = useStore((s) => s.actions.setSelectedCreatureId)
  return (
    <mesh
      onClick={() => setSelectedCreatureId(null)}
      position={[0, -1000, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[5000, 5000]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}

export default function EcoSystem() {
  return (
    <Canvas
      camera={{ fov: 70, near: 0.1, far: 1000 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      }}
    >
      <ClickHandler />
      <DepthLighting />
      <Terrain />
      <SeaGrass />
      <Corals />
      <SeaCreatureManager />
      <WaterParticles />
      <ObservationChamber />
    </Canvas>
  )
}
