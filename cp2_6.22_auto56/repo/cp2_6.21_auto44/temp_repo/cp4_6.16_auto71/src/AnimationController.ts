import { useVoxelStore } from './VoxelStore'

export class AnimationController {
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
    return useVoxelStore.getState().animation.elapsedTime
  }

  setTime(time: number) {
    useVoxelStore.setState({
      animation: { ...useVoxelStore.getState().animation, elapsedTime: time },
    })
    this.notify()
  }

  update() {
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

    const newTime = animation.elapsedTime + dt * animation.speed
    useVoxelStore.setState({
      animation: { ...animation, elapsedTime: newTime },
    })

    this.notify()
  }

  reset() {
    const store = useVoxelStore.getState()
    useVoxelStore.setState({
      animation: { ...store.animation, elapsedTime: 0, isPlaying: false },
    })
    this.lastTime = 0
    this.notify()
  }
}

export const animationController = new AnimationController()
