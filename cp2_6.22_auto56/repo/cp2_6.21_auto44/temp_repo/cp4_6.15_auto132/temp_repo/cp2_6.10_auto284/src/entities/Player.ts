import Phaser from 'phaser'

export class Player extends Phaser.Physics.Arcade.Image {
  private trailParticles: Phaser.GameObjects.Particles.ParticleEmitter
  private isInvincible: boolean = false
  private invincibleTimer: number = 0
  private flashTween: Phaser.Tweens.Tween | null = null

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setCollideWorldBounds(true)
    this.setScale(0.8)
    this.setDepth(10)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(40, 25)
    body.setOffset(10, 7)

    this.createTrail()
  }

  private createTrail(): void {
    this.trailParticles = this.scene.add.particles(0, 0, 'trail', {
      lifespan: 400,
      speedX: { min: -100, max: -50 },
      speedY: { min: -20, max: 20 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.8, end: 0 },
      quantity: 3,
      blendMode: 'ADD',
      follow: this,
      followOffset: { x: -25, y: 0 }
    })
    this.trailParticles.setDepth(5)
  }

  update(time: number, delta: number): void {
    if (this.isInvincible) {
      this.invincibleTimer -= delta
      if (this.invincibleTimer <= 0) {
        this.setInvincible(false)
      }
    }

    const speed = this.scene.game.loop.actualFps > 0 ? 60 / this.scene.game.loop.actualFps : 1
    this.trailParticles.setQuantity(3 * speed)
  }

  move(targetX: number, targetY: number): void {
    const dx = targetX - this.x
    const dy = targetY - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const moveSpeed = 8

    if (distance > 5) {
      const vx = (dx / distance) * moveSpeed
      const vy = (dy / distance) * moveSpeed
      this.setVelocity(vx * 60, vy * 60)

      const angle = Math.atan2(dy, dx)
      this.setRotation(angle * 0.3)
    } else {
      this.setVelocity(0, 0)
      this.setRotation(0)
    }
  }

  hit(): boolean {
    if (this.isInvincible) return false

    this.scene.sound.play('hit')
    
    const camera = this.scene.cameras.main
    camera.shake(200, 0.01)
    
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0xff0000, 0
    )
    flash.setDepth(100)
    flash.setScrollFactor(0)

    this.scene.tweens.add({
      targets: flash,
      alpha: { from: 0, to: 0.5 },
      yoyo: true,
      duration: 100,
      onComplete: () => flash.destroy()
    })

    return true
  }

  activateStarBurst(duration: number): void {
    this.setInvincible(true, duration)
    
    const particles = this.scene.add.particles(this.x, this.y, 'particle', {
      lifespan: 800,
      speed: { min: 100, max: 300 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      quantity: 50,
      blendMode: 'ADD',
      tint: 0xffffff
    })

    this.scene.time.delayedCall(500, () => particles.destroy())

    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0xffffff, 0
    )
    flash.setDepth(100)
    flash.setScrollFactor(0)

    this.scene.tweens.add({
      targets: flash,
      alpha: { from: 0, to: 0.8 },
      yoyo: true,
      duration: 150,
      onComplete: () => flash.destroy()
    })

    this.scene.sound.play('starburst')
  }

  private setInvincible(value: boolean, duration: number = 0): void {
    this.isInvincible = value
    this.invincibleTimer = duration

    if (this.flashTween) {
      this.flashTween.stop()
      this.flashTween = null
      this.clearTint()
      this.setAlpha(1)
    }

    if (value) {
      this.flashTween = this.scene.tweens.add({
        targets: this,
        alpha: { from: 1, to: 0.5 },
        tint: { from: 0x00e5ff, to: 0xffffff },
        yoyo: true,
        repeat: -1,
        duration: 150
      })
    }
  }

  getInvincible(): boolean {
    return this.isInvincible
  }

  destroy(fromScene?: boolean): void {
    if (this.trailParticles) {
      this.trailParticles.destroy()
    }
    if (this.flashTween) {
      this.flashTween.stop()
    }
    super.destroy(fromScene)
  }
}
