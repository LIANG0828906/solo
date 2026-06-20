import { useEffect, useRef, useCallback } from 'react'
import * as PIXI from 'pixi.js'
import {
  RuneType,
  creatureConfigs,
  aiMoveDecision,
  aiAttackDecision,
  getTypeMultiplier,
} from '../data/data'

interface BattleRendererProps {
  playerRuneType: RuneType | null
  aiRuneType: RuneType | null
  onBattleEnd: (winner: 'player' | 'ai' | null) => void
  disabled: boolean
}

type BattleState = 'idle' | 'moving' | 'attacking' | 'hit' | 'dead'

interface Creature {
  sprite: PIXI.Container
  shadow: PIXI.Graphics
  type: RuneType
  hp: number
  maxHp: number
  attack: number
  moveSpeed: number
  attackSpeed: number
  state: BattleState
  attackCooldown: number
  targetX: number
  baseX: number
  baseY: number
  bounceTime: number
  attackAnimTime: number
  hitFlashTime: number
  isPlayer: boolean
}

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 400
const PIXEL_SIZE = 8
const CREATURE_SIZE = 64
const ATTACK_RANGE = 60
const SHOCKWAVE_RADIUS = 50

const BattleRenderer = ({
  playerRuneType,
  aiRuneType,
  onBattleEnd,
  disabled,
}: BattleRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const playerRef = useRef<Creature | null>(null)
  const aiRef = useRef<Creature | null>(null)
  const battleEndedRef = useRef(false)
  const layersRef = useRef<{
    container: PIXI.Container
    backgroundLayer: PIXI.Container
    battleLayer: PIXI.Container
    uiLayer: PIXI.Container
    effectLayer: PIXI.Container
  } | null>(null)
  const shakeRef = useRef({ active: false, time: 0, offset: { x: 0, y: 0 } })
  const playerHpBarRef = useRef<{
    bar: PIXI.Graphics
    text: PIXI.Text
    nameText: PIXI.Text
  } | null>(null)
  const aiHpBarRef = useRef<{
    bar: PIXI.Graphics
    text: PIXI.Text
    nameText: PIXI.Text
  } | null>(null)

  const createCreatureSprite = (
    type: RuneType,
    isPlayer: boolean
  ): PIXI.Container => {
    const container = new PIXI.Container()
    const config = creatureConfigs[type]
    const pixelData = config.pixelData

    for (let row = 0; row < pixelData.length; row++) {
      for (let col = 0; col < pixelData[row].length; col++) {
        const color = pixelData[row][col]
        if (color === 'transparent') continue

        const pixel = new PIXI.Graphics()
        pixel.beginFill(parseInt(color.replace('#', ''), 16))
        pixel.drawRect(
          col * PIXEL_SIZE - CREATURE_SIZE / 2,
          row * PIXEL_SIZE - CREATURE_SIZE / 2,
          PIXEL_SIZE,
          PIXEL_SIZE
        )
        pixel.endFill()
        container.addChild(pixel)
      }
    }

    if (!isPlayer) {
      container.scale.x = -1
    }

    return container
  }

  const createShadow = (): PIXI.Graphics => {
    const shadow = new PIXI.Graphics()
    shadow.beginFill(0x000000, 0.3)
    shadow.drawEllipse(0, 0, 32, 12)
    shadow.endFill()
    return shadow
  }

  const createHpBar = (
    x: number,
    y: number,
    isPlayer: boolean,
    name: string
  ): { bar: PIXI.Graphics; text: PIXI.Text; nameText: PIXI.Text } => {
    const barWidth = 200
    const barHeight = 20

    const bg = new PIXI.Graphics()
    bg.beginFill(0x333333)
    bg.drawRoundedRect(x, y, barWidth, barHeight, 4)
    bg.endFill()
    layersRef.current?.uiLayer.addChild(bg)

    const bar = new PIXI.Graphics()
    layersRef.current?.uiLayer.addChild(bar)

    const nameText = new PIXI.Text(name, {
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xffffff,
    })
    nameText.x = x + (isPlayer ? 8 : barWidth - 8)
    nameText.y = y + 2
    nameText.anchor.x = isPlayer ? 0 : 1
    layersRef.current?.uiLayer.addChild(nameText)

    const text = new PIXI.Text('', {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xffffff,
    })
    text.x = x + (isPlayer ? barWidth - 8 : 8)
    text.y = y + 3
    text.anchor.x = isPlayer ? 1 : 0
    layersRef.current?.uiLayer.addChild(text)

    return { bar, text, nameText }
  }

  const updateHpBar = (
    hpBar: { bar: PIXI.Graphics; text: PIXI.Text; nameText: PIXI.Text },
    hp: number,
    maxHp: number,
    x: number,
    y: number
  ) => {
    const barWidth = 200
    const barHeight = 20
    const ratio = Math.max(0, hp / maxHp)

    hpBar.bar.clear()

    const r = Math.floor(255 * (1 - ratio))
    const g = Math.floor(255 * ratio)
    const color = (r << 16) | (g << 8)

    hpBar.bar.beginFill(color)
    hpBar.bar.drawRoundedRect(
      x,
      y,
      barWidth * ratio,
      barHeight,
      4
    )
    hpBar.bar.endFill()

    hpBar.text.text = `${Math.ceil(hp)}/${maxHp}`
  }

  const createAttackEffect = (x: number, y: number) => {
    if (!layersRef.current) return

    const effect = new PIXI.Graphics()
    effect.x = x
    effect.y = y
    layersRef.current.effectLayer.addChild(effect)

    let time = 0
    const duration = 0.3

    const animate = () => {
      time += 1 / 60
      const progress = time / duration

      if (progress >= 1) {
        layersRef.current?.effectLayer.removeChild(effect)
        effect.destroy()
        return
      }

      effect.clear()
      effect.beginFill(0xffffff, 1 - progress)
      effect.drawCircle(0, 0, SHOCKWAVE_RADIUS * (0.5 + progress * 1.5))
      effect.endFill()

      requestAnimationFrame(animate)
    }

    animate()
  }

  const triggerShake = () => {
    shakeRef.current = {
      active: true,
      time: 0.1,
      offset: { x: 0, y: 0 },
    }
  }

  const initBattle = useCallback(() => {
    if (!appRef.current || !layersRef.current) return
    if (!playerRuneType || !aiRuneType) return

    battleEndedRef.current = false

    const playerConfig = creatureConfigs[playerRuneType]
    const aiConfig = creatureConfigs[aiRuneType]

    const playerSprite = createCreatureSprite(playerRuneType, true)
    const playerShadow = createShadow()
    playerSprite.x = 150
    playerSprite.y = 200
    playerShadow.x = 150
    playerShadow.y = 240

    const aiSprite = createCreatureSprite(aiRuneType, false)
    const aiShadow = createShadow()
    aiSprite.x = 450
    aiSprite.y = 200
    aiShadow.x = 450
    aiShadow.y = 240

    layersRef.current.battleLayer.addChild(playerShadow)
    layersRef.current.battleLayer.addChild(playerSprite)
    layersRef.current.battleLayer.addChild(aiShadow)
    layersRef.current.battleLayer.addChild(aiSprite)

    playerRef.current = {
      sprite: playerSprite,
      shadow: playerShadow,
      type: playerRuneType,
      hp: playerConfig.stats.maxHp,
      maxHp: playerConfig.stats.maxHp,
      attack: playerConfig.stats.attack,
      moveSpeed: playerConfig.stats.moveSpeed,
      attackSpeed: playerConfig.stats.attackSpeed,
      state: 'idle',
      attackCooldown: 0,
      targetX: 150,
      baseX: 150,
      baseY: 200,
      bounceTime: 0.6,
      attackAnimTime: 0,
      hitFlashTime: 0,
      isPlayer: true,
    }

    aiRef.current = {
      sprite: aiSprite,
      shadow: aiShadow,
      type: aiRuneType,
      hp: aiConfig.stats.maxHp,
      maxHp: aiConfig.stats.maxHp,
      attack: aiConfig.stats.attack,
      moveSpeed: aiConfig.stats.moveSpeed,
      attackSpeed: aiConfig.stats.attackSpeed,
      state: 'idle',
      attackCooldown: 0,
      targetX: 450,
      baseX: 450,
      baseY: 200,
      bounceTime: 0.6,
      attackAnimTime: 0,
      hitFlashTime: 0,
      isPlayer: false,
    }

    playerHpBarRef.current = createHpBar(30, 20, true, playerConfig.name)
    aiHpBarRef.current = createHpBar(
      CANVAS_WIDTH - 230,
      20,
      false,
      aiConfig.name
    )
  }, [playerRuneType, aiRuneType])

  const clearBattle = () => {
    if (!layersRef.current) return

    if (playerRef.current) {
      layersRef.current.battleLayer.removeChild(playerRef.current.sprite)
      layersRef.current.battleLayer.removeChild(playerRef.current.shadow)
      playerRef.current.sprite.destroy()
      playerRef.current.shadow.destroy()
      playerRef.current = null
    }

    if (aiRef.current) {
      layersRef.current.battleLayer.removeChild(aiRef.current.sprite)
      layersRef.current.battleLayer.removeChild(aiRef.current.shadow)
      aiRef.current.sprite.destroy()
      aiRef.current.shadow.destroy()
      aiRef.current = null
    }

    layersRef.current.uiLayer.removeChildren()
    layersRef.current.effectLayer.removeChildren()

    playerHpBarRef.current = null
    aiHpBarRef.current = null

    if (layersRef.current.container) {
      layersRef.current.container.x = 0
      layersRef.current.container.y = 0
    }
  }

  const updateBounceAnimation = (creature: Creature, delta: number) => {
    if (creature.bounceTime <= 0) return

    creature.bounceTime -= delta

    let offsetY = 0
    let scaleY = 1

    if (creature.bounceTime > 0.3) {
      const t = 1 - (creature.bounceTime - 0.3) / 0.3
      offsetY = -60 * Math.sin(t * Math.PI)
    } else if (creature.bounceTime > 0.2) {
      const t = 1 - (creature.bounceTime - 0.2) / 0.1
      scaleY = 0.7 + 0.3 * t
      offsetY = 0
    } else if (creature.bounceTime > 0) {
      const t = 1 - creature.bounceTime / 0.2
      offsetY = -20 * Math.sin(t * Math.PI)
    }

    creature.sprite.y = creature.baseY + offsetY
    creature.sprite.scale.y = scaleY
  }

  const updateAttackAnimation = (creature: Creature, delta: number) => {
    if (creature.attackAnimTime <= 0) return

    creature.attackAnimTime -= delta

    const t = 1 - creature.attackAnimTime / 0.2
    const offset = Math.sin(t * Math.PI) * 20

    if (creature.isPlayer) {
      creature.sprite.x = creature.baseX + offset
    } else {
      creature.sprite.x = creature.baseX - offset
    }

    if (creature.attackAnimTime <= 0) {
      creature.sprite.x = creature.baseX
    }
  }

  const updateHitFlash = (creature: Creature, delta: number) => {
    if (creature.hitFlashTime <= 0) return

    creature.hitFlashTime -= delta

    const alpha = creature.hitFlashTime > 0 ? 0.7 : 1
    creature.sprite.alpha = alpha
  }

  const updateCreature = (
    creature: Creature,
    opponent: Creature,
    delta: number,
    isPlayer: boolean
  ) => {
    if (creature.state === 'dead') return

    updateBounceAnimation(creature, delta)
    updateAttackAnimation(creature, delta)
    updateHitFlash(creature, delta)

    if (creature.bounceTime > 0) return

    const distance = Math.abs(creature.baseX - opponent.baseX)

    if (creature.attackCooldown > 0) {
      creature.attackCooldown -= delta
    }

    let decision: 'advance' | 'retreat' | 'hold' = 'hold'

    if (isPlayer) {
      if (distance > ATTACK_RANGE) {
        decision = 'advance'
      } else {
        decision = 'hold'
      }
    } else {
      decision = aiMoveDecision(
        distance / 100,
        creature.hp,
        creature.maxHp
      )
    }

    if (decision === 'advance') {
      const direction = isPlayer ? 1 : -1
      creature.baseX += creature.moveSpeed * direction * delta * 60
      creature.state = 'moving'
    } else if (decision === 'retreat') {
      const direction = isPlayer ? -1 : 1
      creature.baseX += creature.moveSpeed * direction * delta * 60
      creature.state = 'moving'
    } else {
      creature.state = 'idle'
    }

    creature.baseX = Math.max(80, Math.min(520, creature.baseX))
    creature.sprite.x = creature.baseX
    creature.shadow.x = creature.baseX

    const shouldAttack = aiAttackDecision(
      distance,
      ATTACK_RANGE,
      creature.attackCooldown
    )

    if (shouldAttack) {
      creature.state = 'attacking'
      creature.attackAnimTime = 0.2
      creature.attackCooldown = 1 / creature.attackSpeed

      createAttackEffect(
        (creature.baseX + opponent.baseX) / 2,
        (creature.baseY + opponent.baseY) / 2
      )

      const multiplier = getTypeMultiplier(creature.type, opponent.type)
      const damage = creature.attack * multiplier

      opponent.hp -= damage
      opponent.state = 'hit'
      opponent.hitFlashTime = 0.15

      triggerShake()

      setTimeout(() => {
        if (opponent.state === 'hit') {
          opponent.state = 'idle'
        }
      }, 150)
    }

    if (creature.hp <= 0) {
      creature.hp = 0
      creature.state = 'dead'
      creature.sprite.alpha = 0.3
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const gameLoop = useCallback((deltaTime: number) => {
    if (!appRef.current || !layersRef.current) return
    if (disabled || battleEndedRef.current) return

    const delta = deltaTime / 60

    if (shakeRef.current.active) {
      shakeRef.current.time -= delta
      if (shakeRef.current.time <= 0) {
        shakeRef.current.active = false
        shakeRef.current.offset = { x: 0, y: 0 }
      } else {
        shakeRef.current.offset = {
          x: (Math.random() - 0.5) * 8,
          y: (Math.random() - 0.5) * 8,
        }
      }
      layersRef.current.container.x = shakeRef.current.offset.x
      layersRef.current.container.y = shakeRef.current.offset.y
    }

    if (playerRef.current && aiRef.current) {
      updateCreature(playerRef.current, aiRef.current, delta, true)
      updateCreature(aiRef.current, playerRef.current, delta, false)

      if (playerHpBarRef.current && playerRef.current) {
        updateHpBar(
          playerHpBarRef.current,
          playerRef.current.hp,
          playerRef.current.maxHp,
          30,
          20
        )
      }

      if (aiHpBarRef.current && aiRef.current) {
        updateHpBar(
          aiHpBarRef.current,
          aiRef.current.hp,
          aiRef.current.maxHp,
          CANVAS_WIDTH - 230,
          20
        )
      }

      if (playerRef.current.state === 'dead' || aiRef.current.state === 'dead') {
        battleEndedRef.current = true
        let winner: 'player' | 'ai' | null = null
        if (playerRef.current.state === 'dead' && aiRef.current.state === 'dead') {
          winner = null
        } else if (playerRef.current.state === 'dead') {
          winner = 'ai'
        } else {
          winner = 'player'
        }
        setTimeout(() => onBattleEnd(winner), 1000)
      }
    }
  }, [disabled, onBattleEnd])

  const drawBackground = () => {
    if (!layersRef.current) return

    const bg = new PIXI.Graphics()
    bg.beginFill(0x2a2a3a)
    bg.drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    bg.endFill()

    bg.lineStyle(1, 0xffffff, 0.1)
    for (let x = 0; x <= CANVAS_WIDTH; x += 40) {
      bg.moveTo(x, 0)
      bg.lineTo(x, CANVAS_HEIGHT)
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += 40) {
      bg.moveTo(0, y)
      bg.lineTo(CANVAS_WIDTH, y)
    }

    layersRef.current.backgroundLayer.addChild(bg)
  }

  useEffect(() => {
    if (!containerRef.current) return

    const app = new PIXI.Application({
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      antialias: true,
      backgroundColor: 0x2a2a3a,
    })

    containerRef.current.appendChild(app.view as HTMLCanvasElement)
    appRef.current = app

    const container = new PIXI.Container()
    const backgroundLayer = new PIXI.Container()
    const battleLayer = new PIXI.Container()
    const uiLayer = new PIXI.Container()
    const effectLayer = new PIXI.Container()

    container.addChild(backgroundLayer)
    container.addChild(battleLayer)
    container.addChild(uiLayer)
    container.addChild(effectLayer)
    app.stage.addChild(container)

    layersRef.current = {
      container,
      backgroundLayer,
      battleLayer,
      uiLayer,
      effectLayer,
    }

    drawBackground()

    app.ticker.add(gameLoop)

    return () => {
      app.ticker.remove(gameLoop)
      clearBattle()
      app.destroy(true, { children: true, texture: true, baseTexture: true })
      appRef.current = null
      layersRef.current = null
    }
  }, [gameLoop])

  useEffect(() => {
    clearBattle()
    if (playerRuneType && aiRuneType && !disabled) {
      initBattle()
    }
  }, [playerRuneType, aiRuneType, disabled, initBattle])

  return <div ref={containerRef} />
}

export default BattleRenderer
