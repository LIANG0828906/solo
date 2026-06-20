import * as THREE from 'three'
import type { StoreApi } from 'zustand'

export type BuildingType = 'plate' | 'tower' | 'terrace' | 'arc'

export interface BuildingData {
  id: string
  type: BuildingType
  position: { x: number; y: number; z: number }
  height: number
  rotation: number
  selected?: boolean
}

interface BuildingStore {
  buildings: BuildingData[]
  getState: () => BuildingStore
  subscribe: (listener: (state: BuildingStore) => void) => () => void
}

const BUILDING_COLOR = 0x8f9eb3
const SELECTED_COLOR = 0xf5d76e
const BORDER_COLOR = 0xb0c4de
const MAX_INSTANCES = 1000

export class ModelManager {
  private scene: THREE.Scene
  private store: StoreApi<BuildingStore>
  private instancedMeshes: Map<BuildingType, THREE.InstancedMesh> = new Map()
  private borderMeshes: Map<BuildingType, THREE.LineSegments> = new Map()
  private dummy: THREE.Object3D = new THREE.Object3D()
  private buildingIdToIndex: Map<string, { type: BuildingType; index: number }> = new Map()
  private indexToBuildingId: Map<BuildingType, Map<number, string>> = new Map()
  private nextIndices: Map<BuildingType, number> = new Map()
  private needsUpdate: Set<BuildingType> = new Set()
  private previousBuildingIds: Set<string> = new Set()
  private isDisposed: boolean = false

  constructor(scene: THREE.Scene, store: StoreApi<BuildingStore>) {
    this.scene = scene
    this.store = store
    this.initializeMeshes()
    this.subscribeToStore()
  }

  private initializeMeshes(): void {
    const types: BuildingType[] = ['plate', 'tower', 'terrace', 'arc']

    types.forEach((type) => {
      const geometry = this.createBuildingGeometry(type, 1)
      const material = new THREE.MeshLambertMaterial({
        color: BUILDING_COLOR,
      })

      const instancedMesh = new THREE.InstancedMesh(geometry, material, MAX_INSTANCES)
      instancedMesh.count = 0
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
      this.instancedMeshes.set(type, instancedMesh)
      this.scene.add(instancedMesh)

      const borderGeometry = new THREE.EdgesGeometry(geometry)
      const borderMaterial = new THREE.LineBasicMaterial({
        color: BORDER_COLOR,
        transparent: true,
        opacity: 0.7,
        linewidth: 0.5,
      })

      const borderMesh = new THREE.LineSegments(borderGeometry, borderMaterial)
      borderMesh.frustumCulled = false
      this.borderMeshes.set(type, borderMesh)
      this.scene.add(borderMesh)

      this.nextIndices.set(type, 0)
      this.indexToBuildingId.set(type, new Map())
    })
  }

  private createBuildingGeometry(type: BuildingType, height: number): THREE.BufferGeometry {
    switch (type) {
      case 'plate':
        return new THREE.BoxGeometry(20, height, 10)
      case 'tower':
        return new THREE.BoxGeometry(12, height, 12)
      case 'terrace':
        return this.createTerraceGeometry(height)
      case 'arc':
        return this.createArcGeometry(height)
      default:
        return new THREE.BoxGeometry(15, height, 15)
    }
  }

  private createTerraceGeometry(height: number): THREE.BufferGeometry {
    const shape = new THREE.Shape()
    const levels = 3
    const baseWidth = 18
    const depth = 15

    for (let i = 0; i < levels; i++) {
      const width = baseWidth - i * 3
      const levelHeight = height / levels
      const y = i * levelHeight
      shape.moveTo(-width / 2, y)
      shape.lineTo(width / 2, y)
      shape.lineTo(width / 2, y + levelHeight)
      shape.lineTo(-width / 2, y + levelHeight)
      shape.lineTo(-width / 2, y)
    }

    const extrudeSettings = {
      depth: depth,
      bevelEnabled: false,
    }

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geometry.translate(0, 0, -depth / 2)
    return geometry
  }

