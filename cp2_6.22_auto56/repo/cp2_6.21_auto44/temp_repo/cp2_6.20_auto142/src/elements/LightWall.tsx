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

export default function LightWall({ id, params, sensitivity, rotationSpeed, scale, theme }: Props) {
  const meshRef = useRef<THREE.Mesh>(null)
  const width = params.width || 6
  const height = params.height || 4
  const flickerRate = params.flickerRate || 2.0
  const colors = THEME_COLORS[theme]

  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(width, height, Math.min(Math.round(width * 4), 32), Math.min(Math.round(height * 4), 24))
  }, [width, height])

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(colors[0]),
        emissive: new THREE.Color(colors[1]),
        emissiveIntensity: 0.3,
        roughness: 0.4,
        metalness: 0.1,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      }),
    [colors[0], colors[1]]
  )

  useFrame((state) => {
    if (!meshRef.current) return
    const freqData = useStore.getState().frequencyData
    const time = state.clock.elapsedTime

    let bassAvg = 0
    const bassEnd = Math.floor(freqData.length * 0.15)
    for (let i = 0; i < bassEnd; i++) {
      bassAvg += freqData[i]
    }
    bassAvg /= bassEnd
    const beatIntensity = bassAvg / 255

    const t = (Math.sin(time * flickerRate) + 1) / 2
    const col = new THREE.Color().lerpColors(
      new THREE.Color(colors[0]),
      new THREE.Color(colors[2]),
      t
    )
    const emissiveCol = new THREE.Color().lerpColors(
      new THREE.Color(colors[1]),
      new THREE.Color(colors[0]),
      beatIntensity * sensitivity
    )

    material.color.copy(col)
    material.emissive.copy(emissiveCol)
    material.emissiveIntensity = 0.3 + beatIntensity * 0.7 * sensitivity
    material.opacity = 0.5 + beatIntensity * 0.4 * sensitivity

    meshRef.current.rotation.y += rotationSpeed * 0.01
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
