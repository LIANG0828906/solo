import * as THREE from 'three'

export function createNoiseTexture(size: number = 256): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(size, size)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.random() * 60 - 30
    data[i] = 128 + noise
    data[i + 1] = 128 + noise
    data[i + 2] = 128 + noise
    data[i + 3] = 255
  }

  ctx.putImageData(imageData, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

export function createPlanetTexture(
  baseColor: string,
  hasContinents: boolean = false,
  secondaryColor?: string
): THREE.Texture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, size, size)

  if (hasContinents && secondaryColor) {
    ctx.fillStyle = secondaryColor
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const radius = 20 + Math.random() * 60
      ctx.beginPath()
      ctx.ellipse(x, y, radius, radius * 0.6, Math.random() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  for (let i = 0; i < 2000; i++) {
    const x = Math.floor(Math.random() * size)
    const y = Math.floor(Math.random() * size)
    const alpha = Math.random() * 0.15
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`
    ctx.fillRect(x, y, 2, 2)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}
