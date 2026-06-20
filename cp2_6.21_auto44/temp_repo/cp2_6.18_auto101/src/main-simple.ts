import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const app = document.getElementById('app')
if (!app) {
  throw new Error('App container not found')
}

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x0A0F1E)

const camera = new THREE.PerspectiveCamera(60, app.clientWidth / app.clientHeight, 0.1, 1000)
camera.position.set(30, 30, 30)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(app.clientWidth, app.clientHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
app.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

const ambientLight = new THREE.AmbientLight(0x404060, 0.6)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(30, 40, 30)
scene.add(directionalLight)

const gridHelper = new THREE.GridHelper(60, 30, 0x1E293B, 0x0f1a2e)
gridHelper.position.y = -15
scene.add(gridHelper)

const geometry = new THREE.CylinderGeometry(1, 1, 40, 16)
const material = new THREE.MeshPhysicalMaterial({
  color: 0x2196F3,
  transparent: true,
  opacity: 0.7,
  roughness: 0.3,
  metalness: 0.6
})
const cylinder = new THREE.Mesh(geometry, material)
cylinder.rotation.z = Math.PI / 2
scene.add(cylinder)

const animate = () => {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

animate()

window.addEventListener('resize', () => {
  camera.aspect = app.clientWidth / app.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(app.clientWidth, app.clientHeight)
})

console.log('Simple test scene loaded successfully')
