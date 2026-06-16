import * as THREE from 'three'
import { useVoxelStore, AnimationType, Voxel } from './VoxelStore'

export class AnimationController {
  private time = 0
  private lastTime = 0
  private subscribers: Set<() => void> = new Set()

  constructor() {}

  subscribe(cb: () => void) {
    this.subscribers.add(cb)
    return () => this.subscribers.delete(cb)
  }

  private notify() {
    this.subscribers.forEach(cb => cb())
  }

  getTime(): number {
    return this.time
  }

  update(deltaTime: number) {
    const store = useVoxelStore.getState()
    const { animation } = store

    if (!animation.isPlaying) {
      this.lastTime = performance.now()
      return
    }

    const now = performance.now()
    if (this.lastTime === 0) this.lastTime = now
    const dt = Math.min((now - this.lastTime) / 1000, 0.1)
    this.lastTime = now

    this.time += dt * animation.speed
    this.notify()
  }

  reset() {
    this.time = 0
    this.lastTime = 0
  }
}

export const animationController = new AnimationController()
