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

export default function BeatBars({ id, params, sensitivity, rotationSpeed, scale, theme }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const barCount = Math.min(Math.round(params.barCount || 32), 64)
  const spacing = params.spacing || 0.3
  const colors = THEME_COLORS[theme]

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colorArray = useMemo(() => {
    const arr = new Float32Array(barCount * 3)
    for (let i = 0; i < barCount; i++) {
      const t = i / barCount
      const c = new THREE.Color().lerpColors(
        new THREE.Color(colors[0]),
        new THREE.Color(colors[2]),
        t
      )
      arr[i * 3] = c.r
      arr[i * 3 + 1] = c.g
      arr[i * 3 + 2] = c.b
    }
    return arr
  }, [barCount, colors[0], colors[2]])

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        roughness: 0.4,
        emissive: new THREE.Color(colors[0]),
        emissiveIntensity: 0.3,
        metalness: 0.1,
        vertexColors: true,
      }),
    [colors[0]]
  )

  useFrame(() => {
    if (!meshRef.current) return
    const freqData = useStore.getState().frequencyData
    const selectedId = useStore.getState().selectedId
    const isSelected = selectedId === id

    const lowFreqEnd = Math.floor(freqData.length * 0.3)
    for (let i = 0; i < barCount; i++) {
      const freqIdx = Math.floor((i / barCount) * lowFreqEnd)
      const value = (freqData[freqIdx] || 0) / 255
      const height = 0.5 + value * 1.5 * sensitivity
      const x = (i - barCount / 2) * spacing
      dummy.position.set(x, height / 2, 0)
      dummy.scale.set(spacing * 0.8, height, spacing * 0.8)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    meshRef.current.rotation.y += rotationSpeed * 0.01

    if (isSelected) {
      material.emissiveIntensity = 0.5
    } else {
      material.emissiveIntensity = 0.3
    }
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, barCount]}
      material={material}
      onClick={(e) => {
        e.stopPropagation()
        useStore.getState().setSelectedId(id)
      }}
      scale={scale}
    >
      <boxGeometry args={[1, 1, 1]}>
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colorArray, 3]}
        />
      </boxGeometry>
    </instancedMesh>
  )
}
