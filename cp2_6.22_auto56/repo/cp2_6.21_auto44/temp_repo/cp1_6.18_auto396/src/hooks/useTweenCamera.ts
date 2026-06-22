import { useThree } from '@react-three/fiber'
import { useCallback } from 'react'
import * as THREE from 'three'

export function useTweenCamera() {
  const { camera, controls } = useThree()

  const tweenTo = useCallback(
    (targetPosition: [number, number, number], lookAt: [number, number, number], duration: number = 1000) => {
      const startPos = camera.position.clone()
      const endPos = new THREE.Vector3(...targetPosition)
      const startLook = new THREE.Vector3()
      if (controls && 'target' in controls) {
        startLook.copy((controls as any).target)
      }
      const endLook = new THREE.Vector3(...lookAt)

      const startTime = performance.now()

      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

      const animate = () => {
        const elapsed = performance.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = easeOut(progress)

        camera.position.lerpVectors(startPos, endPos, eased)

        if (controls && 'target' in controls) {
          const controlTarget = (controls as any).target as THREE.Vector3
          controlTarget.lerpVectors(startLook, endLook, eased)
        }

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      animate()
    },
    [camera, controls]
  )

  return { tweenTo }
}
