import * as THREE from 'three'
import { Star } from '@/types'

export class StarSystem {
  private stars: Star[] = []
  private readonly sphereRadius = 12
  private readonly starCount = 30

  generateStars(): Star[] {
    this.stars = []
    const goldenRatio = (1 + Math.sqrt(5)) / 2

    for (let i = 0; i < this.starCount; i++) {
      const y = 1 - (i / (this.starCount - 1)) * 2
      const radius = Math.sqrt(1 - y * y)
      const theta = 2 * Math.PI * i / goldenRatio

      const x = Math.cos(theta) * radius * this.sphereRadius
      const z = Math.sin(theta) * radius * this.sphereRadius
      const yPos = y * this.sphereRadius

      const position = new THREE.Vector3(x, yPos, z)

      const star: Star = {
        id: `star-${i}`,
        position: position.clone(),
        originalPosition: position.clone(),
        brightness: 0.4 + Math.random() * 0.6,
        size: 0.3 + Math.random() * 0.3,
        pulsePeriod: 2 + Math.random() * 2,
        pulseAmplitude: 0.05,
        isSelected: false,
        isDragging: false,
        isPartOfConstellation: false,
        constellationId: null
      }

      this.stars.push(star)
    }

    return this.stars
  }

  updateStarPosition(starId: string, position: THREE.Vector3): void {
    const star = this.stars.find(s => s.id === starId)
    if (star) {
      star.position.copy(position)
    }
  }

  resetStarPosition(starId: string): void {
    const star = this.stars.find(s => s.id === starId)
    if (star) {
      star.position.copy(star.originalPosition)
      star.isDragging = false
    }
  }

  setStarSelected(starId: string, selected: boolean): void {
    const star = this.stars.find(s => s.id === starId)
    if (star) {
      star.isSelected = selected
    }
  }

  setStarDragging(starId: string, dragging: boolean): void {
    const star = this.stars.find(s => s.id === starId)
    if (star) {
      star.isDragging = dragging
    }
  }

  setStarBrightness(starId: string, brightness: number): void {
    const star = this.stars.find(s => s.id === starId)
    if (star) {
      star.brightness = Math.max(0, Math.min(1, brightness))
    }
  }

  getStar(starId: string): Star | undefined {
    return this.stars.find(s => s.id === starId)
  }

  getStars(): Star[] {
    return this.stars
  }

  resetAllStars(): void {
    this.generateStars()
  }

  markStarsAsConstellation(starIds: string[], constellationId: string): void {
    this.stars.forEach(star => {
      if (starIds.includes(star.id)) {
        star.isPartOfConstellation = true
        star.constellationId = constellationId
      }
    })
  }

  getConstellationStarIds(): string[] {
    return this.stars
      .filter(s => s.isPartOfConstellation)
      .map(s => s.id)
  }

  calculateConstellationCenter(starIds: string[]): THREE.Vector3 {
    const stars = this.stars.filter(s => starIds.includes(s.id))
    if (stars.length === 0) return new THREE.Vector3()

    const center = new THREE.Vector3()
    stars.forEach(star => center.add(star.originalPosition))
    return center.divideScalar(stars.length)
  }

  calculateConstellationTargetPositions(starIds: string[], center: THREE.Vector3, scale: number = 0.3): THREE.Vector3[] {
    const stars = this.stars.filter(s => starIds.includes(s.id))
    return stars.map(star => {
      const direction = star.originalPosition.clone().sub(center).normalize()
      const distance = star.originalPosition.distanceTo(center) * scale
      return center.clone().add(direction.multiplyScalar(distance))
    })
  }
}
