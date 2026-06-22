import { useRef, useEffect, useCallback } from 'react'
import { useCharacter } from '@/contexts/CharacterContext'
import { useRhythm } from '@/contexts/RhythmContext'
import type { EnemyState } from '@/types/game'

const CANVAS_W = 800
const CANVAS_H = 500
const MINION_COUNT_MIN = 3
const MINION_COUNT_MAX = 5

const CHARACTER_COLORS: Record<string, string> = {
  berserker: '#DC2626',
  ranger: '#22C55E',
  sage: '#6366F1',
}

const CHARACTER_SIZES: Record<string, { w: number; h: number }> = {
  berserker: { w: 36, h: 48 },
  ranger: { w: 30, h: 46 },
  sage: { w: 28, h: 44 },
}

function createEnemies(wave: number): EnemyState[] {
  const count = MINION_COUNT_MIN + Math.floor(Math.random() * (MINION_COUNT_MAX - MINION_COUNT_MIN + 1))
  const enemies: EnemyState[] = []
  for (let i = 0; i < count; i++) {
    enemies.push({
      id: `minion-${wave}-${i}`,
      type: 'minion',
      hp: 30 + wave * 10,
      maxHp: 30 + wave * 10,
      position: {
        x: Math.random() > 0.5 ? -20 - Math.random() * 100 : CANVAS_W + 20 + Math.random() * 100,
        y: 300,
      },
      velocity: { x: 0, y: 0 },
      attackCooldown: 0,
      damage: 5 + wave * 2,
      alive: true,
    })
  }
  enemies.push({
    id: `boss-${wave}`,
    type: 'boss',
    hp: 80 + wave * 30,
    maxHp: 80 + wave * 30,
    position: {
      x: Math.random() > 0.5 ? -40 : CANVAS_W + 40,
      y: 280,
    },
    velocity: { x: 0, y: 0 },
    attackCooldown: 0,
    damage: 10 + wave * 5,
    alive: true,
  })
  return enemies
}

