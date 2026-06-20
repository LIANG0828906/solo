import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import * as THREE from 'three'
import { FlowerParams, GrowthStage } from './utils/flowerUtils'
import './Flower.css'

export interface FlowerRef {
  getCanvas: () => HTMLCanvasElement | null
}

interface FlowerProps {
  params: FlowerParams
  growthStage: GrowthStage
}

const Flower = forwardRef<FlowerRef, FlowerProps>(({ params, growthStage }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const flowerGroupRef = useRef<THREE.Group | null>(null)
  const stemMeshRef = useRef<THREE.Mesh | null>(null)
  const petalsRef = useRef<THREE.Mesh[]>([])
  const seedRef = useRef<THREE.Mesh | null>(null)
  const budRef = useRef<THREE.Mesh | null>(null)
  const particlesRef = useRef<THREE.Points | null>(null)
  const potGroupRef = useRef<THREE.Group | null>(null)
  const flowerPivotRef = useRef<THREE.Group | null>(null)
  const isDraggingRef = useRef(false)
  const previousMouseRef = useRef({ x: 0, y: 0 })
  const rotationYRef = useRef(0)
  const rotationXRef = useRef(0)
  const zoomRef = useRef(0.95)
  const animationIdRef = useRef<number>(0)
  const timeRef = useRef(0)
  const targetParamsRef = useRef({ ...params })
  const currentParamsRef = useRef({ ...params })
  const growthProgressRef = useRef(0)
  const sproutProgressRef = useRef(0)
  const particleVelocitiesRef = useRef<Float32Array | null>(null)

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
  }))

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xfaf3e0)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
    camera.position.set(0, 0.3, 5)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.current.appendChild(renderer.domElement)
    canvasRef.current = renderer.domElement
    rendererRef.current = renderer

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.9)
    mainLight.position.set(3, 5, 3)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 20
    mainLight.shadow.camera.left = -3
    mainLight.shadow.camera.right = 3
    mainLight.shadow.camera.top = 3
    mainLight.shadow.camera.bottom = -3
    scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0xfff0e0, 0.3)
    fillLight.position.set(-2, 2, -2)
    scene.add(fillLight)

    const potGroup = new THREE.Group()
    const potBody = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.05, 1, 48),
      new THREE.MeshStandardMaterial({
        color: 0xad8a6b,
        roughness: 0.85,
        metalness: 0.05,
      })
    )
    potBody.position.y = -1
    potBody.receiveShadow = true
    potBody.castShadow = true
    potGroup.add(potBody)

    const potRim = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.08, 24, 48),
      new THREE.MeshStandardMaterial({
        color: 0x8b6f55,
        roughness: 0.7,
        metalness: 0.05,
      })
    )
    potRim.rotation.x = Math.PI / 2
    potRim.position.y = -0.52
    potGroup.add(potRim)

    const soil = new THREE.Mesh(
      new THREE.CircleGeometry(1.2, 48),
      new THREE.MeshStandardMaterial({
        color: 0x5d4037,
        roughness: 0.95,
        side: THREE.DoubleSide,
      })
    )
    soil.rotation.x = -Math.PI / 2
    soil.position.y = -0.49
    soil.receiveShadow = true
    potGroup.add(soil)

    scene.add(potGroup)
    potGroupRef.current = potGroup

    const seedGeometry = new THREE.SphereGeometry(0.12, 24, 24)
    const seedMaterial = new THREE.MeshStandardMaterial({
      color: 0x6d4c41,
      transparent: true,
      opacity: 0.75,
      roughness: 0.6,
    })
    const seed = new THREE.Mesh(seedGeometry, seedMaterial)
    seed.position.y = -0.45
    seed.visible = true
    seed.castShadow = true
    scene.add(seed)
    seedRef.current = seed

    const stemGeometry = new THREE.CylinderGeometry(0.04, 0.06, 2, 12)
    const stemMaterial = new THREE.MeshStandardMaterial({
      color: 0x7cb342,
      roughness: 0.6,
      metalness: 0.05,
    })
    const stem = new THREE.Mesh(stemGeometry, stemMaterial)
    stem.position.y = 0.5
    stem.castShadow = true
    stem.visible = false
    scene.add(stem)
    stemMeshRef.current = stem

    const flowerPivot = new THREE.Group()
    flowerPivot.position.y = 1.5
    flowerPivot.visible = false
    scene.add(flowerPivot)
    flowerPivotRef.current = flowerPivot

    const flowerGroup = new THREE.Group()
    flowerPivot.add(flowerGroup)
    flowerGroupRef.current = flowerGroup

    const budGeometry = new THREE.SphereGeometry(0.15, 24, 24)
    const budMaterial = new THREE.MeshStandardMaterial({
      color: 0xaed581,
      roughness: 0.5,
    })
    const bud = new THREE.Mesh(budGeometry, budMaterial)
    bud.position.y = 1.5
    bud.visible = false
    bud.castShadow = true
    scene.add(bud)
    budRef.current = bud

    const particleCount = 25
    const particlesGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 1.5
      positions[i * 3 + 2] = 0
      const angle = Math.random() * Math.PI * 2
      const speed = 0.8 + Math.random() * 0.8
      velocities[i * 3] = Math.cos(angle) * speed
      velocities[i * 3 + 1] = 1.5 + Math.random() * 1
      velocities[i * 3 + 2] = Math.sin(angle) * speed
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x81c784,
      size: 0.06,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    })
    const particles = new THREE.Points(particlesGeometry, particlesMaterial)
    particles.visible = false
    scene.add(particles)
    particlesRef.current = particles
    particleVelocitiesRef.current = velocities

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      timeRef.current += 0.016

      if (seedRef.current && growthStage === 'seed') {
        const breathe = 1 + Math.sin(timeRef.current * Math.PI) * 0.12
        seedRef.current.scale.setScalar(breathe)
        seedRef.current.position.y = -0.45 + Math.sin(timeRef.current * Math.PI) * 0.02
      }

      if (growthStage === 'sprouting' && sproutProgressRef.current < 1) {
        sproutProgressRef.current = Math.min(sproutProgressRef.current + 0.018, 1)
        const progress = sproutProgressRef.current

        if (stemMeshRef.current) {
          stemMeshRef.current.visible = true
          const stemHeight = progress * 2
          stemMeshRef.current.scale.y = progress
          stemMeshRef.current.position.y = -0.5 + stemHeight / 2
        }

        if (progress > 0.5 && budRef.current) {
          budRef.current.visible = true
          const budScale = (progress - 0.5) / 0.5
          budRef.current.scale.setScalar(Math.min(budScale, 1) * 0.15)
          budRef.current.position.y = -0.5 + stemHeight
        }

        if (progress >= 1 && particlesRef.current && !particlesRef.current.visible) {
          particlesRef.current.visible = true
          const posAttr = particlesRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
          for (let i = 0; i < particleCount; i++) {
            posAttr.setXYZ(i, 0, 1.5, 0)
          }
          posAttr.needsUpdate = true
          ;(particlesRef.current.material as THREE.PointsMaterial).opacity = 0.9
        }
      }

      if (growthStage === 'growing' && growthProgressRef.current < 1) {
        growthProgressRef.current = Math.min(growthProgressRef.current + 0.012, 1)
        const progress = growthProgressRef.current

        if (budRef.current) {
          budRef.current.scale.setScalar((1 - progress) * 0.15)
          if (progress > 0.3) {
            budRef.current.visible = false
          }
        }

        updateFlower(progress)
        updateStemBend()
      }

      if (growthStage === 'bloomed') {
        growthProgressRef.current = 1
        targetParamsRef.current = { ...params }

        const lerpSpeed = 0.08
        currentParamsRef.current.petalCount = Math.round(
          THREE.MathUtils.lerp(currentParamsRef.current.petalCount, targetParamsRef.current.petalCount, lerpSpeed)
        )
        currentParamsRef.current.petalHue = THREE.MathUtils.lerp(
          currentParamsRef.current.petalHue, targetParamsRef.current.petalHue, lerpSpeed
        )
        currentParamsRef.current.flowerDiameter = THREE.MathUtils.lerp(
          currentParamsRef.current.flowerDiameter, targetParamsRef.current.flowerDiameter, lerpSpeed
        )
        currentParamsRef.current.stemBend = THREE.MathUtils.lerp(
          currentParamsRef.current.stemBend, targetParamsRef.current.stemBend, lerpSpeed
        )

        updateFlower(1)
        updateStemBend()
      }

      if (particlesRef.current && particlesRef.current.visible && particleVelocitiesRef.current) {
        const posAttr = particlesRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
        const velocities = particleVelocitiesRef.current
        let allDone = true
        for (let i = 0; i < particleCount; i++) {
          const x = posAttr.getX(i)
          const y = posAttr.getY(i)
          const z = posAttr.getZ(i)
          const vx = velocities[i * 3] * 0.016
          const vy = velocities[i * 3 + 1] * 0.016
          const vz = velocities[i * 3 + 2] * 0.016
          const newY = y + vy - 0.01
          if (newY > -0.5) {
            posAttr.setXYZ(i, x + vx, newY, z + vz)
            velocities[i * 3 + 1] -= 0.03
            allDone = false
          }
        }
        posAttr.needsUpdate = true
        const material = particlesRef.current.material as THREE.PointsMaterial
        material.opacity -= 0.008
        if (material.opacity <= 0 || allDone) {
          particlesRef.current.visible = false
        }
      }

      if (!isDraggingRef.current && growthStage !== 'seed') {
        rotationYRef.current += 0.003
      }

      if (flowerPivotRef.current) {
        flowerPivotRef.current.rotation.y = rotationYRef.current
        flowerPivotRef.current.rotation.x = rotationXRef.current
      }
      if (stemMeshRef.current && growthStage !== 'seed' && growthStage !== 'sprouting') {
      }

      if (cameraRef.current) {
        const baseDistance = 5
        const distance = baseDistance / zoomRef.current
        const height = 0.3 + rotationXRef.current * 2
        cameraRef.current.position.set(
          Math.sin(rotationYRef.current) * distance * 0.3,
          height,
          Math.cos(rotationYRef.current) * distance
        )
        cameraRef.current.lookAt(0, 0.2, 0)
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }

    animate()

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return
      const size = Math.min(containerRef.current.clientWidth, containerRef.current.clientHeight)
      rendererRef.current.setSize(size, size)
      cameraRef.current.aspect = 1
      cameraRef.current.updateProjectionMatrix()
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationIdRef.current)
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
        rendererRef.current.dispose()
      }
    }
  }, [])

  const updateStemBend = () => {
    if (!stemMeshRef.current || !flowerPivotRef.current) return

    const bendAngle = (currentParamsRef.current.stemBend * Math.PI) / 180

    stemMeshRef.current.rotation.z = bendAngle * 0.3

    const stemHeight = 2
    const stemBaseY = -0.5
    const bendX = Math.sin(bendAngle) * stemHeight * 0.5
    const bendY = stemBaseY + stemHeight * Math.cos(bendAngle * 0.3)

    flowerPivotRef.current.position.y = bendY
    flowerPivotRef.current.position.x = bendX
    flowerPivotRef.current.rotation.z = bendAngle * 0.5
  }

  const updateFlower = (progress: number) => {
    if (!flowerGroupRef.current || !flowerPivotRef.current) return

    flowerPivotRef.current.visible = progress > 0.2

    const petalCount = Math.max(5, Math.min(12, Math.round(currentParamsRef.current.petalCount)))
    const flowerSize = (currentParamsRef.current.flowerDiameter / 80) * 0.9 * progress
    const hue = currentParamsRef.current.petalHue

    while (petalsRef.current.length < petalCount) {
      const petalGeometry = createPetalGeometry()
      const petalMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(hue / 360, 0.7, 0.6),
        roughness: 0.5,
        metalness: 0.05,
        side: THREE.DoubleSide,
      })
      const petal = new THREE.Mesh(petalGeometry, petalMaterial)
      petal.castShadow = true
      petal.receiveShadow = true
      flowerGroupRef.current!.add(petal)
      petalsRef.current.push(petal)
    }

    while (petalsRef.current.length > petalCount) {
      const petal = petalsRef.current.pop()
      if (petal) {
        flowerGroupRef.current!.remove(petal)
        petal.geometry.dispose()
        ;(petal.material as THREE.Material).dispose()
      }
    }

    const centerSize = flowerSize * 0.25
    let centerMesh = flowerGroupRef.current.getObjectByName('center') as THREE.Mesh
    if (!centerMesh) {
      const centerGeometry = new THREE.SphereGeometry(centerSize, 24, 24)
      const centerMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(hue / 360, 0.5, 0.45),
        roughness: 0.6,
        metalness: 0.1,
      })
      centerMesh = new THREE.Mesh(centerGeometry, centerMaterial)
      centerMesh.name = 'center'
      centerMesh.castShadow = true
      flowerGroupRef.current.add(centerMesh)
    } else {
      const geom = centerMesh.geometry as THREE.SphereGeometry
      if (Math.abs(geom.parameters.radius - centerSize) > 0.001) {
        centerMesh.geometry.dispose()
        centerMesh.geometry = new THREE.SphereGeometry(centerSize, 24, 24)
      }
      const mat = centerMesh.material as THREE.MeshStandardMaterial
      mat.color.setHSL(hue / 360, 0.5, 0.45)
    }

    for (let i = 0; i < petalsRef.current.length; i++) {
      const petal = petalsRef.current[i]
      const angle = (i / petalsRef.current.length) * Math.PI * 2
      const petalLength = flowerSize * 0.7
      const petalWidth = flowerSize * 0.35

      petal.position.set(
        Math.cos(angle) * flowerSize * 0.2,
        0,
        Math.sin(angle) * flowerSize * 0.2
      )
      petal.rotation.y = -angle
      petal.rotation.z = Math.PI / 2 - 0.4 * progress

      petal.scale.set(petalWidth, 1, petalLength)

      const mat = petal.material as THREE.MeshStandardMaterial
      const petalHue = (hue + (i % 2 === 0 ? 8 : -8)) / 360
      mat.color.setHSL(petalHue, 0.7, 0.62)
    }

    flowerGroupRef.current.scale.setScalar(progress)
  }

  const createPetalGeometry = (): THREE.BufferGeometry => {
    const shape = new THREE.Shape()
    shape.moveTo(0, -0.5)
    shape.bezierCurveTo(0.35, -0.3, 0.35, 0.25, 0, 0.5)
    shape.bezierCurveTo(-0.35, 0.25, -0.35, -0.3, 0, -0.5)

    const geometry = new THREE.ShapeGeometry(shape, 16)
    geometry.rotateX(Math.PI / 2)
    geometry.translate(0, 0, 0.5)

    const positions = geometry.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i)
      const z = positions.getZ(i)
      const curve = Math.sin(z * Math.PI * 0.8) * 0.25
      positions.setY(i, y + curve)
    }
    geometry.computeVertexNormals()

    return geometry
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true
    previousMouseRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return
    const deltaX = e.clientX - previousMouseRef.current.x
    const deltaY = e.clientY - previousMouseRef.current.y

    rotationYRef.current += deltaX * 0.008

    rotationXRef.current += deltaY * 0.005
    const maxPolarAngle = (30 * Math.PI) / 180
    rotationXRef.current = Math.max(-maxPolarAngle, Math.min(maxPolarAngle, rotationXRef.current))

    previousMouseRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.08 : 0.08
    zoomRef.current = Math.max(0.8, Math.min(1.8, zoomRef.current + delta))
  }

  useEffect(() => {
    if (growthStage === 'sprouting') {
      sproutProgressRef.current = 0
      if (seedRef.current) {
        seedRef.current.visible = false
      }
    } else if (growthStage === 'growing') {
      growthProgressRef.current = 0
      if (budRef.current) {
        budRef.current.visible = true
      }
    } else if (growthStage === 'bloomed') {
      if (flowerPivotRef.current) {
        flowerPivotRef.current.visible = true
      }
    }
  }, [growthStage])

  return (
    <div className="flower-container">
      <div className="pot-area">
        <div
          ref={containerRef}
          className="canvas-container"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />
      </div>
      <div className="pot-shadow" />
    </div>
  )
})

Flower.displayName = 'Flower'

export default Flower
