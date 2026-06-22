import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWaterfallStore, Rock } from './store'

interface RockMeshProps {
  rock: Rock
  onClick: () => void
  onPointerOver: () => void
  onPointerOut: () => void
}

function RockMesh({ rock, onClick, onPointerOver, onPointerOut }: RockMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const geometryRef = useRef<THREE.IcosahedronGeometry | null>(null)
  const originalPositions = useRef<Float32Array | null>(null)

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(rock.radius, 3)
    const pos = geo.attributes.position.array as Float32Array
    originalPositions.current = pos.slice()

    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i]
      const y = pos[i + 1]
      const z = pos[i + 2]
      const noise = (Math.random() - 0.5) * rock.roughness * 0.5
      const len = Math.sqrt(x * x + y * y + z * z)
      pos[i] = (x / len) * (rock.radius + noise)
      pos[i + 1] = (y / len) * (rock.radius + noise)
      pos[i + 2] = (z / len) * (rock.radius + noise)
    }

    geo.computeVertexNormals()
    geometryRef.current = geo
    return geo
  }, [rock.radius, rock.roughness])

  useEffect(() => {
    if (!geometryRef.current || !originalPositions.current) return

    const startTime = performance.now()
    const duration = 200
    const pos = geometryRef.current.attributes.position.array as Float32Array
    const original = originalPositions.current
    const targetPos = new Float32Array(original.length)

    for (let i = 0; i < original.length; i += 3) {
      const x = original[i]
      const y = original[i + 1]
      const z = original[i + 2]
      const noise = (Math.sin(i * 0.1) * 0.5 + 0.5) * rock.roughness * 0.5
      const len = Math.sqrt(x * x + y * y + z * z)
      targetPos[i] = (x / len) * (rock.radius + noise)
      targetPos[i + 1] = (y / len) * (rock.radius + noise)
      targetPos[i + 2] = (z / len) * (rock.radius + noise)
    }

    const startPos = pos.slice()

    const animate = () => {
      const elapsed = performance.now() - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)

      for (let i = 0; i < pos.length; i++) {
        pos[i] = startPos[i] + (targetPos[i] - startPos[i]) * eased
      }

      geometryRef.current!.attributes.position.needsUpdate = true
      geometryRef.current!.computeVertexNormals()

      if (t < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [rock.roughness, rock.radius])

  useFrame(() => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial
      const targetEmissive = rock.isHovered ? new THREE.Color(0xffd700) : new THREE.Color(0x000000)
      material.emissive.lerp(targetEmissive, 0.1)
      material.emissiveIntensity = rock.isHovered ? 0.3 : 0
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={[rock.position.x, rock.position.y, rock.position.z]}
      geometry={geometry}
      castShadow
      receiveShadow
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
        onPointerOver()
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'auto'
        onPointerOut()
      }}
    >
      <meshStandardMaterial
        color="#6b5b4e"
        roughness={0.9}
        metalness={0.1}
        flatShading
      />
    </mesh>
  )
}

export function Rocks() {
  const rocks = useWaterfallStore(state => state.rocks)
  const incrementRockRoughness = useWaterfallStore(state => state.incrementRockRoughness)
  const setRockHover = useWaterfallStore(state => state.setRockHover)

  return (
    <group>
      {rocks.map(rock => (
        <RockMesh
          key={rock.id}
          rock={rock}
          onClick={() => incrementRockRoughness(rock.id)}
          onPointerOver={() => setRockHover(rock.id, true)}
          onPointerOut={() => setRockHover(rock.id, false)}
        />
      ))}
    </group>
  )
}
