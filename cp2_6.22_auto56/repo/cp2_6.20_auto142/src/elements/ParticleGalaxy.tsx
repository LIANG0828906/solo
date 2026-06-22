import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'
import { THEME_COLORS, ThemeType } from '../types'

interface Props {
  id: string
  params: Record<string, number>
  sensitivity: number
  rotationSpeed: number
  scale: number
  theme: ThemeType
}

export default function ParticleGalaxy({ id, params, sensitivity, rotationSpeed, scale, theme }: Props) {
  const pointsRef = useRef<THREE.Points>(null)
  const particleCount = Math.min(Math.round(params.particleCount || 2000), 3000)
  const galaxyRadius = params.galaxyRadius || 3
  const colors = THEME_COLORS[theme]

  const { positions, basePositions, colorAttr } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const base = new Float32Array(particleCount * 3)
    const col = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * galaxyRadius
      const armOffset = Math.floor(Math.random() * 3) * (Math.PI * 2 / 3)
      const spread = (Math.random() - 0.5) * 0.5
      const x = Math.cos(angle + armOffset) * radius + spread
      const y = (Math.random() - 0.5) * 0.3
      const z = Math.sin(angle + armOffset) * radius + spread
      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z
      base[i * 3] = x
      base[i * 3 + 1] = y
      base[i * 3 + 2] = z
      const t = radius / galaxyRadius
      const c = new THREE.Color().lerpColors(
        new THREE.Color(colors[0]),
        new THREE.Color(colors[1]),
        t
      )
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return { positions: pos, basePositions: base, colorAttr: col }
  }, [particleCount, galaxyRadius, colors[0], colors[1]])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const freqData = useStore.getState().frequencyData
    const midHighStart = Math.floor(freqData.length * 0.3)
    const midHighEnd = freqData.length
    let midHighAvg = 0
    for (let i = midHighStart; i < midHighEnd; i++) {
      midHighAvg += freqData[i]
    }
    midHighAvg /= (midHighEnd - midHighStart)
    const intensity = midHighAvg / 255

    const geom = pointsRef.current.geometry
    const posAttr = geom.attributes.position as THREE.BufferAttribute
    const colAttr = geom.attributes.color as THREE.BufferAttribute

    for (let i = 0; i < particleCount; i++) {
      const t = Math.sqrt(basePositions[i * 3] ** 2 + basePositions[i * 3 + 2] ** 2) / galaxyRadius
      const brightness = 0.5 + intensity * 0.5 * sensitivity
      colAttr.setXYZ(i, 
        (1 - t) * 0.3 + t * brightness,
        t * brightness * 0.8,
        brightness * 0.6
      )
    }
    colAttr.needsUpdate = true

    const speed = rotationSpeed * (0.5 + intensity * 2 * sensitivity)
    pointsRef.current.rotation.y += speed * delta
  })

  return (
    <points
      ref={pointsRef}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation()
        useStore.getState().setSelectedId(id)
      }}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colorAttr, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
