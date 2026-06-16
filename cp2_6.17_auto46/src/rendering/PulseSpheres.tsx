import { useEffect, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useFireflyStore, type Pulse } from '../store/fireflyStore'

const PULSE_COLOR = new THREE.Color('#00FFAA')
const MAX_PULSES = 20

const _geo = new THREE.SphereGeometry(1, 24, 16)
const _mat = new THREE.MeshBasicMaterial({
  color: PULSE_COLOR,
  transparent: true,
  opacity: 0.6,
  depthWrite: false,
  side: THREE.DoubleSide
})

export default function PulseSpheres() {
  const pulses = useFireflyStore((s) => s.pulses)
  const groupRef = useRef<THREE.Group>(null)
  const meshPool = useRef<THREE.Mesh[]>([])
  const activeCount = useRef(0)

  useEffect(() => {
    if (!groupRef.current) return
    const group = groupRef.current
    while (meshPool.current.length < MAX_PULSES) {
      const mesh = new THREE.Mesh(_geo, _mat.clone())
      mesh.visible = false
      group.add(mesh)
      meshPool.current.push(mesh)
    }
    return () => {
      for (const mesh of meshPool.current) {
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose()
        }
        group.remove(mesh)
      }
      meshPool.current = []
    }
  }, [])

  useFrame(() => {
    const pool = meshPool.current
    const active = Math.min(pulses.length, MAX_PULSES)
    activeCount.current = active

    for (let i = 0; i < active; i++) {
      const pulse = pulses[i]
      const mesh = pool[i]
      if (!mesh) continue
      mesh.visible = true
      mesh.position.copy(pulse.center)
      mesh.scale.setScalar(pulse.radius)
      if (mesh.material instanceof THREE.MeshBasicMaterial) {
        mesh.material.opacity = pulse.opacity
      }
    }

    for (let i = active; i < pool.length; i++) {
      pool[i].visible = false
    }
  })

  return <group ref={groupRef} />
}
