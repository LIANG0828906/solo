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

  const safeLength = Math.max(length, 0.001)

  const geometry = new THREE.CylinderGeometry(radius, radius, safeLength, 12)

  const material = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.7,
    metalness: 0.2,
    transparent: false,
    opacity: 1,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.copy(midPoint)
  mesh.scale.set(1, 1, 1)

  const axis = new THREE.Vector3(0, 1, 0)
  const dirNormalized = new THREE.Vector3(0, 1, 0)

  if (safeLength > 0.0001) {
    dirNormalized.copy(direction).normalize()
  }

  const dot = axis.dot(dirNormalized)

  if (Math.abs(dot - (-1)) < 0.0001) {
    mesh.rotation.x = Math.PI
    console.log('[BondGeometry] Direction opposite to Y-axis, applied X rotation PI')
  } else if (Math.abs(dot - 1) < 0.0001) {
    mesh.quaternion.identity()
    console.log('[BondGeometry] Direction aligned with Y-axis, identity quaternion')
  } else {
    mesh.quaternion.setFromUnitVectors(axis, dirNormalized)
  }

  mesh.userData = {
    bondLength: safeLength,
    startPos: start.clone(),
    endPos: end.clone(),
    direction: dirNormalized.clone(),
    quaternion: mesh.quaternion.clone(),
  }

  mesh.visible = true
  mesh.matrixAutoUpdate = true

  console.log('[BondGeometry] Bond created:', {
    start: start.toArray().map((v) => v.toFixed(3)),
    end: end.toArray().map((v) => v.toFixed(3)),
    length: safeLength.toFixed(4),
    direction: dirNormalized.toArray().map((v) => v.toFixed(4)),
    midpoint: midPoint.toArray().map((v) => v.toFixed(3)),
    dotWithY: dot.toFixed(4),
    radius,
    position: mesh.position.toArray().map((v) => v.toFixed(3)),
    scale: mesh.scale.toArray(),
    quaternion: mesh.quaternion.toArray().map((v) => v.toFixed(4)),
  })

  return mesh
}
