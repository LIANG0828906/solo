import * as THREE from 'three'

export class Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  energy: number
  maxEnergy: number
  age: number
  radius: number
  color: THREE.Color

  constructor(position?: THREE.Vector3) {
    this.position = position || new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    )
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02
    )
    this.life = 100
    this.maxLife = 100
    this.energy = 50
    this.maxEnergy = 100
    this.age = 0
    this.radius = 0.01 + Math.random() * 0.02
    this.color = new THREE.Color()
    this.updateColor()
  }

  update(deltaTime: number, speed: number): boolean {
    this.life -= deltaTime * speed
    this.age += deltaTime
    this.energy -= 0.1 * deltaTime * speed

    if (this.life <= 0 || this.energy <= 0) {
      return false
    }

    this.velocity.x += (Math.random() - 0.5) * 0.001 * speed
    this.velocity.y += (Math.random() - 0.5) * 0.001 * speed
    this.velocity.z += (Math.random() - 0.5) * 0.001 * speed

    this.velocity.clampLength(0, 0.1)

    this.position.add(this.velocity.clone().multiplyScalar(speed))

    const bounds = 5
    if (Math.abs(this.position.x) > bounds) {
      this.position.x = Math.sign(this.position.x) * bounds
      this.velocity.x *= -0.5
    }
    if (Math.abs(this.position.y) > bounds) {
      this.position.y = Math.sign(this.position.y) * bounds
      this.velocity.y *= -0.5
    }
    if (Math.abs(this.position.z) > bounds) {
      this.position.z = Math.sign(this.position.z) * bounds
      this.velocity.z *= -0.5
    }

    this.updateColor()
    return true
  }

  updateColor(): void {
    const t = this.energy / this.maxEnergy
    if (t > 0.6) {
      const factor = (t - 0.6) / 0.4
      this.color.setHex(0x3366FF)
      this.color.lerp(new THREE.Color(0xFF3366), factor)
    } else if (t > 0.3) {
      const factor = (t - 0.3) / 0.3
      this.color.setHex(0x9933FF)
      this.color.lerp(new THREE.Color(0x3366FF), factor)
    } else {
      const factor = t / 0.3
      this.color.setHex(0x660099)
      this.color.lerp(new THREE.Color(0x9933FF), factor)
    }
  }

  canReproduce(): boolean {
    return this.energy > 80 && this.age > 5
  }

  reproduce(): Particle[] {
    if (!this.canReproduce()) return []

    this.energy /= 2

    const children: Particle[] = []
    for (let i = 0; i < 2; i++) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      )
      const child = new Particle(this.position.clone().add(offset))
      child.energy = this.energy * 0.5
      child.life = this.life * 0.8
      children.push(child)
    }
    return children
  }

  applyForce(force: THREE.Vector3): void {
    this.velocity.add(force)
  }

  distanceTo(other: Particle): number {
    return this.position.distanceTo(other.position)
  }
}