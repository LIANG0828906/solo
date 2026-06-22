import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import {
  generateBuildings,
  getWindowLitRatio,
  shouldLightBeOn,
  lerpColor,
  BuildingData
} from '../utils/buildings'

interface SceneProps {
  time: number
}

const SKY_DAY = [0x87 / 255, 0xce / 255, 0xeb / 255]
const SKY_NIGHT = [0x0a / 255, 0x0a / 255, 0x2e / 255]
const LIGHT_DAY = [1, 0.95, 0.9]
const LIGHT_SUNSET = [1, 0.55, 0.25]
const LIGHT_NIGHT = [0.2, 0.25, 0.4]
const AMBIENT_DAY = [0.6, 0.65, 0.75]
const AMBIENT_NIGHT = [0.08, 0.1, 0.18]

const MIN_TIME = 5
const MAX_TIME = 22

function Scene({ time }: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const buildingsRef = useRef<THREE.Mesh[]>([])
  const windowsRef = useRef<THREE.Mesh[][]>([])
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null)
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null)
  const buildingDataRef = useRef<BuildingData[]>([])
  const currentTimeRef = useRef(time)
  const targetTimeRef = useRef(time)
  const frameIdRef = useRef<number>(0)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87ceeb)
    scene.fog = new THREE.Fog(0x87ceeb, 60, 200)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    const camDist = 90
    const camHeight = 65
    camera.position.set(camDist, camHeight, camDist)
    camera.lookAt(0, 10, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const ambientLight = new THREE.AmbientLight(0x99a8bf, 0.6)
    scene.add(ambientLight)
    ambientLightRef.current = ambientLight

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(50, 80, 30)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 300
    directionalLight.shadow.camera.left = -100
    directionalLight.shadow.camera.right = 100
    directionalLight.shadow.camera.top = 100
    directionalLight.shadow.camera.bottom = -100
    directionalLight.shadow.bias = -0.0005
    scene.add(directionalLight)
    directionalLightRef.current = directionalLight

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x444444, 0.3)
    scene.add(hemiLight)

    const groundGeometry = new THREE.PlaneGeometry(400, 400)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a42,
      roughness: 0.9,
      metalness: 0.1
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const buildingData = generateBuildings(80, 100)
    buildingDataRef.current = buildingData

    const buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      roughness: 0.75,
      metalness: 0.15
    })

    const windowOnMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdd55,
      emissive: 0xffaa22,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.1
    })

    const windowOffMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a35,
      roughness: 0.8,
      metalness: 0.3
    })

    buildingData.forEach((b, bIdx) => {
      const geometry = new THREE.BoxGeometry(b.width, b.height, b.depth)
      const building = new THREE.Mesh(geometry, buildingMaterial)
      building.position.set(b.x, b.height / 2, b.z)
      building.castShadow = true
      building.receiveShadow = true
      scene.add(building)
      buildingsRef.current.push(building)

      const windowMeshes: THREE.Mesh[] = []
      const winWidth = 0.6
      const winHeight = 0.8
      const floors = Math.max(3, Math.floor(b.height / 2))
      const winPerFloor = Math.max(2, Math.floor(b.width / 1.6))
      const winPerSide = Math.max(1, Math.floor(b.depth / 1.6))
      const windowGapH = b.width / (winPerFloor + 1)
      const windowGapV = b.depth / (winPerSide + 1)
      const floorHeight = b.height / (floors + 1)

      let wIdx = 0

      for (let f = 0; f < floors; f++) {
        const y = -b.height / 2 + (f + 1) * floorHeight

        for (let w = 0; w < winPerFloor; w++) {
          const wx = -b.width / 2 + (w + 1) * windowGapH
          const winGeom1 = new THREE.BoxGeometry(winWidth, winHeight, 0.05)
          const win1 = new THREE.Mesh(winGeom1, windowOffMaterial.clone())
          win1.position.set(b.x + wx, b.height / 2 + y, b.z + b.depth / 2 + 0.03)
          win1.userData = { buildingIdx: bIdx, windowIdx: wIdx++ }
          scene.add(win1)
          windowMeshes.push(win1)

          const winGeom2 = new THREE.BoxGeometry(winWidth, winHeight, 0.05)
          const win2 = new THREE.Mesh(winGeom2, windowOffMaterial.clone())
          win2.position.set(b.x + wx, b.height / 2 + y, b.z - b.depth / 2 - 0.03)
          win2.userData = { buildingIdx: bIdx, windowIdx: wIdx++ }
          scene.add(win2)
          windowMeshes.push(win2)
        }

        for (let s = 0; s < winPerSide; s++) {
          const wz = -b.depth / 2 + (s + 1) * windowGapV
          const winGeom3 = new THREE.BoxGeometry(0.05, winHeight, winWidth)
          const win3 = new THREE.Mesh(winGeom3, windowOffMaterial.clone())
          win3.position.set(b.x + b.width / 2 + 0.03, b.height / 2 + y, b.z + wz)
          win3.userData = { buildingIdx: bIdx, windowIdx: wIdx++ }
          scene.add(win3)
          windowMeshes.push(win3)

          const winGeom4 = new THREE.BoxGeometry(0.05, winHeight, winWidth)
          const win4 = new THREE.Mesh(winGeom4, windowOffMaterial.clone())
          win4.position.set(b.x - b.width / 2 - 0.03, b.height / 2 + y, b.z + wz)
          win4.userData = { buildingIdx: bIdx, windowIdx: wIdx++ }
          scene.add(win4)
          windowMeshes.push(win4)
        }
      }

      windowsRef.current.push(windowMeshes)
      ;(windowOnMaterial as any)
      ;(windowOffMaterial as any)
    })

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate)

      const lerpFactor = 0.08
      currentTimeRef.current += (targetTimeRef.current - currentTimeRef.current) * lerpFactor
      const t = currentTimeRef.current
      const normTime = (t - MIN_TIME) / (MAX_TIME - MIN_TIME)

      let skyColor: number[]
      let lightColor: number[]
      let ambientColor: number[]
      let lightIntensity: number
      let ambientIntensity: number

      if (normTime < 0.25) {
        const lt = normTime / 0.25
        skyColor = lerpColor(SKY_NIGHT, SKY_DAY, lt)
        lightColor = lerpColor(LIGHT_NIGHT, LIGHT_DAY, lt)
        ambientColor = lerpColor(AMBIENT_NIGHT, AMBIENT_DAY, lt)
        lightIntensity = 0.3 + lt * 0.7
        ambientIntensity = 0.2 + lt * 0.4
      } else if (normTime < 0.7) {
        skyColor = SKY_DAY
        lightColor = LIGHT_DAY
        ambientColor = AMBIENT_DAY
        lightIntensity = 1.0
        ambientIntensity = 0.6
      } else if (normTime < 0.85) {
        const lt = (normTime - 0.7) / 0.15
        skyColor = lerpColor(SKY_DAY, SKY_NIGHT, lt)
        lightColor = lerpColor(LIGHT_DAY, LIGHT_SUNSET, Math.min(1, lt * 2))
        lightColor = lerpColor(lightColor, LIGHT_NIGHT, Math.max(0, lt * 2 - 1))
        ambientColor = lerpColor(AMBIENT_DAY, AMBIENT_NIGHT, lt)
        lightIntensity = 1.0 - lt * 0.6
        ambientIntensity = 0.6 - lt * 0.4
      } else {
        skyColor = SKY_NIGHT
        lightColor = LIGHT_NIGHT
        ambientColor = AMBIENT_NIGHT
        lightIntensity = 0.4
        ambientIntensity = 0.2
      }

      if (sceneRef.current) {
        sceneRef.current.background = new THREE.Color(
          skyColor[0], skyColor[1], skyColor[2]
        )
        if (sceneRef.current.fog) {
          ;(sceneRef.current.fog as THREE.Fog).color = new THREE.Color(
            skyColor[0], skyColor[1], skyColor[2]
          )
        }
      }

      if (directionalLightRef.current) {
        const sunAngle = normTime * Math.PI * 1.3 - Math.PI * 0.15
        const sunHeight = Math.sin(sunAngle) * 80 + 5
        const sunX = Math.cos(sunAngle) * 60
        const sunZ = Math.sin(sunAngle * 0.5) * 40
        directionalLightRef.current.position.set(sunX, Math.max(5, sunHeight), sunZ)
        directionalLightRef.current.color = new THREE.Color(
          lightColor[0], lightColor[1], lightColor[2]
        )
        directionalLightRef.current.intensity = lightIntensity
      }

      if (ambientLightRef.current) {
        ambientLightRef.current.color = new THREE.Color(
          ambientColor[0], ambientColor[1], ambientColor[2]
        )
        ambientLightRef.current.intensity = ambientIntensity
      }

      const litRatio = getWindowLitRatio(t)
      const bData = buildingDataRef.current
      const wins = windowsRef.current

      for (let bi = 0; bi < wins.length; bi++) {
        const buildingWindows = wins[bi]
        const seed = bData[bi]?.windowSeed ?? 0
        for (let wi = 0; wi < buildingWindows.length; wi++) {
          const win = buildingWindows[wi]
          const isOn = shouldLightBeOn(seed, wi, litRatio)
          const mat = win.material as THREE.MeshStandardMaterial
          const targetEmissive = isOn ? 0.8 : 0
          const targetColorR = isOn ? 0xff / 255 : 0x2a / 255
          const targetColorG = isOn ? 0xdd / 255 : 0x2a / 255
          const targetColorB = isOn ? 0x55 / 255 : 0x35 / 255

          mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.15
          mat.color.r += (targetColorR - mat.color.r) * 0.15
          mat.color.g += (targetColorG - mat.color.g) * 0.15
          mat.color.b += (targetColorB - mat.color.b) * 0.15
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(frameIdRef.current)
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
        rendererRef.current.dispose()
      }
      buildingsRef.current.forEach(m => {
        m.geometry.dispose()
        ;(m.material as THREE.Material).dispose()
      })
      windowsRef.current.forEach(arr => {
        arr.forEach(m => {
          m.geometry.dispose()
          ;(m.material as THREE.Material).dispose()
        })
      })
    }
  }, [])

  useEffect(() => {
    targetTimeRef.current = time
  }, [time])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}

export default Scene
