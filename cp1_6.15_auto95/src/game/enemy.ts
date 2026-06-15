import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'
import type { EnemyState, EnemyConfig, Room } from '@/game/types'

const PATROL_SPEED = 1
const CHASE_SPEED = 2.5
const CHASE_RANGE = 8
const ATTACK_RANGE = 2
const ATTACK_COOLDOWN = 1.5
const TELEGRAPH_DURATION = 0.3
const BOSS_FIRE_TELEGRAPH = 1
const BOSS_FIRE_DURATION = 2
const BOSS_SLAM_TELEGRAPH = 0.8
const BOSS_SLAM_IMPACT = 0.5
const BOSS_SUMMON_COOLDOWN = 30
const BOSS_SPECIAL_MIN_CD = 8
const DEATH_EFFECT_DURATION = 2
const MINI_SKELETON_LIFETIME = 15

interface EnemyInternal {
  state: EnemyState
  group: THREE.Group
  patrolDir: THREE.Vector3
  patrolTimer: number
  attackCdTimer: number
  telegraphSprite: THREE.Sprite | null
  wobblePhase: number
  bossSpecialCd: number
  bossCasting: 'firebreath' | 'groundslam' | null
  bossCastTimer: number
  aoeTelegraph: THREE.Mesh | null
  summonCd: number
  burnTickTimer: number
  slamHit: boolean
  summonLifetime: number
}

interface DeathEffect {
  mesh: THREE.Mesh
  timer: number
}

interface BurnParticle {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  life: number
  maxLife: number
}

export class EnemyManager {
  private scene: THREE.Scene
  private store: typeof useGameStore
  private enemies: Map<string, EnemyInternal> = new Map()
  private deathEffects: DeathEffect[] = []
  private justDied: string[] = []
  private idCounter = 0
  private telegraphTexture: THREE.CanvasTexture | null = null

  private playerIsBurning: boolean = false
  private playerBurnDuration: number = 0
  private playerBurnDamage: number = 0
  private playerBurnTickTimer: number = 0
  private playerBurnLight: THREE.PointLight | null = null
  private burnParticles: BurnParticle[] = []
  private burnParticleTimer: number = 0

  constructor(scene: THREE.Scene, store: typeof useGameStore) {
    this.scene = scene
    this.store = store
  }

  private nextId(): string {
    return `enemy_${++this.idCounter}`
  }

  private getTelegraphTexture(): THREE.CanvasTexture {
    if (this.telegraphTexture) return this.telegraphTexture
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ff0000'
    ctx.font = 'bold 52px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('!', 32, 28)
    this.telegraphTexture = new THREE.CanvasTexture(canvas)
    return this.telegraphTexture
  }

  private showTelegraph(ei: EnemyInternal): void {
    if (ei.telegraphSprite) return
    const mat = new THREE.SpriteMaterial({
      map: this.getTelegraphTexture(),
      color: 0xff0000,
      transparent: true,
      depthTest: false,
    })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(0.6, 0.6, 0.6)
    const h = ei.state.type === 'boss' ? 7.5 : 2.5
    sprite.position.set(0, h, 0)
    ei.group.add(sprite)
    ei.telegraphSprite = sprite
  }

  private hideTelegraph(ei: EnemyInternal): void {
    if (!ei.telegraphSprite) return
    ei.group.remove(ei.telegraphSprite)
    ei.telegraphSprite.material.dispose()
    ei.telegraphSprite = null
  }

