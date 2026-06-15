import { useMemo } from 'react'
import * as THREE from 'three'
import { BoshanStove } from './BoshanStove'
import { Fan } from './Fan'
import { DoorWindow } from './DoorWindow'
import { SCENE_CONSTANTS, COLORS } from '@/utils/constants'

export function SceneElements() {
  const { ROOM_WIDTH, ROOM_HEIGHT, ROOM_DEPTH, SKYLIGHT_RADIUS } = SCENE_CONSTANTS
  const halfW = ROOM_WIDTH / 2
  const halfD = ROOM_DEPTH / 2

  const brickTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = COLORS.WALL
    ctx.fillRect(0, 0, 512, 512)

    const brickW = 64
    const brickH = 32
    for (let y = 0; y < 512; y += brickH) {
      const offset = (y / brickH) % 2 === 0 ? 0 : brickW / 2
      for (let x = -brickW; x < 512 + brickW; x += brickW) {
        ctx.fillStyle = `rgba(80, 90, 80, ${0.3 + Math.random() * 0.3})`
        ctx.fillRect(x + offset + 2, y + 2, brickW - 4, brickH - 4)
        ctx.strokeStyle = 'rgba(60, 70, 60, 0.5)'
        ctx.lineWidth = 1
        ctx.strokeRect(x + offset + 2, y + 2, brickW - 4, brickH - 4)
      }
    }

    return new THREE.CanvasTexture(canvas)
  }, [])

  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = COLORS.FLOOR
    ctx.fillRect(0, 0, 512, 512)

    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      const size = Math.random() * 3 + 1
      ctx.fillStyle = `rgba(${80 + Math.random() * 30}, ${70 + Math.random() * 30}, ${60 + Math.random() * 30}, ${0.3 + Math.random() * 0.4})`
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }

    return new THREE.CanvasTexture(canvas)
  }, [])

  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial map={floorTexture} />
      </mesh>

      <mesh position={[0, ROOM_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>

      <mesh position={[0, ROOM_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[SKYLIGHT_RADIUS, SKYLIGHT_RADIUS + 0.1, 32]} />
        <meshBasicMaterial color="#1a1a1a" side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[-halfW, ROOM_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial map={brickTexture} />
      </mesh>

      <mesh position={[halfW, ROOM_HEIGHT / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial map={brickTexture} />
      </mesh>

      <mesh position={[0, ROOM_HEIGHT / 2, -halfD]} rotation={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial map={brickTexture} />
      </mesh>

      <mesh position={[0, ROOM_HEIGHT / 2, halfD]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial map={brickTexture} />
      </mesh>

      <hemisphereLight args={['#ffcc88', '#3a2a1a', 0.4]} />
      <directionalLight position={[3, 4, 3]} intensity={0.3} castShadow />
      <directionalLight position={[-3, 4, -3]} intensity={0.2} />

      <mesh position={[-3, 0.5, -3]} castShadow>
        <boxGeometry args={[1, 1.5, 0.3]} />
        <meshStandardMaterial color={COLORS.WOOD} />
      </mesh>
      <mesh position={[-3, 1.2, -3]} castShadow>
        <boxGeometry args={[1.2, 0.1, 0.4]} />
        <meshStandardMaterial color="#5a4030" />
      </mesh>

      <DoorWindow type="leftDoor" />
      <DoorWindow type="backWindow" />

      <BoshanStove />
      <Fan />
    </group>
  )
}
