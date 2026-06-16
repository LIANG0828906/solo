import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useSunStore } from '../storage/store'
import { recalculateSunPosition, updateAllFaceIntensities, generateBuildingFaces } from '../sunlight/calculator'
import { updateFaceColors } from '../sunlight/colorMapper'

interface BuildingConfig {
  x: number
  y: number
  z: number
  w: number
  h: number
  d: number
}

export class SunScene {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  public controls: OrbitControls
  public directionalLight: THREE.DirectionalLight
  public ambientLight: THREE.AmbientLight
  public buildingGroup: THREE.Group
  public faceMeshes: THREE.Mesh[] = []
  public faceMaterials: THREE.ShaderMaterial[] = []
  public sunMesh: THREE.Mesh
  public sunGlow: THREE.Mesh
  public ground: THREE.Mesh
  public gridHelper: THREE.GridHelper
  public clock: THREE.Clock
  public isRunning: boolean = false

  private targetSunDirection: THREE.Vector3 = new THREE.Vector3()
  private currentSunDirection: THREE.Vector3 = new THREE.Vector3(0.5, 0.7, 0.5)
  private targetIntensities: number[] = []
  private currentIntensities: number[] = []
  private sunAnimating: boolean = false
  private sunAnimationProgress: number = 0
  private sunAnimationDuration: number = 0.5

  private fpsDiv: HTMLDivElement | null = null
  private frameCount: number = 0
  private fpsTime: number = 0
  private fps: number = 60

  private buildings: BuildingConfig[] = [
    { x: 0, y: 3, z: 0, w: 8, h: 6, d: 6 },
    { x: 5, y: 2, z: -1, w: 3, h: 4, d: 4 },
    { x: -3, y: 4, z: 2, w: 2, h: 8, d: 2 },
  ]

  private readonly faceNormals = [
    { name: 'south', dir: new THREE.Vector3(0, 0, -1) },
    { name: 'north', dir: new THREE.Vector3(0, 0, 1) },
    { name: 'east', dir: new THREE.Vector3(1, 0, 0) },
    { name: 'west', dir: new THREE.Vector3(-1, 0, 0) },
    { name: 'top', dir: new THREE.Vector3(0, 1, 0) },
    { name: 'bottom', dir: new THREE.Vector3(0, -1, 0) },
  ]

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene()

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = 2
    canvas.height = 256

