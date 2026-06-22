import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { lerpColor } from '@/utils/colorUtils'

interface WaveformSurfaceProps {
  spectrumFrame: number[]
  colorStart: string
  colorEnd: string
  wireframe?: boolean
}

const SEGMENTS = 32

export default function WaveformSurface({
  spectrumFrame,
  colorStart,
  colorEnd,
  wireframe = false,
}: WaveformSurfaceProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const geometryRef = useRef<THREE.PlaneGeometry>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)

  const basePositions = useMemo(() => {
    const geo = new THREE.PlaneGeometry(20, 20, SEGMENTS, SEGMENTS)
    const positions = new Float32Array(geo.attributes.position.array)
    geo.dispose()
    return positions
  }, [])

  useFrame((state) => {
    if (!meshRef.current || !geometryRef.current) return

    const positions = geometryRef.current.attributes.position.array as Float32Array
    const colors = new Float32Array(positions.length)
    const time = state.clock.elapsedTime

    const vertexCount = (SEGMENTS + 1) * (SEGMENTS + 1)

    for (let i = 0; i < vertexCount; i++) {
      const i3 = i * 3

      const x = basePositions[i3]
      const y = basePositions[i3 + 1]

      const distFromCenter = Math.sqrt(x * x + y * y) / 10

      const spectrumIndex = Math.floor(distFromCenter * (spectrumFrame.length - 1))
      const spectrumValue = spectrumFrame[Math.max(0, Math.min(spectrumFrame.length - 1, spectrumIndex))] || 0

      const ripple = Math.sin(distFromCenter * 6 - time * 2) * 0.5 + 0.5

      const height = (spectrumValue / 255) * 3 * ripple + Math.sin(distFromCenter * 4 - time * 1.5) * 0.3

      positions[i3 + 2] = height

      const colorT = Math.min(1, distFromCenter + spectrumValue / 510)
      const colorHex = lerpColor(colorStart, colorEnd, colorT)
      const color = new THREE.Color(colorHex)
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
    }

    geometryRef.current.attributes.position.needsUpdate = true
    geometryRef.current.computeVertexNormals()

    if (geometryRef.current.attributes.color) {
      const colorAttr = geometryRef.current.attributes.color.array as Float32Array
      colorAttr.set(colors)
      geometryRef.current.attributes.color.needsUpdate = true
    } else {
      geometryRef.current.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    }
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry ref={geometryRef} args={[20, 20, SEGMENTS, SEGMENTS]} />
      <meshStandardMaterial
        ref={materialRef}
        vertexColors
        transparent
        opacity={0.8}
        side={THREE.DoubleSide}
        wireframe={wireframe}
        metalness={0.3}
        roughness={0.5}
      />
    </mesh>
  )
}
