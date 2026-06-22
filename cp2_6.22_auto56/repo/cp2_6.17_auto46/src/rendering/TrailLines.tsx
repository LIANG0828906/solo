import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useFireflyStore } from '../store/fireflyStore'

const FIREFLY_COUNT = 120
const MAX_TRAIL_LEN = 30
const MAX_SEGMENTS_PER_FIREFLY = MAX_TRAIL_LEN - 1
const MAX_TOTAL_SEGMENTS = FIREFLY_COUNT * MAX_SEGMENTS_PER_FIREFLY

const TRAIL_START = new THREE.Color('#6C5CE7')
const TRAIL_END = new THREE.Color('#FDCB6E')

export default function TrailLines() {
  const linesRef = useRef<THREE.LineSegments>(null)
  const fireflies = useFireflyStore((s) => s.fireflies)
  const visible = useFireflyStore((s) => s.trailsVisible)

  const { positions, colors, segmentCountRef } = useMemo(() => {
    const positions = new Float32Array(MAX_TOTAL_SEGMENTS * 6)
    const colors = new Float32Array(MAX_TOTAL_SEGMENTS * 6)
    const segmentCountRef = { current: 0 }
    return { positions, colors, segmentCountRef }
  }, [])

  useFrame(() => {
    if (!linesRef.current) return
    const geo = linesRef.current.geometry
    const posAttr = geo.attributes.position as THREE.BufferAttribute
    const colAttr = geo.attributes.color as THREE.BufferAttribute

    let segIdx = 0
    const list = fireflies

    for (let i = 0; i < list.length; i++) {
      const f = list[i]
      const trail = f.trail
      const segments = trail.length - 1

      if (segments <= 0) continue

      const fatigue = f.fatigue

      for (let s = 0; s < segments; s++) {
        if (segIdx >= MAX_TOTAL_SEGMENTS) break

        const p1 = trail[s]
        const p2 = trail[s + 1]

        const p = segIdx * 6
        posAttr.array[p] = p1.x
        posAttr.array[p + 1] = p1.y
        posAttr.array[p + 2] = p1.z
        posAttr.array[p + 3] = p2.x
        posAttr.array[p + 4] = p2.y
        posAttr.array[p + 5] = p2.z

        const t1 = s / Math.max(1, segments)
        const t2 = (s + 1) / Math.max(1, segments)
        const fade1 = 1 - t1 * 0.7
        const fade2 = 1 - t2 * 0.7

        const ageT = s / MAX_TRAIL_LEN

        const c1 = new THREE.Color().lerpColors(TRAIL_START, TRAIL_END, ageT * 0.5 + fatigue * 0.3)
        const c2 = new THREE.Color().lerpColors(TRAIL_START, TRAIL_END, (s + 1) / MAX_TRAIL_LEN * 0.5 + fatigue * 0.3)

        const c = segIdx * 6
        colAttr.array[c] = c1.r * fade1
        colAttr.array[c + 1] = c1.g * fade1
        colAttr.array[c + 2] = c1.b * fade1
        colAttr.array[c + 3] = c2.r * fade2
        colAttr.array[c + 4] = c2.g * fade2
        colAttr.array[c + 5] = c2.b * fade2

        segIdx++
      }
    }

    segmentCountRef.current = segIdx
    geo.setDrawRange(0, segIdx * 2)

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
  })

  return (
    <lineSegments ref={linesRef} visible={visible}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={MAX_TOTAL_SEGMENTS * 2}
          array={positions}
          itemSize={3}
          usage={THREE.DynamicDrawUsage}
        />
        <bufferAttribute
          attach="attributes-color"
          count={MAX_TOTAL_SEGMENTS * 2}
          array={colors}
          itemSize={3}
          usage={THREE.DynamicDrawUsage}
        />
      </bufferGeometry>
      <lineBasicMaterial
        transparent
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.85}
      />
    </lineSegments>
  )
}
