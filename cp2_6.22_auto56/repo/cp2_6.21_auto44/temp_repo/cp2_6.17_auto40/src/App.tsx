import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFractalStore } from '@/store/useFractalStore'
import { FractalTree } from '@/generator/FractalTree'
import {
  particleVertexShader,
  particleFragmentShader,
  starVertexShader,
  starFragmentShader,
  pulseRingVertexShader,
  pulseRingFragmentShader,
  petalVertexShader,
  petalFragmentShader
} from '@/generator/ParticleShader'
import { InteractionManager } from '@/controls/InteractionManager'
import ControlPanel from '@/ui/ControlPanel'

const PARTICLE_COUNT = 2000
const STAR_COUNT = 500
const TRANSITION_DURATION = 1.5
const PETAL_DURATION = 1.0

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const interactionManagerRef = useRef<InteractionManager | null>(null)
  const treeMeshRef = useRef<THREE.Points | null>(null)
  const particlesRef = useRef<THREE.Points | null>(null)
  const starsRef = useRef<THREE.Points | null>(null)
  const pulseRingRef = useRef<THREE.Mesh | null>(null)
  const petalsRef = useRef<THREE.Points | null>(null)

  const animationIdRef = useRef<number>(0)
  const timeRef = useRef(0)
  const transitionStartTimeRef = useRef<number | null>(null)
  const growthFrameRef = useRef(0)
  const currentTreeRef = useRef<FractalTree | null>(null)
  const nextTreeRef = useRef<FractalTree | null>(null)
  const petalStartTimeRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef(0)
  const batchedGenerationRef = useRef({
    active: false,
    currentDepth: 0,
    frameCount: 0,
    totalFrames: 3
  })

  const { params, render } = useFractalStore()

  const initialSeed = useFractalStore.getState().params.randomSeed
  const initialMode = useFractalStore.getState().render.mode
  const lastModeRef = useRef<string>(initialMode)
  const lastSeedRef = useRef<number>(initialSeed)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    if (width === 0 || height === 0) return

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    cameraRef.current = camera

    const initialCamera = useFractalStore.getState().camera
    const radius = initialCamera.zoom
    camera.position.set(
      radius * Math.sin(initialCamera.rotationY) * Math.cos(initialCamera.rotationX),
      radius * Math.sin(initialCamera.rotationX),
      radius * Math.cos(initialCamera.rotationY) * Math.cos(initialCamera.rotationX)
    )
    camera.lookAt(0, 4, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    directionalLight.position.set(5, 10, 5)
    scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0x00FFAA, 0.8, 50)
    pointLight.position.set(0, 5, 0)
    scene.add(pointLight)

    createStars(scene)
    createPulseRing(scene)
    createPetals(scene)
    createParticles(scene)
    generateAndDisplayTree()

    const interactionManager = new InteractionManager(container, camera)
    interactionManagerRef.current = interactionManager

    interactionManager.setOnClickCallback((point) => {
      if (point) {
        spawnPetals(point)
      }
    })

    const animate = (timestamp: number) => {
      animationIdRef.current = requestAnimationFrame(animate)
      const deltaTime = Math.min((timestamp - lastFrameTimeRef.current) / 1000, 0.05)
      lastFrameTimeRef.current = timestamp
      timeRef.current += deltaTime

      updateTransition()
      updateGrowth()
      updateCamera()
      updateStars()
      updatePulseRing()
      updatePetals()

      renderer.render(scene, camera)
    }

    lastFrameTimeRef.current = performance.now()
    animate(lastFrameTimeRef.current)

    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return
      const w = container.clientWidth
      const h = container.clientHeight
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationIdRef.current)
      window.removeEventListener('resize', handleResize)
      interactionManager.dispose()
      if (container && renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry?.dispose()
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose())
          } else {
            obj.material?.dispose()
          }
        }
      })
      renderer.dispose()
      sceneRef.current = null
      cameraRef.current = null
      rendererRef.current = null
      treeMeshRef.current = null
      particlesRef.current = null
      starsRef.current = null
      pulseRingRef.current = null
      petalsRef.current = null
      interactionManagerRef.current = null
      currentTreeRef.current = null
      nextTreeRef.current = null
    }
  }, [])

  useEffect(() => {
    const modeChanged = render.mode !== lastModeRef.current
    const seedChanged = params.randomSeed !== lastSeedRef.current
    
    if (modeChanged || seedChanged) {
      const { render: renderState } = useFractalStore.getState()
      if (!renderState.isTransitioning) {
        useFractalStore.getState().startTransition()
      }
      lastModeRef.current = render.mode
      lastSeedRef.current = params.randomSeed
    }
  }, [render.mode, params.randomSeed])

  const generateAndDisplayTree = () => {
    if (!sceneRef.current) return
    const { params: currentParams, render: currentRender } = useFractalStore.getState()
    
    if (currentTreeRef.current) {
      nextTreeRef.current = new FractalTree(currentParams, currentRender.mode)
    } else {
      currentTreeRef.current = new FractalTree(currentParams, currentRender.mode)
    }
    displayCurrentTree()
    
    growthFrameRef.current = 0
    batchedGenerationRef.current = {
      active: currentParams.maxDepth > 8,
      currentDepth: 0,
      frameCount: 0,
      totalFrames: 3
    }
    useFractalStore.getState().setCurrentDepth(0)
    useFractalStore.getState().incrementBranchesGenerated(0)
  }

  const displayCurrentTree = () => {
    if (!sceneRef.current || !currentTreeRef.current) return

    if (treeMeshRef.current) {
      sceneRef.current.remove(treeMeshRef.current)
      treeMeshRef.current.geometry.dispose()
      if (Array.isArray(treeMeshRef.current.material)) {
        treeMeshRef.current.material.forEach(m => m.dispose())
      } else {
        treeMeshRef.current.material.dispose()
      }
      treeMeshRef.current = null
    }

    try {
      const branchData = currentTreeRef.current.generate()
      useFractalStore.getState().setBranchTips(branchData.tips)

      const positions = branchData.vertices
      const colors = branchData.colors
      const pointCount = positions.length / 3

      const pointSizes = new Float32Array(pointCount)
      for (let i = 0; i < pointCount; i++) {
        pointSizes[i] = 0.8 + Math.random() * 0.4
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3))
      geometry.setAttribute('size', new THREE.BufferAttribute(pointSizes, 1))
      geometry.computeBoundingSphere()

      const material = new THREE.PointsMaterial({
        size: 0.22,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: 1.0
      })

      const points = new THREE.Points(geometry, material)
      points.visible = true
      sceneRef.current.add(points)
      treeMeshRef.current = points

    } catch (e) {
      console.error('Error generating tree:', e)
    }
  }

  const createStars = (scene: THREE.Scene) => {
    const positions = new Float32Array(STAR_COUNT * 3)
    const sizes = new Float32Array(STAR_COUNT)
    const brightnesses = new Float32Array(STAR_COUNT)

    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 50

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      sizes[i] = 0.5 + Math.random() * 1.5
      brightnesses[i] = 0.3 + Math.random() * 0.7
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('brightness', new THREE.BufferAttribute(brightnesses, 1))

    const material = new THREE.ShaderMaterial({
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      uniforms: {
        uRotationY: { value: 0 },
        uTime: { value: 0 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const stars = new THREE.Points(geometry, material)
    scene.add(stars)
    starsRef.current = stars
  }

  const createPulseRing = (scene: THREE.Scene) => {
    const geometry = new THREE.TorusGeometry(1, 0.05, 16, 100)
    const material = new THREE.ShaderMaterial({
      vertexShader: pulseRingVertexShader,
      fragmentShader: pulseRingFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uRadius: { value: 10 },
        uZoom: { value: 1 },
        uColor: { value: new THREE.Color(0x00FFFF) }
      },
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const ring = new THREE.Mesh(geometry, material)
    ring.rotation.x = Math.PI / 2
    ring.visible = false
    scene.add(ring)
    pulseRingRef.current = ring
  }

  const createPetals = (scene: THREE.Scene) => {
    const petalCount = 5 * 20
    const positions = new Float32Array(petalCount * 3)
    const velocities = new Float32Array(petalCount * 3)
    const colors = new Float32Array(petalCount * 3)
    const lives = new Float32Array(petalCount)

    const colorOptions = [
      new THREE.Color(0xFF0000),
      new THREE.Color(0xFFFF00),
      new THREE.Color(0xFF69B4)
    ]

    for (let i = 0; i < petalCount; i++) {
      const petalIndex = Math.floor(i / 20)
      const angle = (petalIndex / 5) * Math.PI * 2
      const particleIndex = i % 20

      const petalAngle = angle + (Math.random() - 0.5) * 0.5
      const speed = 1 + Math.random() * 2
      const spread = particleIndex / 20

      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0

      velocities[i * 3] = Math.cos(petalAngle) * speed * (0.5 + spread)
      velocities[i * 3 + 1] = speed * (0.8 + spread * 0.5)
      velocities[i * 3 + 2] = Math.sin(petalAngle) * speed * (0.5 + spread)

      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)]
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      lives[i] = 1
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('life', new THREE.BufferAttribute(lives, 1))

    const material = new THREE.ShaderMaterial({
      vertexShader: petalVertexShader,
      fragmentShader: petalFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uDuration: { value: PETAL_DURATION }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const petals = new THREE.Points(geometry, material)
    petals.visible = false
    scene.add(petals)
    petalsRef.current = petals
  }

  const spawnPetals = (position: THREE.Vector3) => {
    if (!petalsRef.current) return

    const positions = petalsRef.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = 0
      positions[i + 1] = 0
      positions[i + 2] = 0
    }
    petalsRef.current.geometry.attributes.position.needsUpdate = true

    petalsRef.current.position.copy(position)
    petalsRef.current.visible = true
    petalStartTimeRef.current = timeRef.current
  }

  const updatePetals = () => {
    if (!petalsRef.current || petalStartTimeRef.current === null) return

    const elapsed = timeRef.current - petalStartTimeRef.current
    const material = petalsRef.current.material as THREE.ShaderMaterial

    if (elapsed >= PETAL_DURATION) {
      petalsRef.current.visible = false
      petalStartTimeRef.current = null
      return
    }

    material.uniforms.uTime.value = elapsed
  }

  const createParticles = (scene: THREE.Scene) => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const startPositions = new Float32Array(PARTICLE_COUNT * 3)
    const targetPositions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('startPosition', new THREE.BufferAttribute(startPositions, 3))
    geometry.setAttribute('targetPosition', new THREE.BufferAttribute(targetPositions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        uProgress: { value: 0 },
        uExplodeRadius: { value: 10 },
        uTime: { value: 0 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const particles = new THREE.Points(geometry, material)
    particles.visible = false
    scene.add(particles)
    particlesRef.current = particles
  }

  const updateTransition = () => {
    const { render: renderState, params: currentParams } = useFractalStore.getState()

    if (!renderState.isTransitioning) {
      if (transitionStartTimeRef.current !== null) {
        transitionStartTimeRef.current = null
        if (particlesRef.current) {
          particlesRef.current.visible = false
        }
        if (treeMeshRef.current) {
          treeMeshRef.current.visible = true
        }
      }
      return
    }

    if (transitionStartTimeRef.current === null) {
      transitionStartTimeRef.current = timeRef.current

      if (nextTreeRef.current) {
        currentTreeRef.current = nextTreeRef.current
        nextTreeRef.current = null
      }

      if (particlesRef.current && currentTreeRef.current) {
        const currentData = currentTreeRef.current.generateParticleData(PARTICLE_COUNT)

        const targetTree = new FractalTree(currentParams, renderState.mode)
        nextTreeRef.current = targetTree
        const targetData = targetTree.generateParticleData(PARTICLE_COUNT)

        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
        const startPositions = particlesRef.current.geometry.attributes.startPosition.array as Float32Array
        const targetPositions = particlesRef.current.geometry.attributes.targetPosition.array as Float32Array
        const colors = particlesRef.current.geometry.attributes.color.array as Float32Array
        const sizes = particlesRef.current.geometry.attributes.size.array as Float32Array

        for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
          positions[i] = currentData.positions[i]
          startPositions[i] = currentData.positions[i]
          targetPositions[i] = targetData.positions[i]
          colors[i] = targetData.colors[i]
        }
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          sizes[i] = currentData.sizes[i]
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true
        particlesRef.current.geometry.attributes.startPosition.needsUpdate = true
        particlesRef.current.geometry.attributes.targetPosition.needsUpdate = true
        particlesRef.current.geometry.attributes.color.needsUpdate = true
        particlesRef.current.geometry.attributes.size.needsUpdate = true

        particlesRef.current.visible = true
      }

      if (treeMeshRef.current) {
        treeMeshRef.current.visible = false
      }
    }

    const elapsed = timeRef.current - transitionStartTimeRef.current
    const progress = Math.min(elapsed / TRANSITION_DURATION, 1)

    useFractalStore.getState().setTransitionProgress(progress)

    if (particlesRef.current) {
      const material = particlesRef.current.material as THREE.ShaderMaterial
      material.uniforms.uProgress.value = progress
      material.uniforms.uTime.value = timeRef.current
    }

    if (progress >= 1) {
      useFractalStore.getState().endTransition()
      transitionStartTimeRef.current = null

      if (nextTreeRef.current) {
        currentTreeRef.current = nextTreeRef.current
        nextTreeRef.current = null
        displayCurrentTree()
      }

      if (particlesRef.current) {
        particlesRef.current.visible = false
      }
    }
  }

  const updateGrowth = () => {
    const { params: currentParams, render: renderState } = useFractalStore.getState()

    if (renderState.isTransitioning) return

    const effectiveSpeed = currentParams.growthSpeed
    const shouldGrow = Math.random() < effectiveSpeed * 0.08

    if (!shouldGrow) return

    const currentDepth = renderState.currentDepth
    if (currentDepth >= currentParams.maxDepth) return

    const useBatchedGeneration = currentParams.maxDepth > 8

    if (useBatchedGeneration) {
      batchedGenerationRef.current.frameCount++
      const frameCount = batchedGenerationRef.current.frameCount
      const totalFrames = batchedGenerationRef.current.totalFrames

      if (frameCount <= totalFrames) {
        const ratio = frameCount / totalFrames
        const newDepth = Math.min(
          Math.ceil(currentParams.maxDepth * ratio),
          currentParams.maxDepth
        )
        if (newDepth > currentDepth) {
          useFractalStore.getState().setCurrentDepth(newDepth)
          useFractalStore.getState().incrementBranchesGenerated(
            Math.floor(Math.pow(2, newDepth) * 0.35)
          )
        }
      }
      return
    }

    const newDepth = Math.min(currentDepth + 1, currentParams.maxDepth)
    useFractalStore.getState().setCurrentDepth(newDepth)
    useFractalStore.getState().incrementBranchesGenerated(Math.floor(Math.pow(2, newDepth)))
  }

  const updateCamera = () => {
    if (!interactionManagerRef.current || !cameraRef.current) return
    interactionManagerRef.current.update()
  }

  const updateStars = () => {
    if (!starsRef.current) return

    const { camera } = useFractalStore.getState()
    const material = starsRef.current.material as THREE.ShaderMaterial
    material.uniforms.uRotationY.value = camera.rotationY
    material.uniforms.uTime.value = timeRef.current
  }

  const updatePulseRing = () => {
    if (!pulseRingRef.current || !cameraRef.current) return
    pulseRingRef.current.visible = false
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, #0A0E27 0%, #16213E 100%)'
        }}
      />
      <ControlPanel />
    </div>
  )
}
