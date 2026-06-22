import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getBassLevel, getMidLevel, getHighLevel } from '@/utils/audioUtils'
import { lerpColor } from '@/utils/colorUtils'

interface ParticleSystemProps {
  count: number
  spectrumFrame: number[]
  colorStart: string
  colorEnd: string
  size: number
  rotationSpeed: number
  clusteringAmount: number
}

export default function ParticleSystem({
  count,
  spectrumFrame,
  colorStart,
  colorEnd,
  size,
  rotationSpeed,
  clusteringAmount,
}: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const geometryRef = useRef<THREE.BufferGeometry>(null)

  const { positions, basePositions, frequencies } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const basePositions = new Float32Array(count * 3)
    const frequencies = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const radius = 10 * Math.cbrt(Math.random())
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)

      positions[i3] = x
      positions[i3 + 1] = y
      positions[i3 + 2] = z

      basePositions[i3] = x
      basePositions[i3 + 1] = y
      basePositions[i3 + 2] = z

      frequencies[i] = Math.random() * 127
    }

    return { positions, basePositions, frequencies }
  }, [count])

  useEffect(() => {
    if (!geometryRef.current) return
    geometryRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometryRef.current.attributes.position.needsUpdate = true
  }, [positions])

  useFrame((state, delta) => {
    if (!pointsRef.current || !geometryRef.current) return

    const positions = geometryRef.current.attributes.position.array as Float32Array
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    const bass = getBassLevel(spectrumFrame)
    const mid = getMidLevel(spectrumFrame)
    const high = getHighLevel(spectrumFrame)
    const avgLevel = (bass + mid + high) / 3

    const time = state.clock.elapsedTime

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      const freqIndex = Math.floor(frequencies[i])
      const freqEnergy = spectrumFrame[freqIndex] || 0

      const bassOffset = bass * 2
      const midOffset = mid * 1.5
      const highOffset = high * 1

      const clusterFactor = 1 - clusteringAmount * (1 - freqEnergy / 255)

      const bx = basePositions[i3] * clusterFactor
      const by = basePositions[i3 + 1] * clusterFactor
      const bz = basePositions[i3 + 2] * clusterFactor

      positions[i3] = bx + Math.sin(time * 0.5 + i * 0.1) * bassOffset
      positions[i3 + 1] = by + Math.cos(time * 0.4 + i * 0.15) * midOffset
      positions[i3 + 2] = bz + Math.sin(time * 0.6 + i * 0.2) * highOffset

      const colorT = Math.min(1, freqEnergy / 255)
      const colorHex = lerpColor(colorStart, colorEnd, colorT)
      const color = new THREE.Color(colorHex)
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b

      sizes[i] = size * (0.5 + avgLevel / 255) * (0.8 + freqEnergy / 255 * 0.4)
    }

    geometryRef.current.attributes.position.needsUpdate = true

    if (geometryRef.current.attributes.color) {
      const colorAttr = geometryRef.current.attributes.color.array as Float32Array
      colorAttr.set(colors)
      geometryRef.current.attributes.color.needsUpdate = true
    } else {
      geometryRef.current.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    }

    if (geometryRef.current.attributes.size) {
      const sizeAttr = geometryRef.current.attributes.size.array as Float32Array
      sizeAttr.set(sizes)
      geometryRef.current.attributes.size.needsUpdate = true
    } else {
      geometryRef.current.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    }

    pointsRef.current.rotation.y += delta * rotationSpeed
    pointsRef.current.rotation.x += delta * rotationSpeed * 0.3
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef} />
      <pointsMaterial
        size={size}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}
