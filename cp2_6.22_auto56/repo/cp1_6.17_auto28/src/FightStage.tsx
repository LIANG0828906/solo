import { useRef, useEffect, useState } from 'react'
import { useCombatStore } from './store'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  type: 'fire' | 'ice' | 'slash'
}

interface Projectile {
  x: number
  y: number
  targetX: number
  targetY: number
  progress: number
  color: string
  type: 'fireball' | 'iceShard'
}

const STAGE_WIDTH = 800
const STAGE_HEIGHT = 600
const GRID_SIZE = 40
const MAX_PARTICLES = 100

function FightStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])
  const projectilesRef = useRef<Projectile[]>([])
  const [animState, setAnimState] = useState({
    swordsmanOffset: 0,
    mageOffset: 0,
    slashProgress: 0,
    showSlash: false,
    projectileProgress: 0,
    showProjectile: false,
    victoryRotation: 0,
    victoryScale: 1
  })
  const lastRoundRef = useRef(0)

  const { isFighting, round, winner, showVictory, swordsman, mage } = useCombatStore()

  const addParticles = (x: number, y: number, type: 'fire' | 'ice' | 'slash', count: number) => {
    const colors = {
      fire: ['#FF6B35', '#FF8C42', '#FFD93D', '#FF4500'],
      ice: ['#00BFFF', '#87CEEB', '#E0FFFF', '#4169E1'],
      slash: ['#FFFFFF', '#E0E0E0', '#B0B0B0']
    }

    for (let i = 0; i < count && particlesRef.current.length < MAX_PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 4
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 30 + Math.random() * 30,
        color: colors[type][Math.floor(Math.random() * colors[type].length)],
        size: type === 'slash' ? 3 + Math.random() * 2 : 4 + Math.random() * 4,
        type
      })
    }
  }

  useEffect(() => {
    if (isFighting && round > lastRoundRef.current) {
      lastRoundRef.current = round

      setAnimState(prev => ({ ...prev, swordsmanOffset: 1, showSlash: true, slashProgress: 0 }))
      setTimeout(() => setAnimState(prev => ({ ...prev, swordsmanOffset: 0 })), 300)
      setTimeout(() => {
        setAnimState(prev => ({ ...prev, showSlash: false }))
        addParticles(650, 300, 'slash', 15)
      }, 600)

      setTimeout(() => {
        setAnimState(prev => ({ ...prev, mageOffset: 1, showProjectile: true, projectileProgress: 0 }))
        
        const skillType = mage.skill === '火球' ? 'fireball' : 'iceShard'
        const particleType = mage.skill === '火球' ? 'fire' : 'ice'
        const color = mage.skill === '火球' ? '#FF6B35' : '#00BFFF'

        projectilesRef.current.push({
          x: 650,
          y: 280,
          targetX: 150,
          targetY: 300,
          progress: 0,
          color,
          type: skillType
        })

        setTimeout(() => {
          setAnimState(prev => ({ ...prev, mageOffset: 0 }))
        }, 500)

        setTimeout(() => {
          setAnimState(prev => ({ ...prev, showProjectile: false }))
          addParticles(150, 300, particleType, 25)
          projectilesRef.current = []
        }, 1300)
      }, 500)
    }
  }, [isFighting, round, mage.skill])

  useEffect(() => {
    if (showVictory) {
      const startTime = Date.now()
      const animateVictory = () => {
        const elapsed = Date.now() - startTime
        const rotation = (elapsed / 3000) * 360
        const scale = 1 + Math.sin(elapsed / 200) * 0.1
        setAnimState(prev => ({ ...prev, victoryRotation: rotation, victoryScale: 1.5 + scale * 0.1 }))
        if (elapsed < 3000) {
          requestAnimationFrame(animateVictory)
        }
      }
      animateVictory()
    } else {
      setAnimState(prev => ({ ...prev, victoryRotation: 0, victoryScale: 1 }))
    }
  }, [showVictory])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = (currentTime: number) => {

      ctx.fillStyle = '#2C2C2C'
      ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)

      ctx.strokeStyle = '#A0A0A0'
      ctx.lineWidth = 0.5
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

      const time = currentTime / 1000
      const pulseAlpha = 0.3 + Math.sin(time * 4) * 0.5

      if (!showVictory || winner === 'swordsman') {
        ctx.save()
        ctx.globalAlpha = pulseAlpha
        ctx.fillStyle = '#00BFFF'
        ctx.beginPath()
        ctx.arc(150, 300, 50, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      if (!showVictory || winner === 'mage') {
        ctx.save()
        ctx.globalAlpha = pulseAlpha
        ctx.fillStyle = '#FF4080'
        ctx.beginPath()
        ctx.arc(650, 300, 50, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      const swordsmanX = 150 + animState.swordsmanOffset * 100
      const mageX = 650 - animState.mageOffset * 80

      if (animState.showSlash) {
        const slashProgress = Math.min(1, animState.slashProgress + 0.1)
        setAnimState(prev => ({ ...prev, slashProgress: slashProgress }))
        
        ctx.save()
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 4
        ctx.globalAlpha = 1 - slashProgress
        ctx.beginPath()
        ctx.arc(swordsmanX + 50, 300, 80, -Math.PI / 3 + slashProgress * Math.PI, Math.PI / 3 + slashProgress * Math.PI)
        ctx.stroke()
        ctx.restore()
      }

      drawCharacter(ctx, swordsmanX, 300, 'swordsman', swordsman, showVictory && winner === 'swordsman', animState)
      drawCharacter(ctx, mageX, 300, 'mage', mage, showVictory && winner === 'mage', animState)

      projectilesRef.current.forEach(proj => {
        proj.progress += 0.025
        const t = proj.progress
        const x = proj.x + (proj.targetX - proj.x) * t
        const y = proj.y + (proj.targetY - proj.y) * t + Math.sin(t * Math.PI) * 30

        ctx.save()
        ctx.fillStyle = proj.color
        ctx.shadowColor = proj.color
        ctx.shadowBlur = 20
        ctx.beginPath()
        if (proj.type === 'fireball') {
          ctx.arc(x, y, 15, 0, Math.PI * 2)
        } else {
          ctx.beginPath()
          ctx.moveTo(x, y - 20)
          ctx.lineTo(x - 8, y + 10)
          ctx.lineTo(x + 8, y + 10)
          ctx.closePath()
        }
        ctx.fill()
        ctx.restore()
      })

      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.1
        p.life -= 1 / p.maxLife

        if (p.life <= 0) return false

        ctx.save()
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        if (p.type === 'slash') {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size * 3, p.size)
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()

        return true
      })

      if (showVictory && winner) {
        const winnerChar = winner === 'swordsman' ? swordsman : mage
        ctx.save()
        ctx.fillStyle = winnerChar.color
        ctx.shadowColor = winnerChar.color
        ctx.shadowBlur = 30
        ctx.font = 'bold 48px sans-serif'
        ctx.textAlign = 'center'
        ctx.globalAlpha = 0.5 + Math.sin(time * 5) * 0.5
        ctx.fillText(`${winnerChar.name}胜利!`, STAGE_WIDTH / 2, 100)
        ctx.restore()
      }

      if (isFighting) {
        ctx.save()
        ctx.fillStyle = '#E0E0E0'
        ctx.font = 'bold 20px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`回合 ${round}`, STAGE_WIDTH / 2, 40)
        ctx.restore()
      }

      drawHpBar(ctx, 30, 30, swordsman)
      drawHpBar(ctx, STAGE_WIDTH - 230, 30, mage)

      animationRef.current = requestAnimationFrame(render)
    }

    animationRef.current = requestAnimationFrame(render)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isFighting, round, showVictory, winner, swordsman, mage, animState])

  return (
    <canvas
      ref={canvasRef}
      width={STAGE_WIDTH}
      height={STAGE_HEIGHT}
      style={{
        borderRadius: '12px',
        boxShadow: '0 0 30px rgba(0, 191, 255, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.5)',
        border: '2px solid #333'
      }}
    />
  )
}

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: 'swordsman' | 'mage',
  char: { color: string; skill: string },
  isVictory: boolean,
  animState: { victoryRotation: number; victoryScale: number }
) {
  ctx.save()

  if (isVictory) {
    ctx.translate(x, y)
    ctx.rotate((animState.victoryRotation * Math.PI) / 180)
    ctx.scale(animState.victoryScale, animState.victoryScale)
    ctx.translate(-x, -y)
  }

  const color = char.color

  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 15

  ctx.beginPath()
  ctx.arc(x, y - 20, 18, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.arc(x - 6, y - 22, 3, 0, Math.PI * 2)
  ctx.arc(x + 6, y - 22, 3, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = color
  ctx.fillRect(x - 20, y - 2, 40, 45)

  if (type === 'swordsman') {
    ctx.fillStyle = '#888'
    ctx.fillRect(x + 20, y - 50, 6, 60)
    ctx.fillStyle = '#FFD700'
    ctx.fillRect(x + 17, y + 5, 12, 8)
  } else {
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(x + 15, y - 55, 5, 70)
    ctx.fillStyle = char.skill === '火球' ? '#FF6B35' : '#00BFFF'
    ctx.beginPath()
    ctx.arc(x + 17, y - 58, 10, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

function drawHpBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  char: { name: string; currentHp: number; maxHp: number; color: string }
) {
  const barWidth = 200
  const barHeight = 24

  ctx.save()

  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(x, y, barWidth, barHeight)

  ctx.strokeStyle = '#444'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, barWidth, barHeight)

  const hpPercent = Math.max(0, char.currentHp / char.maxHp)
  const gradient = ctx.createLinearGradient(x, y, x + barWidth * hpPercent, y)
  gradient.addColorStop(0, char.color)
  gradient.addColorStop(1, adjustBrightness(char.color, -30))

  ctx.fillStyle = gradient
  ctx.fillRect(x + 2, y + 2, (barWidth - 4) * hpPercent, barHeight - 4)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(
    `${char.name}: ${char.currentHp}/${char.maxHp}`,
    x + barWidth / 2,
    y + barHeight / 2 + 4
  )

  ctx.restore()
}

function adjustBrightness(color: string, amount: number): string {
  const hex = color.replace('#', '')
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount))
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount))
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount))
  return `rgb(${r}, ${g}, ${b})`
}

export default FightStage
