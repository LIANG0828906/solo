import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface OrbitLineProps {
  radius: number
  visible: boolean
}

export function OrbitLine({ radius, visible }: OrbitLineProps) {
  const lineRef = useRef<THREE.Line>(null)

  useFrame(() => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial
      const targetOpacity = visible ? 0.3 : 0
      material.opacity += (targetOpacity - material.opacity) * 0.1
    }
  })

  const points: THREE.Vector3[] = []
  const segments = 128
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2
    points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius))
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points)

  return (
    <primitive object={new THREE.Line(geometry)} ref={lineRef}>
      <lineBasicMaterial
        color="#4A4A6E"
        transparent
        opacity={visible ? 0.3 : 0}
      />
    </primitive>
  )
}