    const gradient = ctx.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0, '#0A1128')
    gradient.addColorStop(1, '#101A35')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 2, 256)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    this.scene.background = texture

    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000)
    this.camera.position.set(22, 16, 22)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1

    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.06
    this.controls.minDistance = 5
    this.controls.maxDistance = 80
    this.controls.maxPolarAngle = Math.PI / 2.1
    this.controls.target.set(0, 3, 0)

    this.ambientLight = new THREE.AmbientLight(0x505070, 0.5)
    this.scene.add(this.ambientLight)

    this.directionalLight = new THREE.DirectionalLight(0xfff5e6, 1.5)
    this.directionalLight.castShadow = true
    this.directionalLight.shadow.mapSize.width = 2048
    this.directionalLight.shadow.mapSize.height = 2048
    this.directionalLight.shadow.camera.near = 0.5
    this.directionalLight.shadow.camera.far = 100
    this.directionalLight.shadow.camera.left = -30
    this.directionalLight.shadow.camera.right = 30
    this.directionalLight.shadow.camera.top = 30
    this.directionalLight.shadow.camera.bottom = -30
    this.directionalLight.shadow.bias = -0.0005
    this.directionalLight.shadow.normalBias = 0.02
    this.directionalLight.shadow.radius = 4
    this.scene.add(this.directionalLight)

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x2a3a5a, 0.4)
    this.scene.add(hemiLight)

    this.buildingGroup = new THREE.Group()
    this.scene.add(this.buildingGroup)

    this.buildBuildingFaces()

    const groundGeometry = new THREE.CircleGeometry(22, 64)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2333,
      roughness: 0.95,
      metalness: 0.05,
    })
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial)
    this.ground.rotation.x = -Math.PI / 2
    this.ground.receiveShadow = true
    this.scene.add(this.ground)

    this.gridHelper = new THREE.GridHelper(44, 44, 0x2a3a5a, 0x1a2a3a)
    ;(this.gridHelper.material as THREE.Material).transparent = true
    ;(this.gridHelper.material as THREE.Material).opacity = 0.4
    this.scene.add(this.gridHelper)

    const sunGeometry = new THREE.SphereGeometry(0.8, 32, 32)
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd88,
      transparent: true,
      opacity: 0.9,
    })
    this.sunMesh = new THREE.Mesh(sunGeometry, sunMaterial)
    this.scene.add(this.sunMesh)

    const glowGeometry = new THREE.SphereGeometry(1.5, 32, 32)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
    })
    this.sunGlow = new THREE.Mesh(glowGeometry, glowMaterial)
    this.sunMesh.add(this.sunGlow)

    const sunLightTarget = new THREE.Object3D()
    sunLightTarget.position.set(0, 0, 0)
    this.scene.add(sunLightTarget)
    this.directionalLight.target = sunLightTarget

    this.clock = new THREE.Clock()

    this.createFPSCounter(container)

    window.addEventListener('resize', () => this.onResize(container))

    const faces = generateBuildingFaces()
    useSunStore.getState().setBuildingFaces(faces)

    const faceCount = this.buildings.length * 4
    this.targetIntensities = new Array(faceCount).fill(0)
    this.currentIntensities = new Array(faceCount).fill(0)

    this.updateSunFromStore()
  }

  private createFaceShader(): { vertexShader: string; fragmentShader: string } {
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec2 vUv;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `

    const fragmentShader = `
      uniform vec3 uBaseColor;
      uniform float uIntensity;
      uniform float uOpacity;
      uniform vec3 uSunDirection;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec2 vUv;

      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }

      void main() {
        float intensity = clamp(uIntensity, 0.0, 1.0);
        float hue = 240.0 - intensity * 180.0;
        vec3 faceColor = hsv2rgb(vec3(hue / 360.0, 0.75, 0.35 + intensity * 0.65));
        
        vec3 normal = normalize(vNormal);
        float diffuse = max(0.0, dot(normal, normalize(uSunDirection))) * 0.3;
        
        vec3 baseColor = uBaseColor * (0.6 + diffuse);
        vec3 finalColor = mix(baseColor, faceColor, uOpacity * (0.5 + intensity * 0.5));
        
        float edge = min(vUv.x, min(1.0 - vUv.x, min(vUv.y, 1.0 - vUv.y)));
        float edgeFactor = smoothstep(0.0, 0.02, edge);
        finalColor = mix(finalColor * 1.2, finalColor, edgeFactor);
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `

    return { vertexShader, fragmentShader }
  }

  private buildBuildingFaces(): void {
    const { vertexShader, fragmentShader } = this.createFaceShader()

    this.buildings.forEach((b, bIdx) => {
      const faceData = [
        {
          width: b.w,
          height: b.h,
          position: new THREE.Vector3(b.x, b.y, b.z - b.d / 2),
          rotation: new THREE.Euler(0, 0, 0),
        },
        {
          width: b.w,
          height: b.h,
          position: new THREE.Vector3(b.x, b.y, b.z + b.d / 2),
          rotation: new THREE.Euler(0, Math.PI, 0),
        },
        {
          width: b.d,
          height: b.h,
          position: new THREE.Vector3(b.x + b.w / 2, b.y, b.z),
          rotation: new THREE.Euler(0, Math.PI / 2, 0),
        },
        {
          width: b.d,
          height: b.h,
          position: new THREE.Vector3(b.x - b.w / 2, b.y, b.z),
          rotation: new THREE.Euler(0, -Math.PI / 2, 0),
        },
      ]

      faceData.forEach((face, fIdx) => {
        const geometry = new THREE.PlaneGeometry(face.width, face.height, 1, 1)

        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uBaseColor: { value: new THREE.Color(0x3a4a5a) },
            uIntensity: { value: 0.0 },
            uOpacity: { value: 0.8 },
            uSunDirection: { value: new THREE.Vector3(0.5, 0.7, 0.5) },
          },
          side: THREE.FrontSide,
        })

        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.copy(face.position)
        mesh.rotation.copy(face.rotation)
        mesh.castShadow = true
        mesh.receiveShadow = true
        this.buildingGroup.add(mesh)
        this.faceMeshes.push(mesh)
        this.faceMaterials.push(material)
      })

      const topGeometry = new THREE.PlaneGeometry(b.w, b.d)
      const topMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a5a6a,
        roughness: 0.8,
        metalness: 0.2,
      })
      const topMesh = new THREE.Mesh(topGeometry, topMaterial)
      topMesh.position.set(b.x, b.y + b.h / 2, b.z)
      topMesh.rotation.x = -Math.PI / 2
      topMesh.castShadow = true
      topMesh.receiveShadow = true
      this.buildingGroup.add(topMesh)

      const bottomGeometry = new THREE.PlaneGeometry(b.w, b.d)
      const bottomMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a3a4a,
        roughness: 0.9,
        metalness: 0.1,
      })
      const bottomMesh = new THREE.Mesh(bottomGeometry, bottomMaterial)
      bottomMesh.position.set(b.x, b.y - b.h / 2, b.z)
      bottomMesh.rotation.x = Math.PI / 2
      bottomMesh.receiveShadow = true
      this.buildingGroup.add(bottomMesh)
    })
  }

  private createFPSCounter(container: HTMLElement): void {
    this.fpsDiv = document.createElement('div')
    this.fpsDiv.style.position = 'absolute'
    this.fpsDiv.style.top = '16px'
    this.fpsDiv.style.left = '16px'
    this.fpsDiv.style.padding = '8px 12px'
    this.fpsDiv.style.background = 'rgba(0, 0, 0, 0.5)'
    this.fpsDiv.style.color = '#00ff66'
    this.fpsDiv.style.fontFamily = 'monospace'
    this.fpsDiv.style.fontSize = '13px'
    this.fpsDiv.style.fontWeight = 'bold'
    this.fpsDiv.style.borderRadius = '6px'
    this.fpsDiv.style.pointerEvents = 'none'
    this.fpsDiv.style.zIndex = '100'
    this.fpsDiv.style.textShadow = '0 0 5px rgba(0, 255, 102, 0.5)'
    this.fpsDiv.textContent = 'FPS: 60'
    container.appendChild(this.fpsDiv)
  }

  private updateFPS(deltaTime: number): void {
    this.frameCount++
    this.fpsTime += deltaTime

    if (this.fpsTime >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsTime)
      this.frameCount = 0
      this.fpsTime = 0
      if (this.fpsDiv) {
        this.fpsDiv.textContent = `FPS: ${this.fps}`
      }
    }
  }

  public updateSunFromStore(): void {
    const state = useSunStore.getState()
    const { sunDirection, buildingFaces } = state

    this.targetSunDirection.set(sunDirection.x, sunDirection.y, sunDirection.z).normalize()
    this.targetIntensities = buildingFaces.map((f) => f.intensity)

    this.sunAnimating = true
    this.sunAnimationProgress = 0
  }

  private updateSunAnimation(delta: number): void {
    if (!this.sunAnimating) return

    this.sunAnimationProgress += delta / this.sunAnimationDuration

    if (this.sunAnimationProgress >= 1) {
      this.sunAnimationProgress = 1
      this.sunAnimating = false
      this.currentSunDirection.copy(this.targetSunDirection)
      this.currentIntensities = [...this.targetIntensities]
    } else {
      const t = this.easeInOutQuad(this.sunAnimationProgress)
      this.currentSunDirection.lerpVectors(this.currentSunDirection, this.targetSunDirection, 0.12)

      for (let i = 0; i < this.currentIntensities.length; i++) {
        this.currentIntensities[i] += (this.targetIntensities[i] - this.currentIntensities[i]) * 0.08
      }
    }

    const lightDistance = 35
    this.directionalLight.position.copy(this.currentSunDirection).multiplyScalar(lightDistance)
    this.directionalLight.target.position.set(0, 0, 0)
    this.directionalLight.intensity = 0.8 + Math.max(0, this.currentSunDirection.y) * 1.2

    const sunDistance = 25
    this.sunMesh.position.copy(this.currentSunDirection).multiplyScalar(sunDistance)
    const sunScale = 0.5 + Math.max(0, this.currentSunDirection.y) * 1.5
    this.sunMesh.scale.setScalar(sunScale)
    ;(this.sunMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0.1, this.currentSunDirection.y)
    ;(this.sunGlow.material as THREE.MeshBasicMaterial).opacity = Math.max(0.05, this.currentSunDirection.y) * 0.4

    this.faceMaterials.forEach((mat, index) => {
      if (index < this.currentIntensities.length) {
        mat.uniforms.uIntensity.value = this.currentIntensities[index]
        mat.uniforms.uSunDirection.value.copy(this.currentSunDirection)
      }
    })
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  }

  public start(): void {
    this.isRunning = true
    this.animate()
  }

  public stop(): void {
    this.isRunning = false
  }

  private animate(): void {
    if (!this.isRunning) return

    requestAnimationFrame(() => this.animate())

    const delta = Math.min(this.clock.getDelta(), 0.1)

    this.updateSunAnimation(delta)
    this.updateFPS(delta)
    this.controls.update()

    this.renderer.render(this.scene, this.camera)
  }

  private onResize(container: HTMLElement): void {
    this.camera.aspect = container.clientWidth / container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(container.clientWidth, container.clientHeight)
  }

  public dispose(): void {
    this.stop()
    this.renderer.dispose()
    this.controls.dispose()
    if (this.fpsDiv?.parentNode) {
      this.fpsDiv.parentNode.removeChild(this.fpsDiv)
    }
  }
}
