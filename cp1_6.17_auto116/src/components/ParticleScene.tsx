import { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { useParticleAnimation } from '@/hooks/useParticleAnimation'
import { themeConfigs } from '@/utils/colorUtils'
import { useAppStore } from '@/store/useAppStore'

export function ParticleScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const initializedRef = useRef(false)
  const [fps, setFps] = useState(60)
  const fpsIntervalRef = useRef<number | null>(null)

  const currentTheme = useAppStore((state) => state.currentTheme)

  const { startAnimation, stopAnimation, getFps, initializeParticles } = useParticleAnimation({
    sceneRef,
    cameraRef,
    rendererRef,
  })

  const initializeScene = useCallback(() => {
    if (!containerRef.current) return

    const width = window.innerWidth
    const height = window.innerHeight - 80

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(themeConfigs[currentTheme].backgroundColor)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.z = 80
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1))
    rendererRef.current = renderer

    containerRef.current.appendChild(renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0x404060, 1)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 1, 100)
    pointLight.position.set(50, 50, 50)
    scene.add(pointLight)

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight - 80
      cameraRef.current.aspect = newWidth / newHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    startAnimation()

    fpsIntervalRef.current = window.setInterval(() => {
      setFps(getFps())
    }, 500)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (fpsIntervalRef.current) {
        clearInterval(fpsIntervalRef.current)
      }
    }
  }, [currentTheme, startAnimation, getFps])

  useEffect(() => {
    const cleanup = initializeScene()

    return () => {
      stopAnimation()
      if (cleanup) cleanup()
      if (rendererRef.current) {
        rendererRef.current.dispose()
        if (rendererRef.current.domElement.parentNode) {
          rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement)
        }
      }
    }
  }, [initializeScene, stopAnimation])

  return (
    <div className="scene-container">
      <div ref={containerRef} className="canvas-container" />
      <div className="fps-display">{fps} FPS</div>
    </div>
  )
}
