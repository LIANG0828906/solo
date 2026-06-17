import { useEffect, useRef } from 'react'
import { useFightStore, SwordsmanSkill, MageSkill, FightStatus } from './store'

const STAGE_WIDTH = 800
const STAGE_HEIGHT = 600
const GRID_SIZE = 40
const MAX_PARTICLES = 100

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

interface Projectile {
  x: number
  y: number
  startX: number
  startY: number
  targetX: number
  targetY: number
  progress: number
  duration: number
  color: string
  skill: string
  size: number
}

interface SlashEffect {
  x: number
  y: number
  angle: number
  progress: number
  duration: number
}

interface ChargeEffect {
  x: number
  y: number
  progress: number
  duration: number
}

const skillNames: Record<string, string> = {
  heavy_slash: '重斩',
  whirlwind: '旋风斩',
  block: '格挡',
  fireball: '火球',
  ice_spike: '冰锥',
  shield: '护盾',
}

const getSkillColor = (skill: string): string => {
  switch (skill) {
    case 'fireball':
      return '#FF8C00'
    case 'ice_spike':
      return '#00BFFF'
    case 'shield':
      return '#CE93D8'
    case 'heavy_slash':
      return '#FFFFFF'
    case 'whirlwind':
      return '#87CEEB'
    case 'block':
      return '#69F0AE'
    default:
      return '#FFFFFF'
  }
}

const getSkillDamageMultiplier = (skill: string): number => {
  switch (skill) {
    case 'heavy_slash':
      return 1.5
    case 'whirlwind':
      return 1.2
    case 'block':
      return 0.3
    case 'fireball':
      return 1.3
    case 'ice_spike':
      return 1.1
    case 'shield':
      return 0.2
    default:
      return 1
  }
}

const getDefenseMultiplier = (skill: string): number => {
  if (skill === 'block' || skill === 'shield') return 0.5
  return 1
}

