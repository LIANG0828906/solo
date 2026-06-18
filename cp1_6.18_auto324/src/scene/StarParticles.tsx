import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore, Particle, ParticleConnection } from '../data/SimulationStore'
import { interactionManager } from '../interaction/InteractionManager'

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      }
    : { r: 1, g: 1, b: 1 }
}

const lerpColor = (color1: THREE.Color, color2: THREE.Color, t: number) => {
  return new THREE.Color(
    color1.r + (color2.r - color1.r) * t,
    color1.g + (color2.g - color1.g) * t,
    color1.b + (color2.b - color1.b) * t
  )
}

export function StarParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  const trailsRef = useRef<THREE.LineSegments>(null)
  const connectionsRef = useRef<THREE.LineSegments>(null)
  const selectionRingRef = useRef<THREE.Mesh>(null)
  const { camera, scene } = useThree()

  const particles = useSimulationStore((s) => s.particles)
  const connections = useSimulationStore((s) => s.connections)
  const selectedParticleId = useSimulationStore((s) => s.selectedParticleId)
  const simulationMode = useSimulationStore((s) => s.simulationMode)
  const modeTransitionProgress = useSimulationStore((s) => s.modeTransitionProgress)

  const geometry = useMemo(() => new THREE.BufferGeometry(), [])
  const trailGeometry = useMemo(() => new THREE.BufferGeometry(), [])
  const connectionGeometry = useMemo(() => new THREE.BufferGeometry(), [])

  useEffect(() => {
    if (pointsRef.current) {
      interactionManager.setPoints(pointsRef.current)
    }
    if (camera instanceof THREE.PerspectiveCamera) {
      interactionManager.setCamera(camera)
    }
    interactionManager.setScene(scene)
  }, [camera, scene])

  useFrame((_, delta) => {
    const positions: number[] = []
    const colors: number[] = []
    const sizes: number[] = []

    const trailPositions: number[] = []
    const trailColors: number[] = []

    particles.forEach((p: Particle) => {
      positions.push(p.x, p.y, p.z)
      const rgb = hexToRgb(p.color)
      colors.push(rgb.r, rgb.g, rgb.b)
      sizes.push(p.size)

      const trail = p.prevPositions || []
      for (let i = 0; i < trail.length - 1; i++) {
        const t1 = trail[i]
        const t2 = trail[i + 1]
        trailPositions.push(t1.x, t1.y, t1.z, t2.x, t2.y, t2.z)
        const alpha = (i / Math.max(trail.length - 1, 1)) * 0.6
        trailColors.push(rgb.r, rgb.g, rgb.b, alpha, rgb.r, rgb.g, rgb.b, alpha * 0.5)
      }
    })

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))
    geometry.computeBoundingSphere()

    trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(trailPositions, 3))
    trailGeometry.setAttribute('color', new THREE.Float32BufferAttribute(trailColors, 4))
    trailGeometry.computeBoundingSphere()

    const connPositions: number[] = []
    const connColors: number[] = []
    const blueColor = new THREE.Color(0x6c63ff)
    const redColor = new THREE.Color(0xff6584)
    const transitionT = simulationMode === 'attract' 
      ? Math.max(0, 1 - modeTransitionProgress)
      : modeTransitionProgress
    const transitionColor = lerpColor(blueColor, redColor, transitionT)

    connections.forEach((conn: ParticleConnection) => {
      const pA = particles.find((p: Particle) => p.id === conn.particleIdA)
      const pB = particles.find((p: Particle) => p.id === conn.particleIdB)
      if (pA && pB) {
        connPositions.push(pA.x, pA.y, pA.z, pB.x, pB.y, pB.z)
        const rgbA = hexToRgb(pA.color)
        const rgbB = hexToRgb(pB.color)
        const mixedR = (rgbA.r + rgbB.r) / 2 * 0.7 + transitionColor.r * 0.3
        const mixedG = (rgbA.g + rgbB.g) / 2 * 0.7 + transitionColor.g * 0.3
        const mixedB = (rgbA.b + rgbB.b) / 2 * 0.7 + transitionColor.b * 0.3
        connColors.push(mixedR, mixedG, mixedB, mixedR, mixedG, mixedB)
      }
    })

    connectionGeometry.setAttribute('position', new THREE.Float32BufferAttribute(connPositions, 3))
    connectionGeometry.setAttribute('color', new THREE.Float32BufferAttribute(connColors, 3))
    connectionGeometry.computeBoundingSphere()

    if (selectionRingRef.current) {
      const selected = particles.find((p: Particle) => p.id === selectedParticleId)
      if (selected) {
        selectionRingRef.current.visible = true
        selectionRingRef.current.position.set(selected.x, selected.y, selected.z)
        selectionRingRef.current.scale.setScalar(selected.size * 2.5)
        if (camera instanceof THREE.PerspectiveCamera) {
          selectionRingRef.current.lookAt(camera.position)
        }
        const mat = selectionRingRef.current.material as THREE.MeshBasicMaterial
        const flash = (Math.sin(performance.now() * Math.PI * 2 * 0.001) + 1) / 2
        mat.opacity = 0.5 + flash * 0.5
      } else {
        selectionRingRef.current.visible = false
      }
    }
  })

  return (
    <group>
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
          size={0.8}
          vertexColors
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      <lineSegments ref={trailsRef} geometry={trailGeometry}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          linewidth={1}
        />
      </lineSegments>

      <lineSegments ref={connectionsRef} geometry={connectionGeometry}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          linewidth={0.5}
        />
      </lineSegments>

      <mesh ref={selectionRingRef} visible={false}>
        <ringGeometry args={[0.8, 1, 32]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export default StarParticles
