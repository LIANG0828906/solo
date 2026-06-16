import * as THREE from 'three'

export function createBondMesh(
  startPos: { x: number; y: number; z: number },
  endPos: { x: number; y: number; z: number },
  radius: number = 0.1
): THREE.Mesh {
  const start = new THREE.Vector3(startPos.x, startPos.y, startPos.z)
  const end = new THREE.Vector3(endPos.x, endPos.y, endPos.z)
  const direction = new THREE.Vector3().subVectors(end, start)
  const length = direction.length()
  const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)

  const geometry = new THREE.CylinderGeometry(radius, radius, length, 12)

  const material = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.7,
    metalness: 0.2,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.copy(midPoint)

  const axis = new THREE.Vector3(0, 1, 0)
  const dirNormalized = direction.clone().normalize()
  mesh.quaternion.setFromUnitVectors(axis, dirNormalized)

  mesh.userData = {
    bondLength: length,
    startPos: start.clone(),
    endPos: end.clone(),
  }

  return mesh
}
