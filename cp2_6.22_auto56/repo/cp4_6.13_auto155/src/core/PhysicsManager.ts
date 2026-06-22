export interface Vector2D {
  x: number
  y: number
}

export interface PlayerState {
  position: Vector2D
  velocity: Vector2D
  isJumping: boolean
  isSliding: boolean
  isInvincible: boolean
}

export interface Obstacle {
  type: 'spike' | 'bar' | 'robot'
  x: number
  y: number
  width: number
  height: number
  originX: number
  moveDirection: number
}

export interface Fragment {
  x: number
  y: number
  rotation: number
  collected: boolean
}

export class PhysicsManager {
  private player: PlayerState
  private obstacles: Obstacle[] = []
  private fragments: Fragment[] = []
  private groundY: number
  private canvasWidth: number
  private gravity: number = 0.8
  private jumpForce: number = -12
  private groundFriction: number = 0.92
  private nextObstacleDistance: number = 200
  private distanceSinceLastObstacle: number = 0
  private prngSeed: number = 12345

  constructor(canvasWidth: number, groundY: number) {
    this.canvasWidth = canvasWidth
    this.groundY = groundY
    this.player = {
      position: { x: 100, y: groundY - 64 },
      velocity: { x: 0, y: 0 },
      isJumping: false,
      isSliding: false,
      isInvincible: false
    }
  }

  private random(): number {
    this.prngSeed = (this.prngSeed * 1103515245 + 12345) & 0x7fffffff
    return this.prngSeed / 0x7fffffff
  }

  update(deltaTime: number, speed: number): void {
    this.distanceSinceLastObstacle += speed

    this.player.velocity.y += this.gravity

    if (!this.player.isSliding) {
      this.player.velocity.x = speed
    } else {
      this.player.velocity.x = speed * 0.8
    }

    this.player.position.x += this.player.velocity.x
    this.player.position.y += this.player.velocity.y

    if (this.player.position.y >= this.groundY - 64) {
      this.player.position.y = this.groundY - 64
      this.player.velocity.y = 0
      this.player.isJumping = false
    }

    if (!this.player.isJumping && !this.player.isSliding) {
      this.player.velocity.x *= this.groundFriction
    }

    this.obstacles.forEach(obs => {
      obs.x -= speed
      if (obs.type === 'robot') {
        obs.y += Math.sin(obs.x * 0.02) * 2
      }
    })

    this.obstacles = this.obstacles.filter(obs => obs.x > -100)

    this.fragments.forEach(frag => {
      frag.x -= speed
      frag.rotation += 0.05
    })

    this.fragments = this.fragments.filter(frag => frag.x > -50 && !frag.collected)

    if (this.distanceSinceLastObstacle >= this.nextObstacleDistance) {
      this.spawnObstacle()
      this.distanceSinceLastObstacle = 0
      this.nextObstacleDistance = 200 + this.random() * 100
    }

    this.trySpawnFragment()
  }

  private spawnObstacle(): void {
    const types: ('spike' | 'bar' | 'robot')[] = ['spike', 'bar', 'robot']
    const type = types[Math.floor(this.random() * types.length)]
    
    let obstacle: Obstacle

    switch (type) {
      case 'spike':
        obstacle = {
          type: 'spike',
          x: this.canvasWidth + 50,
          y: this.groundY - 25,
          width: 30,
          height: 25,
          originX: this.canvasWidth + 50,
          moveDirection: 0
        }
        break
      case 'bar':
        obstacle = {
          type: 'bar',
          x: this.canvasWidth + 50,
          y: this.groundY - 120,
          width: 80,
          height: 10,
          originX: this.canvasWidth + 50,
          moveDirection: 0
        }
        break
      case 'robot':
        obstacle = {
          type: 'robot',
          x: this.canvasWidth + 50,
          y: this.groundY - 50,
          width: 40,
          height: 50,
          originX: this.canvasWidth + 50,
          moveDirection: 1
        }
        break
    }

    this.obstacles.push(obstacle!)
  }

  private trySpawnFragment(): void {
    if (this.random() < 0.015 && this.fragments.length < 5) {
      const fragment: Fragment = {
        x: this.canvasWidth + 50 + this.random() * 150,
        y: this.groundY - 60 - this.random() * 120,
        rotation: 0,
        collected: false
      }
      this.fragments.push(fragment)
    }
  }

  jump(): void {
    if (!this.player.isJumping && !this.player.isSliding) {
      this.player.velocity.y = this.jumpForce
      this.player.isJumping = true
    }
  }

  slide(): void {
    if (!this.player.isJumping) {
      this.player.isSliding = true
      setTimeout(() => { this.player.isSliding = false }, 500)
    }
  }

  checkCollisions(): { hit: boolean; collected: number } {
    if (this.player.isInvincible) {
      this.fragments.forEach(frag => {
        if (!frag.collected && this.aabbCollision(
          { x: this.player.position.x, y: this.player.position.y, width: 40, height: 64 },
          { x: frag.x - 15, y: frag.y - 15, width: 30, height: 30 }
        )) {
          frag.collected = true
        }
      })
      return { hit: false, collected: this.fragments.filter(f => f.collected).length }
    }

    const playerRect = {
      x: this.player.position.x + 8,
      y: this.player.position.y + (this.player.isSliding ? 20 : 0),
      width: 48,
      height: this.player.isSliding ? 44 : 64
    }

    for (const obs of this.obstacles) {
      const obsRect = {
        x: obs.x,
        y: obs.y,
        width: obs.width,
        height: obs.height
      }
      if (this.aabbCollision(playerRect, obsRect)) {
        return { hit: true, collected: 0 }
      }
    }

    let collected = 0
    this.fragments.forEach(frag => {
      if (!frag.collected && this.aabbCollision(
        playerRect,
        { x: frag.x - 15, y: frag.y - 15, width: 30, height: 30 }
      )) {
        frag.collected = true
        collected++
      }
    })

    return { hit: false, collected }
  }

  private aabbCollision(a: { x: number; y: number; width: number; height: number },
                        b: { x: number; y: number; width: number; height: number }): boolean {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y
  }

  setInvincible(state: boolean): void {
    this.player.isInvincible = state
  }

  getPlayerState(): PlayerState {
    return this.player
  }

  getObstacles(): Obstacle[] {
    return this.obstacles
  }

  getFragments(): Fragment[] {
    return this.fragments
  }

  reset(): void {
    this.player = {
      position: { x: 100, y: this.groundY - 64 },
      velocity: { x: 0, y: 0 },
      isJumping: false,
      isSliding: false,
      isInvincible: false
    }
    this.obstacles = []
    this.fragments = []
    this.distanceSinceLastObstacle = 0
    this.nextObstacleDistance = 200 + this.random() * 100
    this.prngSeed = Date.now()
  }
}
