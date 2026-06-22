import * as THREE from 'three'
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { SceneManager } from './SceneManager'
import { UIPanel } from './UIPanel'

const app = document.getElementById('app')!

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(80, 80, 120)
camera.lookAt(0, 50, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
app.appendChild(renderer.domElement)

const css2dRenderer = new CSS2DRenderer()
css2dRenderer.setSize(window.innerWidth, window.innerHeight)
css2dRenderer.domElement.style.position = 'absolute'
css2dRenderer.domElement.style.top = '0'
css2dRenderer.domElement.style.left = '0'
css2dRenderer.domElement.style.pointerEvents = 'none'
app.appendChild(css2dRenderer.domElement)

const sceneManager = new SceneManager(scene, camera, renderer)
sceneManager.init()

const uiPanel = new UIPanel(css2dRenderer)
uiPanel.init(sceneManager)

const clock = new THREE.Clock()
let lastTime = performance.now()
let frameCount = 0
let fps = 60

function animate() {
  requestAnimationFrame(animate)
  const delta = Math.min(clock.getDelta(), 0.1)
  frameCount++
  const now = performance.now()
  if (now - lastTime >= 1000) {
    fps = frameCount
    frameCount = 0
    lastTime = now
  }
  sceneManager.update(delta, fps)
  uiPanel.update(delta)
  renderer.render(scene, camera)
  css2dRenderer.render(scene, camera)
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  css2dRenderer.setSize(window.innerWidth, window.innerHeight)
}

window.addEventListener('resize', onWindowResize)
animate()
