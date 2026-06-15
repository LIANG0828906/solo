import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GRID_SIZE, GRID_RESOLUTION, PathPoint, gridToWorld, easeOutCubic } from './api'

interface TerrainGeneratorProps {
  heights: Float32Array
  pathPoints: PathPoint[]
}

const CHUNK_SIZE = 5000
const TRANSITION_DURATION = 1000

export default function TerrainGenerator({ heights, pathPoints }: TerrainGeneratorProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const terrainRef = useRef<THREE.Mesh | null>(null)
  const wireframeRef = useRef<THREE.LineSegments | null>(null)
  const pathLineRef = useRef<THREE.Line | null>(null)
  const pathMarkersRef = useRef<THREE.Group | null>(null)
  const oldHeightsRef = useRef<Float32Array | null>(null)
  const targetHeightsRef = useRef<Float32Array | null>(null)
  const animStartRef = useRef<number>(0)
  const animProgressRef = useRef<number>(0)
  const isAnimatingRef = useRef(false)
  const lastNormalsUpdateRef = useRef<number>(0)
  const renderIdRef = useRef<number>(0)

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

    let mount = mountRef.current
    const width = mount.clientWidth
    const height = mount.clientHeight

    let scene: THREE.Scene | null = null
    let camera: THREE.PerspectiveCamera | null = null
    let renderer: THREE.WebGLRenderer | null = null
    let geometry: THREE.BufferGeometry | null = null
    let material: THREE.MeshStandardMaterial | null = null
    let animationId: number = 0

    try {
      scene = new THREE.Scene()
      scene.background = new THREE.Color(0x1a2332)
      sceneRef.current = scene

      camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000)
      cameraRef.current = camera

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      mount.appendChild(renderer.domElement)
      rendererRef.current = renderer

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(100, 150, 100)
      scene.add(directionalLight)

      geometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE, GRID_RESOLUTION - 1, GRID_RESOLUTION - 1)
      geometry.rotateX(-Math.PI / 2)

      const positions = geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const z = positions.getZ(i)
        const gx = ((x + GRID_SIZE / 2) / GRID_SIZE) * GRID_RESOLUTION
        const gy = ((z + GRID_SIZE / 2) / GRID_SIZE) * GRID_RESOLUTION
        const idx = Math.floor(gy) * GRID_RESOLUTION + Math.floor(gx)
        positions.setY(i, heights[idx] || 0)
      }
      geometry.computeVertexNormals()

      material = new THREE.MeshStandardMaterial({
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
      wireframeRef.current = wireframeLines

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

      const animate = () => {
        animationId = requestAnimationFrame(animate)
        renderIdRef.current = animationId

        try {
          const cs = cameraStateRef.current
          const lerpFactor = 0.08

          cs.theta += (cs.targetTheta - cs.theta) * lerpFactor
          cs.phi += (cs.targetPhi - cs.phi) * lerpFactor
          cs.distance += (cs.targetDistance - cs.distance) * lerpFactor

          const cx = cs.distance * Math.sin(cs.phi) * Math.cos(cs.theta)
          const cy = cs.distance * Math.cos(cs.phi)
          const cz = cs.distance * Math.sin(cs.phi) * Math.sin(cs.theta)

          camera!.position.set(cx, cy, cz)
          camera!.lookAt(0, 0, 0)

          if (isAnimatingRef.current && terrainRef.current && oldHeightsRef.current && targetHeightsRef.current) {
            const elapsed = performance.now() - animStartRef.current
            const rawT = Math.min(1, elapsed / TRANSITION_DURATION)
            const eased = easeOutCubic(rawT)
            animProgressRef.current = eased

            const positions = terrainRef.current.geometry.attributes.position as THREE.BufferAttribute
            const count = positions.count
            const oldH = oldHeightsRef.current
            const newH = targetHeightsRef.current

            const chunkStart = Math.floor((eased * count) / CHUNK_SIZE) * CHUNK_SIZE
            const chunkEnd = Math.min(count, chunkStart + CHUNK_SIZE)

            for (let i = chunkStart; i < chunkEnd; i++) {
              const oh = oldH[i] || 0
              const nh = newH[i] || 0
              positions.setY(i, oh + (nh - oh) * eased)
            }

            positions.needsUpdate = true

            const now = performance.now()
            if (now - lastNormalsUpdateRef.current > 80) {
              terrainRef.current.geometry.computeVertexNormals()
              lastNormalsUpdateRef.current = now
            }

            if (rawT >= 1) {
              for (let i = 0; i < count; i++) {
                const oh = oldH[i] || 0
                const nh = newH[i] || 0
                positions.setY(i, nh)
              }
              positions.needsUpdate = true
              terrainRef.current.geometry.computeVertexNormals()

              isAnimatingRef.current = false
              oldHeightsRef.current = null
              targetHeightsRef.current = null
              animProgressRef.current = 0
            }
          }

          if (renderer && scene && camera) {
            renderer.render(scene, camera)
          }
        } catch (e) {
          console.error('Terrain animate error:', e)
        }
      }
      animate()

      const onMouseDown = (e: MouseEvent) => {
        try {
          cameraStateRef.current.isDragging = true
          cameraStateRef.current.lastX = e.clientX
          cameraStateRef.current.lastY = e.clientY
        } catch (_) { /* ignore */ }
      }

      const onMouseMove = (e: MouseEvent) => {
        try {
          const cs = cameraStateRef.current
          if (!cs.isDragging) return
          const deltaX = e.clientX - cs.lastX
          const deltaY = e.clientY - cs.lastY
          cs.targetTheta -= deltaX * 0.005
          cs.targetPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, cs.targetPhi - deltaY * 0.005))
          cs.lastX = e.clientX
          cs.lastY = e.clientY
        } catch (_) { /* ignore */ }
      }

      const onMouseUp = () => {
        try {
          cameraStateRef.current.isDragging = false
        } catch (_) { /* ignore */ }
      }

      const onWheel = (e: WheelEvent) => {
        try {
          e.preventDefault()
          const factor = e.deltaY > 0 ? 1.1 : 0.9
          cameraStateRef.current.targetDistance = Math.max(80, Math.min(500, cameraStateRef.current.targetDistance * factor))
        } catch (_) { /* ignore */ }
      }

      const onResize = () => {
        try {
          if (!mount || !camera || !renderer) return
          const w = mount.clientWidth
          const h = mount.clientHeight
          if (w <= 0 || h <= 0) return
          camera.aspect = w / h
          camera.updateProjectionMatrix()
          renderer.setSize(w, h)
        } catch (e) {
          console.error('Terrain resize error:', e)
        }
      }

      const canvas = renderer.domElement
      canvas.addEventListener('mousedown', onMouseDown)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
      canvas.addEventListener('wheel', onWheel, { passive: false })
      window.addEventListener('resize', onResize)

      return () => {
        try {
          cancelAnimationFrame(animationId)
          canvas.removeEventListener('mousedown', onMouseDown)
          window.removeEventListener('mousemove', onMouseMove)
          window.removeEventListener('mouseup', onMouseUp)
          canvas.removeEventListener('wheel', onWheel)
          window.removeEventListener('resize', onResize)
          if (mount && renderer && renderer.domElement.parentNode === mount) {
            mount.removeChild(renderer.domElement)
          }

          if (pathMarkersRef.current) {
            while (pathMarkersRef.current.children.length > 0) {
              const child = pathMarkersRef.current.children[0]
              pathMarkersRef.current.remove(child)
              const mesh = child as THREE.Mesh
              if (mesh.geometry) mesh.geometry.dispose()
              if (mesh.material) {
                const mats = mesh.material as THREE.Material | THREE.Material[]
                if (Array.isArray(mats)) mats.forEach(m => m.dispose())
                else mats.dispose()
              }
            }
          }

          if (pathLineRef.current) {
            pathLineRef.current.geometry.dispose()
            const mat = pathLineRef.current.material as THREE.Material
            if (mat) mat.dispose()
          }

          if (wireframeRef.current) {
            wireframeRef.current.geometry.dispose()
            const mat = wireframeRef.current.material as THREE.Material
            if (mat) mat.dispose()
          }

          if (geometry) geometry.dispose()
          if (material) material.dispose()
          if (renderer) renderer.dispose()
        } catch (e) {
          console.error('Terrain cleanup error:', e)
        }
      }
    } catch (e) {
      console.error('Terrain init error:', e)
      return () => { /* noop */ }
    }
  }, [])

  useEffect(() => {
    try {
      if (!terrainRef.current) return

      const positions = terrainRef.current.geometry.attributes.position as THREE.BufferAttribute
      const count = positions.count

      if (isAnimatingRef.current && targetHeightsRef.current) {
        const partiallyInterpolated = new Float32Array(count)
        const eased = animProgressRef.current
        for (let i = 0; i < count; i++) {
          partiallyInterpolated[i] = positions.getY(i)
        }
        oldHeightsRef.current = partiallyInterpolated
      } else {
        const currentHeights = new Float32Array(count)
        for (let i = 0; i < count; i++) {
          currentHeights[i] = positions.getY(i)
        }
        oldHeightsRef.current = currentHeights
      }

      const safeNewHeights = new Float32Array(count)
      for (let i = 0; i < count; i++) {
        safeNewHeights[i] = heights[i] || 0
      }
      targetHeightsRef.current = safeNewHeights
      animStartRef.current = performance.now()
      animProgressRef.current = 0
      lastNormalsUpdateRef.current = 0
      isAnimatingRef.current = true
    } catch (e) {
      console.error('Terrain param change error:', e)
    }
  }, [heights])

  useEffect(() => {
    try {
      if (!pathLineRef.current || !pathMarkersRef.current || !sceneRef.current) return

      if (pathPoints.length === 0) {
        pathLineRef.current.geometry.dispose()
        pathLineRef.current.geometry = new THREE.BufferGeometry()
      } else {
        const positions = new Float32Array(pathPoints.length * 3)
        for (let i = 0; i < pathPoints.length; i++) {
          const p = pathPoints[i]
          if (p && typeof p.x === 'number' && isFinite(p.x)) {
            positions[i * 3] = p.x
            positions[i * 3 + 1] = (p.y || 0) + 0.5
            positions[i * 3 + 2] = p.z || 0
          }
        }
        pathLineRef.current.geometry.dispose()
        pathLineRef.current.geometry = new THREE.BufferGeometry()
        pathLineRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      }

      while (pathMarkersRef.current.children.length > 0) {
        const child = pathMarkersRef.current.children[0]
        pathMarkersRef.current.remove(child)
        const mesh = child as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        if (mesh.material) {
          const mats = mesh.material as THREE.Material | THREE.Material[]
          if (Array.isArray(mats)) mats.forEach(m => m.dispose())
          else mats.dispose()
        }
      }

      for (let i = 0; i < pathPoints.length; i++) {
        const p = pathPoints[i]
        if (!p || typeof p.x !== 'number' || !isFinite(p.x)) continue

        const sphereGeo = new THREE.SphereGeometry(1.5, 12, 12)
        const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
        const sphere = new THREE.Mesh(sphereGeo, sphereMat)
        sphere.position.set(p.x, (p.y || 0) + 0.5, p.z || 0)
        pathMarkersRef.current.add(sphere)

        const ringGeo = new THREE.RingGeometry(1.5, 2.2, 24)
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff7b00, side: THREE.DoubleSide })
        const ring = new THREE.Mesh(ringGeo, ringMat)
        ring.position.set(p.x, (p.y || 0) + 0.6, p.z || 0)
        ring.rotation.x = -Math.PI / 2
        pathMarkersRef.current.add(ring)
      }
    } catch (e) {
      console.error('Terrain path update error:', e)
    }
  }, [pathPoints])

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        cursor: cameraStateRef.current.isDragging ? 'grabbing' : 'grab',
      }}
    />
  )
}
