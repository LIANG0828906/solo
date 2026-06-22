export function drawWaveform(
  canvas: HTMLCanvasElement,
  dataArray: Uint8Array,
  bufferLength: number
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height

  ctx.fillStyle = '#1A1A2E'
  ctx.fillRect(0, 0, width, height)

  ctx.lineWidth = 2
  ctx.strokeStyle = '#00D2FF'
  ctx.beginPath()

  const sliceWidth = width / bufferLength
  let x = 0

  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0
    const y = (v * height) / 2

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }

    x += sliceWidth
  }

  ctx.lineTo(width, height / 2)
  ctx.stroke()
}

export function drawSpectrum(
  canvas: HTMLCanvasElement,
  dataArray: Uint8Array,
  barCount: number
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height

  ctx.fillStyle = '#16213E'
  ctx.fillRect(0, 0, width, height)

  const barWidth = 6
  const gap = 2
  const totalBarWidth = barWidth + gap
  const usableBars = Math.min(barCount, Math.floor(width / totalBarWidth))
  const startX = (width - usableBars * totalBarWidth) / 2

  for (let i = 0; i < usableBars; i++) {
    const dataIndex = Math.floor((i * dataArray.length) / usableBars)
    const value = dataArray[dataIndex] / 255
    const barHeight = value * height

    const gradient = ctx.createLinearGradient(
      0,
      height,
      0,
      height - barHeight
    )
    gradient.addColorStop(0, '#E94560')
    gradient.addColorStop(1, '#0F3460')

    ctx.fillStyle = gradient
    ctx.fillRect(
      startX + i * totalBarWidth,
      height - barHeight,
      barWidth,
      barHeight
    )
  }
}

export function generateSimulatedWaveform(
  bufferLength: number,
  time: number,
  rate: number,
  pitch: number,
  volume: number
): Uint8Array {
  const data = new Uint8Array(bufferLength)
  const normalizedVolume = volume / 100
  const freq = pitch * 3
  const speed = rate * 2

  for (let i = 0; i < bufferLength; i++) {
    const t = i / bufferLength
    const base = Math.sin(t * freq * Math.PI * 2 + time * speed * 5) * 40
    const harmonic = Math.sin(t * freq * Math.PI * 4 + time * speed * 3) * 20
    const noise = (Math.random() - 0.5) * 15
    const envelope = Math.sin(t * Math.PI)
    const value = 128 + (base + harmonic + noise) * envelope * normalizedVolume
    data[i] = Math.max(0, Math.min(255, value))
  }

  return data
}

export function generateSimulatedSpectrum(
  barCount: number,
  time: number,
  rate: number,
  pitch: number,
  volume: number,
  preset: string
): Uint8Array {
  const data = new Uint8Array(barCount)
  const normalizedVolume = volume / 100

  for (let i = 0; i < barCount; i++) {
    const freq = i / barCount
    let baseAmplitude = 0

    const centerFreq = pitch * 0.4
    const distance = Math.abs(freq - centerFreq)
    baseAmplitude = Math.max(0, 1 - distance * 2) * 0.6

    baseAmplitude += Math.sin(freq * 10 + time * rate * 3) * 0.15
    baseAmplitude += Math.sin(freq * 20 + time * rate * 5) * 0.1
    baseAmplitude += (Math.random() - 0.5) * 0.1

    if (preset === 'warm') {
      if (freq < 0.3) baseAmplitude *= 1.4
      if (freq > 0.7) baseAmplitude *= 0.7
    } else if (preset === 'bright') {
      if (freq < 0.3) baseAmplitude *= 0.6
      if (freq > 0.6) baseAmplitude *= 1.5
    } else if (preset === 'deep') {
      if (freq < 0.2) baseAmplitude *= 1.6
      if (freq > 0.5) baseAmplitude *= 0.5
    }

    baseAmplitude *= normalizedVolume
    data[i] = Math.max(0, Math.min(255, Math.floor(baseAmplitude * 255)))
  }

  return data
}
