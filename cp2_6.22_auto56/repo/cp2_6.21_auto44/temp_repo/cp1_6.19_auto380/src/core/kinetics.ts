import type { Atom, AtomPosition, Bond, EnergyPoint } from '@/utils/store'
import { useAppStore } from '@/utils/store'
import { eventBus } from '@/utils/eventBus'
import { getReactionById } from '@/model/reaction'
import type { ReactionPath } from '@/model/reaction'

const BOND_ANIMATION_DURATION = 0.8
const ENERGY_THRESHOLD = 0.6

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpPosition(a: AtomPosition, b: AtomPosition, t: number): AtomPosition {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t)
  }
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function getAtomKeyframePositions(
  reaction: ReactionPath,
  atomId: string
): { time: number; position: AtomPosition }[] {
  const positions: { time: number; position: AtomPosition }[] = []
  for (const keyframe of reaction.keyframes) {
    const atomKeyframe = keyframe.atoms.find((a) => a.atomId === atomId)
    if (atomKeyframe) {
      positions.push({ time: keyframe.time, position: atomKeyframe.position })
    }
  }
  return positions
}

function interpolateAtomPosition(
  keyframes: { time: number; position: AtomPosition }[],
  currentTime: number
): AtomPosition | null {
  if (keyframes.length === 0) return null
  if (keyframes.length === 1) return keyframes[0].position

  if (currentTime <= keyframes[0].time) return keyframes[0].position
  if (currentTime >= keyframes[keyframes.length - 1].time) {
    return keyframes[keyframes.length - 1].position
  }

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (currentTime >= keyframes[i].time && currentTime <= keyframes[i + 1].time) {
      const segmentDuration = keyframes[i + 1].time - keyframes[i].time
      const segmentProgress = (currentTime - keyframes[i].time) / segmentDuration
      const easedProgress = easeInOutCubic(segmentProgress)
      return lerpPosition(keyframes[i].position, keyframes[i + 1].position, easedProgress)
    }
  }

  return keyframes[keyframes.length - 1].position
}

function interpolateEnergy(
  profile: { time: number; energy: number; isPeak: boolean }[],
  currentTime: number
): EnergyPoint {
  if (profile.length === 0) return { time: currentTime, energy: 0, isPeak: false }
  if (profile.length === 1) return { ...profile[0], time: currentTime }

  if (currentTime <= profile[0].time) return { ...profile[0], time: currentTime }
  if (currentTime >= profile[profile.length - 1].time) {
    return { ...profile[profile.length - 1], time: currentTime }
  }

  for (let i = 0; i < profile.length - 1; i++) {
    if (currentTime >= profile[i].time && currentTime <= profile[i + 1].time) {
      const segmentDuration = profile[i + 1].time - profile[i].time
      const segmentProgress = (currentTime - profile[i].time) / segmentDuration
      const easedProgress = easeInOutCubic(segmentProgress)
      const energy = lerp(profile[i].energy, profile[i + 1].energy, easedProgress)
      const isPeak = profile[i].isPeak || profile[i + 1].isPeak
      return { time: currentTime, energy, isPeak }
    }
  }

  return { ...profile[profile.length - 1], time: currentTime }
}

function calculateBondEnergy(atoms: Atom[], bonds: Bond[]): number {
  let totalBondEnergy = 0
  for (const bond of bonds) {
    if (bond.visible && bond.opacity > 0.1) {
      totalBondEnergy += bond.energy * bond.opacity
    }
  }
  return totalBondEnergy
}

function calculateAtomEnergy(atom: Atom, allAtoms: Atom[]): number {
  let energy = 0
  const atomRadius = getAtomRadius(atom.element)

  for (const other of allAtoms) {
    if (other.id === atom.id) continue
    const dx = atom.position.x - other.position.x
    const dy = atom.position.y - other.position.y
    const dz = atom.position.z - other.position.z
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const otherRadius = getAtomRadius(other.element)
    const minDistance = atomRadius + otherRadius

    if (distance < minDistance * 1.5) {
      const repulsion = Math.pow(minDistance / Math.max(distance, 0.1), 2)
      energy += repulsion * 0.1
    }
  }

  return energy
}

function getAtomRadius(element: string): number {
  switch (element) {
    case 'C':
      return 0.7
    case 'H':
      return 0.5
    case 'O':
      return 0.66
    case 'Cl':
      return 0.8
    default:
      return 0.6
  }
}

export function isAtomHighEnergy(atom: Atom): boolean {
  return atom.energy > ENERGY_THRESHOLD
}

export class MolecularDynamics {
  private animationId: number | null = null
  private startTime: number = 0
  private pausedTime: number = 0
  private reaction: ReactionPath | null = null
  private processedBondChanges: Set<string> = new Set()
  private bondAnimations: Map<string, { startTime: number; action: 'break' | 'form' }> = new Map()
  private atomKeyframes: Map<string, { time: number; position: AtomPosition }[]> = new Map()

