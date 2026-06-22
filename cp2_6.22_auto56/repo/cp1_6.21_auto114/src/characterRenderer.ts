import type { WeatherData, CharacterConfig, WeatherCondition } from './types'

interface AnimationState {
  time: number
  sunAngle: number
  raindrops: { x: number; y: number; speed: number }[]
  snowflakes: { x: number; y: number; speed: number; drift: number }[]
  clouds: { x: number; y: number; width: number; speed: number }[]
  lightningActive: boolean
  lightningTimer: number
  lastLightning: number
  characterSway: number
  characterShake: number
  characterShiver: number
  shoulderOffset: number
  armPhase: number
}

export class CharacterRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRendering2D
  private weather: WeatherData | null = null
  private config: CharacterConfig
  private animationId: number | null = null
  private state: AnimationState
  private canvasWidth = 800
  private canvasHeight = 600
  private characterX = 400
  private characterY = 300

  constructor(canvas: HTMLCanvasElement, config: CharacterConfig) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.config = config
    this.state = this.createInitialState()
    this.resize()
  }

  private createInitialState(): AnimationState {
    return {
      time: 0,
      sunAngle: 0,
      raindrops: [],
      snowflakes: [],
      clouds: [],
      lightningActive: false,
      lightningTimer: 0,
      lastLightning: 0,
      characterSway: 0,
      characterShake: 0,
      characterShiver: 0,
      shoulderOffset: 0,
      armPhase: 0,
    }
  }

  public setWeather(weather: WeatherData | null) {
    this.weather = weather
    if (weather) {
      this.initWeatherElements(weather.condition)
    }
  }

  public setConfig(config: CharacterConfig) {
    this.config = config
  }

  private initWeatherElements(condition: WeatherCondition) {
    this.state.raindrops = []
    this.state.snowflakes = []
    this.state.clouds = []

    if (condition === 'rainy') {
      for (let i = 0; i < 80; i++) {
        this.state.raindrops.push({
          x: Math.random() * this.canvasWidth,
          y: Math.random() * this.canvasHeight,
          speed: 10 + Math.random() * 5,
        })
      }
    }

    if (condition === 'snowy') {
      for (let i = 0; i < 60; i++) {
        this.state.snowflakes.push({
          x: Math.random() * this.canvasWidth,
          y: Math.random() * this.canvasHeight,
          speed: 2 + Math.random() * 3,
          drift: Math.random() * 2 - 1,
        })
      }
    }

    if (condition === 'sunny' || condition === 'cloudy') {
      const cloudCount = condition === 'sunny' ? 4 : 7
      for (let i = 0; i < cloudCount; i++) {
        this.state.clouds.push({
          x: Math.random() * this.canvasWidth,
          y: 50 + Math.random() * 150,
          width: 80 + Math.random() * 100,
          speed: 0.2 + Math.random() * 0.3,
        })
      }
    }

    this.state.lastLightning = this.state.time
    this.state.lightningActive = false
  }

  public resize() {
    this.canvas.width = this.canvasWidth
    this.canvas.height = this.canvasHeight
  }

  public start() {
    if (this.animationId === null) {
      this.animate()
    }
  }

  public stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private animate = () => {
    this.state.time += 1 / 60
    this.update()
    this.render()
    this.animationId = requestAnimationFrame(this.animate)
  }

  private update() {
    const condition = this.weather?.condition || 'sunny'

    this.state.sunAngle += (Math.PI * 2) / (2 * 60)

    if (condition === 'sunny') {
      this.state.characterSway = Math.sin(this.state.time * Math.PI * 2 / 0.5) * 3
      this.state.characterShake = 0
      this.state.characterShiver = 0
      this.state.shoulderOffset = 0
    } else if (condition === 'rainy') {
      this.state.characterSway = 0
      this.state.characterShake = Math.sin(this.state.time * Math.PI * 2 / 0.2) * 2
      this.state.characterShiver = 0
      this.state.shoulderOffset = 0
    } else if (condition === 'snowy') {
      this.state.characterSway = 0
      this.state.characterShake = 0
      this.state.characterShiver = Math.sin(this.state.time * Math.PI * 2 / 0.8) * 3
      this.state.armPhase = (this.state.time * Math.PI * 2 / 0.3) % (Math.PI * 2)
    } else if (condition === 'cloudy') {
      this.state.characterSway = 0
      this.state.characterShake = 0
      this.state.characterShiver = 0
      this.state.shoulderOffset = Math.sin(this.state.time * Math.PI * 2 / 1) * 5
    }

    for (const drop of this.state.raindrops) {
      drop.y += drop.speed
      drop.x += 1
      if (drop.y > this.canvasHeight) {
        drop.y = -10
        drop.x = Math.random() * this.canvasWidth
      }
    }

    for (const flake of this.state.snowflakes) {
      flake.y += flake.speed
      flake.x += flake.drift * Math.sin(this.state.time + flake.y * 0.05)
      if (flake.y > this.canvasHeight) {
        flake.y = -10
        flake.x = Math.random() * this.canvasWidth
      }
      if (flake.x < 0) flake.x = this.canvasWidth
      if (flake.x > this.canvasWidth) flake.x = 0
    }

    for (const cloud of this.state.clouds) {
      cloud.x += cloud.speed
      if (cloud.x > this.canvasWidth + cloud.width) {
        cloud.x = -cloud.width
      }
    }

    if (condition === 'rainy') {
      if (this.state.time - this.state.lastLightning > 5 && !this.state.lightningActive) {
        if (Math.random() < 0.02) {
          this.state.lightningActive = true
          this.state.lightningTimer = 0.3
        }
      }
      if (this.state.lightningActive) {
        this.state.lightningTimer -= 1 / 60
        if (this.state.lightningTimer <= 0) {
          this.state.lightningActive = false
          this.state.lastLightning = this.state.time
        }
      }
    }
  }

  private render() {
    const ctx = this.ctx
    const condition = this.weather?.condition || 'sunny'

    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)

    this.drawBackground(condition)

    if (condition === 'sunny') {
      this.drawSun()
    }

    if (condition === 'rainy' || condition === 'sunny' || condition === 'cloudy') {
      this.drawClouds(condition)
    }

    if (condition === 'rainy') {
      this.drawRaindrops()
      if (this.state.lightningActive) {
        this.drawLightning()
      }
    }

    if (condition === 'snowy') {
      this.drawSnowflakes()
    }

    this.drawCharacter()
  }

  private drawBackground(condition: WeatherCondition) {
    const ctx = this.ctx
    let topColor: string
    let bottomColor: string

    switch (condition) {
      case 'sunny':
        topColor = '#87CEEB'
        bottomColor = '#FFFFFF'
        break
      case 'rainy':
        topColor = '#4B5563'
        bottomColor = '#6B7280'
        break
      case 'snowy':
        topColor = '#E0F2FE'
        bottomColor = '#FFFFFF'
        break
      case 'cloudy':
        topColor = '#9CA3AF'
        bottomColor = '#D1D5DB'
        break
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight)
    gradient.addColorStop(0, topColor)
    gradient.addColorStop(1, bottomColor)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
  }

  private drawSun() {
    const ctx = this.ctx
    const sunX = this.canvasWidth - 100
    const sunY = 80
    const sunRadius = 40

    ctx.save()
    ctx.translate(sunX, sunY)
    ctx.rotate(this.state.sunAngle)

    ctx.strokeStyle = '#FCD34D'
    ctx.lineWidth = 3
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2
      const innerR = sunRadius + 10
      const outerR = sunRadius + 25
      ctx.beginPath()
      ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR)
      ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR)
      ctx.stroke()
    }

    ctx.restore()

    ctx.fillStyle = '#FCD34D'
    ctx.beginPath()
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawClouds(condition: WeatherCondition) {
    const ctx = this.ctx
    const cloudColor = condition === 'cloudy' ? '#6B7280' : '#FFFFFF'

    for (const cloud of this.state.clouds) {
      ctx.fillStyle = cloudColor
      ctx.beginPath()
      ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.width / 4, 0, 0, Math.PI * 2)
      ctx.fill()

      if (condition === 'cloudy') {
        ctx.fillStyle = '#4B5563'
        ctx.beginPath()
        ctx.ellipse(cloud.x - cloud.width * 0.1, cloud.y + cloud.width * 0.1, cloud.width / 3, cloud.width / 5, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  private drawRaindrops() {
    const ctx = this.ctx
    ctx.strokeStyle = '#60A5FA'
    ctx.lineWidth = 2

    for (const drop of this.state.raindrops) {
      ctx.beginPath()
      ctx.moveTo(drop.x, drop.y)
      ctx.lineTo(drop.x + 2, drop.y + 15)
      ctx.stroke()
    }
  }

  private drawLightning() {
    const ctx = this.ctx
    const startX = this.canvasWidth * 0.6 + Math.random() * 100
    const startY = 50

    ctx.strokeStyle = '#FDE047'
    ctx.lineWidth = 4
    ctx.shadowColor = '#FDE047'
    ctx.shadowBlur = 20

    ctx.beginPath()
    ctx.moveTo(startX, startY)
    let x = startX
    let y = startY
    while (y < this.canvasHeight - 100) {
      x += (Math.random() - 0.5) * 60
      y += 40 + Math.random() * 30
      ctx.lineTo(x, y)
    }
    ctx.stroke()

    ctx.shadowBlur = 0
  }

  private drawSnowflakes() {
    const ctx = this.ctx
    ctx.fillStyle = '#FFFFFF'
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1

    for (const flake of this.state.snowflakes) {
      this.drawHexagon(flake.x, flake.y, 4)
    }
  }

  private drawHexagon(x: number, y: number, r: number) {
    const ctx = this.ctx
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const px = x + Math.cos(angle) * r
      const py = y + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()
  }

  private drawCharacter() {
    const ctx = this.ctx
    const condition = this.weather?.condition || 'sunny'
    const { hatColor, clothesColor, eyeSize, showGlasses, skinColor } = this.config

    const baseX = this.characterX
    const baseY = this.characterY + this.state.characterShake + this.state.characterShiver

    ctx.save()
    ctx.translate(baseX, baseY)
    ctx.rotate((this.state.characterSway * Math.PI) / 180)

    const headRadius = 60
    const bodyWidth = 60
    const bodyHeight = 100

    if (condition === 'rainy') {
      this.drawUmbrella(0, -headRadius - bodyHeight / 2 - 20)
    }

    this.drawBody(bodyWidth, bodyHeight, clothesColor, condition)
    this.drawArms(bodyWidth, bodyHeight, skinColor, condition)

    const headY = -bodyHeight / 2 - headRadius + 10
    this.drawHead(0, headY, headRadius, skinColor, condition)

    this.drawEyes(0, headY - 10, eyeSize, showGlasses, condition)
    this.drawMouth(0, headY + 20, condition)
    this.drawEyebrows(0, headY - 25, condition)

    if (condition === 'snowy') {
      this.drawHat(0, headY - headRadius, hatColor)
    }

    if (showGlasses) {
      this.drawGlasses(0, headY - 10, eyeSize)
    }

    ctx.restore()
  }

  private drawBody(width: number, height: number, color: string, condition: WeatherCondition) {
    const ctx = this.ctx
    const shoulderOffset = this.state.shoulderOffset

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(-width / 2, -height / 2 + shoulderOffset, width, height, 10)
    ctx.fill()
  }

  private drawArms(bodyWidth: number, bodyHeight: number, skinColor: string, condition: WeatherCondition) {
    const ctx = this.ctx
    const armLength = 40
    const armWidth = 12

    if (condition === 'snowy') {
      const phase = this.state.armPhase
      const armAngle = Math.sin(phase) * 0.4

      ctx.save()
      ctx.translate(-bodyWidth / 2, -bodyHeight / 4)
      ctx.rotate(-0.5 + armAngle)
      ctx.fillStyle = skinColor
      ctx.beginPath()
      ctx.roundRect(-armWidth / 2, 0, armWidth, armLength, 6)
      ctx.fill()
      ctx.restore()

      ctx.save()
      ctx.translate(bodyWidth / 2, -bodyHeight / 4)
      ctx.rotate(0.5 - armAngle)
      ctx.fillStyle = skinColor
      ctx.beginPath()
      ctx.roundRect(-armWidth / 2, 0, armWidth, armLength, 6)
      ctx.fill()
      ctx.restore()
    } else {
      ctx.fillStyle = skinColor

      ctx.save()
      ctx.translate(-bodyWidth / 2 - armWidth / 2, -bodyHeight / 4)
      ctx.beginPath()
      ctx.roundRect(0, 0, armWidth, armLength, 6)
      ctx.fill()
      ctx.restore()

      ctx.save()
      ctx.translate(bodyWidth / 2 - armWidth / 2, -bodyHeight / 4)
      ctx.beginPath()
      ctx.roundRect(0, 0, armWidth, armLength, 6)
      ctx.fill()
      ctx.restore()
    }
  }

  private drawHead(x: number, y: number, radius: number, skinColor: string, condition: WeatherCondition) {
    const ctx = this.ctx
    ctx.fillStyle = skinColor
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawEyes(x: number, y: number, size: number, showGlasses: boolean, condition: WeatherCondition) {
    const ctx = this.ctx
    const eyeSpacing = 25

    if (condition === 'sunny') {
      ctx.fillStyle = '#1F2937'
      ctx.beginPath()
      ctx.ellipse(x - eyeSpacing, y, 30, 10, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(x + eyeSpacing, y, 30, 10, 0, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = '#1F2937'
      ctx.beginPath()
      ctx.arc(x - eyeSpacing, y, size / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x + eyeSpacing, y, size / 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(x - eyeSpacing + size / 6, y - size / 6, size / 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x + eyeSpacing + size / 6, y - size / 6, size / 5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private drawGlasses(x: number, y: number, eyeSize: number) {
    const ctx = this.ctx
    const eyeSpacing = 25
    const frameRadius = eyeSize / 2 + 4

    ctx.strokeStyle = '#1F2937'
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.arc(x - eyeSpacing, y, frameRadius, 0, Math.PI * 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(x + eyeSpacing, y, frameRadius, 0, Math.PI * 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(x - eyeSpacing + frameRadius, y)
    ctx.lineTo(x + eyeSpacing - frameRadius, y)
    ctx.stroke()
  }

  private drawMouth(x: number, y: number, condition: WeatherCondition) {
    const ctx = this.ctx
    ctx.strokeStyle = '#1F2937'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'

    if (condition === 'sunny') {
      ctx.beginPath()
      ctx.arc(x, y, 20, 0.1 * Math.PI, 0.9 * Math.PI)
      ctx.stroke()
    } else if (condition === 'rainy') {
      ctx.beginPath()
      ctx.arc(x, y + 10, 15, 1.1 * Math.PI, 1.9 * Math.PI)
      ctx.stroke()
    } else if (condition === 'snowy') {
      ctx.beginPath()
      ctx.arc(x, y, 12, 0.1 * Math.PI, 0.9 * Math.PI)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.moveTo(x - 15, y)
      ctx.lineTo(x + 15, y)
      ctx.stroke()
    }
  }

  private drawEyebrows(x: number, y: number, condition: WeatherCondition) {
    const ctx = this.ctx
    const eyebrowSpacing = 25
    const eyebrowWidth = 20

    ctx.strokeStyle = '#1F2937'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'

    if (condition === 'rainy') {
      ctx.beginPath()
      ctx.moveTo(x - eyebrowSpacing - eyebrowWidth / 2, y - 5)
      ctx.lineTo(x - eyebrowSpacing + eyebrowWidth / 2, y + 5)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(x + eyebrowSpacing - eyebrowWidth / 2, y + 5)
      ctx.lineTo(x + eyebrowSpacing + eyebrowWidth / 2, y - 5)
      ctx.stroke()
    } else if (condition === 'sunny') {
    } else {
      ctx.beginPath()
      ctx.moveTo(x - eyebrowSpacing - eyebrowWidth / 2, y)
      ctx.lineTo(x - eyebrowSpacing + eyebrowWidth / 2, y)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(x + eyebrowSpacing - eyebrowWidth / 2, y)
      ctx.lineTo(x + eyebrowSpacing + eyebrowWidth / 2, y)
      ctx.stroke()
    }
  }

  private drawHat(x: number, y: number, color: string) {
    const ctx = this.ctx

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x - 35, y)
    ctx.lineTo(x + 35, y)
    ctx.lineTo(x, y - 30)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#DC2626'
    ctx.beginPath()
    ctx.arc(x, y - 30, 8, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawUmbrella(x: number, y: number) {
    const ctx = this.ctx

    ctx.strokeStyle = '#4B5563'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(x, y + 10)
    ctx.lineTo(x, y + 80)
    ctx.stroke()

    ctx.fillStyle = '#3B82F6'
    ctx.beginPath()
    ctx.arc(x, y + 10, 60, Math.PI, 0)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = '#2563EB'
    ctx.lineWidth = 2
    for (let i = 0; i <= 6; i++) {
      const angle = Math.PI + (i / 6) * Math.PI
      ctx.beginPath()
      ctx.moveTo(x, y + 10)
      ctx.lineTo(x + Math.cos(angle) * 60, y + 10 + Math.sin(angle) * 60)
      ctx.stroke()
    }

    ctx.strokeStyle = '#4B5563'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(x, y + 80, 10, 0, Math.PI, true)
    ctx.stroke()
  }

  public renderAvatar(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!
    const size = canvas.width
    const { hatColor, clothesColor, eyeSize, showGlasses, skinColor } = this.config
    const condition = this.weather?.condition || 'sunny'

    ctx.clearRect(0, 0, size, size)

    const scale = size / 200
    ctx.save()
    ctx.translate(size / 2, size / 2 + 20 * scale)
    ctx.scale(scale, scale)

    const headRadius = 50
    const bodyWidth = 50
    const bodyHeight = 60

    ctx.fillStyle = clothesColor
    ctx.beginPath()
    ctx.roundRect(-bodyWidth / 2, 0, bodyWidth, bodyHeight, 8)
    ctx.fill()

    ctx.fillStyle = skinColor
    ctx.beginPath()
    ctx.arc(0, -headRadius + 10, headRadius, 0, Math.PI * 2)
    ctx.fill()

    const eyeSpacing = 20
    if (condition === 'sunny') {
      ctx.fillStyle = '#1F2937'
      ctx.beginPath()
      ctx.ellipse(-eyeSpacing, -15, 20, 7, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(eyeSpacing, -15, 20, 7, 0, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = '#1F2937'
      ctx.beginPath()
      ctx.arc(-eyeSpacing, -15, eyeSize / 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(eyeSpacing, -15, eyeSize / 2.5, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.strokeStyle = '#1F2937'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    if (condition === 'sunny') {
      ctx.beginPath()
      ctx.arc(0, 5, 15, 0.1 * Math.PI, 0.9 * Math.PI)
      ctx.stroke()
    } else if (condition === 'cloudy') {
      ctx.beginPath()
      ctx.moveTo(-12, 5)
      ctx.lineTo(12, 5)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.arc(0, 5, 10, 0.1 * Math.PI, 0.9 * Math.PI)
      ctx.stroke()
    }

    if (condition === 'snowy') {
      ctx.fillStyle = hatColor
      ctx.beginPath()
      ctx.moveTo(-30, -headRadius + 5)
      ctx.lineTo(30, -headRadius + 5)
      ctx.lineTo(0, -headRadius - 25)
      ctx.closePath()
      ctx.fill()
    }

    if (showGlasses) {
      const frameRadius = eyeSize / 2.5 + 3
      ctx.strokeStyle = '#1F2937'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(-eyeSpacing, -15, frameRadius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(eyeSpacing, -15, frameRadius, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.restore()
  }
}
