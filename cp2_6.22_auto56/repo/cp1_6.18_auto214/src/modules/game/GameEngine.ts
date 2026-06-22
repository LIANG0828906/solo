import * as THREE from 'three'
import { StarSystem } from './StarSystem'
import { generateConstellationTemplates } from '@/data/constellations'
import { useGameStore } from '@/store/useGameStore'
import { ConstellationTemplate, Star, Particle } from '@/types'

export class GameEngine {
  private starSystem: StarSystem
  private constellations: ConstellationTemplate[] = []
  private connectedStars: Set<string> = new Set()
  private connectionSequence: string[] = []

  constructor() {
    this.starSystem = new StarSystem()
  }

  startGame(): void {
    const store = useGameStore.getState()
    store.dispatch({ type: 'START_GAME' })

    const stars = this.starSystem.generateStars()
    store.setStars(stars)

    const starIds = stars.map(s => s.id)
    this.constellations = generateConstellationTemplates(starIds)
    store.setConstellations(this.constellations)

    this.connectedStars.clear()
    this.connectionSequence = []
  }

  checkConnection(fromId: string, toId: string): { isValid: boolean; isComplete: boolean; constellation?: ConstellationTemplate } {
    const store = useGameStore.getState()

    const targetConstellation = this.constellations.find(c =>
      !c.isUnlocked && c.starIds.includes(fromId) && c.starIds.includes(toId)
    )

    if (!targetConstellation) {
      store.dispatch({ type: 'CHECK_CONNECTION', fromId, toId })
      setTimeout(() => {
        this.connectionSequence = []
      }, 300)
      return { isValid: false, isComplete: false }
    }

    this.connectionSequence.push(toId)

    const currentConnections = store.connections.filter(c => !c.isPreview)
    const allConnectedStarIds = [
      ...new Set([...currentConnections.map(c => c.from), ...currentConnections.map(c => c.to), fromId, toId])
    ]

    const isComplete = targetConstellation.starIds.every(id => allConnectedStarIds.includes(id))

    if (isComplete) {
      store.dispatch({ type: 'CHECK_CONNECTION', fromId, toId })
      this.triggerConstellationUnlock(targetConstellation)
      return { isValid: true, isComplete: true, constellation: targetConstellation }
    }

    store.dispatch({ type: 'CHECK_CONNECTION', fromId, toId })
    return { isValid: true, isComplete: false }
  }

  private triggerConstellationUnlock(constellation: ConstellationTemplate): void {
    const store = useGameStore.getState()

    this.animateConstellationMatch(constellation.starIds)

    setTimeout(() => {
      this.animateConstellationGather(constellation)
    }, 600)

    setTimeout(() => {
      store.dispatch({ type: 'UNLOCK_CONSTELLATION', constellationId: constellation.id })
      this.triggerConstellationEffect(constellation)
    }, 1400)
  }

  private animateConstellationMatch(starIds: string[]): void {
    const store = useGameStore.getState()
    let flashCount = 0

    const flash = () => {
      const stars = store.stars.map(star => {
        if (starIds.includes(star.id)) {
          return { ...star, brightness: flashCount % 2 === 0 ? 1.0 : 0.3 }
        }
        return star
      })
      store.setStars(stars)
      flashCount++

      if (flashCount < 4) {
        setTimeout(flash, 250)
      } else {
        const restoredStars = store.stars.map(star => {
          if (starIds.includes(star.id)) {
            return { ...star, brightness: 1.0 }
          }
          return star
        })
        store.setStars(restoredStars)
      }
    }

    flash()
  }

  private animateConstellationGather(constellation: ConstellationTemplate): void {
    const store = useGameStore.getState()
    const center = this.starSystem.calculateConstellationCenter(constellation.starIds)
    const targetPositions = this.starSystem.calculateConstellationTargetPositions(constellation.starIds, center, 0.3)

    store.dispatch({
      type: 'SET_CONSTELLATION_POSITIONS',
      constellationId: constellation.id,
      positions: targetPositions
    })

    const startTime = Date.now()
    const duration = 800

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      const stars = store.stars.map((star, index) => {
        if (constellation.starIds.includes(star.id)) {
          const starIndex = constellation.starIds.indexOf(star.id)
          const target = targetPositions[starIndex]
          if (target) {
            const newPos = star.originalPosition.clone().lerp(target, eased)
            return { ...star, position: newPos }
          }
        }
        return star
      })

      store.setStars(stars)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  }

  unlockConstellation(constellationId: string): ConstellationTemplate | null {
    const constellation = this.constellations.find(c => c.id === constellationId)
    if (constellation) {
      const store = useGameStore.getState()
      store.dispatch({ type: 'UNLOCK_CONSTELLATION', constellationId })
      return constellation
    }
    return null
  }

  private triggerConstellationEffect(constellation: ConstellationTemplate): void {
    const store = useGameStore.getState()
    const center = this.starSystem.calculateConstellationCenter(constellation.starIds)

    const particles: Particle[] = []
    const particleCount = 200

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const speed = 2 + Math.random() * 4

      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      )

      particles.push({
        id: `particle-${Date.now()}-${i}`,
        position: center.clone(),
        velocity,
        color: constellation.themeColor,
        size: 0.1 + Math.random() * 0.3,
        life: 2,
        maxLife: 2,
        opacity: 1
      })
    }

    store.dispatch({ type: 'ADD_PARTICLES', particles })
  }

  handleStarClick(starId: string): void {
    const store = useGameStore.getState()
    const selectedStarId = store.selectedStarId

    if (selectedStarId === null) {
      store.dispatch({ type: 'SELECT_STAR', starId })
      this.connectionSequence = [starId]
    } else if (selectedStarId !== starId) {
      this.checkConnection(selectedStarId, starId)
      store.dispatch({ type: 'SELECT_STAR', starId })
    }
  }

  handleStarDragStart(starId: string, position: THREE.Vector3): void {
    const store = useGameStore.getState()
    store.dispatch({ type: 'START_DRAG', starId, position })
  }

  handleStarDragMove(starId: string, position: THREE.Vector3): void {
    const store = useGameStore.getState()
    store.dispatch({ type: 'DRAG_STAR', starId, position })
  }

  handleStarDragEnd(starId: string, targetStarId?: string): void {
    const store = useGameStore.getState()
    const selectedStarId = store.selectedStarId

    store.dispatch({ type: 'END_DRAG', starId })

    if (targetStarId && selectedStarId && selectedStarId !== targetStarId) {
      this.checkConnection(selectedStarId, targetStarId)
      store.dispatch({ type: 'SELECT_STAR', starId: targetStarId })
    }
  }

  resetGame(): void {
    const store = useGameStore.getState()
    store.dispatch({ type: 'RESET_GAME' })
    setTimeout(() => {
      this.startGame()
    }, 500)
  }

  closeStory(): void {
    const store = useGameStore.getState()
    store.dispatch({ type: 'CLOSE_STORY' })
  }

  getGameState() {
    return useGameStore.getState()
  }

  getStarSystem(): StarSystem {
    return this.starSystem
  }

  getConstellations(): ConstellationTemplate[] {
    return this.constellations
  }

  getStars(): Star[] {
    return this.starSystem.getStars()
  }
}

export const gameEngine = new GameEngine()
