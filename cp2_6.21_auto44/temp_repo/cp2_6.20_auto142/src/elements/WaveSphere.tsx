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

export default function WaveSphere({ id, params, sensitivity, rotationSpeed, scale, theme }: Props) {
  const meshRef = useRef<THREE.Mesh>(null)
  const segments = Math.min(Math.round(params.segments || 32), 48)
  const waveAmplitude = params.waveAmplitude || 0.3
  const colors = THEME_COLORS[theme]

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1.5, segments, segments)
    return geo
  }, [segments])

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(colors[1]),
        emissive: new THREE.Color(colors[0]),
        emissiveIntensity: 0.3,
        roughness: 0.4,
        metalness: 0.1,
        wireframe: true,
        transparent: true,
        opacity: 0.8,
      }),
    [colors[0], colors[1]]
  )

  const basePositions = useMemo(() => {
    const posAttr = geometry.attributes.position as THREE.BufferAttribute
    return new Float32Array(posAttr.array)
  }, [geometry])

  useFrame((state) => {
    if (!meshRef.current) return
    const freqData = useStore.getState().frequencyData
    const timeData = useStore.getState().timeData

    let avgVolume = 0
    for (let i = 0; i < freqData.length; i++) {
      avgVolume += freqData[i]
    }
    avgVolume /= freqData.length
    const volumeNorm = avgVolume / 255

    const posAttr = meshRef.current.geometry.attributes.position as THREE.BufferAttribute
    const time = state.clock.elapsedTime

    for (let i = 0; i < posAttr.count; i++) {
      const bx = basePositions[i * 3]
      const by = basePositions[i * 3 + 1]
      const bz = basePositions[i * 3 + 2]
      const len = Math.sqrt(bx * bx + by * by + bz * bz)
      if (len === 0) continue
      const nx = bx / len
      const ny = by / len
      const nz = bz / len

      const freqIdx = Math.floor((i / posAttr.count) * timeData.length)
      const freqVal = (timeData[freqIdx] || 128) / 128 - 1
      const wave = Math.sin(nx * 3 + time * 2) * Math.sin(ny * 3 + time * 1.5) * waveAmplitude
      const displacement = wave + freqVal * 0.2 * sensitivity + volumeNorm * 0.3 * sensitivity

      posAttr.setXYZ(i, bx + nx * displacement, by + ny * displacement, bz + nz * displacement)
    }
    posAttr.needsUpdate = true
    meshRef.current.rotation.y += rotationSpeed * 0.01

    material.emissiveIntensity = 0.3 + volumeNorm * 0.4 * sensitivity
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation()
        useStore.getState().setSelectedId(id)
      }}
    />
  )
}
