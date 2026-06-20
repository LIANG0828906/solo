import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useClimateStore } from '@/store/useClimateStore'
import type { OrbitControls } from 'three-stdlib'
import * as THREE from 'three'

type ViewPreset = 'global' | 'northPole' | 'equator'

interface PresetPosition {
  position: [number, number, number]
  target: [number, number, number]
}

const PRESET_POSITIONS: Record<ViewPreset, PresetPosition> = {
  global: {
    position: [0, 0, 4.5],
    target: [0, 0, 0],
  },
  northPole: {
    position: [0, 4, 0.8],
    target: [0, 0, 0],
  },
  equator: {
    position: [4.5, 0, 0.5],
    target: [0, 0, 0],
  },
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function useViewPreset(controlsRef: React.RefObject<OrbitControls>) {
  const { camera } = useThree()
  const viewPreset = useClimateStore((state) => state.viewPreset)

  const animatingRef = useRef(false)
  const progressRef = useRef(0)
  const startPosRef = useRef(new THREE.Vector3())
  const endPosRef = useRef(new THREE.Vector3())
  const startTargetRef = useRef(new THREE.Vector3())
  const endTargetRef = useRef(new THREE.Vector3())
  const lastPresetRef = useRef<ViewPreset>(viewPreset)

  useEffect(() => {
    if (lastPresetRef.current === viewPreset) return

    const preset = PRESET_POSITIONS[viewPreset]
    if (!preset) return

    startPosRef.current.copy(camera.position)
    endPosRef.current.set(...preset.position)

    if (controlsRef.current) {
      startTargetRef.current.copy(controlsRef.current.target)
    }
    endTargetRef.current.set(...preset.target)

    progressRef.current = 0
    animatingRef.current = true
    lastPresetRef.current = viewPreset
  }, [viewPreset, camera, controlsRef])

  useFrame((_state, delta) => {
    if (!animatingRef.current) return

    const duration = 1.5
    progressRef.current += delta / duration

    if (progressRef.current >= 1) {
      progressRef.current = 1
      animatingRef.current = false
    }

    const t = easeInOutCubic(progressRef.current)

    camera.position.lerpVectors(startPosRef.current, endPosRef.current, t)
    camera.lookAt(startTargetRef.current.clone().lerp(endTargetRef.current, t))

    if (controlsRef.current) {
      controlsRef.current.target.lerpVectors(startTargetRef.current, endTargetRef.current, t)
      controlsRef.current.update()
    }
  })
}
