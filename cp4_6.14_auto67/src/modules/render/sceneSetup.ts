import * as THREE from 'three'

interface SceneConfig {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer | null
}

function initScene(container: HTMLElement): SceneConfig {
  const scene = new THREE.Scene()

  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createLinearGradient(0, 0, 0, 512)
  gradient.addColorStop(0, '#1e293b')
  gradient.addColorStop(1, '#0f172a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 2, 512)
  const texture = new THREE.CanvasTexture(canvas)
  scene.background = texture

  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  )
  camera.position.set(0, 40, 80)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(container.clientWidth, container.clientHeight)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
  directionalLight.position.set(50, 100, 50)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.set(2048, 2048)
  scene.add(directionalLight)

  const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x362d1f, 0.4)
  scene.add(hemisphereLight)

  const gridHelper = new THREE.GridHelper(120, 60, 0x334155, 0x334155)
  ;(gridHelper.material as THREE.Material).opacity = 0.2
  ;(gridHelper.material as THREE.Material).transparent = true
  scene.add(gridHelper)

  const groundGeometry = new THREE.PlaneGeometry(120, 120)
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    transparent: true,
    opacity: 0.5
  })
  const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial)
  groundPlane.rotation.x = -Math.PI / 2
  scene.add(groundPlane)

  const handleResize = () => {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  }
  window.addEventListener('resize', handleResize)
  ;(renderer as any)._handleResize = handleResize

  container.appendChild(renderer.domElement)

  return {
    scene,
    camera,
    renderer
  }
}

function disposeScene(config: SceneConfig): void {
  const { scene, renderer } = config
  if (renderer && (renderer as any)._handleResize) {
    window.removeEventListener('resize', (renderer as any)._handleResize)
  }
  if (renderer) {
    renderer.dispose()
  }
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose()
      if (Array.isArray(object.material)) {
        object.material.forEach((m) => m.dispose())
      } else {
        object.material.dispose()
      }
    }
  })
  config.renderer = null
}

export { initScene, disposeScene }
export type { SceneConfig }
