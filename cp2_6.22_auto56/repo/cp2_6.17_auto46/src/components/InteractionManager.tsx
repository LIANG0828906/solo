import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFireflyStore } from '../store/fireflyStore'

export default function InteractionManager() {
  const { camera, gl } = useThree()
  const addPulse = useFireflyStore((s) => s.addPulse)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const dom = gl.domElement

    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = false
      dragStartRef.current = { x: e.clientX, y: e.clientY }
    }

    const onPointerMove = (e: PointerEvent) => {
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        isDraggingRef.current = true
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      if (isDraggingRef.current) return

      const rect = dom.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      const ndc = new THREE.Vector3(x, y, 0.5)
      ndc.unproject(camera)

      const dir = new THREE.Vector3().subVectors(ndc, camera.position).normalize()

      const planeNormal = new THREE.Vector3(0, 0, 1)
      const planePoint = new THREE.Vector3(0, 0, 0)
      const plane = new THREE.Plane(planeNormal, -planePoint.dot(planeNormal))

      const intersection = new THREE.Vector3()
      const raycaster = new THREE.Raycaster(camera.position, dir)
      const hit = raycaster.ray.intersectPlane(plane, intersection)

      if (hit) {
        addPulse(intersection)
      } else {
        const defaultPos = camera.position.clone().addScaledVector(dir, 25)
        addPulse(defaultPos)
      }
    }

    dom.addEventListener('pointerdown', onPointerDown)
    dom.addEventListener('pointermove', onPointerMove)
    dom.addEventListener('pointerup', onPointerUp)

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown)
      dom.removeEventListener('pointermove', onPointerMove)
      dom.removeEventListener('pointerup', onPointerUp)
    }
  }, [camera, gl, addPulse])

  return null
}
