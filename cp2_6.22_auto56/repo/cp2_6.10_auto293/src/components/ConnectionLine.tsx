import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Connection, StarNode } from '@/types'
import { getNodeById } from '@/utils/nodeUtils'

interface ConnectionLineProps {
  connection: Connection
  nodes: StarNode[]
  signalStrength: number
  mode: 'normal' | 'spectrum'
}

export const ConnectionLine = ({
  connection,
  nodes,
  signalStrength,
  mode
}: ConnectionLineProps) => {
  const lineRef = useRef<THREE.Line>(null)
  const glowLineRef = useRef<THREE.Line>(null)
  const particlesRef = useRef<THREE.Points>(null)

  const fromNode = getNodeById(nodes, connection.from)
  const toNode = getNodeById(nodes, connection.to)

  const { lineGeometry, particleGeometry } = useMemo(() => {
    if (!fromNode || !toNode) {
      return {
        lineGeometry: new THREE.BufferGeometry(),
        particleGeometry: new THREE.BufferGeometry()
      }
    }

    const start = new THREE.Vector3(...fromNode.position)
    const end = new THREE.Vector3(...toNode.position)
    const midPoint = start.clone().add(end).multiplyScalar(0.5)
    const distance = start.distanceTo(end)
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5
    )
    const controlPoint = midPoint.clone().add(offset).normalize().multiplyScalar(distance * 0.2).add(midPoint)

    const curve = new THREE.QuadraticBezierCurve3(start, controlPoint, end)
    const points = curve.getPoints(100)
    const positions = new Float32Array(points.length * 3)
    points.forEach((p, i) => {
      positions[i * 3] = p.x
      positions[i * 3 + 1] = p.y
      positions[i * 3 + 2] = p.z
    })

    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const particleCount = Math.floor(distance * 5)
    const particlePositions = new Float32Array(particleCount * 3)
    const particleOffsets = new Float32Array(particleCount)
    for (let i = 0; i < particleCount; i++) {
      particleOffsets[i] = Math.random()
      const t = (i + particleOffsets[i]) / particleCount
      const point = curve.getPoint(t)
      particlePositions[i * 3] = point.x
      particlePositions[i * 3 + 1] = point.y
      particlePositions[i * 3 + 2] = point.z
    }

    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    particleGeo.setAttribute('offset', new THREE.BufferAttribute(particleOffsets, 1))

    return { lineGeometry: lineGeo, particleGeometry: particleGeo }
  }, [fromNode, toNode])

  useFrame((state) => {
    const time = state.clock.elapsedTime
    const breathIntensity = 0.5 + 0.5 * Math.sin(time * 2 + connection.createdAt * 0.001)
    const strengthMultiplier = signalStrength / 100

    if (lineRef.current && lineRef.current.material instanceof THREE.LineBasicMaterial) {
      lineRef.current.material.opacity = (0.3 + 0.5 * breathIntensity) * strengthMultiplier
    }

    if (glowLineRef.current && glowLineRef.current.material instanceof THREE.LineBasicMaterial) {
      glowLineRef.current.material.opacity = (0.15 + 0.25 * breathIntensity) * strengthMultiplier
    }

    if (particlesRef.current && particlesRef.current.geometry && fromNode && toNode) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      const offsets = particlesRef.current.geometry.attributes.offset.array as Float32Array
      const start = new THREE.Vector3(...fromNode.position)
      const end = new THREE.Vector3(...toNode.position)
      const midPoint = start.clone().add(end).multiplyScalar(0.5)
      const distance = start.distanceTo(end)
      const controlPoint = midPoint.clone().add(new THREE.Vector3(0, 0.5, 0)).normalize().multiplyScalar(distance * 0.2).add(midPoint)
      const curve = new THREE.QuadraticBezierCurve3(start, controlPoint, end)

      for (let i = 0; i < offsets.length; i++) {
        let t = (offsets[i] + time * 0.1) % 1
        const point = curve.getPoint(t)
        positions[i * 3] = point.x
        positions[i * 3 + 1] = point.y
        positions[i * 3 + 2] = point.z
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  if (!fromNode || !toNode) return null

  const lineColor = mode === 'spectrum'
    ? new THREE.Color().setHSL((Date.now() * 0.0002) % 1, 1, 0.6)
    : new THREE.Color(connection.signalStrength > 50 ? '#00d4ff' : '#a855f7')

  return (
    <group>
      <line ref={glowLineRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color={lineColor}
          transparent
          opacity={0.4}
          linewidth={3}
        />
      </line>
      <line ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color={lineColor}
          transparent
          opacity={0.8}
          linewidth={2}
        />
      </line>
      <points ref={particlesRef} geometry={particleGeometry}>
        <pointsMaterial
          color={lineColor}
          size={0.08}
          transparent
          opacity={0.9}
          sizeAttenuation
        />
      </points>
    </group>
  )
}
