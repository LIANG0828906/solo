import * as THREE from 'three'
import type { Intersection } from 'three'

export function createRaycaster(): THREE.Raycaster {
  return new THREE.Raycaster()
}

export function updateRaycaster(
  raycaster: THREE.Raycaster,
  mouse: THREE.Vector2,
  camera: THREE.Camera
): void {
  raycaster.setFromCamera(mouse, camera)
}

export function intersectObjects(
  raycaster: THREE.Raycaster,
  objects: THREE.Object3D[],
  recursive: boolean = true
): Intersection[] {
  return raycaster.intersectObjects(objects, recursive)
}

export function getFirstIntersection(
  raycaster: THREE.Raycaster,
  objects: THREE.Object3D[],
  recursive: boolean = true
): Intersection | null {
  const intersections = intersectObjects(raycaster, objects, recursive)
  return intersections.length > 0 ? intersections[0] : null
}

export function computeMousePosition(
  event: PointerEvent,
  domElement: HTMLElement
): THREE.Vector2 {
  const rect = domElement.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  return new THREE.Vector2(x, y)
}
