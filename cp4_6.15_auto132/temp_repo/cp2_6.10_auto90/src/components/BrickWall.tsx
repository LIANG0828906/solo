import React, { useMemo } from 'react'
import * as THREE from 'three'
import { SCENE_CONFIG } from '../utils/constants'

export const BrickWall: React.FC = () => {
  const { BRICK_WALL } = SCENE_CONFIG

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.fillStyle = BRICK_WALL.mortarColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const brickWidth = 64
    const brickHeight = 32
    const mortarWidth = BRICK_WALL.mortarWidth

    for (let row = 0; row < canvas.height / brickHeight; row++) {
      const offset = row % 2 === 0 ? 0 : brickWidth / 2
      for (let col = -1; col < canvas.width / brickWidth + 1; col++) {
        const x = col * brickWidth + offset + mortarWidth
        const y = row * brickHeight + mortarWidth
        const w = brickWidth - mortarWidth * 2
        const h = brickHeight - mortarWidth * 2

        const noise = (Math.random() - 0.5) * 20
        const r = parseInt(BRICK_WALL.color.slice(1, 3), 16) + noise
        const g = parseInt(BRICK_WALL.color.slice(3, 5), 16) + noise
        const b = parseInt(BRICK_WALL.color.slice(5, 7), 16) + noise
        ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, r))}, ${Math.max(0, Math.min(255, g))}, ${Math.max(0, Math.min(255, b))})`

        ctx.fillRect(x, y, w, h)
      }
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(4, 4)
    return tex
  }, [BRICK_WALL])

  if (!texture) return null

  return (
    <group>
      <mesh position={[0, 30, -50]} rotation={[0, 0, 0]}>
        <planeGeometry args={[200, 100]} />
        <meshStandardMaterial
          map={texture}
          roughness={1.0}
          metalness={0}
        />
      </mesh>

      <mesh position={[0, 30, 50]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[200, 100]} />
        <meshStandardMaterial
          map={texture}
          roughness={1.0}
          metalness={0}
        />
      </mesh>

      <mesh position={[-50, 30, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          map={texture}
          roughness={1.0}
          metalness={0}
        />
      </mesh>

      <mesh position={[50, 30, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          map={texture}
          roughness={1.0}
          metalness={0}
        />
      </mesh>

      <mesh position={[0, -20, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color="#4a4a4a"
          roughness={1.0}
          metalness={0}
        />
      </mesh>
    </group>
  )
}