  startReaction(reactionId: string): void {
    this.reaction = getReactionById(reactionId)
    if (!this.reaction) return

    const store = useAppStore.getState()
    store.clearEnergyHistory()
    store.clearTrajectories()
    store.resetState()
    store.setCurrentReaction(reactionId)
    store.setReactionStatus('playing')
    store.setMoleculeName(this.reaction.moleculeName)

    this.processedBondChanges.clear()
    this.bondAnimations.clear()
    this.atomKeyframes.clear()

    for (const atom of store.atoms) {
      const keyframes = getAtomKeyframePositions(this.reaction, atom.id)
      if (keyframes.length > 0) {
        this.atomKeyframes.set(atom.id, keyframes)
      }
    }

    this.startTime = performance.now()
    this.pausedTime = 0
    eventBus.emit('reaction:start', { reactionId })

    this.animate()
  }

  pauseReaction(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    const store = useAppStore.getState()
    if (store.reactionStatus === 'playing') {
      this.pausedTime = performance.now() - this.startTime
      store.setReactionStatus('paused')
      eventBus.emit('reaction:pause')
    }
  }

  resumeReaction(): void {
    const store = useAppStore.getState()
    if (store.reactionStatus === 'paused' && this.reaction) {
      this.startTime = performance.now() - this.pausedTime
      store.setReactionStatus('playing')
      eventBus.emit('reaction:resume')
      this.animate()
    }
  }

  replayReaction(): void {
    const store = useAppStore.getState()
    const reactionId = store.currentReaction
    this.startReaction(reactionId)
  }

  resetReaction(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    const store = useAppStore.getState()
    store.resetState()
    store.setReactionStatus('idle')
    this.processedBondChanges.clear()
    this.bondAnimations.clear()
    eventBus.emit('reaction:reset')
  }

  private animate = (): void => {
    const store = useAppStore.getState()
    if (store.reactionStatus !== 'playing' || !this.reaction) return

    const currentTime = (performance.now() - this.startTime) / 1000
    const clampedTime = Math.min(currentTime, this.reaction.duration)

    store.setCurrentTime(clampedTime)

    for (const [atomId, keyframes] of this.atomKeyframes) {
      const newPosition = interpolateAtomPosition(keyframes, clampedTime)
      if (newPosition) {
        store.updateAtomPosition(atomId, newPosition)
        store.addTrajectoryPoint(atomId, newPosition)
        eventBus.emit('atom:move', { atomId, position: newPosition })
      }
    }

    this.updateBondAnimations(clampedTime)

    const updatedAtoms = store.atoms.map((atom) => {
      const energy = calculateAtomEnergy(atom, store.atoms)
      return { ...atom, energy }
    })
    store.setAtoms(updatedAtoms)

    const energyPoint = interpolateEnergy(this.reaction.energyProfile, clampedTime)
    const bondEnergy = calculateBondEnergy(store.atoms, store.bonds)
    const totalEnergy = energyPoint.energy + bondEnergy * 2
    store.addEnergyPoint({ ...energyPoint, energy: totalEnergy })
    eventBus.emit('energy:update', { ...energyPoint, energy: totalEnergy })

    if (clampedTime >= this.reaction.duration) {
      store.setReactionStatus('finished')
      eventBus.emit('reaction:finished')
      return
    }

    this.animationId = requestAnimationFrame(this.animate)
  }

  private updateBondAnimations(currentTime: number): void {
    if (!this.reaction) return
    const store = useAppStore.getState()

    for (const change of this.reaction.bondChanges) {
      if (this.processedBondChanges.has(change.bondId)) continue
      if (currentTime >= change.timing) {
        this.processedBondChanges.add(change.bondId)
        this.bondAnimations.set(change.bondId, {
          startTime: currentTime,
          action: change.action
        })

        if (change.action === 'form' && change.newBond) {
          const existingBond = store.bonds.find((b) => b.id === change.bondId)
          if (!existingBond) {
            const newBond = {
              id: change.bondId,
              atomA: change.newBond.atomA,
              atomB: change.newBond.atomB,
              energy: change.newBond.energy,
              visible: true,
              opacity: 0
            }
            store.setBonds([...store.bonds, newBond])
          }
        }
      }
    }

    for (const [bondId, animation] of this.bondAnimations) {
      const elapsed = currentTime - animation.startTime
      const progress = Math.min(elapsed / BOND_ANIMATION_DURATION, 1)
      const easedProgress = easeInOutCubic(progress)

      if (animation.action === 'break') {
        const opacity = 1 - easedProgress
        store.updateBondOpacity(bondId, opacity)
        if (progress >= 1) {
          store.updateBondVisibility(bondId, false)
        }
      } else {
        store.updateBondOpacity(bondId, easedProgress)
        if (progress >= 1) {
          store.updateBondVisibility(bondId, true)
        }
      }

      eventBus.emit('bond:change', { bondId, action: animation.action, progress })
    }
  }

  destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }
}

export const molecularDynamics = new MolecularDynamics()
