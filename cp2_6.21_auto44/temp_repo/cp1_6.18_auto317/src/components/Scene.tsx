import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../store'
import { getHeatColor } from '../heatIsland'
import { GRID_SIZE, SCENE_SIZE } from '../types'
import type { CityBuilding } from '../types'

const SOUTH_COLOR = new THREE.Color('#A03030')
const NORTH_COLOR = new THREE.Color('#1A3A5C')
const EAST_WEST_COLOR = new THREE.Color('#D08020')
const WALL_COLOR = new THREE.Color('#3A3A5A')
const WINDOW_EMISSIVE = new THREE.Color('#FFD080')

function getRoofColor(orientation: CityBuilding['orientation']): THREE.Color {
  switch (orientation) {
    case 'south':
      return SOUTH_COLOR.clone()
    case 'north':
      return NORTH_COLOR.clone()
    case 'east':
    case 'west':
      return EAST_WEST_COLOR.clone()
  }
}

function createWindowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#3A3A5A'
  ctx.fillRect(0, 0, 256, 256)

  const windowRows = 8
  const windowCols = 6
  const windowWidth = 25
  const windowHeight = 30
  const gapX = (256 - windowCols * windowWidth) / (windowCols + 1)
  const gapY = (256 - windowRows * windowHeight) / (windowRows + 1)

  for (let row = 0; row < windowRows; row++) {
    for (let col = 0; col < windowCols; col++) {
      const x = gapX + col * (windowWidth + gapX)
      const y = gapY + row * (windowHeight + gapY)

      const isLit = Math.random() > 0.4
      ctx.fillStyle = isLit ? '#FFD080' : '#1A1A2E'
      ctx.fillRect(x, y, windowWidth, windowHeight)

      ctx.strokeStyle = '#2A2A4A'
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, windowWidth, windowHeight)

      ctx.beginPath()
      ctx.moveTo(x + windowWidth / 2, y)
      ctx.lineTo(x + windowWidth / 2, y + windowHeight)
      ctx.moveTo(x, y + windowHeight / 2)
      ctx.lineTo(x + windowWidth, y + windowHeight / 2)
      ctx.strokeStyle = '#2A2A4A'
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

function createNormalMapTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!

  const imageData = ctx.createImageData(256, 256)
  const data = imageData.data

  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const idx = (y * 256 + x) * 4

      const wx = x % 42
      const wy = y % 32

      const inWindow = wx > 8 && wx < 33 && wy > 4 && wy < 27

      if (inWindow) {
        data[idx] = 100
        data[idx + 1] = 100
        data[idx + 2] = 255
        data[idx + 3] = 255
      } else {
        data[idx] = 128
        data[idx + 1] = 128
        data[idx + 2] = 255
        data[idx + 3] = 255
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

function Building({
  building,
  isSelected,
  onClick,
  windowTexture,
  normalTexture,
  sunlightIntensity,
}: {
  building: CityBuilding
  isSelected: boolean
  onClick: () => void
  windowTexture: THREE.CanvasTexture
  normalTexture: THREE.CanvasTexture
  sunlightIntensity: number
}) {
  const groupRef = useRef<THREE.Group>(null)

  const roofColor = useMemo(() => {
    const color = getRoofColor(building.orientation)
    const intensityMult = 0.7 + (sunlightIntensity / 100) * 0.6
    color.multiplyScalar(intensityMult)
    if (isSelected) {
      color.lerp(new THREE.Color('#7C4DFF'), 0.5)
    }
    return color
  }, [building.orientation, sunlightIntensity, isSelected])

  const wallColor = useMemo(() => {
    const color = WALL_COLOR.clone()
    const intensityMult = 0.8 + (sunlightIntensity / 100) * 0.4
    color.multiplyScalar(intensityMult)
    if (isSelected) {
      color.lerp(new THREE.Color('#7C4DFF'), 0.3)
    }
    return color
  }, [sunlightIntensity, isSelected])

  const { width, depth, height } = building
  const { x, z } = building.position

  const wallTextureRepeat = useMemo(() => {
    const repeatX = Math.max(1, Math.round(width * 2))
    const repeatY = Math.max(1, Math.round(height * 2))
    return { repeatX, repeatY }
  }, [width, height])

  return (
