export class VisualizerEngine {
  private analyser: AnalyserNode | null = null
  private freqData: Uint8Array | null = null
  private timeData: Uint8Array | null = null
  private rafId: number | null = null
  private spectrumCanvas: HTMLCanvasElement | null = null
  private spectrumCtx: CanvasRenderingContext2D | null = null
  private miniCanvases: Map<string, { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> = new Map()

  attachMainAnalyser(analyser: AnalyserNode) {
    this.analyser = analyser
    this.analyser.fftSize = 2048
    try { this.analyser.smoothingTimeConstant = 0.8 } catch (_e) { /* noop */ }
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount)
    this.timeData = new Uint8Array(this.analyser.fftSize)
    this.loop()
  }

  setSpectrumCanvas(canvas: HTMLCanvasElement | null) {
    this.spectrumCanvas = canvas
    if (canvas) {
      const ctx = canvas.getContext('2d')
      this.spectrumCtx = ctx
      this.resizeCanvas(canvas)
    } else {
      this.spectrumCtx = null
    }
  }

  registerMiniSpectrum(trackId: string, canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      this.resizeCanvas(canvas)
      this.miniCanvases.set(trackId, { canvas, ctx })
    }
  }

  unregisterMiniSpectrum(trackId: string) {
    this.miniCanvases.delete(trackId)
  }

  private resizeCanvas(canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth || 240
    const h = canvas.clientHeight || 60
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
    }
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  private loop = () => {
    this.rafId = requestAnimationFrame(this.loop)
    if (!this.analyser || !this.freqData || !this.timeData) return
    this.analyser.getByteFrequencyData(this.freqData)
    this.analyser.getByteTimeDomainData(this.timeData)

    if (this.spectrumCanvas && this.spectrumCtx) {
      this.resizeCanvas(this.spectrumCanvas)
      this.drawSpectrum(this.spectrumCtx, this.spectrumCanvas.clientWidth, this.spectrumCanvas.clientHeight, this.freqData, false)
    }

    this.miniCanvases.forEach(({ canvas, ctx }) => {
      this.resizeCanvas(canvas)
      this.drawSpectrum(ctx, canvas.clientWidth, canvas.clientHeight, this.freqData, true)
    })
  }

  private drawSpectrum(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    data: Uint8Array,
    mini: boolean
  ) {
    ctx.clearRect(0, 0, w, h)

    const count = Math.min(64, data.length)
    const step = Math.floor(data.length / count)
    const barW = Math.max(1, (w / count) - 2)

    for (let i = 0; i < count; i++) {
      const v = data[i * step] / 255
      const bh = Math.max(1, v * h)
      const x = i * (barW + 2)
      const y = h - bh

      const grad = ctx.createLinearGradient(0, y, 0, h)
      if (mini) {
        grad.addColorStop(0, 'rgba(233, 69, 96, 0.9)')
        grad.addColorStop(1, 'rgba(233, 69, 96, 0.3)')
      } else {
        grad.addColorStop(0, 'rgba(233, 69, 96, 1)')
        grad.addColorStop(0.5, 'rgba(255, 107, 107, 0.8)')
        grad.addColorStop(1, 'rgba(233, 69, 96, 0.2)')
      }
      ctx.fillStyle = grad
      const bw = Math.max(1, barW)
      this.roundRect(ctx, x, y, bw, bh, mini ? 1 : 2)
      ctx.fill()
    }
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    const radius = Math.min(r, w / 2, h / 2)
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + w - radius, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
    ctx.lineTo(x + w, y + h)
    ctx.lineTo(x, y + h)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  dispose() {
    if (this.rafId) cancelAnimationFrame(this.rafId)
    this.rafId = null
    this.miniCanvases.clear()
    this.spectrumCanvas = null
    this.spectrumCtx = null
  }
}

export function drawWaveformPreview(
  canvas: HTMLCanvasElement,
  buffer: AudioBuffer,
  trimStart = 0,
  trimEnd?: number,
  color = 'rgba(255,255,255,0.6)'
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth || 100
  const h = canvas.clientHeight || 40
  canvas.width = w * dpr
  canvas.height = h * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  const end = trimEnd ?? buffer.duration
  const startSample = Math.floor(trimStart * buffer.sampleRate)
  const endSample = Math.floor(end * buffer.sampleRate)
  const totalSamples = Math.max(1, endSample - startSample)
  const ch0 = buffer.getChannelData(0)
  const ch1 = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null

  const samplesPerPixel = Math.max(1, Math.floor(totalSamples / w))
  const mid = h / 2

  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.beginPath()

  for (let x = 0; x < w; x++) {
    const base = startSample + x * samplesPerPixel
    let min = 1
    let max = -1
    for (let s = 0; s < samplesPerPixel; s++) {
      const i = base + s
      if (i >= ch0.length) break
      let v = ch0[i]
      if (ch1) v = (v + ch1[i]) * 0.5
      if (v < min) min = v
      if (v > max) max = v
    }
    const y1 = mid - max * (mid - 2)
    const y2 = mid - min * (mid - 2)
    ctx.moveTo(x + 0.5, y1)
    ctx.lineTo(x + 0.5, y2)
  }
  ctx.stroke()
}
