import { Container, Graphics, Sprite } from 'pixi.js'

interface VFXParticle {
  sprite: Sprite
  x: number
  y: number
  vx: number
  vy: number
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
    if (this.particles.length >= this.maxParticles) return

    const color = this.noteColors[noteIndex % this.noteColors.length]
    const particleCount = 8
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const speed = 50 + Math.random() * 50
      
      const graphics = new Graphics()
      graphics.beginFill(color, 1)
      graphics.drawCircle(0, 0, 3 + Math.random() * 3)
      
      const sprite = graphics.generateSprite()
      sprite.position.set(x, y)
      sprite.anchor.set(0.5)
      sprite.tint = color
      
      this.container.addChild(sprite)
      
      this.particles.push({
        sprite,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color,
      })
    }
  }

  explosion(x: number, y: number, color: number) {
    const particleCount = 150
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 100 + Math.random() * 300
      const size = 2 + Math.random() * 8
      
      const graphics = new Graphics()
      graphics.beginRadialGradient(0, 0, 0, 0, 0, size, [color, 0xffffff], [0.3, 1])
      graphics.drawCircle(0, 0, size)
      
      const sprite = graphics.generateSprite()
      sprite.position.set(x, y)
      sprite.anchor.set(0.5)
      
      this.container.addChild(sprite)
      
      this.explosionParticles.push({
        sprite,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 2,
        maxLife: 2,
        color,
      })
    }
  }

  update(deltaTime: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      
      particle.x += particle.vx * deltaTime
      particle.y += particle.vy * deltaTime
      particle.vy += 50 * deltaTime
      particle.life -= deltaTime * 2
      
      particle.sprite.position.set(particle.x, particle.y)
      particle.sprite.alpha = particle.life / particle.maxLife
      particle.sprite.scale.set(0.5 + (particle.life / particle.maxLife) * 0.5)
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
      particle.vy += 100 * deltaTime
      particle.vx *= 0.98
      particle.vy *= 0.98
      particle.life -= deltaTime
      
      particle.sprite.position.set(particle.x, particle.y)
      particle.sprite.alpha = particle.life / particle.maxLife
      particle.sprite.scale.set(particle.life / particle.maxLife)
      
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
}
