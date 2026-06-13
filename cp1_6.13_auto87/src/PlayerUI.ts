import { Application, Container, Graphics, Text } from 'pixi.js'
import { PlayerData, WaveType } from './GameManager'

interface NoteWave {
  x: number
  y: number
  radius: number
  maxRadius: number
  alpha: number
  color: number
}

interface WaveButtonFlash {
  button: Graphics
  startTime: number
  duration: number
}

export class PlayerUI {
  private app: Application
  private container: Container
  private player: PlayerData
  private isLeft: boolean
  
  private panel: Graphics
  private healthBar: Graphics
  private healthLiquid: Graphics
  private healthGlow: Graphics
  private keys: Graphics[] = []
  private waveButtons: { type: WaveType; button: Graphics; label: Text }[] = []
  
  private noteWaves: NoteWave[] = []
  private waveFlashes: WaveButtonFlash[] = []
  
  private keysLabel: string[] = ['A', 'S', 'D', 'F', 'G', 'H']

  constructor(app: Application, player: PlayerData, isLeft: boolean) {
    this.app = app
    this.player = player
    this.isLeft = isLeft
    this.keysLabel = isLeft ? ['A', 'S', 'D', 'F', 'G', 'H'] : ['J', 'K', 'L', ';', "'", 'ENTER']
    
    this.container = new Container()
    this.container.position.set(player.position.x, player.position.y)
    this.app.stage.addChild(this.container)
    
    this.createPanel()
    this.createHealthBar()
    this.createKeys()
    this.createWaveButtons()
  }

  private createPanel() {
    const panelWidth = 200
    const panelHeight = 280
    
    this.panel = new Graphics()
    this.panel.beginFill(0x1a1a2e, 0.6)
    this.panel.drawRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 15)
    this.panel.endFill()
    
