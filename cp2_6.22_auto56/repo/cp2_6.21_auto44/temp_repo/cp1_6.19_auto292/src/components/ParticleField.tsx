import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useParticleStore } from '@/store/useParticleStore'

const SPHERE_RADIUS = 6
const TRAIL_LENGTH = 15
const BOUNDARY = 12
const DAMPING = 0.98
const RANDOM_FORCE = 0.02
const MOUSE_FORCE = 0.08
const MAX_SPEED = 2.0

const createCircleTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)')
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

interface ParticleData {
  positions: Float32Array
  velocities: Float32Array
  trailPositions: Float32Array
  trailAges: Float32Array
  colors: Float32Array
}

export default function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null)
  const trailRef = useRef<THREE.Points>(null)
  const particleData = useRef<ParticleData | null>(null)
  const prevResetTrigger = useRef(0)

  const {
    particleCount,
    flowSpeed,
    colorSchemeIndex,
    colorSchemes,
    isPaused,
    mouseDirection,
    isMouseDown,
    resetTrigger,
  } = useParticleStore()

  const totalTrailCount = particleCount * TRAIL_LENGTH

  const initParticles = (count: number): ParticleData => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const trailPositions = new Float32Array(count * TRAIL_LENGTH * 3)
    const trailAges = new Float32Array(count * TRAIL_LENGTH)
    const colors = new Float32Array(count * TRAIL_LENGTH * 3)

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = SPHERE_RADIUS * Math.cbrt(Math.random())

      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      velocities[i * 3] = (Math.random() - 0.5) * 0.1
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1

      for (let t = 0; t < TRAIL_LENGTH; t++) {
        const trailIdx = (i * TRAIL_LENGTH + t) * 3
        trailPositions[trailIdx] = x
        trailPositions[trailIdx + 1] = y
        trailPositions[trailIdx + 2] = z
        trailAges[i * TRAIL_LENGTH + t] = 0
      }
    }

    return { positions, velocities, trailPositions, trailAges, colors }
  }

  const { mainGeometry, trailGeometry, mainMaterial, trailMaterial } = useMemo(() => {
    const mainGeo = new THREE.BufferGeometry()
    const trailGeo = new THREE.BufferGeometry()
    const circleTexture = createCircleTexture()
    const mainMat = new THREE.PointsMaterial({
      size: 0.25,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: circleTexture,
      alphaMap: circleTexture,
      vertexColors: true,
    })
    const trailMat = new THREE.PointsMaterial({
      size: 0.12,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
      map: circleTexture,
      alphaMap: circleTexture,
    })
    return { mainGeometry: mainGeo, trailGeometry: trailGeo, mainMaterial: mainMat, trailMaterial: trailMat }
  }, [])

  useEffect(() => {
    particleData.current = initParticles(particleCount)
    const data = particleData.current

    mainGeometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3))
    mainGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3))
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(data.trailPositions, 3))
    trailGeometry.setAttribute('color', new THREE.BufferAttribute(data.colors, 3))

    prevResetTrigger.current = resetTrigger
  }, [particleCount, mainGeometry, trailGeometry])

  useEffect(() => {
    if (resetTrigger !== prevResetTrigger.current) {
      particleData.current = initParticles(particleCount)
      const data = particleData.current
      const mainPosAttr = mainGeometry.getAttribute('position') as THREE.BufferAttribute
      const trailPosAttr = trailGeometry.getAttribute('position') as THREE.BufferAttribute
      const trailColorAttr = trailGeometry.getAttribute('color') as THREE.BufferAttribute
      
      mainPosAttr.array = data.positions
      mainPosAttr.needsUpdate = true
      trailPosAttr.array = data.trailPositions
      trailPosAttr.needsUpdate = true
      trailColorAttr.array = data.colors
      trailColorAttr.needsUpdate = true
      
      prevResetTrigger.current = resetTrigger
    }
  }, [resetTrigger, particleCount, mainGeometry, trailGeometry])

  const lerpColor = (
    c1: { r: number; g: number; b: number },
    c2: { r: number; g: number; b: number },
    t: number
  ) => ({
    r: c1.r + (c2.r - c1.r) * t,
    g: c1.g + (c2.g - c1.g) * t,
    b: c1.b + (c2.b - c1.b) * t,
  })

  const getColorFromSpeed = (speed: number, schemeIndex: number) => {
    const scheme = colorSchemes[schemeIndex]
    const normalizedSpeed = Math.min(speed / MAX_SPEED, 1)
    
    if (normalizedSpeed < 0.5) {
      const t = normalizedSpeed * 2
      return lerpColor(scheme.coldColor, scheme.midColor, t)
    } else {
      const t = (normalizedSpeed - 0.5) * 2
      return lerpColor(scheme.midColor, scheme.warmColor, t)
    }
  }

  useFrame((_, delta) => {
    if (isPaused || !particleData.current) return

    const data = particleData.current
    const { positions, velocities, trailPositions, trailAges, colors } = data
    const speedMultiplier = flowSpeed

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3

      if (isMouseDown) {
        velocities[i3] += mouseDirection[0] * MOUSE_FORCE * speedMultiplier
        velocities[i3 + 1] += mouseDirection[1] * MOUSE_FORCE * speedMultiplier
        velocities[i3 + 2] += mouseDirection[2] * MOUSE_FORCE * speedMultiplier
      }

      velocities[i3] += (Math.random() - 0.5) * RANDOM_FORCE
      velocities[i3 + 1] += (Math.random() - 0.5) * RANDOM_FORCE
      velocities[i3 + 2] += (Math.random() - 0.5) * RANDOM_FORCE

      velocities[i3] *= DAMPING
      velocities[i3 + 1] *= DAMPING
      velocities[i3 + 2] *= DAMPING

      const speed = Math.sqrt(
        velocities[i3] ** 2 + velocities[i3 + 1] ** 2 + velocities[i3 + 2] ** 2
      )
      if (speed > MAX_SPEED * speedMultiplier) {
        const scale = (MAX_SPEED * speedMultiplier) / speed
        velocities[i3] *= scale
        velocities[i3 + 1] *= scale
        velocities[i3 + 2] *= scale
      }

      positions[i3] += velocities[i3] * delta * 60 * speedMultiplier
      positions[i3 + 1] += velocities[i3 + 1] * delta * 60 * speedMultiplier
      positions[i3 + 2] += velocities[i3 + 2] * delta * 60 * speedMultiplier

      if (positions[i3] > BOUNDARY) positions[i3] = -BOUNDARY
      if (positions[i3] < -BOUNDARY) positions[i3] = BOUNDARY
      if (positions[i3 + 1] > BOUNDARY) positions[i3 + 1] = -BOUNDARY
      if (positions[i3 + 1] < -BOUNDARY) positions[i3 + 1] = BOUNDARY
      if (positions[i3 + 2] > BOUNDARY) positions[i3 + 2] = -BOUNDARY
      if (positions[i3 + 2] < -BOUNDARY) positions[i3 + 2] = BOUNDARY

      const trailStart = i * TRAIL_LENGTH
      for (let t = TRAIL_LENGTH - 1; t > 0; t--) {
        const curr = (trailStart + t) * 3
        const prev = (trailStart + t - 1) * 3
        trailPositions[curr] = trailPositions[prev]
        trailPositions[curr + 1] = trailPositions[prev + 1]
        trailPositions[curr + 2] = trailPositions[prev + 2]
        trailAges[trailStart + t] = trailAges[trailStart + t - 1] + 1
      }
      trailPositions[trailStart * 3] = positions[i3]
      trailPositions[trailStart * 3 + 1] = positions[i3 + 1]
      trailPositions[trailStart * 3 + 2] = positions[i3 + 2]
      trailAges[trailStart] = 0

      const currentSpeed = Math.sqrt(
        velocities[i3] ** 2 + velocities[i3 + 1] ** 2 + velocities[i3 + 2] ** 2
      )
      const baseColor = getColorFromSpeed(currentSpeed, colorSchemeIndex)
      
      for (let t = 0; t < TRAIL_LENGTH; t++) {
        const colorIdx = (trailStart + t) * 3
        const alpha = 1 - t / TRAIL_LENGTH
        colors[colorIdx] = baseColor.r * alpha
        colors[colorIdx + 1] = baseColor.g * alpha
        colors[colorIdx + 2] = baseColor.b * alpha
      }
    }

    const mainPosAttr = mainGeometry.getAttribute('position') as THREE.BufferAttribute
    const mainColorAttr = mainGeometry.getAttribute('color') as THREE.BufferAttribute
    const trailPosAttr = trailGeometry.getAttribute('position') as THREE.BufferAttribute
    const trailColorAttr = trailGeometry.getAttribute('color') as THREE.BufferAttribute

    mainPosAttr.needsUpdate = true
    mainColorAttr.needsUpdate = true
    trailPosAttr.needsUpdate = true
    trailColorAttr.needsUpdate = true

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const trailStart = i * TRAIL_LENGTH * 3
      mainColorAttr.array[i3] = colors[trailStart]
      mainColorAttr.array[i3 + 1] = colors[trailStart + 1]
      mainColorAttr.array[i3 + 2] = colors[trailStart + 2]
    }
  })

  return (
    <group>
      <points ref={pointsRef} geometry={mainGeometry} material={mainMaterial} />
      <points ref={trailRef} geometry={trailGeometry} material={trailMaterial} />
    </group>
  )
}
