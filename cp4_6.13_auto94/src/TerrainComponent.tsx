import { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { useTerrainStore, ClickedPoint } from './store'
import { generateTerrain, calculateSlopeAt } from './terrainGenerator'
import { computeRowProfile } from './ProfileAnalyzer'

const GRID_SIZE = 128
const TERRAIN_SIZE = 50

interface Refs {
  scene: THREE.Scene | null
  camera: THREE.PerspectiveCamera | null
  renderer: THREE.WebGLRenderer | null
  mesh: THREE.Mesh | null
  geometry: THREE.BufferGeometry | null
  contourLines: THREE.LineSegments | null
  marker: THREE.Mesh | null
  currentHeights: Float32Array | null
  targetHeights: Float32Array | null
  currentColors: Float32Array | null
  targetColors: Float32Array | null
  animationStartTime: number
  isAnimating: boolean
  isDragging: boolean
  lastMouse: { x: number; y: number }
  spherical: { theta: number; phi: number; radius: number }
  targetSpherical: { theta: number; phi: number; radius: number }
  lastHeightInfo: { minH: number; maxH: number } | null
  rafId: number
  paramsRef: { roughness: number; peakDensity: number; smoothness: number }
}

export default function TerrainComponent() {
  const containerRef = useRef<HTMLDivElement>(null)

  const refs = useRef<Refs>({
    scene: null,
    camera: null,
    renderer: null,
    mesh: null,
    geometry: null,
    contourLines: null,
    marker: null,
    currentHeights: null,
    targetHeights: null,
    currentColors: null,
    targetColors: null,
    animationStartTime: 0,
    isAnimating: false,
    isDragging: false,
    lastMouse: { x: 0, y: 0 },
    spherical: { theta: Math.PI / 4, phi: Math.PI / 4, radius: 80 },
    targetSpherical: { theta: Math.PI / 4, phi: Math.PI / 4, radius: 80 },
    lastHeightInfo: null,
    rafId: 0,
    paramsRef: { roughness: 50, peakDensity: 5, smoothness: 3 },
  })

  const params = useTerrainStore((s) => s.params)
  const setHeightMap = useTerrainStore((s) => s.setHeightMap)
  const setClickedPoint = useTerrainStore((s) => s.setClickedPoint)
  const setProfileData = useTerrainStore((s) => s.setProfileData)

  const setClickedPointRef = useRef(setClickedPoint)
  const setProfileDataRef = useRef(setProfileData)
  const setHeightMapRef = useRef(setHeightMap)

  useEffect(() => {
    setClickedPointRef.current = setClickedPoint
  }, [setClickedPoint])

  useEffect(() => {
    setProfileDataRef.current = setProfileData
  }, [setProfileData])

  useEffect(() => {
    setHeightMapRef.current = setHeightMap
  }, [setHeightMap])

  useEffect(() => {
    refs.current.paramsRef = params
  }, [params])

  const createGeometry = useCallback((): THREE.BufferGeometry => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(GRID_SIZE * GRID_SIZE * 3)
    const colors = new Float32Array(GRID_SIZE * GRID_SIZE * 3)
    const normals = new Float32Array(GRID_SIZE * GRID_SIZE * 3)

    const halfSize = TERRAIN_SIZE / 2
    const cellSize = TERRAIN_SIZE / (GRID_SIZE - 1)

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const idx = row * GRID_SIZE + col
        const posIdx = idx * 3
        positions[posIdx] = col * cellSize - halfSize
        positions[posIdx + 1] = 0
        positions[posIdx + 2] = row * cellSize - halfSize
        colors[posIdx] = 0.3
        colors[posIdx + 1] = 0.5
        colors[posIdx + 2] = 0.2
        normals[posIdx] = 0
        normals[posIdx + 1] = 1
        normals[posIdx + 2] = 0
      }
    }

    const indices: number[] = []
    for (let row = 0; row < GRID_SIZE - 1; row++) {
      for (let col = 0; col < GRID_SIZE - 1; col++) {
        const a = row * GRID_SIZE + col
        const b = a + 1
        const c = a + GRID_SIZE
        const d = c + 1
        indices.push(a, c, b, b, c, d)
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    geometry.setIndex(indices)
    return geometry
  }, [])

  const createContourLines = useCallback(
    (heights: Float32Array, minH: number, maxH: number): THREE.BufferGeometry => {
      const positions: number[] = []
      const numLevels = 12
      const range = maxH - minH
      if (range <= 0) {
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.Float32BufferAttribute([], 3))
        return g
      }

      const halfSize = TERRAIN_SIZE / 2
      const cellSize = TERRAIN_SIZE / (GRID_SIZE - 1)

      for (let l = 1; l < numLevels; l++) {
        const level = minH + (range * l) / numLevels

        for (let row = 0; row < GRID_SIZE - 1; row++) {
          for (let col = 0; col < GRID_SIZE - 1; col++) {
            const idx = row * GRID_SIZE + col
            const h00 = heights[idx]
            const h10 = heights[idx + 1]
            const h01 = heights[idx + GRID_SIZE]
            const h11 = heights[idx + GRID_SIZE + 1]

            const corners = [
              { x: col * cellSize - halfSize, z: row * cellSize - halfSize, h: h00 },
              { x: (col + 1) * cellSize - halfSize, z: row * cellSize - halfSize, h: h10 },
              { x: (col + 1) * cellSize - halfSize, z: (row + 1) * cellSize - halfSize, h: h11 },
              { x: col * cellSize - halfSize, z: (row + 1) * cellSize - halfSize, h: h01 },
            ]

            for (let e = 0; e < 4; e++) {
              const c1 = corners[e]
              const c2 = corners[(e + 1) % 4]
              const a = c1.h - level
              const b = c2.h - level

              if (a * b < 0) {
                const t = Math.abs(a) / (Math.abs(a) + Math.abs(b))
                const x = c1.x + (c2.x - c1.x) * t
                const z = c1.z + (c2.z - c1.z) * t
                positions.push(x, level + 0.05, z)
              }
            }
          }
        }
      }

      const lineGeo = new THREE.BufferGeometry()
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      return lineGeo
    },
    []
  )

  const updateCameraFromSpherical = useCallback(() => {
    const cam = refs.current.camera
    if (!cam) return
    const { theta, phi, radius } = refs.current.spherical
    cam.position.x = radius * Math.sin(phi) * Math.cos(theta)
    cam.position.y = radius * Math.cos(phi)
    cam.position.z = radius * Math.sin(phi) * Math.sin(theta)
    cam.lookAt(0, 5, 0)
  }, [])

  const handleTerrainClick = useCallback((event: PointerEvent) => {
    const r = refs.current
    if (!r.scene || !r.camera || !r.mesh) return
    if (r.isDragging) return

    const canvas = r.renderer?.domElement
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (!rect) return

    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), r.camera)

    const intersects = raycaster.intersectObject(r.mesh, false)

    if (intersects.length > 0) {
      const point = intersects[0].point
      const halfSize = TERRAIN_SIZE / 2
      const cellSize = TERRAIN_SIZE / (GRID_SIZE - 1)

      let col = Math.round((point.x + halfSize) / cellSize)
      let row = Math.round((point.z + halfSize) / cellSize)
      col = Math.max(0, Math.min(GRID_SIZE - 1, col))
      row = Math.max(0, Math.min(GRID_SIZE - 1, row))

      const heights = r.currentHeights
      if (!heights) return

      const idx = row * GRID_SIZE + col
      const elevation = heights[idx]
      const slope = calculateSlopeAt(heights, row, col, GRID_SIZE, cellSize)

      const worldX = col * cellSize - halfSize
      const worldZ = row * cellSize - halfSize

      if (r.marker) {
        r.marker.visible = true
        r.marker.position.set(worldX, elevation + 0.5, worldZ)
      }

      const clickedPoint: ClickedPoint = {
        x: col,
        z: row,
        row,
        col,
        worldX,
        worldZ,
        elevation,
        slope,
      }

      setClickedPointRef.current(clickedPoint)

      const profile = computeRowProfile(heights, clickedPoint, GRID_SIZE, TERRAIN_SIZE)
      setProfileDataRef.current(profile)
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const r = refs.current
    const container = containerRef.current
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0e14)
    scene.fog = new THREE.Fog(0x0a0e14, 100, 250)
    r.scene = scene

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    r.camera = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)
    r.renderer = renderer

    const ambientLight = new THREE.AmbientLight(0x404050, 0.7)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(50, 80, 30)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far = 300
    dirLight.shadow.camera.left = -60
    dirLight.shadow.camera.right = 60
    dirLight.shadow.camera.top = 60
    dirLight.shadow.camera.bottom = -60
    scene.add(dirLight)

    const hemiLight = new THREE.HemisphereLight(0x88aaff, 0x332211, 0.4)
    scene.add(hemiLight)

    const geometry = createGeometry()
    r.geometry = geometry

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      flatShading: false,
      roughness: 0.85,
      metalness: 0.05,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.receiveShadow = true
    mesh.castShadow = true
    scene.add(mesh)
    r.mesh = mesh

    const contourMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
    })
    const emptyContourGeo = new THREE.BufferGeometry()
    emptyContourGeo.setAttribute('position', new THREE.Float32BufferAttribute([], 3))
    const contourLines = new THREE.LineSegments(emptyContourGeo, contourMaterial)
    scene.add(contourLines)
    r.contourLines = contourLines

    const markerGeo = new THREE.SphereGeometry(0.3, 24, 24)
    const markerMat = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.7,
    })
    const marker = new THREE.Mesh(markerGeo, markerMat)
    marker.visible = false
    scene.add(marker)
    r.marker = marker

    const gridHelper = new THREE.GridHelper(TERRAIN_SIZE, 20, 0x333344, 0x222233)
    gridHelper.position.y = -0.01
    scene.add(gridHelper)

    updateCameraFromSpherical()

    const initialResult = generateTerrain(r.paramsRef, GRID_SIZE, TERRAIN_SIZE)
    const { heights, colors, minHeight, maxHeight } = initialResult
    r.currentHeights = new Float32Array(heights)
    r.targetHeights = new Float32Array(heights)
    r.currentColors = new Float32Array(colors)
    r.targetColors = new Float32Array(colors)
    r.lastHeightInfo = { minH: minHeight, maxH: maxHeight }

    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute
    const posArr = posAttr.array as Float32Array
    for (let i = 0; i < heights.length; i++) {
      posArr[i * 3 + 1] = heights[i]
    }
    posAttr.needsUpdate = true

    const colAttr = geometry.getAttribute('color') as THREE.BufferAttribute
    const colArr = colAttr.array as Float32Array
    colArr.set(colors)
    colAttr.needsUpdate = true

    geometry.computeVertexNormals()

    setHeightMapRef.current(new Float32Array(heights), new Float32Array(colors))

    const contourGeo = createContourLines(heights, minHeight, maxHeight)
    contourLines.geometry.dispose()
    contourLines.geometry = contourGeo

    const animate = () => {
      r.rafId = requestAnimationFrame(animate)

      r.spherical.theta += (r.targetSpherical.theta - r.spherical.theta) * 0.1
      r.spherical.phi += (r.targetSpherical.phi - r.spherical.phi) * 0.1
      r.spherical.radius += (r.targetSpherical.radius - r.spherical.radius) * 0.1

      const camDiff =
        Math.abs(r.targetSpherical.theta - r.spherical.theta) +
        Math.abs(r.targetSpherical.phi - r.spherical.phi) +
        Math.abs(r.targetSpherical.radius - r.spherical.radius)

      if (camDiff > 0.001) {
        updateCameraFromSpherical()
      }

      if (r.isAnimating && r.currentHeights && r.targetHeights && r.targetColors && r.currentColors) {
        const elapsed = (performance.now() - r.animationStartTime) / 1500
        const t = Math.min(1, elapsed)
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

        const curH = r.currentHeights
        const tgtH = r.targetHeights
        const curC = r.currentColors
        const tgtC = r.targetColors
        const len = curH.length

        for (let i = 0; i < len; i++) {
          curH[i] = curH[i] + (tgtH[i] - curH[i]) * eased
          const c1 = i * 3
          curC[c1] = curC[c1] + (tgtC[c1] - curC[c1]) * eased
          curC[c1 + 1] = curC[c1 + 1] + (tgtC[c1 + 1] - curC[c1 + 1]) * eased
          curC[c1 + 2] = curC[c1 + 2] + (tgtC[c1 + 2] - curC[c1 + 2]) * eased
        }

        const pAttr = r.geometry?.getAttribute('position') as THREE.BufferAttribute
        if (pAttr) {
          const pArr = pAttr.array as Float32Array
          for (let i = 0; i < len; i++) {
            pArr[i * 3 + 1] = curH[i]
          }
          pAttr.needsUpdate = true
        }

        const cAttr = r.geometry?.getAttribute('color') as THREE.BufferAttribute
        if (cAttr) {
          const cArr = cAttr.array as Float32Array
          cArr.set(curC)
          cAttr.needsUpdate = true
        }

        r.geometry?.computeVertexNormals()

        if (t >= 1) {
          r.isAnimating = false

          if (r.contourLines && r.lastHeightInfo) {
            const newContourGeo = createContourLines(
              r.currentHeights,
              r.lastHeightInfo.minH,
              r.lastHeightInfo.maxH
            )
            r.contourLines.geometry.dispose()
            r.contourLines.geometry = newContourGeo
          }

          const clicked = useTerrainStore.getState().clickedPoint
          if (clicked && r.currentHeights) {
            const { row, col } = clicked
            const idx = row * GRID_SIZE + col
            const newElevation = r.currentHeights[idx]
            const cellSize = TERRAIN_SIZE / (GRID_SIZE - 1)
            const newSlope = calculateSlopeAt(r.currentHeights, row, col, GRID_SIZE, cellSize)

            const newClicked: ClickedPoint = {
              ...clicked,
              elevation: newElevation,
              slope: newSlope,
            }
            setClickedPointRef.current(newClicked)

            const newProfile = computeRowProfile(r.currentHeights, newClicked, GRID_SIZE, TERRAIN_SIZE)
            setProfileDataRef.current(newProfile)

            if (r.marker) {
              r.marker.position.y = newElevation + 0.5
            }
          }
        }
      }

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      if (!r.camera || !r.renderer || !containerRef.current) return
      r.camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      r.camera.updateProjectionMatrix()
      r.renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }

    const handlePointerDown = (e: PointerEvent) => {
      r.isDragging = false
      r.lastMouse = { x: e.clientX, y: e.clientY }
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    }

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - r.lastMouse.x
      const dy = e.clientY - r.lastMouse.y

      if (Math.abs(dx) + Math.abs(dy) > 3) {
        r.isDragging = true
      }

      if (e.buttons & 1) {
        r.targetSpherical.theta -= dx * 0.008
        r.targetSpherical.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, r.targetSpherical.phi + dy * 0.008))
      }

      r.lastMouse = { x: e.clientX, y: e.clientY }
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      r.targetSpherical.radius = Math.max(30, Math.min(200, r.targetSpherical.radius + e.deltaY * 0.1))
    }

    const handlePointerUp = (e: PointerEvent) => {
      ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
    }

    window.addEventListener('resize', handleResize)
    renderer.domElement.addEventListener('pointerdown', handlePointerDown)
    renderer.domElement.addEventListener('pointermove', handlePointerMove)
    renderer.domElement.addEventListener('pointerup', handlePointerUp)
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false })
    renderer.domElement.addEventListener('click', handleTerrainClick)

    return () => {
      cancelAnimationFrame(r.rafId)
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
      renderer.domElement.removeEventListener('pointermove', handlePointerMove)
      renderer.domElement.removeEventListener('pointerup', handlePointerUp)
      renderer.domElement.removeEventListener('wheel', handleWheel)
      renderer.domElement.removeEventListener('click', handleTerrainClick)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      contourLines.geometry.dispose()
      contourMaterial.dispose()
      markerGeo.dispose()
      markerMat.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [createGeometry, createContourLines, handleTerrainClick, updateCameraFromSpherical])

  useEffect(() => {
    const r = refs.current
    if (!r.targetHeights) return

    const result = generateTerrain(params, GRID_SIZE, TERRAIN_SIZE)
    const { heights, colors, minHeight, maxHeight } = result

    if (r.currentHeights) {
      r.targetHeights = new Float32Array(heights)
    }
    if (r.targetColors) {
      r.targetColors = new Float32Array(colors)
    }

    r.lastHeightInfo = { minH: minHeight, maxH: maxHeight }
    r.animationStartTime = performance.now()
    r.isAnimating = true

    setHeightMapRef.current(new Float32Array(heights), new Float32Array(colors))
  }, [params])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    />
  )
}
