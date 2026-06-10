import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface MillstoneProps {
  rotationSpeed: number
  gearRatio: number
  poundingFrequency: number
  poundingDepth: number
  impulse: number
  position?: [number, number, number]
}

interface RiceParticle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  size: number
  color: THREE.Color
  isSplit: boolean
}

interface EnergyParticle {
  t: number
  speed: number
}

export default function Millstone({
  rotationSpeed,
  gearRatio,
  poundingFrequency,
  poundingDepth,
  impulse,
  position = [0, 0, 0]
}: MillstoneProps) {
  const pestleGroupRef = useRef<THREE.Group>(null)
  const gearRef = useRef<THREE.Group>(null)
  const riceMeshRef = useRef<THREE.InstancedMesh>(null)
  const energyMeshRef = useRef<THREE.InstancedMesh>(null)
  const riceParticlesRef = useRef<RiceParticle[]>([])
  const energyParticlesRef = useRef<EnergyParticle[]>([])
  const lastPoundTimeRef = useRef(0)
  const [gearTeeth, setGearTeeth] = useState(24)

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const energyDummy = useMemo(() => new THREE.Object3D(), [])
  const maxRiceParticles = 300
  const energyParticleCount = 10

  const riceColors = useMemo(
    () => [new THREE.Color('#f5deb3'), new THREE.Color('#d2b48c')],
    []
  )

  const energyCurve = useMemo(() => {
    return new THREE.CubicBezierCurve3(
      new THREE.Vector3(-2, 1.5, 0),
      new THREE.Vector3(-1, 3, 0),
      new THREE.Vector3(1, 2, 0),
      new THREE.Vector3(3, 1.5, 0)
    )
  }, [])

  useEffect(() => {
    const teeth = Math.round(12 + (gearRatio - 3) * 8)
    setGearTeeth(Math.max(12, Math.min(36, teeth)))
  }, [gearRatio])

  useEffect(() => {
    const initialCount = 150 + Math.floor(Math.random() * 150)
    for (let i = 0; i < initialCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 0.5
      riceParticlesRef.current.push({
        position: new THREE.Vector3(
          position[0] + Math.cos(angle) * radius,
          position[1] + 0.15,
          position[2] + Math.sin(angle) * radius
        ),
        velocity: new THREE.Vector3(0, 0, 0),
        life: 1,
        size: 0.03 + Math.random() * 0.02,
        color: riceColors[Math.floor(Math.random() * riceColors.length)].clone(),
        isSplit: false
      })
    }
  }, [position, riceColors])

  useEffect(() => {
    for (let i = 0; i < energyParticleCount; i++) {
      energyParticlesRef.current.push({
        t: i / energyParticleCount,
        speed: 0.3 + Math.random() * 0.2
      })
    }
  }, [])

  useFrame((state, delta) => {
    const currentTime = state.clock.elapsedTime

    if (gearRef.current) {
      const gearRotationSpeed = rotationSpeed / gearRatio
      gearRef.current.rotation.y += gearRotationSpeed * delta
    }

    if (pestleGroupRef.current && poundingFrequency > 0) {
      const period = 1 / poundingFrequency
      const phase = (currentTime % period) / period
      const yOffset = Math.sin(phase * Math.PI * 2) * poundingDepth * 0.5 + poundingDepth * 0.5
      pestleGroupRef.current.position.y = position[1] + 1.2 + yOffset

      if (currentTime - lastPoundTimeRef.current >= period && phase > 0.45 && phase < 0.55) {
        lastPoundTimeRef.current = currentTime

        riceParticlesRef.current.forEach((particle) => {
          const dist = particle.position.distanceTo(
            new THREE.Vector3(position[0], position[1] + 0.15, position[2])
          )
          if (dist < 0.6) {
            const force = Math.min(impulse * 0.1, 2)
            const direction = particle.position
              .clone()
              .sub(new THREE.Vector3(position[0], position[1] + 0.15, position[2]))
              .normalize()
            particle.velocity.add(direction.multiplyScalar(force))
            particle.velocity.y += force * 0.5
          }
        })

        if (impulse > 3) {
          const splitCount = Math.min(Math.floor(impulse / 2), 5)
          for (let i = 0; i < splitCount; i++) {
            if (riceParticlesRef.current.length < maxRiceParticles) {
              const angle = Math.random() * Math.PI * 2
              const radius = Math.random() * 0.3
              riceParticlesRef.current.push({
                position: new THREE.Vector3(
                  position[0] + Math.cos(angle) * radius,
                  position[1] + 0.2,
                  position[2] + Math.sin(angle) * radius
                ),
                velocity: new THREE.Vector3(
                  (Math.random() - 0.5) * impulse * 0.2,
                  Math.random() * impulse * 0.3,
                  (Math.random() - 0.5) * impulse * 0.2
                ),
                life: 1,
                size: 0.015 + Math.random() * 0.01,
                color: riceColors[Math.floor(Math.random() * riceColors.length)].clone(),
                isSplit: true
              })
            }
          }
        }
      }
    }

    riceParticlesRef.current = riceParticlesRef.current.filter((particle) => {
      particle.velocity.y -= 9.8 * delta
      particle.position.add(particle.velocity.clone().multiplyScalar(delta))
      particle.velocity.multiplyScalar(0.95)

      if (particle.position.y < position[1] + 0.1) {
        particle.position.y = position[1] + 0.1
        particle.velocity.y *= -0.3
        particle.velocity.x *= 0.8
        particle.velocity.z *= 0.8
      }

      const distFromCenter = Math.sqrt(
        Math.pow(particle.position.x - position[0], 2) +
          Math.pow(particle.position.z - position[2], 2)
      )
      if (distFromCenter > 0.8) {
        particle.velocity.x *= -0.5
        particle.velocity.z *= -0.5
      }

      return particle.life > 0
    })

    if (riceMeshRef.current) {
      riceParticlesRef.current.forEach((particle, i) => {
        if (i >= maxRiceParticles) return
        dummy.position.copy(particle.position)
        dummy.scale.setScalar(particle.size)
        dummy.updateMatrix()
        riceMeshRef.current!.setMatrixAt(i, dummy.matrix)
        riceMeshRef.current!.setColorAt(i, particle.color)
      })
      riceMeshRef.current.count = Math.min(riceParticlesRef.current.length, maxRiceParticles)
      riceMeshRef.current.instanceMatrix.needsUpdate = true
      if (riceMeshRef.current.instanceColor) {
        riceMeshRef.current.instanceColor.needsUpdate = true
      }
    }

    energyParticlesRef.current.forEach((particle) => {
      particle.t += particle.speed * delta * (rotationSpeed > 0 ? 1 : 0)
      if (particle.t > 1) particle.t = 0
    })

    if (energyMeshRef.current) {
      energyParticlesRef.current.forEach((particle, i) => {
        const point = energyCurve.getPoint(particle.t)
        energyDummy.position.copy(point)
        energyDummy.scale.setScalar(0.08 * (0.5 + Math.sin(particle.t * Math.PI) * 0.5))
        energyDummy.updateMatrix()
        energyMeshRef.current!.setMatrixAt(i, energyDummy.matrix)
      })
      energyMeshRef.current.count = energyParticleCount
      energyMeshRef.current.instanceMatrix.needsUpdate = true
    }
  })

  const gearGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    const outerRadius = 0.6
    const innerRadius = 0.4
    const toothHeight = 0.12
    const toothWidth = (Math.PI * 2) / gearTeeth / 2

    for (let i = 0; i < gearTeeth; i++) {
      const angle = (i / gearTeeth) * Math.PI * 2
      const nextAngle = ((i + 1) / gearTeeth) * Math.PI * 2

      if (i === 0) {
        shape.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius)
      }

      shape.lineTo(
        Math.cos(angle - toothWidth / 2) * outerRadius,
        Math.sin(angle - toothWidth / 2) * outerRadius
      )
      shape.lineTo(
        Math.cos(angle - toothWidth / 4) * (outerRadius + toothHeight),
        Math.sin(angle - toothWidth / 4) * (outerRadius + toothHeight)
      )
      shape.lineTo(
        Math.cos(angle + toothWidth / 4) * (outerRadius + toothHeight),
        Math.sin(angle + toothWidth / 4) * (outerRadius + toothHeight)
      )
      shape.lineTo(
        Math.cos(angle + toothWidth / 2) * outerRadius,
        Math.sin(angle + toothWidth / 2) * outerRadius
      )
      shape.lineTo(Math.cos(nextAngle) * innerRadius, Math.sin(nextAngle) * innerRadius)
    }

    shape.closePath()

    const holePath = new THREE.Path()
    holePath.absarc(0, 0, 0.15, 0, Math.PI * 2, true)
    shape.holes.push(holePath)

    const extrudeSettings = {
      depth: 0.15,
      bevelEnabled: false
    }

    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [gearTeeth])

  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 0.9, 0.3, 32]} />
        <meshStandardMaterial color="#708090" roughness={0.9} />
      </mesh>

      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.2, 32]} />
        <meshStandardMaterial color="#556b7a" roughness={0.95} />
      </mesh>

      <group ref={pestleGroupRef} position={[0, 1.2, 0]}>
        <mesh position={[0, -0.6, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 1.2, 8]} />
          <meshStandardMaterial color="#8b4513" roughness={0.8} />
        </mesh>
        <mesh position={[0, -1.3, 0]} castShadow>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#696969" roughness={0.7} metalness={0.2} />
        </mesh>
      </group>

      <group ref={gearRef} position={[0, 2.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh geometry={gearGeometry} castShadow>
          <meshStandardMaterial color="#b8860b" roughness={0.6} metalness={0.4} />
        </mesh>
      </group>

      <instancedMesh
        ref={riceMeshRef}
        args={[undefined, undefined, maxRiceParticles]}
        castShadow
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>

      <instancedMesh ref={energyMeshRef} args={[undefined, undefined, energyParticleCount]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0.8} />
      </instancedMesh>
    </group>
  )
}
