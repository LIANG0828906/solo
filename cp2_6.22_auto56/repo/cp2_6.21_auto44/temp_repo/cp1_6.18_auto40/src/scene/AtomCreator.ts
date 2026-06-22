import * as THREE from 'three'
import { AtomType, ATOM_CONFIG } from '../store/moleculeStore'

export interface CreatedAtom {
  mesh: THREE.Mesh
  glow: THREE.Mesh
  ghost?: THREE.Mesh
  group: THREE.Group
}

export interface CreatedBond {
  group: THREE.Group
  cylinders: THREE.Mesh[]
}

export class AtomCreator {
  private highDetailSegments = 32
  private lowDetailSegments = 16
  private bondHighDetail = 24
  private bondLowDetail = 12
  private useHighDetail = true

  setDetailLevel(useHigh: boolean) {
    this.useHighDetail = useHigh
  }

  getAtomRadius(type: AtomType): number {
    return ATOM_CONFIG[type].radius / 100
  }

  getAtomColor(type: AtomType): THREE.Color {
    return new THREE.Color(ATOM_CONFIG[type].color)
  }

  createAtom(type: AtomType, isGhost = false): CreatedAtom {
    const group = new THREE.Group()
    const radius = this.getAtomRadius(type)
    const color = this.getAtomColor(type)
    const segments = this.useHighDetail ? this.highDetailSegments : this.lowDetailSegments

    const geometry = new THREE.SphereGeometry(radius, segments, segments)
    
    let material: THREE.MeshStandardMaterial
    if (type === 'carbon') {
      material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.8,
        roughness: 0.2
      })
    } else if (type === 'hydrogen') {
      material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.1,
        roughness: 0.9
      })
    } else {
      material = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.7,
        metalness: 0.3,
        roughness: 0.4
      })
    }

    if (isGhost) {
      material = material.clone()
      material.transparent = true
      material.opacity = 0.2
    }

    const mesh = new THREE.Mesh(geometry, material)
    mesh.userData = { type, isAtom: true }
    group.add(mesh)

    const glowGeometry = new THREE.SphereGeometry(radius * 1.2, segments, segments)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    glow.userData = { isGlow: true }
    group.add(glow)

    return { mesh, glow, group }
  }

  createBond(
    order: 1 | 2 | 3,
    distance: number
  ): CreatedBond {
    const group = new THREE.Group()
    const cylinders: THREE.Mesh[] = []
    const radius = 0.02
    const segments = this.useHighDetail ? this.bondHighDetail : this.bondLowDetail

    const colors = {
      1: new THREE.Color('#68D391'),
      2: new THREE.Color('#F6E05E'),
      3: new THREE.Color('#FC8181')
    }

    const offsets = order === 1 ? [0] : order === 2 ? [-0.02, 0.02] : [-0.04, 0, 0.04]

    offsets.forEach((offset) => {
      const geometry = new THREE.CylinderGeometry(radius, radius, distance, segments)
      const material = new THREE.MeshBasicMaterial({
        color: colors[order],
        transparent: true,
        opacity: 0.9
      })
      const cylinder = new THREE.Mesh(geometry, material)
      cylinder.rotation.z = Math.PI / 2
      cylinder.position.x = offset
      cylinder.userData = { isBond: true, offset }
      group.add(cylinder)
      cylinders.push(cylinder)
    })

    return { group, cylinders }
  }

  updateBondVisuals(
    bondGroup: THREE.Group,
    order: 1 | 2 | 3,
    distance: number
  ): CreatedBond {
    while (bondGroup.children.length > 0) {
      const child = bondGroup.children[0]
      bondGroup.remove(child)
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (child.material instanceof THREE.Material) {
          child.material.dispose()
        }
      }
    }

    const newBond = this.createBond(order, distance)
    bondGroup.add(newBond.group)
    
    return {
      group: bondGroup,
      cylinders: newBond.cylinders
    }
  }

  disposeAtom(atomGroup: THREE.Group) {
    atomGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (child.material instanceof THREE.Material) {
          child.material.dispose()
        }
      }
    })
  }

  createGridHelper(): THREE.Group {
    const group = new THREE.Group()
    const size = 15
    const divisions = 15
    const color = new THREE.Color('#2D3748')

    for (let i = 0; i <= divisions; i++) {
      const position = (i / divisions - 0.5) * size
      
      const geometryX = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-size / 2, 0, position),
        new THREE.Vector3(size / 2, 0, position)
      ])
      const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 })
      const lineX = new THREE.Line(geometryX, material)
      group.add(lineX)

      const geometryZ = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(position, 0, -size / 2),
        new THREE.Vector3(position, 0, size / 2)
      ])
      const lineZ = new THREE.Line(geometryZ, material)
      group.add(lineZ)
    }

    for (let i = 0; i <= divisions; i++) {
      const yPos = (i / divisions - 0.5) * size
      const pos = (i / divisions - 0.5) * size
      
      const geometryX = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-size / 2, yPos, -size / 2),
        new THREE.Vector3(size / 2, yPos, -size / 2)
      ])
      const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 })
      const lineX = new THREE.Line(geometryX, material)
      group.add(lineX)

      const geometryZ = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-size / 2, yPos, -size / 2),
        new THREE.Vector3(-size / 2, yPos, size / 2)
      ])
      const lineZ = new THREE.Line(geometryZ, material)
      group.add(lineZ)

      const geometryY = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-size / 2, yPos, pos),
        new THREE.Vector3(size / 2, yPos, pos)
      ])
      const lineY = new THREE.Line(geometryY, material.clone())
      group.add(lineY)
    }

    return group
  }
}
