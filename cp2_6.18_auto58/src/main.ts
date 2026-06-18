import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { createGallery } from './gallery'
import type { ArtworkPlacement, ArtworkInfo } from './gallery'
import { generateHighResDataUrl, applyPulse } from './artwork'

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let composer: EffectComposer
let bloomPass: UnrealBloomPass
let artworks: ArtworkPlacement[] = []
let raycaster: THREE.Raycaster
let pointer: THREE.Vector2
let bloomActiveUntil = 0
let useBloom = false
let modalActive = false

const clock = new THREE.Clock()
const highResCache = new Map<string, string>()

function init() {
  const container = document.getElementById('app')!

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)
  scene.fog = new THREE.Fog(0x1a1a2e, 18, 40)

  const aspect = window.innerWidth / window.innerHeight
  camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 100)
  if (aspect < 1.4) {
    camera.position.set(0, 1.7, 4.5)
  } else {
    camera.position.set(0, 1.7, 2.5)
  }

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = false
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.4
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 3
  controls.maxDistance = 16
  controls.minPolarAngle = Math.PI / 6
  controls.maxPolarAngle = Math.PI / 2.1
  controls.minFov = 20
  controls.maxFov = 100
  controls.zoomSpeed = 0.8
  controls.target.set(0, 1.5, 0)
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  }

  const ambient = new THREE.AmbientLight(0xb0b0d0, 1.4)
  scene.add(ambient)

  const hemiLight = new THREE.HemisphereLight(0xfff4e6, 0x3a3a52, 0.9)
  scene.add(hemiLight)

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9)
  dirLight.position.set(5, 8, 5)
  scene.add(dirLight)

  const { galleryGroup, artworks: _artworks } = createGallery(scene, renderer)
  scene.add(galleryGroup)
  artworks = _artworks

  raycaster = new THREE.Raycaster()
  pointer = new THREE.Vector2()

  const renderPass = new RenderPass(scene, camera)
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.3,
    0.5,
    0.85
  )
  bloomPass.enabled = false
  composer = new EffectComposer(renderer)
  composer.addPass(renderPass)
  composer.addPass(bloomPass)

  window.addEventListener('resize', onWindowResize)
  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('click', onClick)
  document.addEventListener('keydown', onKeyDown)

  const overlay = document.getElementById('modal-overlay')!
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal()
  })

  const startHint = document.getElementById('start-hint')
  if (startHint) {
    setTimeout(() => {
      startHint.classList.add('fade-out')
      setTimeout(() => startHint.remove(), 1600)
    }, 3000)
  }

  animate()
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
}

function triggerBloom(duration = 1000) {
  bloomActiveUntil = performance.now() + duration
  if (!useBloom) {
    useBloom = true
    bloomPass.enabled = true
  }
}

function onPointerDown(e: PointerEvent) {
  if (modalActive) return
  if (e.button === 0 || e.button === 2) {
    triggerBloom()
  }
}

function onClick(event: MouseEvent) {
  if (modalActive) return
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(pointer, camera)
  const candidates: THREE.Object3D[] = []
  artworks.forEach((a) => collectPaintingMeshes(a.group, candidates))
  const intersects = raycaster.intersectObjects(candidates, false)

  if (intersects.length > 0) {
    const obj = intersects[0].object
    let target: THREE.Object3D | null = obj
    while (target && !target.userData?.isArtwork) {
      target = target.parent
    }
    if (target && target.userData) {
      const info = target.userData.info as ArtworkInfo | undefined
      if (info) {
        triggerBloom(1500)
        const dataUrl = getHighResCached(info)
        openModal(info.title, info.description, dataUrl)
      }
    }
  }
}

function getHighResCached(info: ArtworkInfo): string {
  const key = info.title
  if (highResCache.has(key)) {
    return highResCache.get(key)!
  }
  const url = generateHighResDataUrl(info)
  highResCache.set(key, url)
  return url
}

function collectPaintingMeshes(group: THREE.Object3D, out: THREE.Object3D[]) {
  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      out.push(child)
    }
  })
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && modalActive) {
    closeModal()
  }
}

function openModal(title: string, description: string, dataUrl: string) {
  const overlay = document.getElementById('modal-overlay')!
  const titleEl = document.getElementById('modal-title')!
  const descEl = document.getElementById('modal-desc')!
  const imgEl = document.getElementById('modal-image') as HTMLImageElement
  titleEl.textContent = title
  descEl.textContent = description
  imgEl.src = dataUrl
  overlay.classList.add('active')
  modalActive = true
  controls.enabled = false
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay')!
  overlay.classList.remove('active')
  modalActive = false
  controls.enabled = true
}

function updateArtworksPulse(time: number) {
  artworks.forEach((art) => {
    applyPulse(art.group, time, art.pulsePeriod, art.pulsePhase)
  })
}

function animate() {
  requestAnimationFrame(animate)
  const delta = clock.getDelta()
  const time = clock.getElapsedTime()

  controls.update()
  updateArtworksPulse(time)

  if (useBloom && performance.now() > bloomActiveUntil) {
    useBloom = false
    bloomPass.enabled = false
  }

  if (useBloom) {
    composer.render()
  } else {
    renderer.render(scene, camera)
  }
}

init()
