import * as THREE from 'three'
import type { Atom, Residue, PickerResult } from '../../types'

export class Picker {
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private atomMeshMap: Map<THREE.Object3D, Atom> = new Map()
  private cartoonMeshMap: Map<THREE.Object3D, Residue> = new Map()

  constructor() {
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
  }

  setAtomMeshes(meshes: Map<THREE.Object3D, Atom>): void {
    this.atomMeshMap = meshes
  }

  setCartoonMeshes(meshes: Map<THREE.Object3D, Residue>): void {
    this.cartoonMeshMap = meshes
  }

  pick(
    clientX: number,
    clientY: number,
    container: HTMLElement,
    camera: THREE.Camera
  ): PickerResult {
    const rect = container.getBoundingClientRect()
    
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, camera)

    const allMeshes = [
      ...Array.from(this.atomMeshMap.keys()),
      ...Array.from(this.cartoonMeshMap.keys())
    ]

    const intersects = this.raycaster.intersectObjects(allMeshes, true)

    if (intersects.length > 0) {
      const firstHit = intersects[0]
      let hitObject: THREE.Object3D | null = firstHit.object

      while (hitObject) {
        if (this.atomMeshMap.has(hitObject)) {
          const atom = this.atomMeshMap.get(hitObject)!
          return {
            atom,
            residue: null,
            point: {
              x: firstHit.point.x,
              y: firstHit.point.y,
              z: firstHit.point.z
            }
          }
        }
        
        if (this.cartoonMeshMap.has(hitObject)) {
          const residue = this.cartoonMeshMap.get(hitObject)!
          return {
            atom: residue.atoms.length > 0 ? residue.atoms[0] : null,
            residue,
            point: {
              x: firstHit.point.x,
              y: firstHit.point.y,
              z: firstHit.point.z
            }
          }
        }
        
        hitObject = hitObject.parent
      }
    }

    return {
      atom: null,
      residue: null,
      point: null
    }
  }

  hoverPick(
    clientX: number,
    clientY: number,
    container: HTMLElement,
    camera: THREE.Camera
  ): PickerResult {
    return this.pick(clientX, clientY, container, camera)
  }
}

export const picker = new Picker()
