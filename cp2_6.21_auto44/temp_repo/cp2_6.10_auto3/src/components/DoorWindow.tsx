import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { animated, useSpring } from '@react-spring/three'
import * as THREE from 'three'
import { useIncenseStore } from '@/store/useIncenseStore'
import { SCENE_CONSTANTS, COLORS, ANIMATION_DURATION } from '@/utils/constants'

interface DoorWindowProps {
  type: 'leftDoor' | 'backWindow'
}

export function DoorWindow({ type }: DoorWindowProps) {
  const { doorWindow, toggleLeftDoor, toggleBackWindow } = useIncenseStore()
  const groupRef = useRef<THREE.Group>(null)
  const isOpen = doorWindow[type]

  const isLeftDoor = type === 'leftDoor'
  const position = isLeftDoor
    ? ([-SCENE_CONSTANTS.ROOM_WIDTH / 2 + 0.05, 1, 0] as [number, number, number])
    : ([0, 1, -SCENE_CONSTANTS.ROOM_DEPTH / 2 + 0.05] as [number, number, number])

  const rotation = isLeftDoor ? [0, 0, 0] : [0, Math.PI / 2, 0]
  const size = isLeftDoor ? [1.5, 2.5] : [1.5, 1.5]

  const openSpring = useSpring({
    rotation: isOpen ? (isLeftDoor ? -Math.PI / 2 : Math.PI / 2) : 0,
    config: { duration: ANIMATION_DURATION.DOOR_WINDOW * 1000 },
  })

  const handleClick = (e: THREE.Event) => {
    e.stopPropagation()
    if (isLeftDoor) {
      toggleLeftDoor()
    } else {
      toggleBackWindow()
    }
  }

  useFrame(() => {
    if (groupRef.current) {
      const targetRot = openSpring.rotation.get()
      if (isLeftDoor) {
        groupRef.current.rotation.y = targetRot
      } else {
        groupRef.current.rotation.x = targetRot
      }
    }
  })

  const hingeOffset = isLeftDoor ? -size[0] / 2 : -size[1] / 2

  return (
    <group position={position} rotation={rotation as [number, number, number]}>
      <group
        ref={groupRef}
        position={isLeftDoor ? [size[0] / 2, 0, 0] : [0, size[1] / 2, 0]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      >
        <mesh position={isLeftDoor ? [hingeOffset, 0, 0] : [0, hingeOffset, 0]} castShadow>
          <boxGeometry args={[size[0], size[1], 0.1]} />
          <meshStandardMaterial color={COLORS.WOOD} />
        </mesh>

        <mesh position={isLeftDoor ? [hingeOffset, 0, 0.06] : [0.06, hingeOffset, 0]}>
          <boxGeometry args={[size[0] - 0.15, size[1] - 0.15, 0.02]} />
          <meshStandardMaterial color="#5a4030" />
        </mesh>

        <mesh
          position={
            isLeftDoor
              ? [hingeOffset + size[0] / 2 - 0.15, 0, 0.06]
              : [0.06, hingeOffset + size[1] / 2 - 0.15, 0]
          }
        >
          <torusGeometry args={[0.04, 0.01, 8, 16]} />
          <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  )
}
