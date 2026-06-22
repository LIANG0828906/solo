import { useRef, useMemo, useState } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { PlanetData } from './StarSystem'

interface PlanetProps {
  data: PlanetData
  isSelected: boolean
  showOrbit: boolean
  onHover: (planet: PlanetData | null, event?: MouseEvent) => void
  onClick: (planet: PlanetData) => void
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function generatePlanetTexture(
  color: string,
  type: 'noise' | 'stripes',
  seed: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = color
  ctx.fillRect(0, 0, 256, 256)

  const random = seededRandom(seed)

  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)

  if (type === 'noise') {
    const imageData = ctx.getImageData(0, 0, 256, 256)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const noise = (random() - 0.5) * 80
      data[i] = Math.max(0, Math.min(255, r + noise))
      data[i + 1] = Math.max(0, Math.min(255, g + noise))
      data[i + 2] = Math.max(0, Math.min(255, b + noise))
      data[i + 3] = 255
    }

    ctx.putImageData(imageData, 0, 0)

    for (let i = 0; i < 5; i++) {
      const spotX = random() * 256
      const spotY = random() * 256
      const spotRadius = 10 + random() * 30
      const gradient = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, spotRadius)
      const darkerR = Math.max(0, r - 40 - random() * 30)
      const darkerG = Math.max(0, g - 40 - random() * 30)
      const darkerB = Math.max(0, b - 40 - random() * 30)
      gradient.addColorStop(0, `rgba(${darkerR}, ${darkerG}, ${darkerB}, 0.6)`)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(spotX, spotY, spotRadius, 0, Math.PI * 2)
      ctx.fill()
    }
  } else {
    for (let i = 0; i < 12; i++) {
      const y = (i / 12) * 256 + random() * 20
      const height = 8 + random() * 20
      const stripeOpacity = 0.2 + random() * 0.3

      const isDark = random() > 0.5
      const stripeR = isDark ? Math.max(0, r - 30 - random() * 40) : Math.min(255, r + 30 + random() * 40)
      const stripeG = isDark ? Math.max(0, g - 30 - random() * 40) : Math.min(255, g + 30 + random() * 40)
      const stripeB = isDark ? Math.max(0, b - 30 - random() * 40) : Math.min(255, b + 30 + random() * 40)

      ctx.fillStyle = `rgba(${stripeR}, ${stripeG}, ${stripeB}, ${stripeOpacity})`

      ctx.beginPath()
      ctx.moveTo(0, y)
      for (let x = 0; x <= 256; x += 10) {
        const waveY = y + Math.sin(x * 0.05 + random() * Math.PI) * 5
        ctx.lineTo(x, waveY)
      }
      ctx.lineTo(256, y + height)
      for (let x = 256; x >= 0; x -= 10) {
        const waveY = y + height + Math.sin(x * 0.05 + random() * Math.PI) * 5
        ctx.lineTo(x, waveY)
      }
      ctx.closePath()
      ctx.fill()
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export default function Planet({
  data,
  isSelected,
  showOrbit,
  onHover,
  onClick
}: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  const texture = useMemo(() => {
    return generatePlanetTexture(data.color, data.textureType, data.seed)
  }, [data.color, data.textureType, data.seed])

  const orbitGeometry = useMemo(() => {
    const curve = new THREE.EllipseCurve(
      0, 0,
      data.orbitRadius, data.orbitRadius,
      0, 2 * Math.PI,
      false,
      0
    )
    const points = curve.getPoints(128)
    const positions = new Float32Array(points.length * 3)
    points.forEach((point, i) => {
      positions[i * 3] = point.x
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = point.y
    })
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setIndex(
      Array.from({ length: points.length }, (_, i) => i).concat([0])
    )
    return geometry
  }, [data.orbitRadius])

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime()
    const angle = elapsed * data.orbitSpeed * 0.3

    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angle) * data.orbitRadius
      groupRef.current.position.z = Math.sin(angle) * data.orbitRadius
    }

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005
    }

    const targetScale = hovered || isSelected ? 1.2 : 1
    if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
    }
    if (glowRef.current) {
      const glowScale = hovered || isSelected ? 1.3 : 1
      glowRef.current.scale.lerp(new THREE.Vector3(glowScale, glowScale, glowScale), 0.1)
      const material = glowRef.current.material as THREE.MeshBasicMaterial
      material.opacity = hovered || isSelected ? 0.5 : 0
    }
  })

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    onHover(data, e.nativeEvent as unknown as MouseEvent)
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(false)
    onHover(null)
    document.body.style.cursor = 'default'
  }

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onClick(data)
  }

  return (
    <>
      {showOrbit && (
        <lineSegments geometry={orbitGeometry}>
          <lineBasicMaterial color="#64748B" transparent opacity={0.3} />
        </lineSegments>
      )}

      <group ref={groupRef}>
        <mesh
          ref={meshRef}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        >
          <sphereGeometry args={[data.radius, 64, 64]} />
          <meshStandardMaterial map={texture} roughness={0.8} metalness={0.1} />
        </mesh>

        <mesh ref={glowRef} scale={1}>
          <sphereGeometry args={[data.radius * 1.05, 32, 32]} />
          <meshBasicMaterial
            color={data.color}
            transparent
            opacity={0}
            side={THREE.BackSide}
          />
        </mesh>

        <group position={[0, data.radius + 0.3, 0]}>
          <Html
            center
            distanceFactor={10}
            style={{
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          >
            <div
              style={{
                fontSize: '14px',
                color: '#E2E8F0',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                borderRadius: '4px',
                padding: '2px 6px',
                whiteSpace: 'nowrap',
                fontWeight: 500
              }}
            >
              {data.name}
            </div>
          </Html>
        </group>
      </group>
    </>
  )
}
