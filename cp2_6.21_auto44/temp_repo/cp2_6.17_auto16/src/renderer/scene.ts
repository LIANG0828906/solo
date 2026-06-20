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
  color?: number
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
  public ground: THREE.Mesh
  public shadowBlurPlane: THREE.Mesh
  public gridHelper: THREE.GridHelper
  public clock: THREE.Clock
  public isRunning: boolean = false

  private targetSunDirection: THREE.Vector3 = new THREE.Vector3()
  private currentSunDirection: THREE.Vector3 = new THREE.Vector3(0.5, 0.7, 0.5)
  private targetIntensities: number[] = []
  private currentDisplayIntensities: number[] = []
  private startIntensities: number[] = []
  private sunAnimating: boolean = false
  private sunAnimationProgress: number = 0
  private sunAnimationDuration: number = 0.5
  private colorAnimating: boolean = false
  private colorAnimationProgress: number = 0
  private colorAnimationDuration: number = 1.0
  private readonly COLOR_INTENSITY_STEP = 0.05

  private fpsDiv: HTMLDivElement | null = null
  private frameCount: number = 0
  private fpsTime: number = 0
  private fps: number = 60

  private buildings: BuildingConfig[] = [
    { x: 0, y: 3, z: 0, w: 8, h: 6, d: 6, color: 0x3a4a5a },
    { x: 5, y: 2, z: -1, w: 3, h: 4, d: 4, color: 0x42526a },
    { x: -3, y: 4, z: 2, w: 2, h: 8, d: 2, color: 0x3e4e64 },
    { x: -1, y: 3, z: -3.3, w: 2.5, h: 3.5, d: 0.6, color: 0x5a6a7e },
    { x: 1, y: 1.5, z: -3.1, w: 2, h: 3, d: 0.4, color: 0x4a5a6e },
  ]

  private readonly facesPerBuilding = 5

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene()

    const bgCanvas = document.createElement('canvas')
    const bgCtx = bgCanvas.getContext('2d')!
    bgCanvas.width = 2
    bgCanvas.height = 256

    const gradient = bgCtx.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0, '#0A1128')
    gradient.addColorStop(1, '#101A35')
    bgCtx.fillStyle = gradient
    bgCtx.fillRect(0, 0, 2, 256)

    const bgTexture = new THREE.CanvasTexture(bgCanvas)
    bgTexture.needsUpdate = true
    this.scene.background = bgTexture

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
    this.directionalLight.shadow.bias = -0.0008
    this.directionalLight.shadow.normalBias = 0.03
    this.directionalLight.shadow.radius = 6
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

    const shadowBlurGeom = new THREE.CircleGeometry(22, 64)
    const shadowBlurMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uSunAltitude: { value: 0.5 },
        uSunAzimuth: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        uniform float uSunAltitude;
        uniform float uSunAzimuth;
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center) * 2.0;
          if(dist > 1.0) discard;
          
          float edgeFeather = smoothstep(1.0, 0.85, dist);
          
          float shadowAmount = 0.0;
          if(uSunAltitude > 0.0) {
            float altitudeFactor = 1.0 - clamp(uSunAltitude, 0.0, 1.0);
            shadowAmount = mix(0.0, 0.12, altitudeFactor) * edgeFeather;
          }
          
          vec3 shadowColor = vec3(0.05, 0.08, 0.12);
          gl_FragColor = vec4(shadowColor, shadowAmount);
        }
      `,
      blending: THREE.MultiplyBlending,
    })
    this.shadowBlurPlane = new THREE.Mesh(shadowBlurGeom, shadowBlurMat)
    this.shadowBlurPlane.rotation.x = -Math.PI / 2
    this.shadowBlurPlane.position.y = 0.02
    this.shadowBlurPlane.visible = true
    this.scene.add(this.shadowBlurPlane)

    this.gridHelper = new THREE.GridHelper(44, 44, 0x2a3a5a, 0x1a2a3a)
    ;(this.gridHelper.material as THREE.Material).transparent = true
    ;(this.gridHelper.material as THREE.Material).opacity = 0.4
    this.scene.add(this.gridHelper)

    const sunLightTarget = new THREE.Object3D()
    sunLightTarget.position.set(0, 0, 0)
    this.scene.add(sunLightTarget)
    this.directionalLight.target = sunLightTarget

    this.clock = new THREE.Clock()

    this.createFPSCounter(container)

    window.addEventListener('resize', () => this.onResize(container))

    const faces = generateBuildingFaces()
    useSunStore.getState().setBuildingFaces(faces)

    const faceCount = this.buildings.length * this.facesPerBuilding
    this.targetIntensities = new Array(faceCount).fill(0)
    this.currentDisplayIntensities = new Array(faceCount).fill(0)
    this.startIntensities = new Array(faceCount).fill(0)

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
        float diffuse = max(0.0, dot(normal, normalize(uSunDirection))) * 0.25;

        vec3 baseColor = uBaseColor * (0.65 + diffuse);
        vec3 finalColor = mix(baseColor, faceColor, uOpacity * (0.5 + intensity * 0.5));

        float edge = min(vUv.x, min(1.0 - vUv.x, min(vUv.y, 1.0 - vUv.y)));
        float edgeFactor = smoothstep(0.0, 0.015, edge);
        finalColor = mix(finalColor * 1.15, finalColor, edgeFactor);

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
        {
          width: b.w,
          height: b.d,
          position: new THREE.Vector3(b.x, b.y + b.h / 2, b.z),
          rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
        },
      ]

      const baseColor = new THREE.Color(b.color ?? 0x3a4a5a)

      faceData.forEach((face) => {
        const geometry = new THREE.PlaneGeometry(face.width, face.height, 1, 1)

        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uBaseColor: { value: baseColor.clone() },
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

      const bottomGeometry = new THREE.PlaneGeometry(b.w, b.d)
      const bottomMaterial = new THREE.MeshStandardMaterial({
        color: baseColor.clone().multiplyScalar(0.7),
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

    for (let i = 0; i < this.currentDisplayIntensities.length; i++) {
      this.startIntensities[i] = this.currentDisplayIntensities[i]
    }

    this.targetIntensities = buildingFaces.map((f) => f.intensity)
    while (this.targetIntensities.length < this.currentDisplayIntensities.length) {
      this.targetIntensities.push(0)
    }

    this.sunAnimating = true
    this.sunAnimationProgress = 0

    this.colorAnimating = true
    this.colorAnimationProgress = 0
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  }

  private isInViewFrustum(object: THREE.Object3D): boolean {
    const frustum = new THREE.Frustum()
    const matrix = new THREE.Matrix4().multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    )
    frustum.setFromProjectionMatrix(matrix)

    const sphere = new THREE.Sphere()
    const box = new THREE.Box3().setFromObject(object)
    box.getBoundingSphere(sphere)

    return frustum.intersectsSphere(sphere)
  }

  private updateAnimations(delta: number): void {
    if (this.sunAnimating) {
      this.sunAnimationProgress += delta / this.sunAnimationDuration
      if (this.sunAnimationProgress >= 1) {
        this.sunAnimationProgress = 1
        this.sunAnimating = false
        this.currentSunDirection.copy(this.targetSunDirection)
      } else {
        const t = this.easeInOutQuad(this.sunAnimationProgress)
        this.currentSunDirection.lerpVectors(this.currentSunDirection, this.targetSunDirection, 0.08 + t * 0.1)
      }
    }

    if (this.colorAnimating) {
      this.colorAnimationProgress += delta / this.colorAnimationDuration
      if (this.colorAnimationProgress >= 1) {
        this.colorAnimationProgress = 1
        this.colorAnimating = false
        for (let i = 0; i < this.currentDisplayIntensities.length; i++) {
          this.currentDisplayIntensities[i] = this.targetIntensities[i] ?? 0
        }
      } else {
        const easedProgress = this.easeInOutQuad(this.colorAnimationProgress)

        for (let i = 0; i < this.currentDisplayIntensities.length; i++) {
          const start = this.startIntensities[i] ?? 0
          const target = this.targetIntensities[i] ?? 0
          const continuousValue = start + (target - start) * easedProgress

          const steppedValue =
            Math.round(continuousValue / this.COLOR_INTENSITY_STEP) * this.COLOR_INTENSITY_STEP

          this.currentDisplayIntensities[i] = Math.max(0, Math.min(1, steppedValue))
        }
      }
    }

    const lightDistance = 35
    this.directionalLight.position.copy(this.currentSunDirection).multiplyScalar(lightDistance)
    this.directionalLight.target.position.set(0, 0, 0)
    this.directionalLight.intensity = 0.8 + Math.max(0, this.currentSunDirection.y) * 1.2

    const sunAltitude = Math.max(0, this.currentSunDirection.y)
    const sunAzimuth = Math.atan2(this.currentSunDirection.x, this.currentSunDirection.z)
    ;(this.shadowBlurPlane.material as THREE.ShaderMaterial).uniforms.uSunAltitude.value = sunAltitude
    ;(this.shadowBlurPlane.material as THREE.ShaderMaterial).uniforms.uSunAzimuth.value = sunAzimuth

    this.shadowBlurPlane.visible = this.isInViewFrustum(this.shadowBlurPlane) && sunAltitude > 0.05

    this.faceMaterials.forEach((mat, index) => {
      if (index < this.currentDisplayIntensities.length) {
        mat.uniforms.uIntensity.value = this.currentDisplayIntensities[index]
        mat.uniforms.uSunDirection.value.copy(this.currentSunDirection)
      }
    })
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

    this.updateAnimations(delta)
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