const FightStage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])
  const projectilesRef = useRef<Projectile[]>([])
  const slashEffectsRef = useRef<SlashEffect[]>([])
  const chargeEffectsRef = useRef<ChargeEffect[]>([])
  const startTimeRef = useRef<number>(0)
  const swordsmanLastAttackRef = useRef<number>(0)
  const mageLastAttackRef = useRef<number>(0)
  const swordsmanDashingRef = useRef<{ active: boolean; start: number }>({ active: false, start: 0 })
  const mageDashingRef = useRef<{ active: boolean; start: number }>({ active: false, start: 0 })
  const fightEndTimeRef = useRef<number>(0)

  const swordsman = useFightStore((s) => s.swordsman)
  const mage = useFightStore((s) => s.mage)
  const fightStatus = useFightStore((s) => s.fightStatus)
  const winner = useFightStore((s) => s.winner)
  const round = useFightStore((s) => s.round)
  const startFight = useFightStore((s) => s.startFight)
  const resetFight = useFightStore((s) => s.resetFight)
  const recordLog = useFightStore((s) => s.recordLog)
  const applyDamage = useFightStore((s) => s.applyDamage)
  const setWinner = useFightStore((s) => s.setWinner)
  const incrementRound = useFightStore((s) => s.incrementRound)

  const swordsmanState = useRef(swordsman)
  const mageState = useRef(mage)
  const fightStatusState = useRef(fightStatus)
  const winnerState = useRef(winner)
  const roundState = useRef(round)

  useEffect(() => {
    swordsmanState.current = swordsman
  }, [swordsman])
  useEffect(() => {
    mageState.current = mage
  }, [mage])
  useEffect(() => {
    fightStatusState.current = fightStatus
  }, [fightStatus])
  useEffect(() => {
    winnerState.current = winner
  }, [winner])
  useEffect(() => {
    roundState.current = round
  }, [round])

  const addParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      if (particlesRef.current.length >= MAX_PARTICLES) {
        particlesRef.current.shift()
      }
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 40 + Math.random() * 30,
        color,
        size: 2 + Math.random() * 4,
      })
    }
  }

  useEffect(() => {
    if (fightStatus === 'fighting') {
      startTimeRef.current = performance.now()
      swordsmanLastAttackRef.current = performance.now()
      mageLastAttackRef.current = performance.now()
    }
  }, [fightStatus])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const SWORDSMAN_BASE_X = 180
    const MAGE_BASE_X = 620
    const CHARACTER_Y = 350

    const drawGrid = () => {
      ctx.fillStyle = '#2C2C2C'
      ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)

      ctx.strokeStyle = '#A0A0A0'
      ctx.lineWidth = 1
      for (let x = 0; x <= STAGE_WIDTH; x += GRID_SIZE) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, STAGE_HEIGHT)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x + 1, 0)
        ctx.lineTo(x + 1, STAGE_HEIGHT)
        ctx.stroke()
      }
      for (let y = 0; y <= STAGE_HEIGHT; y += GRID_SIZE) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(STAGE_WIDTH, y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, y + 1)
        ctx.lineTo(STAGE_WIDTH, y + 1)
        ctx.stroke()
      }
    }

    const drawScanline = (time: number) => {
      const x = ((time * 0.0008 * STAGE_WIDTH) % (STAGE_WIDTH + 200)) - 100
      const gradient = ctx.createLinearGradient(x - 50, 0, x + 50, 0)
      gradient.addColorStop(0, 'rgba(0, 191, 255, 0)')
      gradient.addColorStop(0.5, 'rgba(0, 191, 255, 0.15)')
      gradient.addColorStop(1, 'rgba(0, 191, 255, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(x - 50, 0, 100, STAGE_HEIGHT)
    }

    const drawAura = (x: number, y: number, color: string, time: number, isDashing: boolean) => {
      const pulse = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(time * 0.004))
      let offsetX = 0
      if (isDashing) {
        const dashProgress = Math.min((performance.now() - swordsmanDashingRef.current.start) / 300, 1)
        offsetX = color === '#00BFFF' ? Math.sin(dashProgress * Math.PI) * 60 : -Math.sin(dashProgress * Math.PI) * 60
      }
      ctx.beginPath()
      ctx.arc(x + offsetX, y, 55, 0, Math.PI * 2)
      ctx.fillStyle = color + Math.floor(pulse * 255).toString(16).padStart(2, '0')
      ctx.fill()
      return offsetX
    }

    const drawCharacter = (
      x: number,
      y: number,
      color: string,
      type: 'swordsman' | 'mage',
      hp: number,
      maxHp: number,
      scale: number = 1,
      rotation: number = 0
    ) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.scale(scale, scale)

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(0, -30, 20, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = color
      ctx.fillRect(-15, -10, 30, 50)

      if (type === 'swordsman') {
        ctx.strokeStyle = '#C0C0C0'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(15, 0)
        ctx.lineTo(45, -30)
        ctx.stroke()
      } else {
        ctx.strokeStyle = '#8B4513'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(15, -10)
        ctx.lineTo(35, -50)
        ctx.stroke()
        ctx.fillStyle = '#9C27B0'
        ctx.beginPath()
        ctx.arc(35, -55, 8, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()

      const barWidth = 80
      const barHeight = 8
      const barX = x - barWidth / 2
      const barY = y - 80

      ctx.fillStyle = '#444444'
      ctx.fillRect(barX, barY, barWidth, barHeight)
      ctx.fillStyle = color
      ctx.fillRect(barX, barY, barWidth * (hp / maxHp), barHeight)
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 1
      ctx.strokeRect(barX, barY, barWidth, barHeight)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${hp}/${maxHp}`, x, barY - 4)
    }

    const drawSlashEffects = () => {
      slashEffectsRef.current = slashEffectsRef.current.filter((s) => s.progress < 1)
      for (const slash of slashEffectsRef.current) {
        const alpha = 1 - slash.progress
        ctx.save()
        ctx.translate(slash.x, slash.y)
        ctx.rotate(slash.angle)
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.arc(0, 0, 50 * (0.5 + slash.progress * 0.5), -Math.PI / 3, Math.PI / 3)
        ctx.stroke()
        ctx.restore()
        slash.progress += 1 / slash.duration
      }
    }

    const drawChargeEffects = () => {
      chargeEffectsRef.current = chargeEffectsRef.current.filter((c) => c.progress < 1)
      for (const charge of chargeEffectsRef.current) {
        const pulse = 0.5 + 0.5 * Math.sin(charge.progress * Math.PI * 6)
        ctx.beginPath()
        ctx.arc(charge.x, charge.y - 50, 10 + pulse * 8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(156, 39, 176, ${0.3 + charge.progress * 0.5})`
        ctx.fill()
        charge.progress += 1 / charge.duration
      }
    }

    const drawProjectiles = () => {
      projectilesRef.current = projectilesRef.current.filter((p) => {
        if (p.progress >= 1) {
          addParticles(p.x, p.y, p.color, 15)
          return false
        }
        p.progress += 1 / p.duration
        p.x = p.startX + (p.targetX - p.startX) * p.progress
        p.y = p.startY + (p.targetY - p.startY) * p.progress
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2)
        ctx.fillStyle = p.color + '55'
        ctx.fill()
        return true
      })
    }

    const drawParticles = () => {
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05
        p.life -= 1 / p.maxLife
        if (p.life <= 0) return false
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        if (p.color === '#FF8C00') {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 1.5)
        } else if (p.color === '#00BFFF') {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y - p.size)
          ctx.lineTo(p.x - p.size / 2, p.y + p.size / 2)
          ctx.lineTo(p.x + p.size / 2, p.y + p.size / 2)
          ctx.closePath()
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
        return true
      })
    }

    const drawVictory = (time: number) => {
      if (!winnerState.current) return
      const winnerChar = winnerState.current === 'swordsman' ? swordsmanState.current : mageState.current
      const color = winnerState.current === 'swordsman' ? '#00BFFF' : '#FF4080'
      const x = winnerState.current === 'swordsman' ? SWORDSMAN_BASE_X : MAGE_BASE_X
      const scale = 1.5
      const rotation = (time % 3000) / 3000 * Math.PI * 2
      drawCharacter(x, CHARACTER_Y, color, winnerState.current, winnerChar.hp, winnerChar.maxHp, scale, rotation)

      const flash = Math.floor(time / 150) % 2 === 0
      if (flash) {
        ctx.font = 'bold 48px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillStyle = color
        ctx.shadowColor = color
        ctx.shadowBlur = 20
        ctx.fillText(
          winnerState.current === 'swordsman' ? '剑士胜利!' : '法师胜利!',
          STAGE_WIDTH / 2,
          150
        )
        ctx.shadowBlur = 0
      }
    }

    const executeSwordsmanAttack = () => {
      const skill = swordsmanState.current.skill as SwordsmanSkill
      const baseAttack = swordsmanState.current.attack
      const dmgMult = getSkillDamageMultiplier(skill)
      const defMult = getDefenseMultiplier(mageState.current.skill as MageSkill)
      const damage = Math.floor(baseAttack * dmgMult * defMult)

      swordsmanDashingRef.current = { active: true, start: performance.now() }
      setTimeout(() => {
        swordsmanDashingRef.current.active = false
        slashEffectsRef.current.push({
          x: MAGE_BASE_X - 20,
          y: CHARACTER_Y,
          angle: Math.PI,
          progress: 0,
          duration: 18,
        })
        addParticles(MAGE_BASE_X, CHARACTER_Y, getSkillColor(skill), 8)

        if (skill === 'block') {
          recordLog(`回合${roundState.current}：剑士使用格挡，防御姿态`, 'defense')
        } else {
          applyDamage('mage', damage)
          recordLog(
            `回合${roundState.current}：剑士使用${skillNames[skill]}造成${damage}点伤害`,
            skill === 'whirlwind' ? 'special' : 'attack'
          )
        }

        if (mageState.current.hp - damage <= 0) {
          setTimeout(() => {
            setWinner('swordsman')
            fightEndTimeRef.current = performance.now()
            setTimeout(() => resetFight(), 3000)
          }, 500)
        }
      }, 200)
    }

    const executeMageAttack = () => {
      const skill = mageState.current.skill as MageSkill
      const baseAttack = mageState.current.attack
      const dmgMult = getSkillDamageMultiplier(skill)
      const defMult = getDefenseMultiplier(swordsmanState.current.skill as SwordsmanSkill)
      const damage = Math.floor(baseAttack * dmgMult * defMult)

      chargeEffectsRef.current.push({
        x: MAGE_BASE_X,
        y: CHARACTER_Y,
        progress: 0,
        duration: 30,
      })

      setTimeout(() => {
        projectilesRef.current.push({
          x: MAGE_BASE_X,
          y: CHARACTER_Y - 40,
          startX: MAGE_BASE_X,
          startY: CHARACTER_Y - 40,
          targetX: SWORDSMAN_BASE_X,
          targetY: CHARACTER_Y - 40,
          progress: 0,
          duration: 48,
          color: getSkillColor(skill),
          skill,
          size: skill === 'ice_spike' ? 8 : 12,
        })

        setTimeout(() => {
          if (skill === 'shield') {
            recordLog(`回合${roundState.current}：法师使用护盾，防御姿态`, 'defense')
          } else {
            applyDamage('swordsman', damage)
            recordLog(
              `回合${roundState.current}：法师使用${skillNames[skill]}造成${damage}点伤害`,
              'special'
            )
          }

          if (swordsmanState.current.hp - damage <= 0) {
            setTimeout(() => {
              setWinner('mage')
              fightEndTimeRef.current = performance.now()
              setTimeout(() => resetFight(), 3000)
            }, 500)
          }
        }, 800)
      }, 500)
    }

    let lastRoundTime = performance.now()

    const animate = (time: number) => {
      drawGrid()

      if (fightStatusState.current === 'fighting') {
        drawScanline(time)

        const now = performance.now()
        if (now - swordsmanLastAttackRef.current >= 1500) {
          swordsmanLastAttackRef.current = now
          executeSwordsmanAttack()
        }
        if (now - mageLastAttackRef.current >= 2000) {
          mageLastAttackRef.current = now
          executeMageAttack()
        }
        if (now - lastRoundTime >= 2000) {
          lastRoundTime = now
          incrementRound()
        }
      }

      drawChargeEffects()
      drawProjectiles()

      const swordOffset = drawAura(
        SWORDSMAN_BASE_X,
        CHARACTER_Y,
        '#00BFFF',
        time,
        swordsmanDashingRef.current.active
      )
      drawAura(MAGE_BASE_X, CHARACTER_Y, '#FF4080', time, false)

      if (fightStatusState.current !== 'victory') {
        drawCharacter(
          SWORDSMAN_BASE_X + swordOffset,
          CHARACTER_Y,
          '#1E88E5',
          'swordsman',
          swordsmanState.current.hp,
          swordsmanState.current.maxHp
        )
        drawCharacter(
          MAGE_BASE_X,
          CHARACTER_Y,
          '#E53935',
          'mage',
          mageState.current.hp,
          mageState.current.maxHp
        )
      }

      drawSlashEffects()
      drawParticles()

      if (fightStatusState.current === 'victory') {
        drawVictory(time)
      }

      if (fightStatusState.current === 'fighting') {
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '16px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`回合: ${roundState.current}`, 20, 30)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={STAGE_WIDTH}
      height={STAGE_HEIGHT}
      style={{
        border: '2px solid #444',
        borderRadius: '8px',
        boxShadow: '0 0 30px rgba(0, 191, 255, 0.2)',
      }}
    />
  )
}

export default FightStage
