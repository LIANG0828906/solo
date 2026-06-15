/*
 * ============================================================
 * 模块调用关系与数据流向
 * ============================================================
 *
 * 职责：
 *   - 初始化 Three.js 场景、透视相机、WebGL 渲染器
 *   - 设置环境光照、阴影、背景渐变
 *   - 创建 OrbitControls 轨道控制器
 *   - 管理动画循环 (requestAnimationFrame)
 *   - 协调心脏模型与 UI 交互
 *
 * 数据流入：
 *   - main.ts 调用 createHeartScene() 并 start()
 *   - useHeartStore 订阅变化，通过 setPaused / setConductionVisible 控制
 *
 * 内部处理：
 *   1. 每帧调用 heartModel.update() 更新顶点位置和材质颜色
 *   2. 更新 OrbitControls 阻尼
 *   3. 调用 renderer.render() 渲染场景
 *   4. 处理窗口 resize 事件，自动调整相机和渲染器
 *
 * 数据流出：
 *   - WebGL 渲染结果输出到 canvas
 *
 * 调用方：
 *   - main.ts 在应用启动时创建场景实例
 *   - 动画循环每帧调用 heartModel.update()
 * ============================================================
 */

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
  let canvas: HTMLCanvasElement

  function createBackgroundGradient(): THREE.Mesh {
    const topColor = new THREE.Color('#0f172a')
    const bottomColor = new THREE.Color('#1e3a8a')

    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: topColor },
        bottomColor: { value: bottomColor },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec2 vUv;
        void main() {
          vec3 color = mix(bottomColor, topColor, vUv.y);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.renderOrder = -1000
    mesh.position.z = -10
    return mesh
  }

  function init(): void {
    scene = new THREE.Scene()

    canvas = document.createElement('canvas')
    canvas.style.position = 'fixed'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.zIndex = '0'
    canvas.style.display = 'block'
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
    renderer.outputColorSpace = THREE.SRGBColorSpace

    camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    )
    camera.position.set(0, 1.0, 4)

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.rotateSpeed = 0.5
    controls.enablePan = false
    controls.minDistance = 2
    controls.maxDistance = 10
    controls.minPolarAngle = Math.PI * 0.2
    controls.maxPolarAngle = Math.PI * 0.8
    controls.target.set(0, 0, 0)

    const bgMesh = createBackgroundGradient()
    scene.add(bgMesh)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0)
    keyLight.position.set(5, 5, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 1024
    keyLight.shadow.mapSize.height = 1024
    keyLight.shadow.camera.near = 0.5
    keyLight.shadow.camera.far = 20
    keyLight.shadow.camera.left = -3
    keyLight.shadow.camera.right = 3
    keyLight.shadow.camera.top = 3
    keyLight.shadow.camera.bottom = -3
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.4)
    fillLight.position.set(-5, 3, -3)
    scene.add(fillLight)

    const rimLight = new THREE.PointLight(0xff6666, 0.5, 10)
    rimLight.position.set(0, 0, -3)
    scene.add(rimLight)

    heartModel = createHeartModel()
    scene.add(heartModel.group)

    const initialHeight = window.innerHeight
    const fov = camera.fov * (Math.PI / 180)
    const targetHeight = 2.0
    const distance = (targetHeight / 2) / Math.tan(fov / 2)
    camera.position.z = distance
    camera.position.y = distance * 0.25
    controls.update()

    window.addEventListener('resize', onWindowResize)
  }

  function onWindowResize(): void {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)

    const fov = camera.fov * (Math.PI / 180)
    const targetHeight = 2.2
    const distance = (targetHeight / 2) / Math.tan(fov / 2)
    camera.position.z = Math.max(2.5, distance)
    camera.position.y = distance * 0.25

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
    lastTime = 0
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
        object.geometry?.dispose()
        if (object.material instanceof THREE.Material) {
          object.material.dispose()
        } else if (Array.isArray(object.material)) {
          object.material.forEach((m) => m.dispose())
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
