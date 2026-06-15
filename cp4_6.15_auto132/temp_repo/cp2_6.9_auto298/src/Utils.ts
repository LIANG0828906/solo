import { saveAs } from 'file-saver'
import { v4 as uuidv4 } from 'uuid'
import type { JointType } from './JoinCore'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789'

export function generateJointCode(jointType: JointType): string {
  const prefix = jointType === 'straight' ? 'MS' : jointType === 'dovetail' ? 'YW' : 'ZJ'
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return `${prefix}-${suffix}`
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function randomOffset(base: number, range: number): number {
  return base + (Math.random() - 0.5) * range
}

export function playClickSound(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1)

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  } catch (e) {
    console.log('Audio not supported')
  }
}

export function playSuccessSound(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const notes = [523.25, 659.25, 783.99]

    notes.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.15)
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + index * 0.15)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.15 + 0.3)

      oscillator.start(audioContext.currentTime + index * 0.15)
      oscillator.stop(audioContext.currentTime + index * 0.15 + 0.3)
    })
  } catch (e) {
    console.log('Audio not supported')
  }
}

export function playErrorSound(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2)

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  } catch (e) {
    console.log('Audio not supported')
  }
}

export async function generateStampPNG(
  code: string,
  jointName: string,
  authorName: string,
  time: string,
  attempts: number
): Promise<void> {
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 300
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const gradient = ctx.createLinearGradient(0, 0, 400, 300)
  gradient.addColorStop(0, '#f5e6c8')
  gradient.addColorStop(0.5, '#e8dcc4')
  gradient.addColorStop(1, '#f5e6c8')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 400, 300)

  ctx.fillStyle = 'rgba(212, 163, 115, 0.1)'
  for (let i = 0; i < 50; i++) {
    ctx.beginPath()
    ctx.arc(
      Math.random() * 400,
      Math.random() * 300,
      Math.random() * 30 + 10,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }

  ctx.strokeStyle = '#6d4c41'
  ctx.lineWidth = 3
  ctx.strokeRect(20, 20, 360, 260)

  ctx.strokeStyle = '#d4a373'
  ctx.lineWidth = 1
  ctx.strokeRect(28, 28, 344, 244)

  ctx.fillStyle = '#5d4037'
  ctx.font = 'bold 24px "Ma Shan Zheng", cursive'
  ctx.textAlign = 'center'
  ctx.fillText('榫卯图谱', 200, 65)

  ctx.font = '18px "Noto Serif SC", serif'
  ctx.fillText(`结构：${jointName}`, 200, 100)

  ctx.fillStyle = '#6d4c41'
  ctx.font = 'bold 28px "Courier New", monospace'
  ctx.fillText(code, 200, 150)

  ctx.fillStyle = '#5d4037'
  ctx.font = '14px "Noto Serif SC", serif'
  ctx.fillText(`匠人：${authorName}`, 200, 185)
  ctx.fillText(`耗时：${time}`, 200, 210)
  ctx.fillText(`尝试：${attempts}次`, 200, 235)

  ctx.font = '12px "Noto Serif SC", serif'
  ctx.fillStyle = '#8d6e63'
  ctx.fillText(`编号：${uuidv4().slice(0, 8)}`, 200, 265)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `榫卯图谱_${code}.png`)
      }
      resolve()
    }, 'image/png')
  })
}

export function createParticles(
  x: number,
  y: number,
  count: number
): { id: string; tx: number; ty: number; delay: number }[] {
  const particles = []
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
    const distance = 50 + Math.random() * 100
    particles.push({
      id: uuidv4(),
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance - 50,
      delay: Math.random() * 0.2
    })
  }
  return particles
}