  private createArcGeometry(height: number): THREE.BufferGeometry {
    const shape = new THREE.Shape()
    const outerRadius = 15
    const innerRadius = 8
    const startAngle = -Math.PI / 3
    const endAngle = Math.PI / 3

    shape.moveTo(innerRadius * Math.cos(startAngle), innerRadius * Math.sin(startAngle))
    for (let i = 0; i <= 20; i++) {
      const angle = startAngle + ((endAngle - startAngle) * i) / 20
      shape.lineTo(outerRadius * Math.cos(angle), outerRadius * Math.sin(angle))
    }
    for (let i = 20; i >= 0; i--) {
      const angle = startAngle + ((endAngle - startAngle) * i) / 20
      shape.lineTo(innerRadius * Math.cos(angle), innerRadius * Math.sin(angle))
    }

    const extrudeSettings = {
      depth: height,
      bevelEnabled: false,
    }

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geometry.rotateX(-Math.PI / 2)
    return geometry
  }

  private subscribeToStore(): void {
    this.store.subscribe(() => {
      if (!this.isDisposed) {
        this.markAllForUpdate()
      }
    })
  }

  private markAllForUpdate(): void {
    const types: BuildingType[] = ['plate', 'tower', 'terrace', 'arc']
    types.forEach((type) => this.needsUpdate.add(type))
  }

  addBuilding(
    type: BuildingType,
    position: { x: number; y: number; z: number },
    height: number,
    rotation: number = 0
  ): string {
    const id = this.generateId()
    const building: BuildingData = {
      id,
      type,
      position,
      height,
      rotation,
      selected: false,
    }

    const state = this.store.getState()
    const buildings = [...state.buildings, building]
    ;(this.store as unknown as { setState: (partial: Partial<BuildingStore>) => void }).setState({
      buildings,
    })

    return id
  }

  deleteBuilding(id: string): boolean {
    const state = this.store.getState()
    const building = state.buildings.find((b) => b.id === id)
    if (!building) return false

    const buildings = state.buildings.filter((b) => b.id !== id)
    ;(this.store as unknown as { setState: (partial: Partial<BuildingStore>) => void }).setState({
      buildings,
    })

    return true
  }

