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

  collect(type: ResourceType, amount: number = 1): ResourceEvent {
    const previousValue = this.resources[type]
    this.resources[type] += amount
    const event: ResourceEvent = {
      type: 'collect',
      resource: type,
      amount,
      previousValue,
      currentValue: this.resources[type]
    }
    this.emit(event)
    return event
  }

  consume(type: ResourceType, amount: number): ResourceEvent | null {
    const previousValue = this.resources[type]
    if (this.resources[type] >= amount) {
      this.resources[type] -= amount
      const event: ResourceEvent = {
        type: 'consume',
        resource: type,
        amount,
        previousValue,
        currentValue: this.resources[type]
      }
      this.emit(event)
      return event
    }
    return null
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

  build(buildingType: BuildingType): ResourceEvent[] | null {
    if (!this.canBuild(buildingType)) {
      return null
    }
    const costs = BUILDING_COSTS[buildingType]
    const events: ResourceEvent[] = []
    for (const [resource, amount] of Object.entries(costs)) {
      const event = this.consume(resource as ResourceType, amount || 0)
      if (event) {
        events.push(event)
      }
    }
    return events
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
