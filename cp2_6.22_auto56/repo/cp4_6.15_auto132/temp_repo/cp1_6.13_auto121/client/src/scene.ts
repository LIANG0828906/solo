import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { LightConfig } from './types'

export interface SceneCallbacks {
  onFrame?: (delta: number) => void
}

function colorTempToRGB(kelvin: number): THREE.Color {
  const temp = kelvin / 100
  let red: number, green: number, blue: number
  if (temp <= 66) {
    red = 255
    green = temp
    green = 99.4708025861 * Math.log(green) - 161.1195681661
    if (temp <= 19) {
      blue = 0
    } else {
      blue = temp - 10
      blue = 138.5177312231 * Math.log(blue) - 305.0447927307
    }
  } else {
    red = temp - 60
    red = 329.698727446 * Math.pow(red, -0.1332047592)
    green = temp - 60
    green = 288.1221695283 * Math.pow(green, -0.0755148492)
    blue = 255
  }
  const clamp = (v: number) => Math.max(0, Math.min(255, v)) / 255
  return new THREE.Color(clamp(red), clamp(green), clamp(blue))
}

function hexToRgb(hex: string): THREE.Color {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16) / 255
  const g = parseInt(h.substring(2, 4), 16) / 255
  const b = parseInt(h.substring(4, 6), 16) / 255
  return new THREE.Color(r, g, b)
}

export class LightScene {
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private spotlights: THREE.SpotLight[] = []
  private spotlightTargets: THREE.Object3D[] = []
  private spotlightHelpers: THREE.SpotLightHelper[] = []
  private glowMeshes: THREE.Mesh[] = []
  private particles: THREE.Points | null = null
  private focusBox: THREE.Mesh | null = null
  private artifact: THREE.Group | null = null
  private animationId: number | null = null
  private currentLights: (LightConfig & { targetBrightness: number; targetColorTemp: number })[] = []
  private lastZoomTime = 0
  private lastRotateTime = 0
  private callbacks: SceneCallbacks = {}
  private clock = new THREE.Clock()
  private fpsCounter = { frames: 0, lastTime: 0, fps: 60 }

  constructor(container: HTMLElement, callbacks: SceneCallbacks = {}) {
    this.container = container
    this.callbacks = callbacks
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0a0a)
    this.scene.fog = new THREE.FogExp2(0x0a0a0a, 0.035)

