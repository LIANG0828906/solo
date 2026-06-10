import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { BubbleManager } from './BubbleManager.js'
import { UI } from './UI.js'

class StarVoiceBubbles {
  constructor() {
    this.container = document.getElementById('canvas-container')
    this.clock = new THREE.Clock()
    this.audioContext = null
    
    this.init()
    this.initAudio()
    this.createManagers()
    this.bindEvents()
    this.animate()
    
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.bubbleManager.createBubble()
      }, i * 300)
    }
  }

  init() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0d0a2e)
    this.scene.fog = new THREE.FogExp2(0x0d0a2e, 0.008)

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.set(0, 5, 25)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    this.container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 10
    this.controls.maxDistance = 80
    this.controls.autoRotate = true
    this.controls.autoRotateSpeed = 0.5

    this.setupLighting()
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x4a4a7a, 0.6)
    this.scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 1)
    mainLight.position.set(10, 20, 10)
    this.scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0x4fc3f7, 0.5)
    fillLight.position.set(-10, 10, -10)
    this.scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xe91e63, 0.3)
    rimLight.position.set(0, -10, 10)
    this.scene.add(rimLight)

    const pointLight1 = new THREE.PointLight(0xffd700, 1, 50)
    pointLight1.position.set(15, 10, 15)
    this.scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0x9c27b0, 0.8, 40)
    pointLight2.position.set(-15, -10, -15)
    this.scene.add(pointLight2)
  }

  initAudio() {
    const initContext = () => {
      if (!this.audioContext) {
        try {
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
        } catch (e) {
          console.log('Web Audio API not supported')
        }
      }
    }

    document.addEventListener('click', initContext, { once: true })
    document.addEventListener('touchstart', initContext, { once: true })
  }

  createManagers() {
    this.bubbleManager = new BubbleManager(
      this.scene,
      this.camera,
      this.renderer,
      this.audioContext
    )
    
    this.ui = new UI(this.bubbleManager, this.scene)
  }

  bindEvents() {
    window.addEventListener('resize', () => this.onWindowResize())
    
    this.renderer.domElement.addEventListener('click', (e) => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }
      this.bubbleManager.handleClick(e, this.renderer.domElement, this.ui)
    })
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  animate() {
    requestAnimationFrame(() => this.animate())
    
    const deltaTime = Math.min(this.clock.getDelta(), 0.1)
    
    this.controls.update()
    this.bubbleManager.update(deltaTime)
    this.renderer.render(this.scene, this.camera)
  }
}

new StarVoiceBubbles()
