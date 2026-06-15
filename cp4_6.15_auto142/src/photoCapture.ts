import * as THREE from 'three'
import { saveAs } from 'file-saver'

export function captureSnapshot(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  width?: number,
  height?: number
): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  
  const originalSize = new THREE.Vector2()
  renderer.getSize(originalSize)
  const originalPixelRatio = renderer.getPixelRatio()

  const captureWidth = width ?? originalSize.width * dpr
  const captureHeight = height ?? originalSize.height * dpr

  renderer.setPixelRatio(1)
  renderer.setSize(captureWidth, captureHeight, false)

  addGoldenGlow(scene, camera, renderer)

  renderer.render(scene, camera)

  const canvas = renderer.domElement
  const dataURL = canvas.toDataURL('image/png', 1.0)

  removeGoldenGlow(scene)

  renderer.setPixelRatio(originalPixelRatio)
  renderer.setSize(originalSize.width, originalSize.height, false)
  renderer.render(scene, camera)

  const byteString = atob(dataURL.split(',')[1])
  const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0]
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  const blob = new Blob([ab], { type: mimeString })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  saveAs(blob, `plant-snapshot-${timestamp}.png`)
}

let glowObjects: THREE.Object3D[] = []
let originalBackground: THREE.Color | THREE.Texture | null = null

function addGoldenGlow(
  scene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer
): void {
  originalBackground = scene.background
  scene.background = new THREE.Color('#0a1929')

  const bbox = new THREE.Box3().setFromObject(scene)
  const center = new THREE.Vector3()
  bbox.getCenter(center)
  const size = new THREE.Vector3()
  bbox.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z)

  const glowCount = 3
  for (let i = 0; i < glowCount; i++) {
    const ringGeometry = new THREE.RingGeometry(
      maxDim * (0.6 + i * 0.15),
      maxDim * (0.65 + i * 0.15),
      64
    )
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(`hsl(${45 + i * 5}, 100%, ${60 - i * 10}%)`),
      transparent: true,
      opacity: 0.15 - i * 0.04,
      side: THREE.DoubleSide,
      depthWrite: false
    })
    const glowRing = new THREE.Mesh(ringGeometry, glowMaterial)
    glowRing.position.copy(center)
    glowRing.lookAt(camera.position)
    scene.add(glowRing)
    glowObjects.push(glowRing)
  }

  const ambientLight = new THREE.AmbientLight(0xffd700, 0.3)
  scene.add(ambientLight)
  glowObjects.push(ambientLight)

  const pointLight = new THREE.PointLight(0xffd700, 2, maxDim * 5)
  pointLight.position.copy(center).add(new THREE.Vector3(maxDim, maxDim * 0.5, maxDim))
  scene.add(pointLight)
  glowObjects.push(pointLight)
}

function removeGoldenGlow(scene: THREE.Scene): void {
  for (const obj of glowObjects) {
    scene.remove(obj)
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose()
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose())
      } else {
        obj.material.dispose()
      }
    }
  }
  glowObjects = []

  if (originalBackground !== null) {
    scene.background = originalBackground
  }
}

export function createSnapshotPreviewCanvas(
  renderer: THREE.WebGLRenderer,
  container: HTMLElement
): HTMLCanvasElement {
  const previewCanvas = document.createElement('canvas')
  previewCanvas.className = 'snapshot-preview'
  previewCanvas.width = 400
  previewCanvas.height = 300
  previewCanvas.style.borderRadius = '12px'
  previewCanvas.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)'

  const ctx = previewCanvas.getContext('2d')!
  const sourceCanvas = renderer.domElement
  
  ctx.drawImage(
    sourceCanvas,
    0, 0, sourceCanvas.width, sourceCanvas.height,
    0, 0, previewCanvas.width, previewCanvas.height
  )

  ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)'
  ctx.lineWidth = 4
  ctx.strokeRect(0, 0, previewCanvas.width, previewCanvas.height)

  container.innerHTML = ''
  container.appendChild(previewCanvas)

  return previewCanvas
}
