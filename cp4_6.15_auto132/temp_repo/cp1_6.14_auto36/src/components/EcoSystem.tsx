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
  const depth = useStore((s) => s.depth)
  const baseColorsRef = useRef<Float32Array | null>(null)

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

      const localDepthFactor = Math.max(0, Math.min(1, (-height) / 50))
      colors[i * 3] = 0.04 + localDepthFactor * 0.08
      colors[i * 3 + 1] = 0.12 + localDepthFactor * 0.18
      colors[i * 3 + 2] = 0.22 + localDepthFactor * 0.25
    }

    baseColorsRef.current = new Float32Array(colors)
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [noise2D, noise2D2])

  useFrame(() => {
    if (!meshRef.current || !baseColorsRef.current) return
    const colorAttr = meshRef.current.geometry.attributes.color as THREE.BufferAttribute
    const colors = colorAttr.array as Float32Array
    const base = baseColorsRef.current
    const globalDepthFactor = Math.min(1, depth / 80)
    const darken = 1 - globalDepthFactor * 0.55
    const blueShift = globalDepthFactor * 0.15

    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = base[i] * darken
      colors[i + 1] = base[i + 1] * darken
      colors[i + 2] = Math.min(1, base[i + 2] * darken + blueShift)
    }
    colorAttr.needsUpdate = true
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        roughness={0.95}
        metalness={0.05}
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
      if (y > -55 && Math.random() > 0.5) {
        data.push({
          position: new THREE.Vector3(x, y, z),
          rotation: Math.random() * Math.PI * 2,
          height: 1.5 + Math.random() * 4.5,
          color: `hsl(${95 + Math.random() * 50}, ${55 + Math.random() * 35}%, ${22 + Math.random() * 22}%)`
        })
      }
    }
    return data
  }, [noise2D])

  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.elapsedTime
    groupRef.current.children.forEach((child, i) => {
      const sway = Math.sin(time * 1.8 + i * 0.45) * 0.2
      const sway2 = Math.cos(time * 1.2 + i * 0.6) * 0.1
      child.rotation.z = sway
      child.rotation.x = sway2
    })
  })

  return (
    <group ref={groupRef}>
      {instances.map((inst, i) => (
        <mesh key={i} position={inst.position} rotation={[0, inst.rotation, 0]}>
          <cylinderGeometry args={[0.06, 0.18, inst.height, 5]} />
          <meshStandardMaterial color={inst.color} side={THREE.DoubleSide} roughness={0.8} />
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
          for (let i = 0; i < 10; i++) {
            const x = (Math.random() - 0.5) * 260
            const z = (Math.random() - 0.5) * 260
            const h1 = noise2D(x * 0.008, z * 0.008) * 25
            const h2 = noise2D2(x * 0.02, z * 0.02) * 8
            const y = -80 + h1 + h2

            if (y > -72) {
              instances.push({
                id: `${coral.id}-${i}`,
                coralId: coral.id,
                position: new THREE.Vector3(x, y, z),
                rotation: new THREE.Euler(0, Math.random() * Math.PI * 2, 0),
                scale: 0.7 + Math.random() * 1.5,
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
            <sphereGeometry args={[scale * 0.85, 20, 14]} />
            <meshStandardMaterial color={color} roughness={0.92} />
          </mesh>
        )
      case 'staghorn':
        return (
          <group>
            {[0, 0.4, -0.4, 0.25, -0.25, 0.6, -0.6].map((offset, i) => (
              <mesh key={i} position={[offset * scale, scale * 0.6, offset * scale * 0.6]} rotation={[0, i * 0.4, offset * 0.6]}>
                <cylinderGeometry args={[scale * 0.07, scale * 0.13, scale * 1.7, 6]} />
                <meshStandardMaterial color={color} roughness={0.85} />
              </mesh>
            ))}
            <mesh position={[0, scale * 0.35, 0]}>
              <cylinderGeometry args={[scale * 0.17, scale * 0.24, scale * 0.9, 6]} />
              <meshStandardMaterial color={color} roughness={0.85} />
            </mesh>
          </group>
        )
      case 'tablecoral':
        return (
          <group>
            <mesh position={[0, scale * 0.45, 0]}>
              <cylinderGeometry args={[scale * 0.11, scale * 0.17, scale * 0.9, 8]} />
              <meshStandardMaterial color={color} roughness={0.85} />
            </mesh>
            <mesh position={[0, scale * 0.95, 0]}>
              <cylinderGeometry args={[scale * 1.1, scale * 0.95, scale * 0.2, 20]} />
              <meshStandardMaterial color={color} roughness={0.75} />
            </mesh>
          </group>
        )
      case 'fan coral':
        return (
          <group>
            <mesh position={[0, scale * 0.35, 0]}>
              <cylinderGeometry args={[scale * 0.09, scale * 0.14, scale * 0.7, 6]} />
              <meshStandardMaterial color={color} roughness={0.75} />
            </mesh>
            <mesh position={[0, scale * 1.1, 0]}>
              <ringGeometry args={[scale * 0.35, scale * 1.35, 24]} />
              <meshStandardMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.88} />
            </mesh>
            <mesh position={[0, scale * 1.1, 0]} rotation={[0, Math.PI / 2, 0]}>
              <ringGeometry args={[scale * 0.35, scale * 1.35, 24]} />
              <meshStandardMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.6} />
            </mesh>
          </group>
        )
      case 'mushroom':
        return (
          <mesh position={[0, scale * 0.2, 0]}>
            <sphereGeometry args={[scale * 0.9, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={color} roughness={0.92} />
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
              <sphereGeometry args={[inst.scale * 2.2, 32, 32]} />
              <meshBasicMaterial
                color="#4dd0e1"
                transparent
                opacity={0.22}
                side={THREE.BackSide}
              />
            </mesh>
          )}
          {selectedCreatureId === inst.coralId && (
            <mesh>
              <ringGeometry args={[inst.scale * 1.5, inst.scale * 1.9, 48]} />
              <meshBasicMaterial
                color="#4dd0e1"
                transparent
                opacity={0.55}
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

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 360
      pos[i * 3 + 1] = -Math.random() * 115
      pos[i * 3 + 2] = (Math.random() - 0.5) * 360
    }
    return [pos]
  }, [])

  useFrame((state) => {
    if (!pointsRef.current) return
    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array
    const time = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      posArr[i * 3] += Math.sin(time * 0.25 + i * 0.01) * 0.012
      posArr[i * 3 + 1] += 0.006 + Math.sin(time * 0.12 + i * 0.015) * 0.008
      posArr[i * 3 + 2] += Math.cos(time * 0.15 + i * 0.02) * 0.012
      if (posArr[i * 3 + 1] > -2) {
        posArr[i * 3 + 1] = -115
        posArr[i * 3] = (Math.random() - 0.5) * 360
        posArr[i * 3 + 2] = (Math.random() - 0.5) * 360
      }
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
      </bufferGeometry>
      <pointsMaterial
        color="#aaddff"
        size={0.25}
        transparent
        opacity={0.5}
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
  const hemiRef = useRef<THREE.HemisphereLight>(null)

  useFrame(() => {
    const depthFactor = Math.min(1, depth / 80)
    const shallowColor = new THREE.Color(0x7ec8e3)
    const midColor = new THREE.Color(0x0f3d5c)
    const deepColor = new THREE.Color(0x071a1f)

    let bgColor: THREE.Color
    if (depthFactor < 0.35) {
      bgColor = shallowColor.clone().lerp(midColor, depthFactor / 0.35)
    } else {
      bgColor = midColor.clone().lerp(deepColor, (depthFactor - 0.35) / 0.65)
    }
    scene.background = bgColor
    scene.fog = new THREE.FogExp2(bgColor.getHex(), 0.009 + depthFactor * 0.015)

    if (ambientRef.current) {
      const ambientIntensity = Math.max(0.12, 0.75 - depthFactor * 0.6)
      ambientRef.current.intensity = ambientIntensity
      const tint = bgColor.clone().offsetHSL(0.05, 0.08, 0.08)
      ambientRef.current.color.copy(tint)
    }
    if (dirRef.current) {
      dirRef.current.intensity = Math.max(0.15, 1.1 - depthFactor * 0.95)
      const lightColor = new THREE.Color(0xffffee).lerp(new THREE.Color(0x66ccff), depthFactor)
      dirRef.current.color.copy(lightColor)
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = Math.max(0.05, 0.35 - depthFactor * 0.3)
    }
  })

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.75} color="#99ccff" />
      <hemisphereLight ref={hemiRef} args={['#88ccff', '#113344', 0.35]} />
      <directionalLight
        ref={dirRef}
        position={[60, 90, 60]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, -25, 0]} intensity={0.5} color="#4dd0e1" distance={120} />
    </>
  )
}

function SceneGround() {
  const setSelectedCreatureId = useStore((s) => s.actions.setSelectedCreatureId)
  return (
    <mesh
      onClick={(e) => {
        e.stopPropagation()
        setSelectedCreatureId(null)
      }}
      position={[0, -150, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[2000, 2000]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}

export default function EcoSystem() {
  const setSelectedCreatureId = useStore((s) => s.actions.setSelectedCreatureId)

  return (
    <Canvas
      camera={{ fov: 70, near: 0.1, far: 1500, position: [0, -20, 0] }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      onCreated={({ gl, scene }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.1
        scene.onPointerMissed = () => {
          setSelectedCreatureId(null)
        }
      }}
      onPointerMissed={() => setSelectedCreatureId(null)}
    >
      <SceneGround />
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
