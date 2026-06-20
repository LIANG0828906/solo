import jsPDF from 'jspdf'
import { saveAs } from 'file-saver'
import type { CanvasElement, TextElement, StickerElement, DrawingElement } from '../store/editorStore'

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 800

export const renderToCanvas = async (
  elements: CanvasElement[],
  background: string,
  scale: number = 2,
  transparent: boolean = false
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH * scale
  canvas.height = CANVAS_HEIGHT * scale
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)

  if (!transparent) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  }

  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex)

  for (const element of sortedElements) {
    ctx.save()
    ctx.globalAlpha = element.opacity

    const centerX = element.x + element.width / 2
    const centerY = element.y + element.height / 2
    ctx.translate(centerX, centerY)
    ctx.rotate((element.rotation * Math.PI) / 180)
    ctx.translate(-centerX, -centerY)

    if (element.type === 'text') {
      const el = element as TextElement
      ctx.font = `${el.fontSize}px ${el.fontFamily}`
      ctx.textAlign = el.textAlign
      ctx.textBaseline = 'top'
      ctx.fillStyle = el.color

      const lines = el.content.split('\n')
      const lineHeight = el.fontSize * el.lineHeight
      const startY = element.y

      lines.forEach((line, i) => {
        let drawX = element.x
        if (el.textAlign === 'center') drawX = element.x + element.width / 2
        else if (el.textAlign === 'right') drawX = element.x + element.width

        if (el.strokeWidth > 0) {
          ctx.lineWidth = el.strokeWidth
          ctx.strokeStyle = el.strokeColor
          ctx.strokeText(line, drawX, startY + i * lineHeight)
        }
        ctx.fillText(line, drawX, startY + i * lineHeight)
      })
    } else if (element.type === 'sticker') {
      const el = element as StickerElement
      try {
        const img = await loadImage(el.src)
        ctx.drawImage(img, element.x, element.y, element.width, element.height)
      } catch {
        ctx.fillStyle = '#a29bfe'
        ctx.fillRect(element.x, element.y, element.width, element.height)
      }
    } else if (element.type === 'drawing') {
      const el = element as DrawingElement
      if (el.points.length < 2) continue

      ctx.beginPath()
      ctx.moveTo(el.points[0].x, el.points[0].y)
      for (let i = 1; i < el.points.length; i++) {
        ctx.lineTo(el.points[i].x, el.points[i].y)
      }
      ctx.strokeStyle = el.stroke
      ctx.lineWidth = el.strokeWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()

      if (el.fill !== 'transparent') {
        ctx.fillStyle = el.fill
        ctx.fill()
      }
    }

    ctx.restore()
  }

  return canvas
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export const exportPNG = async (
  elements: CanvasElement[],
  background: string,
  transparent: boolean = true
): Promise<void> => {
  const canvas = await renderToCanvas(elements, background, 2, transparent)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png')
  )
  if (blob) {
    saveAs(blob, `greeting-card-${Date.now()}.png`)
  }
}

export const exportPDF = async (
  elements: CanvasElement[],
  background: string
): Promise<void> => {
  const canvas = await renderToCanvas(elements, background, 3, false)
  const imgData = canvas.toDataURL('image/png')

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const cardRatio = CANVAS_WIDTH / CANVAS_HEIGHT
  const pageRatio = pageWidth / pageHeight

  let drawWidth, drawHeight, drawX, drawY

  if (cardRatio > pageRatio) {
    drawWidth = pageWidth - 20
    drawHeight = drawWidth / cardRatio
    drawX = 10
    drawY = (pageHeight - drawHeight) / 2
  } else {
    drawHeight = pageHeight - 20
    drawWidth = drawHeight * cardRatio
    drawX = (pageWidth - drawWidth) / 2
    drawY = 10
  }

  pdf.addImage(imgData, 'PNG', drawX, drawY, drawWidth, drawHeight, '', 'FAST')
  pdf.save(`greeting-card-${Date.now()}.pdf`)
}

export const estimateFileSize = async (
  elements: CanvasElement[],
  background: string,
  format: 'png' | 'pdf'
): Promise<string> => {
  const canvas = await renderToCanvas(elements, background, 1, false)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png', 0.5)
  )
  if (!blob) return '~0 KB'

  let size = blob.size
  if (format === 'png') size = size * 4
  if (format === 'pdf') size = size * 2

  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

export const playCompleteSound = (): void => {
  try {
    const AudioContextClass =
      (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!AudioContextClass) return

    const audioContext = new AudioContextClass()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(1320, audioContext.currentTime + 0.05)

    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  } catch {
    // Audio not supported
  }
}
