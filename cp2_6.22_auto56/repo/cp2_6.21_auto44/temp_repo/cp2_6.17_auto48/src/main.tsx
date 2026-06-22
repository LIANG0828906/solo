import React, { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import * as THREE from 'three'
import { PlanetSystem } from '@/simulation/planetSystem'
import { CameraControls } from '@/interaction/controls'
import { UI } from '@/interaction/UI'
import { usePlanetariumStore } from '@/store/store'
import { Planet } from '@/simulation/planet'

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const planetSystemRef = useRef<PlanetSystem | null>(null)
  const controlsRef = useRef<CameraControls | null>(null)
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())
  const animationIdRef = useRef<number>(0)
  const clockRef = useRef<THREE.Clock>(new THREE.Clock())
  const planetMeshesRef = useRef<THREE.Mesh[]>([])
  const planetObjectsRef = useRef<Map<THREE.Mesh, Planet>>(new Map())
  const fpsCounterRef = useRef<{ count: number; lastTime: number }>({
    count: 0,
    lastTime: 0,
  })

  const setSelectedPlanet = usePlanetariumStore(
    (state) => state.setSelectedPlanet
  )

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    scene.background = null
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(0, 15, 35)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = false
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const sunLight = new THREE.PointLight(0xffcc00, 2, 200, 0.5)
    sunLight.position.set(0, 0, 0)
    scene.add(sunLight)

    const planetSystem = new PlanetSystem(scene)
    planetSystemRef.current = planetSystem

    const controls = new CameraControls(camera, renderer)
    controlsRef.current = controls

    const allPlanets = planetSystem.getAllPlanets()
    allPlanets.forEach((planet) => {
      if (planet.mesh) {
        planetMeshesRef.current.push(planet.mesh)
        planetObjectsRef.current.set(planet.mesh, planet)
      }
    })

    const handleResize = () => {
      if (!camera || !renderer) return
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    const handleClick = (event: MouseEvent) => {
      if (!camera || !renderer) return

      const rect = renderer.domElement.getBoundingClientRect()
      mouseRef.current.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const intersects = raycasterRef.current.intersectObjects(
        planetMeshesRef.current,
        false
      )

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object as THREE.Mesh
        const planet = planetObjectsRef.current.get(clickedMesh)

        if (planet && controlsRef.current) {
          const planetPos = planet.getPosition()
          controlsRef.current.flyToPlanet(
            planetPos,
            planet.config.radius,
            2000
          )
          setSelectedPlanet(planet.config.name)
        }
      }
    }
    renderer.domElement.addEventListener('click', handleClick)

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)

      const deltaTime = Math.min(clockRef.current.getDelta(), 0.1)

      fpsCounterRef.current.count++
      const now = performance.now()
      if (now - fpsCounterRef.current.lastTime >= 1000) {
        fpsCounterRef.current.lastTime = now
        fpsCounterRef.current.count = 0
      }

      if (planetSystemRef.current) {
        planetSystemRef.current.update(deltaTime)
      }

      if (controlsRef.current) {
        controlsRef.current.update(deltaTime)
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera)
      }
    }
    animate()

    return () => {
      cancelAnimationFrame(animationIdRef.current)
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('click', handleClick)

      controlsRef.current?.dispose()
      planetSystemRef.current?.dispose()

      if (renderer) {
        renderer.dispose()
        if (containerRef.current && renderer.domElement.parentNode) {
          containerRef.current.removeChild(renderer.domElement)
        }
      }

      if (scene) {
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose()
            const materials = Array.isArray(object.material)
              ? object.material
              : [object.material]
            materials.forEach((mat) => mat.dispose())
          }
        })
      }
    }
  }, [setSelectedPlanet])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <UI />
    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  createRoot(container).render(<App />)
}
