import saveAs from 'file-saver'
import type { LightSource, TimelineState } from '@/store/useLightStore'
import * as THREE from 'three'

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

export function takeScreenshot(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  width: number = 1920,
  height: number = 1080
): void {
  const originalSize = gl.getSize(new THREE.Vector2())
  const originalPixelRatio = gl.getPixelRatio()

  gl.setPixelRatio(1)
  gl.setSize(width, height, false)
  gl.render(scene, camera)

  const pixels = new Uint8Array(width * height * 4)
  const glContext = gl.getContext()
  glContext.readPixels(0, 0, width, height, glContext.RGBA, glContext.UNSIGNED_BYTE, pixels)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  const imageData = ctx.createImageData(width, height)
  for (let i = 0; i < pixels.length; i += 4) {
    const row = Math.floor(i / 4 / width)
    const flippedRow = height - 1 - row
    const flippedIndex = (flippedRow * width + (i / 4) % width) * 4
    imageData.data[flippedIndex] = pixels[i]
    imageData.data[flippedIndex + 1] = pixels[i + 1]
    imageData.data[flippedIndex + 2] = pixels[i + 2]
    imageData.data[flippedIndex + 3] = pixels[i + 3]
  }
  ctx.putImageData(imageData, 0, 0)

  ctx.font = 'bold 32px Arial'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText('LightCanvas', width - 20, height - 20)

  canvas.toBlob((blob) => {
    if (!blob) return
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    saveAs(blob, `lightcanvas-screenshot-${timestamp}.png`)
  }, 'image/png')

  gl.setSize(originalSize.x, originalSize.y, false)
  gl.setPixelRatio(originalPixelRatio)
}

export interface SceneConfig {
  version: string
  lights: LightSource[]
  timeline: TimelineState
  showTestObjects: boolean
  exportedAt: string
}

export function exportSceneConfig(
  lights: LightSource[],
  timeline: TimelineState,
  showTestObjects: boolean
): void {
  const config: SceneConfig = {
    version: '1.0.0',
    lights,
    timeline,
    showTestObjects,
    exportedAt: new Date().toISOString(),
  }

  const json = JSON.stringify(config, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  saveAs(blob, `lightcanvas-scene-${timestamp}.json`)
}

export function parseAndLoad(
  file: File,
  onLoad: (data: { lights: LightSource[]; timeline: TimelineState; showTestObjects: boolean }) => void,
  onError?: (error: string) => void
): void {
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const text = e.target?.result as string
      const data = JSON.parse(text) as SceneConfig

      if (!data.version) {
        onError?.('Invalid file: missing version')
        return
      }

      if (!Array.isArray(data.lights)) {
        onError?.('Invalid file: lights must be an array')
        return
      }

      if (typeof data.timeline !== 'object' || data.timeline === null) {
        onError?.('Invalid file: timeline must be an object')
        return
      }

      data.lights.forEach((light) => {
        if (light.position && Array.isArray(light.position)) {
          light.position = new THREE.Vector3(
            light.position[0],
            light.position[1],
            light.position[2]
          )
        } else if (light.position && typeof light.position === 'object') {
          light.position = new THREE.Vector3(
            light.position.x,
            light.position.y,
            light.position.z
          )
        }
      })

      data.timeline.keyframes?.forEach((kf) => {
        if (kf.property === 'position' && kf.value) {
          if (Array.isArray(kf.value)) {
            kf.value = new THREE.Vector3(kf.value[0], kf.value[1], kf.value[2])
          } else if (typeof kf.value === 'object') {
            kf.value = new THREE.Vector3(kf.value.x, kf.value.y, kf.value.z)
          }
        }
      })

      onLoad({
        lights: data.lights,
        timeline: data.timeline,
        showTestObjects: data.showTestObjects ?? false,
      })
    } catch (err) {
      onError?.(`Failed to parse file: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  reader.onerror = () => {
    onError?.('Failed to read file')
  }

  reader.readAsText(file)
}
