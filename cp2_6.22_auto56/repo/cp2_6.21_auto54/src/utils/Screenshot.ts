import * as THREE from 'three'

export function captureScene(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera
): void {
  renderer.render(scene, camera)

  const dataUrl = renderer.domElement.toDataURL('image/png')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `cell-snapshot-${timestamp}.png`

  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
