import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { animated, useSpring } from '@react-spring/three'
import * as THREE from 'three'
import { DragControls } from '@react-three/drei'
import { useIncenseStore } from '@/store/useIncenseStore'
import { SCENE_CONSTANTS, FAN_CONSTANTS, COLORS, ANIMATION_DURATION } from '@/utils/constants'
import type { FanLevel } from '@/types'

export function Fan() {
  const { fan, setFanLevel, setFanAngle } = useIncenseStore()
  const groupRef = useRef<THREE.Group>(null)
  const bladeRef = useRef<THREE.Group>(null)
  const [isDragging, setIsDragging] = useState(false)
  const timeRef = useRef(0)
  const lastSwingRef = useRef(0)

  const fanConfig = FAN_CONSTANTS.LEVELS[fan.level]

  const [baseAngle, setBaseAngle] = useState(fan.angle)

  const levelSpring = useSpring({
    swingAmplitude: fanConfig.amplitude,
    swingSpeed: fanConfig.speed,
    config: { duration: ANIMATION_DURATION.FAN_LEVEL_CHANGE * 1000 },
  })

  const gradientTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 256, 0)
    gradient.addColorStop(0, COLORS.FAN_START)
    gradient.addColorStop(1, COLORS.FAN_END)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 256, 256)
    return new THREE.CanvasTexture(canvas)
  }, [])

  const fanShape = useMemo(() => {
    const shape = new THREE.Shape()
    const width = 0.6
    const height = 0.8

    shape.moveTo(0, -height / 2)
    shape.quadraticCurveTo(width / 2, -height / 2, width / 2, 0)
    shape.quadraticCurveTo(width / 2, height / 2, 0, height / 2)
    shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, 0)
    shape.quadraticCurveTo(-width / 2, -height / 2, 0, -height / 2)

    return shape
  }, [])

  const handleClick = (e: THREE.Event) => {
    e.stopPropagation()
    if (isDragging) return
    const nextLevel = ((fan.level + 1) % 4) as FanLevel
    setFanLevel(nextLevel)
  }

  useFrame((_, delta) => {
    timeRef.current += delta

    const swingAmplitude = levelSpring.swingAmplitude.get()
    const swingSpeed = levelSpring.swingSpeed.get()

    if (bladeRef.current && swingSpeed > 0) {
      const swingAngle =
        Math.sin(timeRef.current * (swingSpeed * (Math.PI / 180))) *
        (swingAmplitude * (Math.PI / 180))
      bladeRef.current.rotation.z = swingAngle

      const currentSwing = Math.abs(swingAngle)
      if (currentSwing > swingAmplitude * 0.8 * (Math.PI / 180) && lastSwingRef.current < currentSwing) {
        // emit wood particles at swing extremes
      }
      lastSwingRef.current = currentSwing
    }

    if (groupRef.current) {
      const targetRotation = baseAngle * (Math.PI / 180)
      groupRef.current.rotation.y += (targetRotation - groupRef.current.rotation.y) * 0.1
    }
  })

  const [x, y, z] = SCENE_CONSTANTS.FAN_POSITION

  return (
    <DragControls
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      onDrag={(event) => {
        if (event.object) {
          const newAngle = Math.max(
            FAN_CONSTANTS.MIN_ANGLE,
            Math.min(FAN_CONSTANTS.MAX_ANGLE, baseAngle + event.object.rotation.y * 30)
          )
          setBaseAngle(newAngle)
          setFanAngle(newAngle)
        }
      }}
      autoTransform={false}
    >
      <animated.group
        ref={groupRef}
        position={[x, y, z]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      >
        <group ref={bladeRef}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <shapeGeometry args={[fanShape]} />
            <meshStandardMaterial map={gradientTexture} side={THREE.DoubleSide} transparent opacity={0.9} />
          </mesh>

          <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
            <meshStandardMaterial color="#5d3a1a" />
          </mesh>

          <mesh position={[0, -0.25, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.15, 8]} />
            <meshStandardMaterial color="#4a2a0a" />
          </mesh>
        </group>

        {fan.level > 0 && (
          <group>
            {[0, 1, 2].map((i) => (
              <mesh
                key={i}
                position={[
                  Math.sin(timeRef.current * 3 + i) * 0.3,
                  Math.sin(timeRef.current * 2 + i * 2) * 0.2,
                  Math.cos(timeRef.current * 3 + i) * 0.3,
                ]}
                visible={fan.level >= i + 1}
              >
                <sphereGeometry args={[0.015, 4, 4]} />
                <meshBasicMaterial color="#c4a060" transparent opacity={0.6} />
              </mesh>
            ))}
          </group>
        )}
      </animated.group>
    </DragControls>
  )
}
