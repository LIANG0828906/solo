import { useRef, useMemo, useEffect } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { HeatmapSample } from '../types'
import { heatmapColor, hexToRgb } from '../utils/colorUtils'

interface HeatmapProps {
  samples: HeatmapSample[][]
  gridSize: number
  visible: boolean
  onSampleClick?: (sample: HeatmapSample) => void
  maxSunlightHours?: number
}

export default function Heatmap({
  samples,
  gridSize,
  visible,
  onSampleClick,
  maxSunlightHours = 13,
}: HeatmapProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const borderMeshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const xCount = samples.length
  const zCount = samples[0]?.length || 0
  const instanceCount = xCount * zCount

  const cellSize = useMemo(() => {
    const resolution = Math.max(xCount, zCount)
    return gridSize / resolution
  }, [gridSize, xCount, zCount])

  const minSunlightHours = useMemo(() => {
    let min = Infinity
    for (let x = 0; x < xCount; x++) {
      for (let z = 0; z < zCount; z++) {
        min = Math.min(min, samples[x][z].sunlightHours)
      }
    }
    return min === Infinity ? 0 : min
  }, [samples, xCount, zCount])

  const { positions, colors, borderColors, sampleArray } = useMemo(() => {
    const positions: [number, number][] = []
    const colors: string[] = []
    const borderColors: string[] = []
    const sampleArray: HeatmapSample[] = []

    const halfGrid = gridSize / 2
    const halfCell = cellSize / 2

    for (let x = 0; x < xCount; x++) {
      for (let z = 0; z < zCount; z++) {
        const sample = samples[x][z]
        const px = -halfGrid + x * cellSize + halfCell
        const pz = -halfGrid + z * cellSize + halfCell

        positions.push([px, pz])

        const color = heatmapColor(sample.sunlightHours, minSunlightHours, maxSunlightHours)
        colors.push(color)

        const [r, g, b] = hexToRgb(color)
        const brighterR = Math.min(255, r * 1.3)
        const brighterG = Math.min(255, g * 1.3)
        const brighterB = Math.min(255, b * 1.3)
        const borderColor = `rgb(${Math.round(brighterR)}, ${Math.round(brighterG)}, ${Math.round(brighterB)})`
        borderColors.push(borderColor)

        sampleArray.push(sample)
      }
    }

    return { positions, colors, borderColors, sampleArray }
  }, [samples, xCount, zCount, gridSize, cellSize, minSunlightHours, maxSunlightHours])

  useEffect(() => {
    if (!meshRef.current || !visible) return

    const mesh = meshRef.current
    const gap = cellSize * 0.02
    const boxSize = cellSize - gap * 2

    for (let i = 0; i < instanceCount; i++) {
      const [px, pz] = positions[i]
      dummy.position.set(px, 0.02, pz)
      dummy.scale.set(boxSize, 1, boxSize)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      const color = new THREE.Color(colors[i])
      mesh.setColorAt(i, color)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true
    }
  }, [positions, colors, cellSize, instanceCount, visible, dummy])

  useEffect(() => {
    if (!borderMeshRef.current || !visible) return

    const borderMesh = borderMeshRef.current
    const gap = cellSize * 0.02
    const boxSize = cellSize - gap * 2
    const borderSize = boxSize * 0.05

    for (let i = 0; i < instanceCount; i++) {
      const [px, pz] = positions[i]
      dummy.position.set(px, 0.021, pz)
      dummy.scale.set(boxSize + borderSize, 1, boxSize + borderSize)
      dummy.updateMatrix()
      borderMesh.setMatrixAt(i, dummy.matrix)

      const color = new THREE.Color(borderColors[i])
      borderMesh.setColorAt(i, color)
    }

    borderMesh.instanceMatrix.needsUpdate = true
    if (borderMesh.instanceColor) {
      borderMesh.instanceColor.needsUpdate = true
    }
  }, [positions, borderColors, cellSize, instanceCount, visible, dummy])

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!onSampleClick || !meshRef.current) return

    event.stopPropagation()

    const intersection = event.intersections[0]
    if (intersection && intersection.instanceId !== undefined) {
      const index = intersection.instanceId
      if (index >= 0 && index < sampleArray.length) {
        onSampleClick(sampleArray[index])
      }
    }
  }

  if (!visible || instanceCount === 0) return null

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, instanceCount]}
        raycast={THREE.InstancedMesh.prototype.raycast}
        onClick={handleClick}
        receiveShadow
      >
        <boxGeometry args={[1, 0.04, 1]} />
        <meshStandardMaterial
          transparent
          opacity={0.7}
          emissiveIntensity={0.2}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      <instancedMesh
        ref={borderMeshRef}
        args={[undefined, undefined, instanceCount]}
        raycast={() => null}
      >
        <boxGeometry args={[1, 0.002, 1]} />
        <meshBasicMaterial
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </group>
  )
}
