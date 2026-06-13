import { Container, Graphics, Sprite } from 'pixi.js'

interface VFXParticle {
  sprite: Sprite
  x: number
  y: number
  angle: number
  radius: number
  speed: number
  verticalOffset: number
  verticalSpeed: number
  life: number
  maxLife: number
  color: number
}

interface ExplosionParticle {
  sprite: Sprite
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: number
}

export class VFXManager {
  private container: Container
  private particles: VFXParticle[] = []
  private explosionParticles: ExplosionParticle[] = []
  private maxParticles: number = 300
  private noteColors: number[] = [
    0xff6b6b, 0xffe66d, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xdda0dd
  ]

  constructor(container: Container) {
    this.container = container
  }

  noteEffect(x: number, y: number, noteIndex: number, playerColor: number) {
    if (this.particles.length >= this.maxParticles) {
      this.removeOldestParticle()
    }

    const color = this.noteColors[noteIndex % this.noteColors.length]
    const particleCount = 6
    
    for (let i = 0; i < particleCount; i++) {
      const graphics = new Graphics()
      graphics.beginFill(color, 0.9)
      graphics.drawCircle(0, 0, 4 + Math.random() * 3)
      graphics.endFill()
      
      const sprite = graphics.generateSprite()
      sprite.anchor.set(0.5)
      sprite.tint = color
      
      this.container.addChild(sprite)
      
      const radius = 30 + Math.random() * 40
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5
      const speed = 1.5 + Math.random() * 1.5
      
      this.particles.push({
        sprite,
        x,
        y,
        angle,
        radius,
        speed,
        verticalOffset: Math.random() * Math.PI * 2,
        verticalSpeed: 2 + Math.random() * 2,
        life: 2.5,
        maxLife: 2.5,
        color,
      })
    }
  }

  private removeOldestParticle() {
    if (this.particles.length > 0) {
      const oldest = this.particles.shift()
      if (oldest) {
        this.container.removeChild(oldest.sprite)
        oldest.sprite.destroy()
      }
    }
  }

  explosion(x: number, y: number, color: number) {
    const particleCount = 120
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 150 + Math.random() * 350
      const size = 3 + Math.random() * 10
      
      const graphics = new Graphics()
      graphics.beginFill(color, 0.9)
      graphics.drawCircle(0, 0, size)
      graphics.endFill()
      
      const sprite = graphics.generateSprite()
      sprite.anchor.set(0.5)
      
      this.container.addChild(sprite)
      
      this.explosionParticles.push({
        sprite,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 2.5,
        maxLife: 2.5,
        color,
      })
    }
  }

  update(deltaTime: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      
      particle.angle += particle.speed * deltaTime
      particle.verticalOffset += particle.verticalSpeed * deltaTime
      
      const x = particle.x + Math.cos(particle.angle) * particle.radius
      const y = particle.y + Math.sin(particle.verticalOffset) * 20 + Math.sin(particle.angle) * particle.radius * 0.3
      
      particle.life -= deltaTime
      particle.sprite.position.set(x, y)
      particle.sprite.alpha = Math.min(1, particle.life / particle.maxLife)
      particle.sprite.scale.set(0.3 + (particle.life / particle.maxLife) * 0.7)
      particle.sprite.rotation += deltaTime * 2
      
      if (particle.life <= 0) {
        this.container.removeChild(particle.sprite)
        particle.sprite.destroy()
        this.particles.splice(i, 1)
      }
    }
    
    for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
      const particle = this.explosionParticles[i]
      
      particle.x += particle.vx * deltaTime
      particle.y += particle.vy * deltaTime
      particle.vy += 120 * deltaTime
      particle.vx *= 0.97
      particle.vy *= 0.97
      particle.life -= deltaTime
      
      particle.sprite.position.set(particle.x, particle.y)
      particle.sprite.alpha = Math.min(1, particle.life / particle.maxLife)
      particle.sprite.scale.set(particle.life / particle.maxLife)
      particle.sprite.rotation += deltaTime * 5
      
      if (particle.life <= 0) {
        this.container.removeChild(particle.sprite)
        particle.sprite.destroy()
        this.explosionParticles.splice(i, 1)
      }
    }
  }

  getParticleCount(): number {
    return this.particles.length + this.explosionParticles.length
  }

  getMaxParticles(): number {
    return this.maxParticles
  }
}
