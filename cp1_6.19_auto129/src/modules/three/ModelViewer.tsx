import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import * as THREE from 'three'

export interface ModelViewerRef {
  startRotation: () => void
  stopRotation: () => void
}

interface ModelViewerProps {
  visible: boolean
}

const ModelViewer = forwardRef<ModelViewerRef, ModelViewerProps>(
  ({ visible }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const meshRef = useRef<THREE.Mesh | null>(null)
    const animationIdRef = useRef<number>(0)
    const isRotatingRef = useRef(false)
    const startTimeRef = useRef(0)

    useImperativeHandle(ref, () => ({
      startRotation: () => {
        isRotatingRef.current = true
        startTimeRef.current = performance.now()
      },
      stopRotation: () => {
        isRotatingRef.current = false
      },
    }))

    useEffect(() => {
      if (!containerRef.current) return

      const container = containerRef.current
      const width = container.clientWidth
      const height = container.clientHeight

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x8b5a2b)
      sceneRef.current = scene

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
      camera.position.z = 5
      cameraRef.current = camera

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.2
      container.appendChild(renderer.domElement)
      rendererRef.current = renderer

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(5, 5, 5)
      scene.add(directionalLight)

      const pointLight = new THREE.PointLight(0xffd700, 0.5, 10)
      pointLight.position.set(-3, 2, 3)
      scene.add(pointLight)

      const ringGeometry = new THREE.TorusGeometry(1.5, 0.5, 32, 100)

      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext('2d')!

      const gradient = ctx.createLinearGradient(0, 0, 512, 512)
      gradient.addColorStop(0, '#D4A574')
      gradient.addColorStop(0.3, '#CDB891')
      gradient.addColorStop(0.6, '#D9B382')
      gradient.addColorStop(1, '#B8865A')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 512, 512)

      for (let i = 0; i < 20; i++) {
        ctx.beginPath()
        ctx.arc(
          Math.random() * 512,
          Math.random() * 512,
          Math.random() * 30 + 10,
          0,
          Math.PI * 2
        )
        ctx.fillStyle = `rgba(${180 + Math.random() * 40}, ${140 + Math.random() * 30}, ${90 + Math.random() * 30}, ${0.3 + Math.random() * 0.3})`
        ctx.fill()
      }

      const texture = new THREE.CanvasTexture(canvas)
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping

      const material = new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.3,
        roughness: 0.5,
        envMapIntensity: 1,
      })

      const mesh = new THREE.Mesh(ringGeometry, material)
      mesh.rotation.x = Math.PI / 3
      scene.add(mesh)
      meshRef.current = mesh

      const animate = () => {
        animationIdRef.current = requestAnimationFrame(animate)

        if (meshRef.current && isRotatingRef.current) {
          const elapsed = (performance.now() - startTimeRef.current) / 1000
          meshRef.current.rotation.z = (elapsed / 12) * Math.PI * 2
        }

        renderer.render(scene, camera)
      }
      animate()

      const handleResize = () => {
        if (!containerRef.current || !cameraRef.current || !rendererRef.current) return
        const w = containerRef.current.clientWidth
        const h = containerRef.current.clientHeight
        cameraRef.current.aspect = w / h
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(w, h)
      }
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current)
        }
        if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement)
        }
        ringGeometry.dispose()
        material.dispose()
        texture.dispose()
        renderer.dispose()
      }
    }, [])

    useEffect(() => {
      if (visible) {
        isRotatingRef.current = true
        startTimeRef.current = performance.now()
      }
    }, [visible])

    return (
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: visible ? 1 : 0,
          transition: 'opacity 1s ease-in-out',
          pointerEvents: 'none',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      />
    )
  }
)

ModelViewer.displayName = 'ModelViewer'

export default ModelViewer
