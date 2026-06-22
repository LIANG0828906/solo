import * as THREE from 'three'

let rendererRef: THREE.WebGLRenderer | null = null
let sceneRef: THREE.Scene | null = null
let cameraRef: THREE.Camera | null = null

export function setThreeContext(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera
) {
  rendererRef = renderer
  sceneRef = scene
  cameraRef = camera
}

export function getThreeContext() {
  return {
    renderer: rendererRef,
    scene: sceneRef,
    camera: cameraRef,
  }
}