    const { clientWidth: w, clientHeight: h } = container
    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000)
    this.camera.position.set(8, 8, 12)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(w, h)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.minDistance = 4
    this.controls.maxDistance = 30
    this.controls.maxPolarAngle = Math.PI * 0.9
    this.controls.target.set(0, 1.5, 0)

    this.setupEnvironment()
    this.setupSpotlights()
    this.setupParticles()
    this.setupFocusBox()
    this.setupControlsEvents()

    window.addEventListener('resize', this.handleResize)
    this.animate()
  }

  private setupEnvironment() {
    const ambient = new THREE.AmbientLight(0x222233, 0.3)
    this.scene.add(ambient)

    const floorGeo = new THREE.CircleGeometry(12, 64)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.85,
      metalness: 0.15
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)

    const gridHelper = new THREE.GridHelper(18, 36, 0x333344, 0x222233)
    ;(gridHelper.material as THREE.Material).opacity = 0.4
    ;(gridHelper.material as THREE.Material).transparent = true
    this.scene.add(gridHelper)

    this.artifact = new THREE.Group()
    this.scene.add(this.artifact)

    const pedestalGeo = new THREE.CylinderGeometry(1.8, 2.2, 0.4, 48)
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.3,
      metalness: 0.7
    })
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat)
    pedestal.position.y = 0.2
    pedestal.castShadow = true
    pedestal.receiveShadow = true
    this.artifact.add(pedestal)

    const mainSphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.1, 3),
      new THREE.MeshPhysicalMaterial({
        color: 0xdde4f0,
        roughness: 0.25,
        metalness: 0.1,
        clearcoat: 0.6,
        clearcoatRoughness: 0.2
      })
    )
    mainSphere.position.y = 1.8
    mainSphere.castShadow = true
    mainSphere.receiveShadow = true
    this.artifact.add(mainSphere)

    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.08, 24, 80),
      new THREE.MeshStandardMaterial({
        color: 0xf5d76e,
        roughness: 0.35,
        metalness: 0.85
      })
    )
    torus.position.y = 1.8
    torus.rotation.x = Math.PI / 3
    torus.castShadow = true
    this.artifact.add(torus)

    const torus2 = torus.clone()
    torus2.rotation.x = -Math.PI / 4
    torus2.rotation.z = Math.PI / 3
    torus2.material = new THREE.MeshStandardMaterial({
      color: 0x6e8efb,
      roughness: 0.3,
      metalness: 0.9
    })
    this.artifact.add(torus2)

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.28, 0.28),
        new THREE.MeshPhysicalMaterial({
          color: new THREE.Color().setHSL(i / 6, 0.75, 0.6),
          roughness: 0.15,
          metalness: 0.4,
          clearcoat: 1.0
        })
      )
      cube.position.set(Math.cos(angle) * 1.4, 0.7, Math.sin(angle) * 1.4)
      cube.rotation.set(angle * 0.5, angle, angle * 0.3)
      cube.castShadow = true
      cube.receiveShadow = true
      this.artifact.add(cube)
    }
  }

  private setupSpotlights() {
    for (let i = 0; i < 5; i++) {
      const config = {
        id: i,
        color: '#FFFFFF',
        brightness: 50,
        colorTemp: 4500,
        position: { x: 0, y: 8, z: 0 },
        target: { x: 0, y: 1.5, z: 0 },
        targetBrightness: 50,
        targetColorTemp: 4500
      }
      this.currentLights.push(config)

      const target = new THREE.Object3D()
      target.position.set(0, 1.5, 0)
      this.scene.add(target)
      this.spotlightTargets.push(target)

      const light = new THREE.SpotLight(0xffffff, 1.5, 30, Math.PI / 7, 0.4, 1.2)
      light.castShadow = true
      light.shadow.mapSize.set(1024, 1024)
      light.shadow.camera.near = 1
      light.shadow.camera.far = 30
      light.shadow.bias = -0.0001
      light.target = target
      this.scene.add(light)
      this.spotlights.push(light)

      const helper = new THREE.SpotLightHelper(light, 0xffffff)
      const helperMat = (helper as unknown as { material: THREE.Material }).material
      helperMat.opacity = 0.12
      helperMat.transparent = true
      this.scene.add(helper)
      this.spotlightHelpers.push(helper)

      const bulbGeo = new THREE.SphereGeometry(0.12, 16, 16)
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
      const bulb = new THREE.Mesh(bulbGeo, bulbMat)
      this.scene.add(bulb)
      this.glowMeshes.push(bulb)
    }
  }

  private setupParticles() {
    const count = 200
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.5
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5
      const c = new THREE.Color().setHSL(0.55 + Math.random() * 0.15, 0.8, 0.6)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const mat = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    this.particles = new THREE.Points(geo, mat)
    this.scene.add(this.particles)
  }

  private setupFocusBox() {
    const geo = new THREE.RingGeometry(2.2, 2.5, 64)
    const mat = new THREE.MeshBasicMaterial({
      color: 0x4a90e2,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    })
    this.focusBox = new THREE.Mesh(geo, mat)
    this.focusBox.rotation.x = -Math.PI / 2
    this.focusBox.position.y = 0.02
    this.scene.add(this.focusBox)
  }

  private setupControlsEvents() {
    let isRotating = false
    this.controls.addEventListener('start', () => {
      isRotating = true
    })
    this.controls.addEventListener('change', () => {
      if (isRotating) {
        this.lastRotateTime = this.clock.elapsedTime
      }
    })
    this.controls.addEventListener('end', () => {
      isRotating = false
    })

    const origUpdate = this.controls.update.bind(this.controls)
    let lastDist = this.camera.position.distanceTo(this.controls.target)
    this.controls.update = (...args) => {
      const curDist = this.camera.position.distanceTo(this.controls.target)
      if (Math.abs(curDist - lastDist) > 0.05) {
        this.lastZoomTime = this.clock.elapsedTime
      }
      lastDist = curDist
      return origUpdate(...args)
    }
  }

  private handleResize = () => {
    const { clientWidth: w, clientHeight: h } = this.container
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  public updateLights(lights: LightConfig[], animate = true) {
    lights.forEach((cfg) => {
      const current = this.currentLights[cfg.id]
      if (!current) return
      current.color = cfg.color
      current.position = cfg.position
      current.target = cfg.target
      if (animate) {
        current.targetBrightness = cfg.brightness
        current.targetColorTemp = cfg.colorTemp
      } else {
        current.brightness = cfg.brightness
        current.targetBrightness = cfg.brightness
        current.colorTemp = cfg.colorTemp
        current.targetColorTemp = cfg.colorTemp
      }
    })
  }

  public triggerGlow(lightId: number) {
    const light = this.spotlights[lightId]
    if (!light) return
    const start = this.clock.elapsedTime
    const duration = 0.4
    const origAngle = light.angle
    const animateGlow = () => {
      const t = (this.clock.elapsedTime - start) / duration
      if (t >= 1) {
        light.angle = origAngle
        return
      }
      const pulse = Math.sin(t * Math.PI) * 0.08
      light.angle = origAngle + pulse
      requestAnimationFrame(animateGlow)
    }
    animateGlow()
  }

  private animate = () => {
    const delta = Math.min(this.clock.getDelta(), 0.05)
    const t = this.clock.elapsedTime

    this.currentLights.forEach((cfg, i) => {
      const light = this.spotlights[i]
      const target = this.spotlightTargets[i]
      const helper = this.spotlightHelpers[i]
      const bulb = this.glowMeshes[i]
      if (!light || !target || !helper || !bulb) return

      cfg.brightness += (cfg.targetBrightness - cfg.brightness) * Math.min(delta * 4, 1)
      cfg.colorTemp += (cfg.targetColorTemp - cfg.colorTemp) * Math.min(delta * 3, 1)

      light.position.set(cfg.position.x, cfg.position.y, cfg.position.z)
      target.position.set(cfg.target.x, cfg.target.y, cfg.target.z)
      bulb.position.copy(light.position)

      const baseColor = hexToRgb(cfg.color)
      const tempColor = colorTempToRGB(cfg.colorTemp)
      const finalColor = baseColor.clone().lerp(tempColor, 0.5)
      light.color = finalColor
      light.intensity = cfg.brightness / 100 * 3

      const bulbColor = finalColor.clone()
      ;(bulb.material as THREE.MeshBasicMaterial).color = bulbColor

      helper.update()
      helper.color = finalColor
    })

    if (this.artifact) {
      this.artifact.children.forEach((child, i) => {
        if (i > 2) {
          child.rotation.y += delta * (0.3 + i * 0.05)
          child.position.y += Math.sin(t * 1.2 + i) * 0.002
        }
      })
    }

    if (this.particles) {
      this.particles.position.copy(this.camera.position)
      this.particles.lookAt(this.controls.target)
      const mat = this.particles.material as THREE.PointsMaterial
      const timeSinceRotate = t - this.lastRotateTime
      const targetOp = timeSinceRotate < 1.5 ? 0.3 : 0
      mat.opacity += (targetOp - mat.opacity) * Math.min(delta * 2, 1)
      const posAttr = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < posAttr.count; i++) {
        posAttr.setX(i, posAttr.getX(i) + Math.sin(t * 2 + i) * 0.0003)
        posAttr.setY(i, posAttr.getY(i) + Math.cos(t * 1.5 + i * 0.7) * 0.0003)
        posAttr.setZ(i, posAttr.getZ(i) + Math.sin(t + i * 0.5) * 0.0003)
      }
      posAttr.needsUpdate = true
    }

    if (this.focusBox) {
      const mat = this.focusBox.material as THREE.MeshBasicMaterial
      const timeSinceZoom = t - this.lastZoomTime
      const targetOp = timeSinceZoom < 0.8 ? (1 - timeSinceZoom / 0.8) * 0.45 : 0
      mat.opacity += (targetOp - mat.opacity) * Math.min(delta * 3, 1)
      this.focusBox.scale.setScalar(1 + Math.sin(t * 4) * 0.03)
    }

    this.controls.update()
    this.renderer.render(this.scene, this.camera)

    this.fpsCounter.frames++
    const now = performance.now()
    if (now - this.fpsCounter.lastTime >= 1000) {
      this.fpsCounter.fps = this.fpsCounter.frames
      this.fpsCounter.frames = 0
      this.fpsCounter.lastTime = now
    }

    this.callbacks.onFrame?.(delta)
    this.animationId = requestAnimationFrame(this.animate)
  }

  public dispose() {
    if (this.animationId) cancelAnimationFrame(this.animationId)
    window.removeEventListener('resize', this.handleResize)
    this.controls.dispose()
    this.renderer.dispose()
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
  }
}
