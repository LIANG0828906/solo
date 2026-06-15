import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { animated, useSpring } from '@react-spring/three'
import * as THREE from 'three'
import { useIncenseStore } from '@/store/useIncenseStore'
import { SCENE_CONSTANTS, COLORS, ANIMATION_DURATION, INCENSE_NAMES } from '@/utils/constants'
import type { IncenseType } from '@/types'

const INCENSE_TYPES: IncenseType[] = ['chenxiang', 'tanxiang', 'longnao']

export function BoshanStove() {
  const { incenseType, setIncenseType } = useIncenseStore()
  const lidRef = useRef<THREE.Group>(null)
  const flameRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const [isOpening, setIsOpening] = useState(false)
  const timeRef = useRef(0)

  const lidSpring = useSpring({
    lidRotation: isOpening ? -0.5 : 0,
    config: { duration: ANIMATION_DURATION.STOVE_LID * 1000 },
  })

  const gradientTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0, COLORS.STOVE_END)
    gradient.addColorStop(1, COLORS.STOVE_START)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 256, 256)
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])

  const handleClick = () => {
    if (isOpening) return
    setIsOpening(true)

    const currentIndex = INCENSE_TYPES.indexOf(incenseType)
    const nextIndex = (currentIndex + 1) % INCENSE_TYPES.length
    const nextType = INCENSE_TYPES[nextIndex]

    setTimeout(() => {
      setIncenseType(nextType)
      setTimeout(() => {
        setIsOpening(false)
      }, 100)
    }, ANIMATION_DURATION.STOVE_LID * 1000)
  }

  useFrame((_, delta) => {
    timeRef.current += delta * 5

    if (flameRef.current) {
      const scale = 1 + Math.sin(timeRef.current) * 0.1 + Math.random() * 0.1
      flameRef.current.scale.setScalar(scale)
    }

    if (lightRef.current) {
      const intensity = 1.5 + Math.sin(timeRef.current * 2) * 0.3 + Math.random() * 0.2
      lightRef.current.intensity = intensity
    }
  })

  const [x, y, z] = SCENE_CONSTANTS.STOVE_POSITION

  return (
    <group position={[x, y + 0.3, z]}>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.4, 32]} />
        <meshStandardMaterial map={gradientTexture} metalness={0.6} roughness={0.3} />
      </mesh>

      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 3) * Math.PI * 2) * 0.2,
            -0.15,
            Math.sin((i / 3) * Math.PI * 2) * 0.2,
          ]}
          rotation={[0, (i / 3) * Math.PI * 2, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.04, 0.05, 0.2, 8]} />
          <meshStandardMaterial map={gradientTexture} metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      <mesh position={[0, 0.25, 0]} castShadow>
        <torusGeometry args={[0.32, 0.05, 8, 32]} />
        <meshStandardMaterial map={gradientTexture} metalness={0.6} roughness={0.3} />
      </mesh>

      <animated.group
        ref={lidRef}
        position={[0, 0.4, 0]}
        rotation-x={lidSpring.lidRotation}
        onClick={(e) => {
          e.stopPropagation()
          handleClick()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      >
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.08, 32]} />
          <meshStandardMaterial map={gradientTexture} metalness={0.6} roughness={0.3} />
        </mesh>

        <mesh position={[0, 0.05, 0]} castShadow>
          <coneGeometry args={[0.2, 0.25, 32, 1, true]} />
          <meshStandardMaterial map={gradientTexture} metalness={0.6} roughness={0.3} side={THREE.DoubleSide} />
        </mesh>

        {[0, 1, 2, 3, 4].map((i) => (
          <mesh
            key={i}
            position={[
              Math.cos((i / 5) * Math.PI * 2) * 0.12,
              0.05,
              Math.sin((i / 5) * Math.PI * 2) * 0.12,
            ]}
          >
            <ringGeometry args={[0.03, 0.05, 16]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
        ))}

        <mesh position={[0, 0.2, 0]} castShadow>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial map={gradientTexture} metalness={0.7} roughness={0.2} />
        </mesh>
      </animated.group>

      <mesh ref={flameRef} position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#ffaa33" transparent opacity={0.8} />
      </mesh>

      <pointLight
        ref={lightRef}
        position={[0, 0.2, 0]}
        color="#ffcc66"
        intensity={1.5}
        distance={5}
        castShadow
      />
    </group>
  )
}
