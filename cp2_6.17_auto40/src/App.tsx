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
  const treeMeshRef = useRef<THREE.Mesh | null>(null)
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

  const { params, render } = useFractalStore()

  const initialSeed = useFractalStore.getState().params.randomSeed
  const initialMode = useFractalStore.getState().render.mode
  const lastModeRef = useRef<string>(initialMode)
  const lastSeedRef = useRef<number>(initialSeed)

  useEffect(() => {
    if (!containerRef.current) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    const scene = new THREE.Scene()
    sceneRef.current = scene
    ;(window as any).__FRACTAL_SCENE__ = scene
    ;(window as any).__THREE__ = THREE

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    cameraRef.current = camera

    const initialCamera = useFractalStore.getState().camera
    const radius = initialCamera.zoom
    camera.position.set(
      radius * Math.sin(initialCamera.rotationY) * Math.cos(initialCamera.rotationX),
      radius * Math.sin(initialCamera.rotationX),
      radius * Math.cos(initialCamera.rotationY) * Math.cos(initialCamera.rotationX)
    )
    camera.lookAt(0, 0, 0)
    console.log('Initial camera position:', camera.position)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 10, 5)
    scene.add(directionalLight)

    createStars(scene)
    createPulseRing(scene)
    createPetals(scene)

    const interactionManager = new InteractionManager(containerRef.current, camera)
    interactionManagerRef.current = interactionManager

    interactionManager.setOnClickCallback((point) => {
      if (point) {
        spawnPetals(point)
      }
    })

    generateTree()

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      timeRef.current += 0.016

      updateTransition()
      updateGrowth()
      updateCamera()
      updateStars()
      updatePulseRing()
      updatePetals()

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationIdRef.current)
      interactionManager.dispose()
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  useEffect(() => {
    if (render.mode !== lastModeRef.current || params.randomSeed !== lastSeedRef.current) {
      if (!render.isTransitioning) {
        useFractalStore.getState().startTransition()
      }
      lastModeRef.current = render.mode
      lastSeedRef.current = params.randomSeed
    }
  }, [render.mode, params.randomSeed])

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
      side: THREE.DoubleSide
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

  const generateTree = () => {
    const { params, render } = useFractalStore.getState()
    console.log('generateTree called, mode:', render.mode, 'currentTree exists:', !!currentTreeRef.current)

    if (currentTreeRef.current) {
      nextTreeRef.current = new FractalTree(params, render.mode)
    } else {
      currentTreeRef.current = new FractalTree(params, render.mode)
      console.log('Creating new tree mesh')
      createTreeMesh()
    }

    growthFrameRef.current = 0
    useFractalStore.getState().setCurrentDepth(0)
    useFractalStore.getState().incrementBranchesGenerated(0)
  }

  const createTreeMesh = () => {
    if (!sceneRef.current || !currentTreeRef.current) {
      console.log('createTreeMesh: early return, scene:', !!sceneRef.current, 'tree:', !!currentTreeRef.current)
      return
    }

    console.log('createTreeMesh: generating tree...')

    if (treeMeshRef.current) {
      sceneRef.current.remove(treeMeshRef.current)
      treeMeshRef.current.geometry.dispose()
      if (Array.isArray(treeMeshRef.current.material)) {
        treeMeshRef.current.material.forEach(m => m.dispose())
      } else {
        treeMeshRef.current.material.dispose()
      }
    }

    try {
      const branchData = currentTreeRef.current.generate()
      console.log('Tree generated, vertices:', branchData.vertices.length / 3, 'tips:', branchData.tips.length)
      useFractalStore.getState().setBranchTips(branchData.tips)

      const material = new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.DoubleSide
      })
      console.log('Material created, vertex colors enabled')

      const mesh = new THREE.Mesh(branchData.geometry, material)
      sceneRef.current.add(mesh)
      treeMeshRef.current = mesh
      ;(window as any).__TREE_MESH__ = mesh
      console.log('Mesh added to scene, children count:', sceneRef.current.children.length)

      const box = new THREE.Box3().setFromObject(mesh)
      console.log('Tree bounding box min:', JSON.stringify(box.min))
      console.log('Tree bounding box max:', JSON.stringify(box.max))
      console.log('Tree position:', JSON.stringify(mesh.position))
      console.log('Camera position:', JSON.stringify(cameraRef.current?.position))
      console.log('Camera far:', cameraRef.current?.far)
      console.log('Camera near:', cameraRef.current?.near)

      createParticles()
    } catch (e) {
      console.error('Error generating tree:', e)
    }
  }

  const createParticles = () => {
    if (!sceneRef.current || !currentTreeRef.current) return

    if (particlesRef.current) {
      sceneRef.current.remove(particlesRef.current)
      particlesRef.current.geometry.dispose()
      if (Array.isArray(particlesRef.current.material)) {
        particlesRef.current.material.forEach(m => m.dispose())
      } else {
        particlesRef.current.material.dispose()
      }
    }

    const currentData = currentTreeRef.current.generateParticleData(PARTICLE_COUNT)
    const targetData = nextTreeRef.current
      ? nextTreeRef.current.generateParticleData(PARTICLE_COUNT)
      : currentData

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(currentData.positions), 3))
    geometry.setAttribute('startPosition', new THREE.BufferAttribute(new Float32Array(currentData.positions), 3))
    geometry.setAttribute('targetPosition', new THREE.BufferAttribute(new Float32Array(targetData.positions), 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(targetData.colors), 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(new Float32Array(currentData.sizes), 1))

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
    sceneRef.current.add(particles)
    particlesRef.current = particles
  }

  const updateTransition = () => {
    const { render } = useFractalStore.getState()

    if (!render.isTransitioning) {
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

        const targetTree = new FractalTree(useFractalStore.getState().params, useFractalStore.getState().render.mode)
        nextTreeRef.current = targetTree
        const targetData = targetTree.generateParticleData(PARTICLE_COUNT)

        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
        const startPositions = particlesRef.current.geometry.attributes.startPosition.array as Float32Array
        const targetPositions = particlesRef.current.geometry.attributes.targetPosition.array as Float32Array
        const colors = particlesRef.current.geometry.attributes.color.array as Float32Array

        for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
          positions[i] = currentData.positions[i]
          startPositions[i] = currentData.positions[i]
          targetPositions[i] = targetData.positions[i]
          colors[i] = targetData.colors[i]
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true
        particlesRef.current.geometry.attributes.startPosition.needsUpdate = true
        particlesRef.current.geometry.attributes.targetPosition.needsUpdate = true
        particlesRef.current.geometry.attributes.color.needsUpdate = true

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

      if (currentTreeRef.current) {
        const branchData = currentTreeRef.current.generate()
        useFractalStore.getState().setBranchTips(branchData.tips)

        if (treeMeshRef.current) {
          treeMeshRef.current.geometry.dispose()
          treeMeshRef.current.geometry = branchData.geometry
          treeMeshRef.current.visible = true
        }
      }

      if (particlesRef.current) {
        particlesRef.current.visible = false
      }
    }
  }

  const updateGrowth = () => {
    const { params, render } = useFractalStore.getState()

    if (render.isTransitioning) return

    const effectiveSpeed = params.growthSpeed
    const shouldGrow = Math.random() < effectiveSpeed * 0.1

    if (!shouldGrow) return

    const currentDepth = render.currentDepth
    if (currentDepth >= params.maxDepth) return

    const useBatchedGeneration = params.maxDepth > 8
    const generationRatio = useBatchedGeneration ? 0.4 : 1.0

    if (useBatchedGeneration) {
      growthFrameRef.current++
      if (growthFrameRef.current < 3) {
        const depthIncrement = Math.ceil(generationRatio * (params.maxDepth - currentDepth) / 3)
        const newDepth = Math.min(currentDepth + depthIncrement, params.maxDepth)
        useFractalStore.getState().setCurrentDepth(newDepth)
        useFractalStore.getState().incrementBranchesGenerated(Math.floor(Math.pow(2, newDepth) * 0.4))
        return
      }
      growthFrameRef.current = 0
    }

    const newDepth = currentDepth + 1
    useFractalStore.getState().setCurrentDepth(newDepth)
    useFractalStore.getState().incrementBranchesGenerated(Math.floor(Math.pow(2, newDepth)))
  }

  const updateCamera = () => {
    if (interactionManagerRef.current) {
      interactionManagerRef.current.update()
    }
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

    const { camera } = useFractalStore.getState()
    const normalizedZoom = (camera.zoom - 5) / 25

    if (normalizedZoom > 0.05) {
      pulseRingRef.current.visible = true
      const material = pulseRingRef.current.material as THREE.ShaderMaterial
      material.uniforms.uTime.value = timeRef.current
      material.uniforms.uZoom.value = 1 + normalizedZoom * 3
      material.uniforms.uRadius.value = 10
    } else {
      pulseRingRef.current.visible = false
    }
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