export default function GameScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { state: charState } = useCharacter()
  const { state: rhythmState, setWave, decrementEnemies, startWaveTransition, endWaveTransition, triggerScreenShake } = useRhythm()
  const enemiesRef = useRef<EnemyState[]>([])
  const effectsRef = useRef<{ type: string; x: number; y: number; startTime: number; duration: number }[]>([])
  const waveRef = useRef(0)
  const waveTimerRef = useRef(0)
  const shakeRef = useRef({ x: 0, y: 0, endTime: 0 })
  const frameRef = useRef(0)
  const lastTimeRef = useRef(0)

  const spawnWave = useCallback((wave: number) => {
    const enemies = createEnemies(wave)
    enemiesRef.current = enemies
    const totalWaves = 5
    setWave(wave, enemies.length, totalWaves)
  }, [setWave])

  useEffect(() => {
    if (waveRef.current === 0) {
      waveRef.current = 1
      spawnWave(1)
    }
  }, [spawnWave])

  useEffect(() => {
    if (rhythmState.screenShake) {
      shakeRef.current.endTime = Date.now() + 300
    }
  }, [rhythmState.screenShake])

  useEffect(() => {
    if (rhythmState.comboMilestone > 0) {
      const char = charState.characters[charState.activeCharacterId]
      effectsRef.current.push({
        type: 'lightning',
        x: char.position.x,
        y: char.position.y - 40,
        startTime: Date.now(),
        duration: 500,
      })
    }
  }, [rhythmState.comboMilestone, charState.activeCharacterId, charState.characters])

  useEffect(() => {
    const draw = (timestamp: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const dt = Math.min((timestamp - lastTimeRef.current) / 16.67, 3)
      lastTimeRef.current = timestamp

      const now = Date.now()
      let shakeX = 0
      let shakeY = 0
      if (now < shakeRef.current.endTime) {
        shakeX = (Math.random() - 0.5) * 8
        shakeY = (Math.random() - 0.5) * 8
      }

      ctx.save()
      ctx.translate(shakeX, shakeY)

      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_H)
      gradient.addColorStop(0, '#0A0B1E')
      gradient.addColorStop(1, '#1A1B3E')
      ctx.fillStyle = gradient
      ctx.fillRect(-10, -10, CANVAS_W + 20, CANVAS_H + 20)

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
      ctx.lineWidth = 1
      for (let x = 0; x < CANVAS_W; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, CANVAS_H)
        ctx.stroke()
      }
      for (let y = 0; y < CANVAS_H; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(CANVAS_W, y)
        ctx.stroke()
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
      for (let i = 0; i < 8; i++) {
        const sx = ((timestamp * 0.01 + i * 120) % (CANVAS_W + 20)) - 10
        const sy = 30 + Math.sin(timestamp * 0.001 + i) * 20 + i * 55
        ctx.beginPath()
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 320, CANVAS_W, CANVAS_H - 320)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, 320)
      ctx.lineTo(CANVAS_W, 320)
      ctx.stroke()

      const activeChar = charState.characters[charState.activeCharacterId]
      if (activeChar) {
        const charColor = CHARACTER_COLORS[activeChar.id] || '#fff'
        const charSize = CHARACTER_SIZES[activeChar.id] || { w: 32, h: 44 }

        if (charState.haloActive) {
          const haloProgress = Math.min(1, (now - charState.switchCooldownEnd + 500) / 300)
          if (haloProgress >= 0 && haloProgress < 1) {
            const haloRadius = 30 + haloProgress * 25
            const haloAlpha = 1 - haloProgress
            ctx.beginPath()
            ctx.arc(activeChar.position.x, activeChar.position.y - charSize.h / 2, haloRadius, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255, 255, 255, ${haloAlpha * 0.3})`
            ctx.fill()
            ctx.strokeStyle = `rgba(255, 255, 255, ${haloAlpha * 0.8})`
            ctx.lineWidth = 2
            ctx.stroke()
          }
        }

        ctx.save()
        ctx.translate(activeChar.position.x, activeChar.position.y)

        ctx.fillStyle = charColor
        ctx.fillRect(-charSize.w / 2, -charSize.h, charSize.w, charSize.h)

        ctx.fillStyle = '#F5F5F5'
        ctx.beginPath()
        ctx.arc(0, -charSize.h + 12, 8, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#1a1a2e'
        ctx.beginPath()
        ctx.arc(-3, -charSize.h + 10, 2, 0, Math.PI * 2)
        ctx.arc(3, -charSize.h + 10, 2, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.fillRect(-charSize.w / 2 + 3, -charSize.h + 3, 6, charSize.h - 6)

        ctx.restore()

        const hpPercent = activeChar.hp / activeChar.maxHp
        const hpBarW = 40
        ctx.fillStyle = '#333'
        ctx.fillRect(activeChar.position.x - hpBarW / 2, activeChar.position.y + 5, hpBarW, 4)
        const hpGrad = ctx.createLinearGradient(
          activeChar.position.x - hpBarW / 2, 0,
          activeChar.position.x + hpBarW / 2, 0
        )
        hpGrad.addColorStop(0, '#EF4444')
        hpGrad.addColorStop(1, '#DC2626')
        ctx.fillStyle = hpGrad
        ctx.fillRect(activeChar.position.x - hpBarW / 2, activeChar.position.y + 5, hpBarW * hpPercent, 4)
      }

      for (const enemy of enemiesRef.current) {
        if (!enemy.alive) continue

        const dx = activeChar ? activeChar.position.x - enemy.position.x : 0
        const moveSpeed = enemy.type === 'boss' ? 0.8 : 1.2
        if (Math.abs(dx) > 40) {
          enemy.position.x += Math.sign(dx) * moveSpeed * dt
        }

        enemy.position.x = Math.max(10, Math.min(CANVAS_W - 10, enemy.position.x))

        if (enemy.attackCooldown <= 0 && activeChar) {
          const dist = Math.abs(enemy.position.x - activeChar.position.x)
          if (dist < 50) {
            enemy.attackCooldown = 1500
          }
        }
        if (enemy.attackCooldown > 0) {
          enemy.attackCooldown -= 16.67 * dt
        }

        const size = enemy.type === 'boss' ? { w: 44, h: 56 } : { w: 28, h: 38 }
        const color = enemy.type === 'boss' ? '#7C3AED' : '#F97316'

        ctx.fillStyle = color
        ctx.fillRect(enemy.position.x - size.w / 2, enemy.position.y - size.h, size.w, size.h)

        ctx.fillStyle = '#F5F5F5'
        ctx.beginPath()
        ctx.arc(enemy.position.x, enemy.position.y - size.h + 10, 6, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#DC2626'
        ctx.beginPath()
        ctx.arc(enemy.position.x - 2, enemy.position.y - size.h + 8, 2.5, 0, Math.PI * 2)
        ctx.arc(enemy.position.x + 2, enemy.position.y - size.h + 8, 2.5, 0, Math.PI * 2)
        ctx.fill()

        const eHpPercent = enemy.hp / enemy.maxHp
        const eHpW = enemy.type === 'boss' ? 50 : 30
        ctx.fillStyle = '#333'
        ctx.fillRect(enemy.position.x - eHpW / 2, enemy.position.y - size.h - 8, eHpW, 3)
        ctx.fillStyle = '#EF4444'
        ctx.fillRect(enemy.position.x - eHpW / 2, enemy.position.y - size.h - 8, eHpW * eHpPercent, 3)
      }

      effectsRef.current = effectsRef.current.filter(e => now - e.startTime < e.duration)
      for (const effect of effectsRef.current) {
        const progress = (now - effect.startTime) / effect.duration
        if (effect.type === 'lightning') {
          const alpha = 1 - progress
          ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`
          ctx.lineWidth = 2
          for (let i = 0; i < 3; i++) {
            ctx.beginPath()
            let lx = effect.x + (Math.random() - 0.5) * 60
            let ly = effect.y - 20
            ctx.moveTo(lx, ly)
            for (let j = 0; j < 4; j++) {
              lx += (Math.random() - 0.5) * 30
              ly -= 15 + Math.random() * 10
              ctx.lineTo(lx, ly)
            }
            ctx.stroke()
          }
        }
      }

      if (activeChar && rhythmState.comboCount > 0) {
        const skill = activeChar.skills.find(s => s.currentCooldown === 0 || now >= s.currentCooldown)
        if (skill && skill.damage > 0) {
          const nearestEnemy = enemiesRef.current
            .filter(e => e.alive)
            .sort((a, b) => Math.abs(a.position.x - activeChar.position.x) - Math.abs(b.position.x - activeChar.position.x))[0]
          if (nearestEnemy && Math.abs(nearestEnemy.position.x - activeChar.position.x) < skill.range) {
            const dist = Math.abs(nearestEnemy.position.x - activeChar.position.x)
            if (dist > 30) {
              effectsRef.current.push({
                type: 'attack_line',
                x: activeChar.position.x,
                y: activeChar.position.y - 22,
                startTime: now,
                duration: 200,
              })
            }
          }
        }
      }

      const aliveEnemies = enemiesRef.current.filter(e => e.alive)
      if (aliveEnemies.length === 0 && waveRef.current > 0 && waveTimerRef.current === 0) {
        waveTimerRef.current = now
        startWaveTransition(now)

        if (waveRef.current < 5) {
          effectsRef.current.push({
            type: 'wave_clear',
            x: CANVAS_W / 2,
            y: CANVAS_H / 2,
            startTime: now,
            duration: 800,
          })
        }

        setTimeout(() => {
          endWaveTransition()
          if (waveRef.current < 5) {
            waveRef.current++
            spawnWave(waveRef.current)
          }
          waveTimerRef.current = 0
        }, 3000)
      }

      for (const effect of effectsRef.current) {
        if (effect.type === 'wave_clear') {
          const progress = (now - effect.startTime) / effect.duration
          const alpha = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7
          ctx.font = 'bold 28px sans-serif'
          ctx.fillStyle = `rgba(245, 158, 11, ${alpha})`
          ctx.textAlign = 'center'
          ctx.fillText(`WAVE ${waveRef.current} CLEAR`, effect.x, effect.y - 40 + progress * 60)
        }
        if (effect.type === 'attack_line') {
          const alpha = 1 - (now - effect.startTime) / effect.duration
          const nearest = enemiesRef.current.filter(e => e.alive).sort((a, b) =>
            Math.abs(a.position.x - activeChar!.position.x) - Math.abs(b.position.x - activeChar!.position.x)
          )[0]
          if (nearest) {
            ctx.strokeStyle = `rgba(255, 200, 50, ${alpha * 0.6})`
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(effect.x, effect.y)
            ctx.lineTo(nearest.position.x, nearest.position.y - 19)
            ctx.stroke()
          }
        }
      }

      ctx.restore()

      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [charState, rhythmState, spawnWave, startWaveTransition, endWaveTransition])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="game-canvas"
    />
  )
}
