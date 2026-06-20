import type { Mood } from '../store'

interface Particle {
  x: number
  y: number
  size: number
  baseY: number
  speed: number
  phase: number
  opacity: number
}

export class AssistantAnimator {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private mood: Mood = 'happy'
  private targetMood: Mood = 'happy'
  private moodTransition = 1
  private particles: Particle[] = []
  private animationId: number | null = null
  private time = 0
  private isSpeaking = false
  private scale = 1

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.initParticles()
    this.resize()
  }

  private initParticles() {
    this.particles = []
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30 + Math.random() * 0.5
      const radius = 80 + Math.random() * 100
      this.particles.push({
        x: 0,
        y: 0,
        size: 2 + Math.random() * 2,
        baseY: 0,
        speed: 3 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        opacity: 0.5 + Math.random() * 0.5,
      })
    }
  }

  setScale(scale: number) {
    this.scale = scale
    this.resize()
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = rect.width * dpr
    this.canvas.height = rect.height * dpr
    this.ctx.scale(dpr, dpr)
  }

  setMood(mood: Mood) {
    if (this.targetMood !== mood) {
      this.targetMood = mood
      this.moodTransition = 0
    }
  }

  setSpeaking(speaking: boolean) {
    this.isSpeaking = speaking
  }

  start() {
    const animate = () => {
      this.time += 0.016
      this.render()
      this.animationId = requestAnimationFrame(animate)
    }
    animate()
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private render() {
    const w = this.canvas.width / (window.devicePixelRatio || 1)
    const h = this.canvas.height / (window.devicePixelRatio || 1)
    this.ctx.clearRect(0, 0, w, h)

    if (this.moodTransition < 1) {
      this.moodTransition = Math.min(1, this.moodTransition + 0.03)
      if (this.moodTransition >= 1) {
        this.mood = this.targetMood
      }
    }

    this.updateParticles(w, h)
    this.drawParticles(w, h)
    this.drawAssistant(w, h)
  }

  private updateParticles(w: number, h: number) {
    const cx = w / 2
    const cy = h * 0.4

    this.particles.forEach((p, i) => {
      const angle = (Math.PI * 2 * i) / this.particles.length + Math.sin(this.time * 0.5 + p.phase) * 0.3
      const baseRadius = 80 + Math.sin(this.time * p.speed * 0.3 + p.phase) * 20
      const targetRadius = this.isSpeaking ? 40 + Math.random() * 60 : baseRadius

      const targetX = cx + Math.cos(angle) * targetRadius
      const targetY = cy + Math.sin(angle) * targetRadius * 0.6 + Math.sin(this.time * p.speed + p.phase) * 15

      p.x += (targetX - p.x) * 0.05
      p.y += (targetY - p.y) * 0.05
    })
  }

  private drawParticles(w: number, h: number) {
    this.particles.forEach(p => {
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
      gradient.addColorStop(0, `rgba(240, 230, 140, ${p.opacity})`)
      gradient.addColorStop(1, 'rgba(240, 230, 140, 0)')
      this.ctx.fillStyle = gradient
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
      this.ctx.fill()
    })
  }

  private drawAssistant(w: number, h: number) {
    const s = this.scale
    const cx = w / 2
    const cy = h * 0.4
    const bobY = Math.sin(this.time * 2) * 3 * s

    this.ctx.save()
    this.ctx.translate(cx, cy + bobY)

    this.drawBody(s)
    this.drawHead(s)
    this.drawFace(s)
    this.drawHair(s)

    this.ctx.restore()
  }

  private drawBody(s: number) {
    this.ctx.save()
    this.ctx.translate(0, 80 * s)

    const bodyGradient = this.ctx.createLinearGradient(0, 0, 0, 150 * s)
    bodyGradient.addColorStop(0, '#C084FC')
    bodyGradient.addColorStop(1, '#8B5CF6')

    this.ctx.fillStyle = bodyGradient
    this.ctx.beginPath()
    this.ctx.moveTo(-35 * s, 0)
    this.ctx.quadraticCurveTo(-45 * s, 80 * s, -30 * s, 140 * s)
    this.ctx.lineTo(30 * s, 140 * s)
    this.ctx.quadraticCurveTo(45 * s, 80 * s, 35 * s, 0)
    this.ctx.closePath()
    this.ctx.fill()

    this.ctx.fillStyle = 'rgba(255,255,255,0.15)'
    this.ctx.beginPath()
    this.ctx.ellipse(-10 * s, 40 * s, 8 * s, 25 * s, -0.3, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = '#F0E68C'
    this.ctx.beginPath()
    this.ctx.arc(0, 5 * s, 8 * s, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.restore()
  }

  private drawHead(s: number) {
    this.ctx.save()
    this.ctx.translate(0, 10 * s)

    const headGradient = this.ctx.createRadialGradient(-15 * s, -20 * s, 5 * s, 0, 0, 60 * s)
    headGradient.addColorStop(0, '#FFE4C4')
    headGradient.addColorStop(0.7, '#F5DEB3')
    headGradient.addColorStop(1, '#DEB887')

    this.ctx.fillStyle = headGradient
    this.ctx.beginPath()
    this.ctx.ellipse(0, 0, 48 * s, 55 * s, 0, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = 'rgba(255, 182, 193, 0.4)'
    this.ctx.beginPath()
    this.ctx.ellipse(-30 * s, 15 * s, 10 * s, 7 * s, 0, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.beginPath()
    this.ctx.ellipse(30 * s, 15 * s, 10 * s, 7 * s, 0, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.restore()
  }

  private drawHair(s: number) {
    this.ctx.save()
    this.ctx.translate(0, 10 * s)

    this.ctx.fillStyle = '#4A1A6B'
    this.ctx.beginPath()
    this.ctx.moveTo(-45 * s, -10 * s)
    this.ctx.quadraticCurveTo(-50 * s, -60 * s, 0, -58 * s)
    this.ctx.quadraticCurveTo(50 * s, -60 * s, 45 * s, -10 * s)
    this.ctx.quadraticCurveTo(40 * s, -30 * s, 20 * s, -35 * s)
    this.ctx.quadraticCurveTo(0, -40 * s, -20 * s, -35 * s)
    this.ctx.quadraticCurveTo(-40 * s, -30 * s, -45 * s, -10 * s)
    this.ctx.closePath()
    this.ctx.fill()

    this.ctx.fillStyle = '#5C2B7E'
    this.ctx.beginPath()
    this.ctx.moveTo(-35 * s, -20 * s)
    this.ctx.quadraticCurveTo(-20 * s, -35 * s, 0, -32 * s)
    this.ctx.quadraticCurveTo(20 * s, -35 * s, 35 * s, -20 * s)
    this.ctx.quadraticCurveTo(25 * s, -25 * s, 0, -25 * s)
    this.ctx.quadraticCurveTo(-25 * s, -25 * s, -35 * s, -20 * s)
    this.ctx.closePath()
    this.ctx.fill()

    this.ctx.restore()
  }

  private drawFace(s: number) {
    const mood = this.moodTransition < 1 ? this.mood : this.targetMood
    const t = this.moodTransition

    this.ctx.save()
    this.ctx.translate(0, 10 * s)

    this.drawEyes(s, mood, t)
    this.drawMouth(s, mood, t)
    this.drawBrows(s, mood, t)

    this.ctx.restore()
  }

  private lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
  }

  private drawEyes(s: number, mood: Mood, t: number) {
    const eyeY = -5 * s
    const eyeSpacing = 18 * s

    const getEyeParams = (m: Mood) => {
      switch (m) {
        case 'happy':
          return { size: 6, height: 8, closed: false, sparkle: true }
        case 'confused':
          return { size: 5, height: 7, closed: false, sparkle: false }
        case 'thinking':
          return { size: 4, height: 5, closed: false, sparkle: false }
        case 'encouraging':
          return { size: 7, height: 9, closed: false, sparkle: true }
        default:
          return { size: 6, height: 8, closed: false, sparkle: true }
      }
    }

    const from = getEyeParams(this.mood)
    const to = getEyeParams(mood)

    const eyeW = this.lerp(from.size, to.size, t) * s
    const eyeH = this.lerp(from.height, to.height, t) * s

    const blink = Math.sin(this.time * 3) > 0.95 ? 0.2 : 1
    const finalH = eyeH * blink

    const sides: number[] = [-1, 1]
    sides.forEach(side => {
      this.ctx.fillStyle = '#FFFFFF'
      this.ctx.beginPath()
      this.ctx.ellipse(side * eyeSpacing, eyeY, eyeW + 2, finalH + 2, 0, 0, Math.PI * 2)
      this.ctx.fill()

      if (blink > 0.3) {
        this.ctx.fillStyle = '#2D1B4E'
        this.ctx.beginPath()
        this.ctx.ellipse(side * eyeSpacing + (mood === 'thinking' ? side * 2 : 0), eyeY, eyeW * 0.7, finalH * 0.8, 0, 0, Math.PI * 2)
        this.ctx.fill()

        if (to.sparkle) {
          this.ctx.fillStyle = '#FFFFFF'
          this.ctx.beginPath()
          this.ctx.arc(side * eyeSpacing - 1.5 * s, eyeY - 2 * s, 1.5 * s, 0, Math.PI * 2)
          this.ctx.fill()
        }
      }

      if (mood === 'happy') {
        this.ctx.strokeStyle = '#2D1B4E'
        this.ctx.lineWidth = 1.5 * s
        this.ctx.beginPath()
        this.ctx.arc(side * eyeSpacing, eyeY + 2 * s, eyeW + 3 * s, Math.PI * 1.15, Math.PI * 1.85)
        this.ctx.stroke()
      }
    })
  }

  private drawMouth(s: number, mood: Mood, t: number) {
    const mouthY = 18 * s

    this.ctx.strokeStyle = '#8B4557'
    this.ctx.lineWidth = 2 * s
    this.ctx.lineCap = 'round'

    this.ctx.beginPath()
    switch (mood) {
      case 'happy':
        this.ctx.arc(0, mouthY - 3 * s, 12 * s, 0.15 * Math.PI, 0.85 * Math.PI)
        break
      case 'confused':
        this.ctx.moveTo(-10 * s, mouthY + 2 * s)
        this.ctx.quadraticCurveTo(0, mouthY - 3 * s, 10 * s, mouthY + 5 * s)
        break
      case 'thinking':
        this.ctx.moveTo(-8 * s, mouthY + 3 * s)
        this.ctx.lineTo(5 * s, mouthY + 3 * s)
        this.ctx.beginPath()
        this.ctx.arc(8 * s, mouthY, 4 * s, 0, Math.PI * 2)
        this.ctx.fillStyle = '#8B4557'
        this.ctx.fill()
        return
      case 'encouraging':
        this.ctx.arc(0, mouthY - 5 * s, 15 * s, 0.1 * Math.PI, 0.9 * Math.PI)
        break
    }
    this.ctx.stroke()

    if (mood === 'happy' || mood === 'encouraging') {
      this.ctx.fillStyle = 'rgba(255, 105, 135, 0.3)'
      this.ctx.beginPath()
      const depth = mood === 'encouraging' ? 8 : 5
      this.ctx.ellipse(0, mouthY, 8 * s, depth * s, 0, 0, Math.PI)
      this.ctx.fill()
    }
  }

  private drawBrows(s: number, mood: Mood, t: number) {
    const browY = -20 * s
    const browSpacing = 18 * s
    const browSides: number[] = [-1, 1]

    this.ctx.strokeStyle = '#4A1A6B'
    this.ctx.lineWidth = 2 * s
    this.ctx.lineCap = 'round'

    switch (mood) {
      case 'happy':
        browSides.forEach(side => {
          this.ctx.beginPath()
          this.ctx.moveTo(side * (browSpacing - 5 * s), browY + 2 * s)
          this.ctx.quadraticCurveTo(side * browSpacing, browY - 2 * s, side * (browSpacing + 5 * s), browY + 2 * s)
          this.ctx.stroke()
        })
        break
      case 'confused':
        this.ctx.beginPath()
        this.ctx.moveTo(-browSpacing - 5 * s, browY - 3 * s)
        this.ctx.lineTo(-browSpacing + 5 * s, browY + 2 * s)
        this.ctx.stroke()
        this.ctx.beginPath()
        this.ctx.moveTo(browSpacing - 5 * s, browY - 3 * s)
        this.ctx.lineTo(browSpacing + 5 * s, browY + 2 * s)
        this.ctx.stroke()
        break
      case 'thinking':
        this.ctx.beginPath()
        this.ctx.moveTo(-browSpacing - 5 * s, browY + 2 * s)
        this.ctx.lineTo(-browSpacing + 5 * s, browY - 3 * s)
        this.ctx.stroke()
        this.ctx.beginPath()
        this.ctx.moveTo(browSpacing - 5 * s, browY)
        this.ctx.lineTo(browSpacing + 5 * s, browY)
        this.ctx.stroke()
        break
      case 'encouraging':
        browSides.forEach(side => {
          this.ctx.beginPath()
          this.ctx.moveTo(side * (browSpacing - 6 * s), browY)
          this.ctx.quadraticCurveTo(side * browSpacing, browY - 5 * s, side * (browSpacing + 6 * s), browY)
          this.ctx.stroke()
        })
        break
    }
  }
}
