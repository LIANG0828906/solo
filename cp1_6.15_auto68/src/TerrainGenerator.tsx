import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GRID_SIZE, GRID_RESOLUTION, PathPoint, gridToWorld, easeOutCubic } from './api'

interface TerrainGeneratorProps {
  heights: Float32Array
  pathPoints: PathPoint[]
}

export default function TerrainGenerator({ heights, pathPoints }: TerrainGeneratorProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const terrainRef = useRef<THREE.Mesh | null>(null)
  const pathLineRef = useRef<THREE.Line | null>(null)
  const pathMarkersRef = useRef<THREE.Group | null>(null)
  const oldHeightsRef = useRef<Float32Array | null>(null)
  const animStartRef = useRef<number>(0)
  const isAnimatingRef = useRef(false)

  const cameraStateRef = useRef({
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    distance: 250,
    targetTheta: Math.PI / 4,
    targetPhi: Math.PI / 3,
    targetDistance: 250,
    isDragging: false,
    lastX: 0,
    lastY: 0,
  })

  useEffect(() => {
    if (!mountRef.current) return

    const width = mountRef.current.clientWidth
    const height = mountRef.current.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a2332)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(100, 150, 100)
    scene.add(directionalLight)

    const geometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE, GRID_RESOLUTION - 1, GRID_RESOLUTION - 1)
    geometry.rotateX(-Math.PI / 2)

    const positions = geometry.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const z = positions.getZ(i)
      const gx = ((x + GRID_SIZE / 2) / GRID_SIZE) * GRID_RESOLUTION
      const gy = ((z + GRID_SIZE / 2) / GRID_SIZE) * GRID_RESOLUTION
      const idx = Math.floor(gy) * GRID_RESOLUTION + Math.floor(gx)
      positions.setY(i, heights[idx] || 0)
    }
    geometry.computeVertexNormals()

    const material = new THREE.MeshStandardMaterial({
      vertexColors: false,
      color: 0x4a6b7a,
      flatShading: false,
      roughness: 0.8,
      metalness: 0.2,
    })

    const terrain = new THREE.Mesh(geometry, material)
    scene.add(terrain)
    terrainRef.current = terrain

    const wireframe = new THREE.WireframeGeometry(geometry)
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x2a3b4a, opacity: 0.3, transparent: true })
    const wireframeLines = new THREE.LineSegments(wireframe, lineMaterial)
    scene.add(wireframeLines)

    const pathGeometry = new THREE.BufferGeometry()
    const pathMaterial = new THREE.LineBasicMaterial({ color: 0xff7b00, linewidth: 2 })
    const pathLine = new THREE.Line(pathGeometry, pathMaterial)
    scene.add(pathLine)
    pathLineRef.current = pathLine

    const pathMarkers = new THREE.Group()
    scene.add(pathMarkers)
    pathMarkersRef.current = pathMarkers

    const gridHelper = new THREE.GridHelper(GRID_SIZE, 20, 0x3a4b5a, 0x2a3b4a)
    gridHelper.position.y = -0.1
    scene.add(gridHelper)

    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const cs = cameraStateRef.current
      const lerpFactor = 0.08

      cs.theta += (cs.targetTheta - cs.theta) * lerpFactor
      cs.phi += (cs.targetPhi - cs.phi) * lerpFactor
      cs.distance += (cs.targetDistance - cs.distance) * lerpFactor

      const x = cs.distance * Math.sin(cs.phi) * Math.cos(cs.theta)
      const y = cs.distance * Math.cos(cs.phi)
      const z = cs.distance * Math.sin(cs.phi) * Math.sin(cs.theta)

      camera.position.set(x, y, z)
      camera.lookAt(0, 0, 0)

      if (isAnimatingRef.current && terrainRef.current) {
        const elapsed = performance.now() - animStartRef.current
        const t = Math.min(1, elapsed / 1000)
        const eased = easeOutCubic(t)

        if (oldHeightsRef.current && terrainRef.current) {
          const positions = terrainRef.current.geometry.attributes.position
          for (let i = 0; i < positions.count; i++) {
            const oldH = oldHeightsRef.current[i] || 0
            const newH = heights[i] || 0
            positions.setY(i, oldH + (newH - oldH) * eased)
          }
          positions.needsUpdate = true
          terrainRef.current.geometry.computeVertexNormals()
        }

        if (t >= 1) {
          isAnimatingRef.current = false
          oldHeightsRef.current = null
        }
      }

      renderer.render(scene, camera)
    }
    animate()

    const onMouseDown = (e: MouseEvent) => {
      cameraStateRef.current.isDragging = true
      cameraStateRef.current.lastX = e.clientX
      cameraStateRef.current.lastY = e.clientY
    }

    const onMouseMove = (e: MouseEvent) => {
      const cs = cameraStateRef.current
      if (!cs.isDragging) return
      const deltaX = e.clientX - cs.lastX
      const deltaY = e.clientY - cs.lastY
      cs.targetTheta -= deltaX * 0.005
      cs.targetPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, cs.targetPhi - deltaY * 0.005))
      cs.lastX = e.clientX
      cs.lastY = e.clientY
    }

    const onMouseUp = () => {
      cameraStateRef.current.isDragging = false
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = e.deltaY > 0 ? 1.1 : 0.9
      cameraStateRef.current.targetDistance = Math.max(80, Math.min(500, cameraStateRef.current.targetDistance * factor))
    }

    const onResize = () => {
      if (!mountRef.current || !camera || !renderer) return
      const w = mountRef.current.clientWidth
      const h = mountRef.current.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    const canvas = renderer.domElement
    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animationId)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', onResize)
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      geometry.dispose()
      material.dispose()
    }
  }, [])

  useEffect(() => {
    if (!terrainRef.current) return

    const positions = terrainRef.current.geometry.attributes.position
    const currentHeights = new Float32Array(positions.count)
    for (let i = 0; i < positions.count; i++) {
      currentHeights[i] = positions.getY(i)
    }
    oldHeightsRef.current = currentHeights
    animStartRef.current = performance.now()
    isAnimatingRef.current = true
  }, [heights])

  useEffect(() => {
    if (!pathLineRef.current || !pathMarkersRef.current) return

    if (pathPoints.length === 0) {
      pathLineRef.current.geometry.dispose()
      pathLineRef.current.geometry = new THREE.BufferGeometry()
    } else {
      const positions = new Float32Array(pathPoints.length * 3)
      pathPoints.forEach((p, i) => {
        positions[i * 3] = p.x
        positions[i * 3 + 1] = p.y + 0.5
        positions[i * 3 + 2] = p.z
      })
      pathLineRef.current.geometry.dispose()
      pathLineRef.current.geometry = new THREE.BufferGeometry()
      pathLineRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    }

    while (pathMarkersRef.current.children.length > 0) {
      const child = pathMarkersRef.current.children[0]
      pathMarkersRef.current.remove(child)
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose()
      if ((child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material as THREE.Material | THREE.Material[]
        if (Array.isArray(mat)) mat.forEach(m => m.dispose())
        else mat.dispose()
      }
    }

    pathPoints.forEach((p, i) => {
      const sphereGeo = new THREE.SphereGeometry(1.5, 16, 16)
      const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
      const sphere = new THREE.Mesh(sphereGeo, sphereMat)
      sphere.position.set(p.x, p.y + 0.5, p.z)
      pathMarkersRef.current!.add(sphere)

      const ringGeo = new THREE.RingGeometry(1.5, 2.2, 32)
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xff7b00, side: THREE.DoubleSide })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.set(p.x, p.y + 0.6, p.z)
      ring.rotation.x = -Math.PI / 2
      pathMarkersRef.current!.add(ring)
    })
  }, [pathPoints])

  return <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
}
