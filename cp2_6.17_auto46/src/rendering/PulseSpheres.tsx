import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useFireflyStore } from '../store/fireflyStore'

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
  const removePulse = useFireflyStore((s) => s.removePulse)
  const groupRef = useRef<THREE.Group>(null)
  const meshPool = useRef<THREE.Mesh[]>([])

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

    const expiredIds: number[] = []

    for (let i = 0; i < active; i++) {
      const pulse = pulses[i]
      const mesh = pool[i]
      if (!mesh) continue

      if (pulse.life <= 0 || pulse.radius >= 16) {
        expiredIds.push(pulse.id)
        mesh.visible = false
        continue
      }

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

    if (expiredIds.length > 0) {
      for (const id of expiredIds) {
        removePulse(id)
      }
    }
  })

  return <group ref={groupRef} />
}
