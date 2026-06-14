import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createHeartModel, HeartModel } from './model'
import { useHeartStore } from '../store/useHeartStore'

export interface HeartScene {
  start: () => void
  stop: () => void
  dispose: () => void
  setPaused: (paused: boolean) => void
  setConductionVisible: (visible: boolean) => void
  resize: () => void
}

export function createHeartScene(container: HTMLElement): HeartScene {
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let renderer: THREE.WebGLRenderer
  let controls: OrbitControls
  let heartModel: HeartModel
  let animationFrameId: number
  let isPaused = false
  let isRunning = false
  const clock = new THREE.Clock()
  let lastTime = 0

  function init(): void {
    scene = new THREE.Scene()

    const canvas = document.createElement('canvas')
    canvas.style.position = 'fixed'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.zIndex = '0'
    container.appendChild(canvas)

    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    )
    camera.position.set(0, 1.5, 4)

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.rotateSpeed = 0.5
    controls.enablePan = false
    controls.minDistance = 2
    controls.maxDistance = 10
    controls.target.set(0, 0, 0)

    const topColor = new THREE.Color('#0f172a')
    const bottomColor = new THREE.Color('#1e3a8a')
    const vertices = new Float32Array([
      -1, -1, 0,
      1, -1, 0,
      1, 1, 0,
      -1, 1, 0,
    ])
    const colors = new Float32Array([
      bottomColor.r, bottomColor.g, bottomColor.b,
      bottomColor.r, bottomColor.g, bottomColor.b,
      topColor.r, topColor.g, topColor.b,
      topColor.r, topColor.g, topColor.b,
    ])
    const bgGeometry = new THREE.BufferGeometry()
    bgGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    bgGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    bgGeometry.setIndex([0, 1, 2, 0, 2, 3])
    const bgMaterial = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec3 vColor;
        attribute vec3 color;
        void main() {
          vColor = color;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          gl_FragColor = vec4(vColor, 1.0);
        }
      `,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    })
    const backgroundMesh = new THREE.Mesh(bgGeometry, bgMaterial)
    backgroundMesh.renderOrder = -1000
    backgroundMesh.position.z = -5
    scene.add(backgroundMesh)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0)
    keyLight.position.set(5, 5, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 1024
    keyLight.shadow.mapSize.height = 1024
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.4)
    fillLight.position.set(-5, 3, -3)
    scene.add(fillLight)

    const rimLight = new THREE.PointLight(0xff6666, 0.5, 10)
    rimLight.position.set(0, 0, -3)
    scene.add(rimLight)

    heartModel = createHeartModel()
    scene.add(heartModel.group)

    const cameraHeight = window.innerHeight
    const modelHeight = cameraHeight / 3
    const fov = camera.fov * (Math.PI / 180)
    const distance = (modelHeight / 2) / Math.tan(fov / 2)
    camera.position.z = distance * 1.2
    camera.position.y = distance * 0.3
    controls.update()

    window.addEventListener('resize', onWindowResize)
  }

  function onWindowResize(): void {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    
    const cameraHeight = window.innerHeight
    const fov = camera.fov * (Math.PI / 180)
    const targetHeight = cameraHeight / 300
    const distance = (targetHeight / 2) / Math.tan(fov / 2)
    camera.position.z = Math.max(2.5, distance * 1.5)
    camera.position.y = distance * 0.3
    
    controls.update()
    heartModel.resize()
  }

  function animate(): void {
    animationFrameId = requestAnimationFrame(animate)

    const delta = clock.getDelta()
    const elapsed = clock.getElapsedTime()

    if (!isPaused) {
      const state = useHeartStore.getState()
      const activationArray = state.activationArray
      heartModel.update(activationArray, delta, elapsed)
    }

    controls.update()
    renderer.render(scene, camera)

    lastTime = elapsed
  }

  function start(): void {
    if (isRunning) return
    isRunning = true
    clock.start()
    animate()
  }

  function stop(): void {
    if (!isRunning) return
    isRunning = false
    cancelAnimationFrame(animationFrameId)
    clock.stop()
  }

  function dispose(): void {
    stop()
    window.removeEventListener('resize', onWindowResize)
    
    if (renderer) {
      renderer.dispose()
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }

    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (object.material instanceof THREE.Material) {
          object.material.dispose()
        }
      }
    })
  }

  function setPaused(paused: boolean): void {
    isPaused = paused
    if (paused) {
      clock.stop()
    } else {
      clock.start()
    }
  }

  function setConductionVisible(visible: boolean): void {
    heartModel.setConductionVisible(visible)
  }

  function resize(): void {
    onWindowResize()
  }

  init()

  return {
    start,
    stop,
    dispose,
    setPaused,
    setConductionVisible,
    resize,
  }
}
