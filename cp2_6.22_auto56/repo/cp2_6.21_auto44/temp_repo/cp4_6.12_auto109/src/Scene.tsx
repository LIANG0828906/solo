import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface SceneProps {
  temperature: number
  ionization: number
  viewAngle: number
}

const PARTICLE_COUNT = 5000

export default function Scene({ temperature, ionization, viewAngle }: SceneProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const { camera } = useThree()
  const glowLightsRef = useRef<THREE.PointLight[]>([])
  const glowLightTargetsRef = useRef<number[]>([])

  const { positions, sizes, baseColors, distances } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)
    const baseColors = new Float32Array(PARTICLE_COUNT * 3)
    const distances = new Float32Array(PARTICLE_COUNT)

    const innerColor = new THREE.Color('#66b3ff')
    const midColor = new THREE.Color('#ff6666')
    const outerColor = new THREE.Color('#9933ff')
    const zScale = 0.7

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3

      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = Math.cbrt(Math.random()) * 5

      positions[i3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = r * Math.cos(phi) * zScale

      const dist = Math.sqrt(
        positions[i3] ** 2 +
        positions[i3 + 1] ** 2 +
        (positions[i3 + 2] / zScale) ** 2
      )
      distances[i] = dist / 5

      sizes[i] = 0.1 + Math.random() * 0.2

      const t = distances[i]
      let color: THREE.Color
      if (t < 0.5) {
        color = innerColor.clone().lerp(midColor, t * 2)
      } else {
        color = midColor.clone().lerp(outerColor, (t - 0.5) * 2)
      }
      baseColors[i3] = color.r
      baseColors[i3 + 1] = color.g
      baseColors[i3 + 2] = color.b
    }

    return { positions, sizes, baseColors, distances }
  }, [])

  const flickerData = useMemo(() => {
    const frequencies = new Float32Array(PARTICLE_COUNT)
    const phases = new Float32Array(PARTICLE_COUNT)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      frequencies[i] = 0.5 + Math.random() * 1.5
      phases[i] = Math.random() * Math.PI * 2
    }
    return { frequencies, phases }
  }, [])

  const glowingIndicesRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    const glowCount = Math.floor((ionization / 100) * PARTICLE_COUNT)
    const newGlowing = new Set<number>()
    const indices = Array.from({ length: PARTICLE_COUNT }, (_, i) => i)

    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }

    for (let i = 0; i < glowCount; i++) {
      newGlowing.add(indices[i])
    }

    glowingIndicesRef.current = newGlowing
  }, [ionization])

  useEffect(() => {
    const lights: THREE.PointLight[] = []
    const targets: number[] = []
    const maxLights = Math.min(50, Math.floor((ionization / 100) * PARTICLE_COUNT))

    for (let i = 0; i < maxLights; i++) {
      const light = new THREE.PointLight(0xffffff, 0.3, 3)
      light.visible = false
      lights.push(light)
      targets.push(-1)
    }

    glowLightsRef.current = lights
    glowLightTargetsRef.current = targets

    return () => {
      lights.forEach(light => light.dispose())
    }
  }, [ionization])

  useFrame((state) => {
    if (!pointsRef.current) return

    const colors = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute
    const colorArray = colors.array as Float32Array

    const tempNormalized = (temperature - 2000) / 8000
    const hotColor = new THREE.Color(200 / 255, 230 / 255, 255 / 255)
    const coldColor = new THREE.Color(255 / 255, 100 / 255, 50 / 255)
    const tempColor = coldColor.clone().lerp(hotColor, tempNormalized)

    const time = state.clock.elapsedTime

    const glowingSet = glowingIndicesRef.current
    const lights = glowLightsRef.current
    const lightTargets = glowLightTargetsRef.current

    const activeLightCount = Math.min(lights.length, glowingSet.size)
    const glowingArray = Array.from(glowingSet).slice(0, activeLightCount)

    for (let i = 0; i < activeLightCount; i++) {
      lightTargets[i] = glowingArray[i]
    }
    for (let i = activeLightCount; i < lights.length; i++) {
      lights[i].visible = false
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3

      const baseR = baseColors[i3]
      const baseG = baseColors[i3 + 1]
      const baseB = baseColors[i3 + 2]

      const baseColor = new THREE.Color(baseR, baseG, baseB)
      const finalColor = baseColor.clone().lerp(tempColor, Math.abs(tempNormalized - 0.5) * 0.6)

      let brightness = 1.0
      if (glowingSet.has(i)) {
        const flicker = 0.85 + 0.15 * Math.sin(time * flickerData.frequencies[i] * Math.PI * 2 + flickerData.phases[i])
        brightness = 1.5 * flicker
      }

      colorArray[i3] = finalColor.r * brightness
      colorArray[i3 + 1] = finalColor.g * brightness
      colorArray[i3 + 2] = finalColor.b * brightness
    }

    colors.needsUpdate = true

    const positionsArray = pointsRef.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < activeLightCount; i++) {
      const idx = lightTargets[i]
      const light = lights[i]
      if (idx >= 0 && light) {
        const i3 = idx * 3
        light.position.set(
          positionsArray[i3],
          positionsArray[i3 + 1],
          positionsArray[i3 + 2]
        )
        light.color.setRGB(
          colorArray[i3],
          colorArray[i3 + 1],
          colorArray[i3 + 2]
        )
        light.intensity = 0.3
        light.distance = 3
        light.visible = true
      }
    }

    const angleRad = (viewAngle * Math.PI) / 180
    const radius = 10
    camera.position.x = Math.sin(angleRad) * radius
    camera.position.z = Math.cos(angleRad) * radius
    camera.lookAt(0, 0, 0)
  })

  const ringGeometry = useMemo(() => {
    const geometry = new THREE.RingGeometry(5.9, 6.1, 128)
    const pos = geometry.attributes.position
    const v3 = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i)
      v3.z = 0
      pos.setXYZ(i, v3.x, v3.y, v3.z)
    }
    return geometry
  }, [])

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={PARTICLE_COUNT}
            array={baseColors.slice()}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={PARTICLE_COUNT}
            array={sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.2}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <mesh geometry={ringGeometry} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#888888" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {glowLightsRef.current.map((light, i) => (
        <primitive key={i} object={light} />
      ))}
    </group>
  )
}
