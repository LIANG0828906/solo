import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload(): void {
    this.generateTextures()
    this.load.audio('collect', this.generateBeepSound(800, 0.1))
    this.load.audio('hit', this.generateBeepSound(150, 0.3))
    this.load.audio('starburst', this.generateBeepSound(1200, 0.5))
  }

  create(): void {
    this.scene.start('GameScene')
  }

  private generateTextures(): void {
    const graphics = this.add.graphics()

    graphics.fillStyle(0x00e5ff, 1)
    graphics.beginPath()
    graphics.moveTo(30, 0)
    graphics.lineTo(-15, -18)
    graphics.lineTo(-8, 0)
    graphics.lineTo(-15, 18)
    graphics.closePath()
    graphics.fillPath()
    graphics.lineStyle(2, 0x00ffff, 1)
    graphics.strokePath()
    graphics.generateTexture('player', 60, 40)
    graphics.clear()

    graphics.fillStyle(0xcc0000, 1)
    graphics.fillCircle(25, 25, 25)
    graphics.lineStyle(3, 0xff3333, 1)
    graphics.strokeCircle(25, 25, 25)
    graphics.generateTexture('asteroid', 50, 50)
    graphics.clear()

    const gradientCircle = this.createGradientCircle(40, 0x330033, 0x000000)
    this.textures.addCanvas('blackhole', gradientCircle)

    graphics.fillStyle(0xcc0000, 0.8)
    graphics.fillRect(0, 0, 80, 20)
    graphics.lineStyle(2, 0xff6666, 1)
    graphics.strokeRect(0, 0, 80, 20)
    graphics.generateTexture('storm', 80, 20)
    graphics.clear()

    graphics.fillStyle(0xffd700, 1)
    graphics.beginPath()
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
      const x = 15 + 12 * Math.cos(angle)
      const y = 15 + 12 * Math.sin(angle)
      if (i === 0) graphics.moveTo(x, y)
      else graphics.lineTo(x, y)
    }
    graphics.closePath()
    graphics.fillPath()
    graphics.lineStyle(1, 0xffff00, 0.8)
    graphics.strokePath()
    graphics.generateTexture('stardust', 30, 30)
    graphics.clear()

    graphics.fillStyle(0xffd700, 1)
    graphics.fillCircle(4, 4, 4)
    graphics.generateTexture('particle', 8, 8)
    graphics.clear()

    graphics.fillStyle(0xff6600, 1)
    graphics.fillCircle(4, 4, 4)
    graphics.generateTexture('trail', 8, 8)
    graphics.clear()

    graphics.destroy()
  }

  private createGradientCircle(size: number, innerColor: number, outerColor: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    )
    gradient.addColorStop(0, '#' + innerColor.toString(16).padStart(6, '0'))
    gradient.addColorStop(1, '#' + outerColor.toString(16).padStart(6, '0'))
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ff33ff'
    ctx.lineWidth = 2
    ctx.stroke()
    return canvas
  }

  private generateBeepSound(frequency: number, duration: number): string {
    const sampleRate = 44100
    const numSamples = sampleRate * duration
    const buffer = new Float32Array(numSamples)
    
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate
      const envelope = Math.exp(-t * 5)
      buffer[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3
    }

    const wav = this.floatToWav(buffer, sampleRate)
    return 'data:audio/wav;base64,' + this.arrayBufferToBase64(wav)
  }

  private floatToWav(buffer: Float32Array, sampleRate: number): ArrayBuffer {
    const numChannels = 1
    const bytesPerSample = 2
    const blockAlign = numChannels * bytesPerSample
    const byteRate = sampleRate * blockAlign
    const dataSize = buffer.length * bytesPerSample
    const bufferSize = 44 + dataSize
    const arrayBuffer = new ArrayBuffer(bufferSize)
    const view = new DataView(arrayBuffer)

    this.writeString(view, 0, 'RIFF')
    view.setUint32(4, 36 + dataSize, true)
    this.writeString(view, 8, 'WAVE')
    this.writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bytesPerSample * 8, true)
    this.writeString(view, 36, 'data')
    view.setUint32(40, dataSize, true)

    let offset = 44
    for (let i = 0; i < buffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, buffer[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += 2
    }

    return arrayBuffer
  }

  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
}
