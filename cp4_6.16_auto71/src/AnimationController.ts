import * as THREE from 'three'
import { useVoxelStore, AnimationType, Voxel } from './VoxelStore'

export interface AnimationState {
  time: number
  rotations: Map<string, THREE.Euler>
  positions: Map<string, THREE.Vector3>
  colors: Map<string, string>
  scales: Map<string, number>
  groupRotation: number
}

export class AnimationController {
  private state: AnimationState = {
    time: 0,
    rotations: new Map(),
    positions: new Map(),
    colors: new Map(),
    scales: new Map(),
    groupRotation: 0,
  }

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

  getState(): AnimationState {
    return this.state
  }

  getGroupRotation(): number {
    return this.state.groupRotation
  }

  getVoxelPosition(voxel: Voxel): THREE.Vector3 {
    return this.state.positions.get(voxel.id) || new THREE.Vector3(voxel.x, voxel.y, voxel.z)
  }

  getVoxelScale(voxel: Voxel): number {
    return this.state.scales.get(voxel.id) ?? 1
  }

  getVoxelColor(voxel: Voxel): string {
    return this.state.colors.get(voxel.id) || voxel.color
  }

  update(deltaTime: number) {
    const store = useVoxelStore.getState()
    const { animation, voxels } = store

    if (!animation.isPlaying) {
      this.lastTime = performance.now()
      return
    }

    const now = performance.now()
    if (this.lastTime === 0) this.lastTime = now
    const dt = Math.min((now - this.lastTime) / 1000, 0.1)
    this.lastTime = now

    this.state.time += dt * animation.speed

    this.state.positions.clear()
    this.state.scales.clear()
    this.state.colors.clear()
    this.state.rotations.clear()

    switch (animation.type) {
      case 'rotate':
        this.applyRotateAnimation(voxels)
        break
      case 'bounce':
        this.applyBounceAnimation(voxels)
        break
      case 'wave':
        this.applyWaveAnimation(voxels)
        break
    }

    this.notify()
  }

  private applyRotateAnimation(voxels: Voxel[]) {
    this.state.groupRotation = this.state.time * 0.8

    const bounds = this.getBounds(voxels)
    const cx = (bounds.minX + bounds.maxX) / 2
    const cy = (bounds.minY + bounds.maxY) / 2
    const cz = (bounds.minZ + bounds.maxZ) / 2

    const colorHue = (this.state.time * 30) % 360

    voxels.forEach(voxel => {
      const dx = voxel.x - cx
      const dz = voxel.z - cz
      const angle = this.state.groupRotation
      const rx = dx * Math.cos(angle) - dz * Math.sin(angle) + cx
      const rz = dx * Math.sin(angle) + dz * Math.cos(angle) + cz

      this.state.positions.set(voxel.id, new THREE.Vector3(rx, voxel.y + Math.sin(this.state.time * 2 + (voxel.animOffset || 0)) * 0.1, rz))

      const hue = (colorHue + (voxel.x + voxel.y + voxel.z) * 5) % 360
      this.state.colors.set(voxel.id, hslToHex(hue, 70, 60))
    })
  }

  private applyBounceAnimation(voxels: Voxel[]) {
    const bounds = this.getBounds(voxels)
    const cy = (bounds.minY + bounds.maxY) / 2

    voxels.forEach(voxel => {
      const offset = voxel.animOffset || 0
      const bounce = Math.sin(this.state.time * 3 + offset) * 0.5
      const scale = 1 + Math.sin(this.state.time * 4 + offset) * 0.15

      this.state.positions.set(voxel.id, new THREE.Vector3(voxel.x, voxel.y + bounce, voxel.z))
      this.state.scales.set(voxel.id, scale)

      const hue = (Math.sin(this.state.time * 2 + offset) * 0.5 + 0.5) * 360
      this.state.colors.set(voxel.id, hslToHex(hue, 75, 60))
    })
  }

  private applyWaveAnimation(voxels: Voxel[]) {
    voxels.forEach(voxel => {
      const dist = Math.sqrt(voxel.x * voxel.x + voxel.z * voxel.z)
      const wave = Math.sin(this.state.time * 2.5 - dist * 0.4) * 0.8
      const scale = 1 + wave * 0.1

      this.state.positions.set(voxel.id, new THREE.Vector3(voxel.x, voxel.y + wave, voxel.z))
      this.state.scales.set(voxel.id, scale)

      const hue = (dist * 15 + this.state.time * 40) % 360
      this.state.colors.set(voxel.id, hslToHex(hue, 70, 55))
    })
  }

  private getBounds(voxels: Voxel[]) {
    if (voxels.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 }
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    let minZ = Infinity, maxZ = -Infinity
    voxels.forEach(v => {
      minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x)
      minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y)
      minZ = Math.min(minZ, v.z); maxZ = Math.max(maxZ, v.z)
    })
    return { minX, maxX, minY, maxY, minZ, maxZ }
  }
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const color = l - a * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export const animationController = new AnimationController()
