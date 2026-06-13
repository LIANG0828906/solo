import { ResourceType, ResourceEvent, BuildingType, BUILDING_COSTS } from '../types'

export type ResourceMap = Record<ResourceType, number>

type EventListener = (event: ResourceEvent) => void

class ResourceManager {
  private resources: ResourceMap = {
    wood: 0,
    stone: 0,
    metal: 0,
    food: 0
  }

  private listeners: Set<EventListener> = new Set()

  getResources(): ResourceMap {
    return { ...this.resources }
  }

  getResource(type: ResourceType): number {
    return this.resources[type]
  }

  collect(type: ResourceType, amount: number = 1): boolean {
    this.resources[type] += amount
    this.emit({ type: 'collect', resource: type, amount })
    return true
  }

  consume(type: ResourceType, amount: number): boolean {
    if (this.resources[type] >= amount) {
      this.resources[type] -= amount
      this.emit({ type: 'consume', resource: type, amount })
      return true
    }
    return false
  }

  canBuild(buildingType: BuildingType): boolean {
    const costs = BUILDING_COSTS[buildingType]
    for (const [resource, amount] of Object.entries(costs)) {
      if (this.resources[resource as ResourceType] < (amount || 0)) {
        return false
      }
    }
    return true
  }

  build(buildingType: BuildingType): boolean {
    if (!this.canBuild(buildingType)) {
      return false
    }
    const costs = BUILDING_COSTS[buildingType]
    for (const [resource, amount] of Object.entries(costs)) {
      this.resources[resource as ResourceType] -= amount || 0
      this.emit({ type: 'consume', resource: resource as ResourceType, amount: amount || 0 })
    }
    return true
  }

  reset(): void {
    this.resources = { wood: 0, stone: 0, metal: 0, food: 0 }
  }

  addListener(listener: EventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(event: ResourceEvent): void {
    this.listeners.forEach((listener) => listener(event))
  }
}

export const resourceManager = new ResourceManager()
