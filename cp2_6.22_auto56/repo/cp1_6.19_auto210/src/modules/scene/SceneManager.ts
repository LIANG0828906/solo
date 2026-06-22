import * as THREE from 'three'

class SceneManager {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  directionalLight: THREE.DirectionalLight | null = null
  ambientLight: THREE.AmbientLight | null = null

  constructor() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#062C36')
    this.scene.fog = new THREE.FogExp2(new THREE.Color('#0a3a47'), 0.012)

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500)
    this.camera.position.set(0, 6, 18)
    this.camera.lookAt(0, 0, 0)
  }

  setupLights(): void {
    this.ambientLight = new THREE.AmbientLight('#1a5a6e', 0.5)
    this.ambientLight.name = 'underwater_ambient'
    this.scene.add(this.ambientLight)

    this.directionalLight = new THREE.DirectionalLight('#7ec8b8', 1.0)
    this.directionalLight.position.set(5, 20, 8)
    this.directionalLight.name = 'underwater_sun'
    this.scene.add(this.directionalLight)

    const fillLight = new THREE.DirectionalLight('#0c4a5e', 0.3)
    fillLight.position.set(-3, -5, -2)
    this.scene.add(fillLight)

    const pointLight = new THREE.PointLight('#7ec8b8', 0.6, 30)
    pointLight.position.set(0, 8, 0)
    this.scene.add(pointLight)
  }

  getSceneConfig() {
    return {
      background: '#062C36',
      backgroundGradient: ['#062C36', '#0F4C5C'] as [string, string],
      fogColor: '#0a3a47',
      fogDensity: 0.012,
      cameraPosition: [0, 6, 18] as [number, number, number],
      cameraFov: 60,
      cameraNear: 0.1,
      cameraFar: 500,
      directionalLightPosition: [5, 20, 8] as [number, number, number],
      directionalLightColor: '#7ec8b8',
      directionalLightIntensity: 1.0,
      ambientLightColor: '#1a5a6e',
      ambientLightIntensity: 0.5,
    }
  }

  addPointCloud(geometry: THREE.BufferGeometry, material: THREE.ShaderMaterial): THREE.Points {
    const points = new THREE.Points(geometry, material)
    points.name = 'archaeological_pointcloud'
    this.scene.add(points)
    return points
  }

  removePointCloud(): void {
    const existing = this.scene.getObjectByName('archaeological_pointcloud')
    if (existing) {
      this.scene.remove(existing)
      if (existing instanceof THREE.Points) {
        existing.geometry.dispose()
      }
    }
  }

  updateAspectRatio(width: number, height: number): void {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  dispose(): void {
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })
  }
}

export const sceneManager = new SceneManager()
export default SceneManager