  private createEnemyMesh(type: EnemyConfig['type']): THREE.Group {
    const group = new THREE.Group()
    switch (type) {
      case 'skeleton': {
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 1.2, 0.4),
          new THREE.MeshStandardMaterial({ color: 0x8B7355 })
        )
        body.position.y = 0.6
        group.add(body)
        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 8, 6),
          new THREE.MeshStandardMaterial({ color: 0x8B7355 })
        )
        head.position.y = 1.5
        group.add(head)
        break
      }
      case 'ghost': {
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.6, 12, 8),
          new THREE.MeshStandardMaterial({
            color: 0x9966ff,
            transparent: true,
            opacity: 0.6,
          })
        )
        sphere.position.y = 1.2
        group.add(sphere)
        break
      }
      case 'demon': {
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 1.4, 0.5),
          new THREE.MeshStandardMaterial({ color: 0xcc2222 })
        )
        body.position.y = 0.7
        group.add(body)
        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 8, 6),
          new THREE.MeshStandardMaterial({ color: 0xcc2222 })
        )
        head.position.y = 1.75
        group.add(head)
        const hornMat = new THREE.MeshStandardMaterial({ color: 0x880000 })
        const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 6), hornMat)
        hornL.position.set(-0.2, 2.2, 0)
        hornL.rotation.z = 0.3
        group.add(hornL)
        const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 6), hornMat)
        hornR.position.set(0.2, 2.2, 0)
        hornR.rotation.z = -0.3
        group.add(hornR)
        break
      }
      case 'boss': {
        const mat = new THREE.MeshStandardMaterial({ color: 0x880000 })
        const bottom = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 1.5), mat)
        bottom.position.y = 1
        group.add(bottom)
        const mid = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2, 1.2), mat)
        mid.position.y = 3
        group.add(mid)
        const top = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1), mat)
        top.position.y = 5
        group.add(top)
        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.7, 10, 8),
          new THREE.MeshStandardMaterial({ color: 0x880000 })
        )
        head.position.y = 6.3
        group.add(head)
        const hornMat = new THREE.MeshStandardMaterial({ color: 0x440000 })
        for (let i = -2; i <= 2; i++) {
          const horn = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.8, 6), hornMat)
          horn.position.set(i * 0.4, 7.3, 0)
          group.add(horn)
        }
        break
      }
    }
    return group
  }

  spawnEnemies(enemyConfigs: EnemyConfig[], rooms: Room[]): void {
    this.enemies.forEach((ei) => {
      this.scene.remove(ei.group)
      this.hideTelegraph(ei)
      this.clearAoeTelegraph(ei)
    })
    this.enemies.clear()
    this.deathEffects.forEach((de) => {
      this.scene.remove(de.mesh)
      de.mesh.geometry.dispose()
      ;(de.mesh.material as THREE.Material).dispose()
    })
    this.deathEffects = []
    this.justDied = []
    this.idCounter = 0
    this.clearPlayerBurn()

    enemyConfigs.forEach((cfg) => {
      const room = rooms.length > 0
        ? rooms[Math.floor(Math.random() * rooms.length)]
        : null
      const id = this.nextId()
      const isBoss = cfg.type === 'boss'
      let px = 0
      let pz = 0
      if (room) {
        px = room.x + Math.random() * room.width
        pz = room.y + Math.random() * room.height
      }
      const state: EnemyState = {
        id,
        type: cfg.type,
        name: cfg.name,
        hp: cfg.hp,
        maxHp: cfg.hp,
        attack: cfg.attack,
        defense: cfg.defense,
        speed: cfg.speed,
        position: { x: px, y: 0, z: pz },
        state: 'patrol',
        attackTimer: 0,
        attackCooldown: cfg.attackInterval,
        isBoss,
        bossPhase: isBoss ? 1 : undefined,
        roomId: room?.id ?? '',
        isTelegraphing: false,
        telegraphTimer: 0,
      }
      const mesh = this.createEnemyMesh(cfg.type)
      mesh.position.set(px, 0, pz)
      this.scene.add(mesh)
      const angle = Math.random() * Math.PI * 2
      const ei: EnemyInternal = {
        state,
        group: mesh,
        patrolDir: new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)),
        patrolTimer: 2 + Math.random() * 2,
        attackCdTimer: 0,
        telegraphSprite: null,
        wobblePhase: Math.random() * Math.PI * 2,
        bossSpecialCd: 5,
        bossCasting: null,
        bossCastTimer: 0,
        aoeTelegraph: null,
        summonCd: BOSS_SUMMON_COOLDOWN,
        burnTickTimer: 0,
        slamHit: false,
        summonLifetime: 0,
      }
      this.enemies.set(id, ei)
      if (isBoss) {
        this.store.getState().setBossBar(true, cfg.name, cfg.hp, cfg.hp)
      }
    })
    this.store.getState().setEnemies(Array.from(this.enemies.values()).map((e) => e.state))
  }

  update(dt: number, playerPos: THREE.Vector3): void {
    this.justDied = []
    const storeState = this.store.getState()

    this.updatePlayerBurn(dt, playerPos)

    this.enemies.forEach((ei) => {
      if (ei.state.state === 'dead') return

      if (ei.summonLifetime > 0) {
        ei.summonLifetime -= dt
        if (ei.summonLifetime <= 0) {
          this.killEnemy(ei)
          return
        }
      }

      const ex = ei.state.position.x
      const ez = ei.state.position.z
      const dist = Math.sqrt(
        (playerPos.x - ex) ** 2 + (playerPos.z - ez) ** 2
      )

      const isBossCasting = ei.state.isBoss && ei.bossCasting !== null

      if (!isBossCasting) {
        if (dist <= ATTACK_RANGE && ei.attackCdTimer <= 0 && !ei.state.isTelegraphing) {
          ei.state.state = 'attack'
        } else if (dist <= CHASE_RANGE) {
          if (ei.state.state !== 'attack') ei.state.state = 'chase'
        } else {
          if (ei.state.state !== 'attack') ei.state.state = 'patrol'
        }
        if (ei.state.state === 'attack' && dist > ATTACK_RANGE && !ei.state.isTelegraphing) {
          ei.state.state = dist <= CHASE_RANGE ? 'chase' : 'patrol'
        }
      } else {
        ei.state.state = 'attack'
      }

      this.updateAI(ei, dt, playerPos, dist)

      ei.group.position.set(ei.state.position.x, 0, ei.state.position.z)

      if (ei.state.type === 'ghost') {
        ei.wobblePhase += dt * 3
        const child = ei.group.children[0]
        if (child) child.position.y = 1.2 + Math.sin(ei.wobblePhase) * 0.15
      }

      if (ei.state.isBoss) {
        this.updateBossSpecial(ei, dt, playerPos, dist)
      }

      ei.attackCdTimer = Math.max(0, ei.attackCdTimer - dt)
    })

    this.updateDeathEffects(dt)
    storeState.setEnemies(Array.from(this.enemies.values()).map((e) => e.state))
  }

  private updatePlayerBurn(dt: number, playerPos: THREE.Vector3): void {
    this.updateBurnParticles(dt, playerPos)

    if (!this.playerIsBurning) return

    this.playerBurnDuration -= dt
    this.playerBurnTickTimer -= dt

    if (this.playerBurnTickTimer <= 0) {
      this.store.getState().damagePlayer(this.playerBurnDamage)
      this.playerBurnTickTimer = 1
    }

    if (this.playerBurnDuration <= 0) {
      this.clearPlayerBurn()
    }

    this.updateBurnLight(playerPos)
  }

  private updateBurnLight(playerPos: THREE.Vector3): void {
    if (!this.playerBurnLight) return
    this.playerBurnLight.position.set(playerPos.x, playerPos.y + 1, playerPos.z)
    const flicker = 0.7 + Math.random() * 0.6
    this.playerBurnLight.intensity = 2 * flicker
    const hue = 0.05 + Math.random() * 0.05
    this.playerBurnLight.color.setHSL(hue, 1, 0.5)
  }

  private updateBurnParticles(dt: number, playerPos: THREE.Vector3): void {
    if (this.playerIsBurning) {
      this.burnParticleTimer -= dt
      if (this.burnParticleTimer <= 0) {
        this.spawnBurnParticle(playerPos)
        this.burnParticleTimer = 0.08 + Math.random() * 0.05
      }
    }

    for (let i = this.burnParticles.length - 1; i >= 0; i--) {
      const p = this.burnParticles[i]
      p.life -= dt
      p.mesh.position.add(p.velocity.clone().multiplyScalar(dt))
      p.velocity.y -= 2 * dt
      const t = Math.max(0, p.life / p.maxLife)
      const mat = p.mesh.material as THREE.MeshBasicMaterial
      mat.opacity = t
      p.mesh.scale.setScalar(0.1 + (1 - t) * 0.15)
      const hue = 0.05 + (1 - t) * 0.05
      mat.color.setHSL(hue, 1, 0.5 + t * 0.3)

      if (p.life <= 0) {
        this.scene.remove(p.mesh)
        p.mesh.geometry.dispose()
        mat.dispose()
        this.burnParticles.splice(i, 1)
      }
    }
  }

  private spawnBurnParticle(playerPos: THREE.Vector3): void {
    const geo = new THREE.SphereGeometry(0.1, 6, 4)
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 1,
    })
    const mesh = new THREE.Mesh(geo, mat)
    const offsetX = (Math.random() - 0.5) * 0.6
    const offsetY = Math.random() * 1.5
    const offsetZ = (Math.random() - 0.5) * 0.6
    mesh.position.set(
      playerPos.x + offsetX,
      playerPos.y + offsetY,
      playerPos.z + offsetZ
    )
    this.scene.add(mesh)

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,
      1.5 + Math.random() * 1.5,
      (Math.random() - 0.5) * 0.5
    )

    this.burnParticles.push({
      mesh,
      velocity,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 1,
    })
  }

  setPlayerBurning(duration: number, damagePerSecond: number): void {
    this.playerIsBurning = true
    this.playerBurnDuration = duration
    this.playerBurnDamage = damagePerSecond
    this.playerBurnTickTimer = 0

    if (!this.playerBurnLight) {
      this.playerBurnLight = new THREE.PointLight(0xff6600, 2, 5)
      this.scene.add(this.playerBurnLight)
    }
  }

  private clearPlayerBurn(): void {
    this.playerIsBurning = false
    this.playerBurnDuration = 0
    this.playerBurnDamage = 0
    this.playerBurnTickTimer = 0

    if (this.playerBurnLight) {
      this.scene.remove(this.playerBurnLight)
      this.playerBurnLight.dispose()
      this.playerBurnLight = null
    }

    for (let i = this.burnParticles.length - 1; i >= 0; i--) {
      const p = this.burnParticles[i]
      this.scene.remove(p.mesh)
      p.mesh.geometry.dispose()
      ;(p.mesh.material as THREE.Material).dispose()
    }
    this.burnParticles = []
    this.burnParticleTimer = 0
  }

  private updateAI(ei: EnemyInternal, dt: number, playerPos: THREE.Vector3, dist: number): void {
    switch (ei.state.state) {
      case 'patrol':
        this.updatePatrol(ei, dt)
        break
      case 'chase':
        this.updateChase(ei, dt, playerPos)
        break
      case 'attack':
        this.updateAttack(ei, dt, playerPos, dist)
        break
    }
  }

  private updatePatrol(ei: EnemyInternal, dt: number): void {
    ei.patrolTimer -= dt
    if (ei.patrolTimer <= 0) {
      const angle = Math.random() * Math.PI * 2
      ei.patrolDir.set(Math.cos(angle), 0, Math.sin(angle))
      ei.patrolTimer = 2 + Math.random() * 2
    }
    ei.state.position.x += ei.patrolDir.x * PATROL_SPEED * dt
    ei.state.position.z += ei.patrolDir.z * PATROL_SPEED * dt
    ei.group.rotation.y = Math.atan2(ei.patrolDir.x, ei.patrolDir.z)
  }

  private updateChase(ei: EnemyInternal, dt: number, playerPos: THREE.Vector3): void {
    const dx = playerPos.x - ei.state.position.x
    const dz = playerPos.z - ei.state.position.z
    const len = Math.sqrt(dx * dx + dz * dz)
    if (len < 0.01) return
    const nx = dx / len
    const nz = dz / len
    ei.state.position.x += nx * CHASE_SPEED * dt
    ei.state.position.z += nz * CHASE_SPEED * dt
    ei.group.rotation.y = Math.atan2(nx, nz)
  }

  private updateAttack(ei: EnemyInternal, dt: number, playerPos: THREE.Vector3, dist: number): void {
    if (ei.state.isBoss && ei.bossCasting) return

    if (dist > ATTACK_RANGE && !ei.state.isTelegraphing) {
      this.updateChase(ei, dt, playerPos)
      return
    }

    if (!ei.state.isTelegraphing && ei.attackCdTimer <= 0) {
      ei.state.isTelegraphing = true
      ei.state.telegraphTimer = TELEGRAPH_DURATION
      this.showTelegraph(ei)
    }

    if (ei.state.isTelegraphing) {
      ei.state.telegraphTimer -= dt
      if (ei.state.telegraphTimer <= 0) {
        ei.state.isTelegraphing = false
        this.hideTelegraph(ei)
        this.store.getState().damagePlayer(ei.state.attack)
        ei.attackCdTimer = ATTACK_COOLDOWN
        ei.state.state = 'chase'
      }
    }
  }

  private updateBossSpecial(ei: EnemyInternal, dt: number, playerPos: THREE.Vector3, dist: number): void {
    this.store.getState().updateBossHp(ei.state.hp)

    if (ei.bossCasting) {
      this.processBossCast(ei, dt, playerPos)
      return
    }

    ei.bossSpecialCd -= dt
    ei.summonCd -= dt

    if (ei.summonCd <= 0) {
      this.bossSummon(ei, playerPos)
      ei.summonCd = BOSS_SUMMON_COOLDOWN
      return
    }

    if (ei.bossSpecialCd <= 0 && dist <= CHASE_RANGE) {
      const roll = Math.random()
      if (roll < 0.4) {
        ei.bossCasting = 'firebreath'
        ei.bossCastTimer = BOSS_FIRE_TELEGRAPH + BOSS_FIRE_DURATION
        ei.burnTickTimer = 0
      } else if (roll < 0.75) {
        ei.bossCasting = 'groundslam'
        ei.bossCastTimer = BOSS_SLAM_TELEGRAPH + BOSS_SLAM_IMPACT
        ei.slamHit = false
      } else {
        this.bossSummon(ei, playerPos)
        ei.summonCd = BOSS_SUMMON_COOLDOWN
      }
      if (ei.bossCasting) {
        this.showTelegraph(ei)
        ei.bossSpecialCd = BOSS_SPECIAL_MIN_CD + Math.random() * 5
      }
    }
  }

  private processBossCast(ei: EnemyInternal, dt: number, playerPos: THREE.Vector3): void {
    ei.bossCastTimer -= dt

    if (ei.bossCasting === 'firebreath') {
      if (ei.bossCastTimer <= BOSS_FIRE_DURATION && !ei.aoeTelegraph) {
        const geo = new THREE.CircleGeometry(5, 20, -0.5, 1)
        const mat = new THREE.MeshBasicMaterial({
          color: 0xff4400,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide,
        })
        const fan = new THREE.Mesh(geo, mat)
        fan.rotation.x = -Math.PI / 2
        fan.position.y = 0.05
        ei.group.add(fan)
        ei.aoeTelegraph = fan
      }

      if (ei.bossCastTimer <= BOSS_FIRE_DURATION && ei.bossCastTimer > 0) {
        if (ei.aoeTelegraph) {
          ;(ei.aoeTelegraph.material as THREE.MeshBasicMaterial).opacity = 0.6
          ;(ei.aoeTelegraph.material as THREE.MeshBasicMaterial).color.setHex(0xff2200)
        }
        ei.burnTickTimer -= dt
        if (ei.burnTickTimer <= 0) {
          const d = Math.sqrt(
            (playerPos.x - ei.state.position.x) ** 2 +
            (playerPos.z - ei.state.position.z) ** 2
          )
          if (d < 5) {
            this.setPlayerBurning(2, 10)
          }
          ei.burnTickTimer = 0.5
        }
      }

      if (ei.bossCastTimer <= 0) {
        this.clearAoeTelegraph(ei)
        ei.bossCasting = null
        ei.burnTickTimer = 0
      }
    } else if (ei.bossCasting === 'groundslam') {
      if (ei.bossCastTimer <= BOSS_SLAM_IMPACT && !ei.aoeTelegraph) {
        const geo = new THREE.RingGeometry(0.5, 4, 24)
        const mat = new THREE.MeshBasicMaterial({
          color: 0xffaa00,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
        })
        const ring = new THREE.Mesh(geo, mat)
        ring.rotation.x = -Math.PI / 2
        ring.position.y = 0.05
        ei.group.add(ring)
        ei.aoeTelegraph = ring
      }

      if (ei.bossCastTimer <= BOSS_SLAM_IMPACT && ei.bossCastTimer > 0) {
        if (ei.aoeTelegraph) {
          ;(ei.aoeTelegraph.material as THREE.MeshBasicMaterial).opacity = 0.8
          ;(ei.aoeTelegraph.material as THREE.MeshBasicMaterial).color.setHex(0xff6600)
        }
        if (!ei.slamHit) {
          const d = Math.sqrt(
            (playerPos.x - ei.state.position.x) ** 2 +
            (playerPos.z - ei.state.position.z) ** 2
          )
          if (d < 4) {
            this.store.getState().damagePlayer(ei.state.attack)
            const dx = playerPos.x - ei.state.position.x
            const dz = playerPos.z - ei.state.position.z
            const len = Math.sqrt(dx * dx + dz * dz)
            if (len > 0.1) {
              this.store.getState().setPlayerPosition({
                x: playerPos.x + (dx / len) * 3,
                y: playerPos.y,
                z: playerPos.z + (dz / len) * 3,
              })
            }
          }
          ei.slamHit = true
        }
      }

      if (ei.bossCastTimer <= 0) {
        this.clearAoeTelegraph(ei)
        ei.bossCasting = null
        ei.slamHit = false
      }
    }
  }

  private bossSummon(ei: EnemyInternal, playerPos: THREE.Vector3): void {
    for (let i = 0; i < 2; i++) {
      const id = this.nextId()
      const angle = Math.random() * Math.PI * 2
      const offset = 2 + Math.random() * 2
      const px = ei.state.position.x + Math.cos(angle) * offset
      const pz = ei.state.position.z + Math.sin(angle) * offset
      const state: EnemyState = {
        id,
        type: 'skeleton',
        name: '迷你骷髅',
        hp: 20,
        maxHp: 20,
        attack: 5,
        defense: 1,
        speed: 1.5,
        position: { x: px, y: 0, z: pz },
        state: 'chase',
        attackTimer: 0,
        attackCooldown: 1.5,
        isBoss: false,
        roomId: ei.state.roomId,
        isTelegraphing: false,
        telegraphTimer: 0,
      }
      const mesh = this.createEnemyMesh('skeleton')
      mesh.position.set(px, 0, pz)
      mesh.scale.set(0.6, 0.6, 0.6)
      this.scene.add(mesh)
      const dir = new THREE.Vector3(
        playerPos.x - px,
        0,
        playerPos.z - pz
      ).normalize()
      const miniEi: EnemyInternal = {
        state,
        group: mesh,
        patrolDir: dir,
        patrolTimer: 1,
        attackCdTimer: 0,
        telegraphSprite: null,
        wobblePhase: 0,
        bossSpecialCd: 0,
        bossCasting: null,
        bossCastTimer: 0,
        aoeTelegraph: null,
        summonCd: 0,
        burnTickTimer: 0,
        slamHit: false,
        summonLifetime: MINI_SKELETON_LIFETIME,
      }
      this.enemies.set(id, miniEi)
    }
  }

  private killEnemy(ei: EnemyInternal): void {
    if (ei.state.state === 'dead') return
    ei.state.state = 'dead'
    this.justDied.push(ei.state.id)
    this.scene.remove(ei.group)
    this.hideTelegraph(ei)
    this.clearAoeTelegraph(ei)
    this.createDeathEffect(ei.state.position)
    if (ei.state.isBoss) {
      this.store.getState().setBossBar(false)
    }
  }

  private createDeathEffect(pos: { x: number; y: number; z: number }): void {
    const geo = new THREE.CylinderGeometry(0.3, 0.8, 4, 8)
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffaa00,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 1,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(pos.x, 2, pos.z)
    this.scene.add(mesh)
    this.deathEffects.push({ mesh, timer: DEATH_EFFECT_DURATION })
  }

  private updateDeathEffects(dt: number): void {
    for (let i = this.deathEffects.length - 1; i >= 0; i--) {
      const de = this.deathEffects[i]
      de.timer -= dt
      const t = Math.max(0, de.timer / DEATH_EFFECT_DURATION)
      const mat = de.mesh.material as THREE.MeshStandardMaterial
      mat.opacity = t
      mat.emissiveIntensity = t * 2
      de.mesh.scale.set(1 + (1 - t) * 0.5, 1, 1 + (1 - t) * 0.5)
      if (de.timer <= 0) {
        this.scene.remove(de.mesh)
        de.mesh.geometry.dispose()
        mat.dispose()
        this.deathEffects.splice(i, 1)
      }
    }
  }

  private clearAoeTelegraph(ei: EnemyInternal): void {
    if (ei.aoeTelegraph) {
      ei.group.remove(ei.aoeTelegraph)
      ei.aoeTelegraph.geometry.dispose()
      ;(ei.aoeTelegraph.material as THREE.Material).dispose()
      ei.aoeTelegraph = null
    }
  }

  damageEnemy(id: string, amount: number): boolean {
    const ei = this.enemies.get(id)
    if (!ei || ei.state.state === 'dead') return false

    const actualDmg = Math.max(1, amount - ei.state.defense)
    ei.state.hp = Math.max(0, ei.state.hp - actualDmg)

    if (ei.state.hp <= 0) {
      this.killEnemy(ei)
      return true
    }

    if (ei.state.isBoss && ei.state.bossPhase !== undefined) {
      const pct = ei.state.hp / ei.state.maxHp
      if (pct < 0.5 && ei.state.bossPhase < 2) ei.state.bossPhase = 2
      else if (pct < 0.25 && ei.state.bossPhase < 3) ei.state.bossPhase = 3
    }

    return false
  }

  getDeadEnemies(): string[] {
    return [...this.justDied]
  }

  dispose(): void {
    this.enemies.forEach((ei) => {
      this.scene.remove(ei.group)
      this.hideTelegraph(ei)
      this.clearAoeTelegraph(ei)
    })
    this.enemies.clear()
    this.deathEffects.forEach((de) => {
      this.scene.remove(de.mesh)
      de.mesh.geometry.dispose()
      ;(de.mesh.material as THREE.Material).dispose()
    })
    this.deathEffects = []
    if (this.telegraphTexture) {
      this.telegraphTexture.dispose()
      this.telegraphTexture = null
    }
    this.clearPlayerBurn()
  }
}