  private generateId(): string {
    return `building_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  update(): void {
    if (this.isDisposed) return

    const state = this.store.getState()
    const currentBuildings = state.buildings
    const currentBuildingIds = new Set(currentBuildings.map((b) => b.id))

    const addedBuildings = currentBuildings.filter((b) => !this.previousBuildingIds.has(b.id))
    const removedIds = [...this.previousBuildingIds].filter((id) => !currentBuildingIds.has(id))
    const updatedBuildings = currentBuildings.filter((b) => this.previousBuildingIds.has(b.id))

    removedIds.forEach((id) => this.removeBuildingInstance(id))
    addedBuildings.forEach((building) => this.addBuildingInstance(building))
    updatedBuildings.forEach((building) => this.updateBuildingInstance(building))

    this.needsUpdate.forEach((type) => {
      const mesh = this.instancedMeshes.get(type)
      if (mesh) {
        mesh.instanceMatrix.needsUpdate = true
      }
    })
    this.needsUpdate.clear()

    this.updateBorderMeshes()

    this.previousBuildingIds = currentBuildingIds
  }

  private addBuildingInstance(building: BuildingData): void {
    const type = building.type
    const mesh = this.instancedMeshes.get(type)
    if (!mesh) return

    const nextIndex = this.nextIndices.get(type) || 0
    if (nextIndex >= MAX_INSTANCES) {
      console.warn(`Maximum instances reached for building type: ${type}`)
      return
    }

    this.updateInstanceMatrix(mesh, nextIndex, building)
    this.updateInstanceColor(mesh, nextIndex, building.selected || false)

    mesh.count = Math.max(mesh.count, nextIndex + 1)

    this.buildingIdToIndex.set(building.id, { type, index: nextIndex })
    this.indexToBuildingId.get(type)?.set(nextIndex, building.id)
    this.nextIndices.set(type, nextIndex + 1)
    this.needsUpdate.add(type)
  }

  private removeBuildingInstance(id: string): void {
    const info = this.buildingIdToIndex.get(id)
    if (!info) return

    const { type, index } = info
    const mesh = this.instancedMeshes.get(type)
    if (!mesh) return

    const lastIndex = (this.nextIndices.get(type) || 1) - 1
    const typeMap = this.indexToBuildingId.get(type)

    if (index !== lastIndex && typeMap) {
      const lastBuildingId = typeMap.get(lastIndex)
      if (lastBuildingId) {
        const state = this.store.getState()
        const lastBuilding = state.buildings.find((b) => b.id === lastBuildingId)
        if (lastBuilding) {
          this.updateInstanceMatrix(mesh, index, lastBuilding)
          this.updateInstanceColor(mesh, index, lastBuilding.selected || false)
        }

        typeMap.set(index, lastBuildingId)
        this.buildingIdToIndex.set(lastBuildingId, { type, index })
      }
    }

    mesh.count = Math.max(0, mesh.count - 1)
    this.nextIndices.set(type, lastIndex)
    typeMap?.delete(lastIndex)
    this.buildingIdToIndex.delete(id)
    this.needsUpdate.add(type)
  }

  private updateBuildingInstance(building: BuildingData): void {
    const info = this.buildingIdToIndex.get(building.id)
    if (!info) return

    const { type, index } = info
    const mesh = this.instancedMeshes.get(type)
    if (!mesh) return

    this.updateInstanceMatrix(mesh, index, building)
    this.updateInstanceColor(mesh, index, building.selected || false)
    this.needsUpdate.add(type)
  }

  private updateInstanceMatrix(
    mesh: THREE.InstancedMesh,
    index: number,
    building: BuildingData
  ): void {
    this.dummy.position.set(building.position.x, building.position.y, building.position.z)
    this.dummy.rotation.y = building.rotation
    this.dummy.updateMatrix()
    mesh.setMatrixAt(index, this.dummy.matrix)
  }

  private updateInstanceColor(
    mesh: THREE.InstancedMesh,
    index: number,
    selected: boolean
  ): void {
    const color = new THREE.Color(selected ? SELECTED_COLOR : BUILDING_COLOR)
    mesh.setColorAt(index, color)
    if (!mesh.instanceColor) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(MAX_INSTANCES * 3),
        3
      )
    }
    mesh.instanceColor.needsUpdate = true
  }

  private updateBorderMeshes(): void {
    const state = this.store.getState()

    this.borderMeshes.forEach((borderMesh, type) => {
      const instancedMesh = this.instancedMeshes.get(type)
      if (!instancedMesh || instancedMesh.count === 0) {
        borderMesh.visible = false
        return
      }

      borderMesh.visible = true
      borderMesh.matrixAutoUpdate = false

      const parent = new THREE.Group()
      for (let i = 0; i < instancedMesh.count; i++) {
        const buildingId = this.indexToBuildingId.get(type)?.get(i)
        const building = state.buildings.find((b) => b.id === buildingId)
        if (building) {
          const borderClone = borderMesh.clone()
          borderClone.position.set(building.position.x, building.position.y, building.position.z)
          borderClone.rotation.y = building.rotation
          borderClone.updateMatrix()
          parent.add(borderClone)
        }
      }
      parent.updateMatrixWorld(true)
    })
  }

  dispose(): void {
    this.isDisposed = true

    this.instancedMeshes.forEach((mesh) => {
      this.scene.remove(mesh)
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
    })

    this.borderMeshes.forEach((mesh) => {
      this.scene.remove(mesh)
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
    })

    this.instancedMeshes.clear()
    this.borderMeshes.clear()
    this.buildingIdToIndex.clear()
    this.indexToBuildingId.clear()
    this.nextIndices.clear()
    this.needsUpdate.clear()
    this.previousBuildingIds.clear()
  }
}