    this.panel.lineStyle(2, this.player.color, 0.5)
    this.panel.drawRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 15)
    
    this.container.addChild(this.panel)
  }

  private createHealthBar() {
    const barWidth = 20
    const barHeight = 150
    const barX = this.isLeft ? 80 : -100
    
    this.healthBar = new Graphics()
    this.healthBar.beginFill(0x000000, 0.5)
    this.healthBar.drawRect(barX, -barHeight/2, barWidth, barHeight)
    this.healthBar.endFill()
    
    this.healthBar.lineStyle(1, this.player.color, 0.5)
    this.healthBar.drawRect(barX, -barHeight/2, barWidth, barHeight)
    
    this.healthLiquid = new Graphics()
    this.healthLiquid.beginFill(this.player.color, 0.8)
    this.healthLiquid.drawRect(barX, -barHeight/2, barWidth, barHeight * (this.player.health / this.player.maxHealth))
    this.healthLiquid.endFill()
    
    this.healthGlow = new Graphics()
    this.healthGlow.beginFill(this.player.color, 0.2)
    this.healthGlow.drawRect(barX - 5, -barHeight/2, barWidth + 10, barHeight * (this.player.health / this.player.maxHealth))
    
    this.container.addChild(this.healthBar)
    this.container.addChild(this.healthLiquid)
    this.container.addChild(this.healthGlow)
  }

  private createKeys() {
    const keyWidth = 28
    const keyHeight = 40
    const keySpacing = 5
    const keysStartX = -((keyWidth + keySpacing) * 3 - keySpacing)
    const keysY = 60
    
    for (let i = 0; i < 6; i++) {
      const key = new Graphics()
      const x = keysStartX + i * (keyWidth + keySpacing)
      
      key.beginFill(0x2d2d44, 0.8)
      key.drawRoundedRect(x, keysY, keyWidth, keyHeight, 5)
      key.endFill()
      
      key.lineStyle(1.5, this.player.color, 0.6)
      key.drawRoundedRect(x, keysY, keyWidth, keyHeight, 5)
      
      const label = new Text(this.keysLabel[i], {
        fontFamily: 'Orbitron',
        fontSize: 14,
        fill: 0xffffff,
        align: 'center',
      })
      label.position.set(x + keyWidth/2 - label.width/2, keysY + keyHeight/2 - label.height/2)
      
      key.interactive = true
      key.buttonMode = true
      
      this.container.addChild(key)
      this.container.addChild(label)
      this.keys.push(key)
    }
  }

  private createWaveButtons() {
    const buttonSize = 40
    const buttonSpacing = 10
    const buttonsStartX = -((buttonSize + buttonSpacing) * 1.5 - buttonSpacing)
    const buttonsY = -50
    
    const waves: { type: WaveType; label: string }[] = [
      { type: 'sine', label: 'SIN' },
      { type: 'sawtooth', label: 'SAW' },
      { type: 'square', label: 'SQR' },
    ]
    
    waves.forEach((wave, index) => {
      const button = new Graphics()
      const x = buttonsStartX + index * (buttonSize + buttonSpacing)
      
      button.beginFill(wave.type === this.player.waveType ? this.player.color : 0x2d2d44, 0.8)
      button.drawRoundedRect(x, buttonsY, buttonSize, buttonSize, 8)
      button.endFill()
      
      button.lineStyle(2, wave.type === this.player.waveType ? 0xffffff : this.player.color, 0.6)
      button.drawRoundedRect(x, buttonsY, buttonSize, buttonSize, 8)
      
      const label = new Text(wave.label, {
        fontFamily: 'Orbitron',
        fontSize: 10,
        fill: 0xffffff,
        align: 'center',
      })
      label.position.set(x + buttonSize/2 - label.width/2, buttonsY + buttonSize/2 - label.height/2)
      
      this.container.addChild(button)
      this.container.addChild(label)
      this.waveButtons.push({ type: wave.type, button, label })
    })
  }

  notePressed(noteIndex: number) {
    const key = this.keys[noteIndex]
    if (!key) return
    
    const bounds = key.getBounds()
    const noteWave: NoteWave = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
      radius: 5,
      maxRadius: 60,
      alpha: 1,
      color: this.player.color,
    }
    this.noteWaves.push(noteWave)
    
    key.beginFill(this.player.color, 0.5)
    const bounds2 = key.getBounds()
    key.drawRoundedRect(bounds2.x, bounds2.y, bounds2.width, bounds2.height, 5)
    key.endFill()
    
    setTimeout(() => {
      key.beginFill(0x2d2d44, 0.8)
      key.drawRoundedRect(bounds2.x, bounds2.y, bounds2.width, bounds2.height, 5)
      key.endFill()
      key.lineStyle(1.5, this.player.color, 0.6)
      key.drawRoundedRect(bounds2.x, bounds2.y, bounds2.width, bounds2.height, 5)
    }, 150)
  }

  wavePressed(waveType: WaveType) {
    const waveButton = this.waveButtons.find(w => w.type === waveType)
    if (!waveButton) return
    
    this.waveFlashes.push({
      button: waveButton.button,
      startTime: Date.now(),
      duration: 300,
    })
    
    this.waveButtons.forEach(w => {
      const isActive = w.type === waveType
      w.button.clear()
      w.button.beginFill(isActive ? this.player.color : 0x2d2d44, 0.8)
      const bounds = w.button.getBounds()
      w.button.drawRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, 8)
      w.button.endFill()
      w.button.lineStyle(2, isActive ? 0xffffff : this.player.color, 0.6)
      w.button.drawRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, 8)
    })
  }

  updateHealth(health: number) {
    const barHeight = 150
    const barWidth = 20
    const barX = this.isLeft ? 80 : -100
    const healthPercent = Math.max(0, Math.min(1, health / this.player.maxHealth))
    const filledHeight = barHeight * healthPercent
    const barTop = barHeight / 2 - filledHeight
    
    this.healthLiquid.clear()
    if (filledHeight > 0) {
      this.healthLiquid.beginFill(this.player.color, 0.8)
      this.healthLiquid.drawRect(barX, barTop, barWidth, filledHeight)
      this.healthLiquid.endFill()
    }
    
    this.healthGlow.clear()
    if (filledHeight > 0) {
      this.healthGlow.beginFill(this.player.color, 0.2)
      this.healthGlow.drawRect(barX - 3, barTop, barWidth + 6, filledHeight)
      this.healthGlow.endFill()
    }
    
    this.player.health = health
  }

  update(deltaTime: number) {
    const currentTime = Date.now()
    
    for (let i = this.noteWaves.length - 1; i >= 0; i--) {
      const wave = this.noteWaves[i]
      wave.radius += 300 * deltaTime
      wave.alpha -= 2 * deltaTime
      
      if (wave.alpha <= 0) {
        this.noteWaves.splice(i, 1)
        continue
      }
      
      const graphics = new Graphics()
      graphics.beginFill(wave.color, wave.alpha * 0.3)
      graphics.drawCircle(wave.x, wave.y, wave.radius)
      graphics.endFill()
      graphics.lineStyle(2, wave.color, wave.alpha)
      graphics.drawCircle(wave.x, wave.y, wave.radius)
      
      this.container.addChild(graphics)
      
      setTimeout(() => {
        this.container.removeChild(graphics)
        graphics.destroy()
      }, 100)
    }
    
    for (let i = this.waveFlashes.length - 1; i >= 0; i--) {
      const flash = this.waveFlashes[i]
      const elapsed = currentTime - flash.startTime
      const progress = elapsed / flash.duration
      
      if (progress >= 1) {
        this.waveFlashes.splice(i, 1)
        continue
      }
      
      const intensity = Math.sin(progress * Math.PI) * 0.5 + 0.5
      
      flash.button.clear()
      flash.button.beginFill(this.player.color, 0.5 + intensity * 0.5)
      const bounds = flash.button.getBounds()
      flash.button.drawRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, 8)
      flash.button.endFill()
      flash.button.lineStyle(2 + intensity * 2, 0xffffff, 0.6 + intensity * 0.4)
      flash.button.drawRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, 8)
    }
  }

  resize(position: { x: number; y: number }) {
    this.container.position.set(position.x, position.y)
  }
}
