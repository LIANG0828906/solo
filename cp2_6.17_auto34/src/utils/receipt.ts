import { saveAs } from 'file-saver'
import type { SignRecord } from '@/types'

const CARD_WIDTH = 350
const CARD_HEIGHT = 500

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawCircleImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, radius: number) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  const scale = Math.max((radius * 2) / img.width, (radius * 2) / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  const dx = cx - dw / 2
  const dy = cy - dh / 2
  ctx.drawImage(img, dx, dy, dw, dh)
  ctx.restore()
}

export async function renderReceiptToCanvas(record: SignRecord, canvas: HTMLCanvasElement): Promise<void> {
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#FFFFFF'
  drawRoundRect(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, 12)
  ctx.fill()

  ctx.fillStyle = '#1565C0'
  drawRoundRect(ctx, 0, 0, CARD_WIDTH, 64, 12)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.moveTo(0, 64)
  ctx.lineTo(CARD_WIDTH, 64)
  ctx.lineTo(CARD_WIDTH, 52)
  ctx.lineTo(0, 64)
  ctx.closePath()
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('SignFlow 物流', CARD_WIDTH / 2, 26)

  ctx.fillStyle = '#1565C0'
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'
  ctx.fillText('电子签收凭证', CARD_WIDTH / 2, 96)

  let y = 128
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  ctx.fillStyle = '#666666'
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.fillText('运单号', 28, y)
  y += 16
  ctx.fillStyle = '#1A237E'
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'
  ctx.fillText(record.trackingNumber, 28, y)
  y += 28

  ctx.fillStyle = '#666666'
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.fillText('收件人', 28, y)
  y += 16
  ctx.fillStyle = '#333333'
  ctx.font = '14px system-ui, -apple-system, sans-serif'
  ctx.fillText(record.recipient, 28, y)
  y += 24

  ctx.fillStyle = '#666666'
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.fillText('签收时间', 28, y)
  y += 16
  ctx.fillStyle = '#333333'
  ctx.font = '13px system-ui, -apple-system, sans-serif'
  ctx.fillText(formatTimestamp(record.timestamp), 28, y)
  y += 28

  ctx.fillStyle = '#666666'
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.fillText('收件人签名', 28, y)
  y += 18
  const sigBoxY = y
  ctx.strokeStyle = '#E0E0E0'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  drawRoundRect(ctx, 28, sigBoxY, CARD_WIDTH - 56, 72, 6)
  ctx.stroke()
  ctx.setLineDash([])

  try {
    const sigImg = await loadImage(record.signatureBase64)
    const maxW = CARD_WIDTH - 72
    const maxH = 56
    const scale = Math.min(maxW / sigImg.width, maxH / sigImg.height, 1)
    const dw = sigImg.width * scale
    const dh = sigImg.height * scale
    const dx = 28 + (CARD_WIDTH - 56 - dw) / 2
    const dy = sigBoxY + (72 - dh) / 2
    ctx.drawImage(sigImg, dx, dy, dw, dh)
  } catch {
    ctx.fillStyle = '#999999'
    ctx.font = '12px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('签名图像', CARD_WIDTH / 2, sigBoxY + 28)
    ctx.textAlign = 'left'
  }

  y = sigBoxY + 72 + 24

  const photoBoxY = y
  ctx.strokeStyle = '#E0E0E0'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(CARD_WIDTH / 2, photoBoxY + 48, 50, 0, Math.PI * 2)
  ctx.closePath()
  ctx.stroke()

  try {
    const photoImg = await loadImage(record.photoBase64)
    drawCircleImage(ctx, photoImg, CARD_WIDTH / 2, photoBoxY + 48, 48)
  } catch {
    ctx.fillStyle = '#E3F2FD'
    ctx.beginPath()
    ctx.arc(CARD_WIDTH / 2, photoBoxY + 48, 48, 0, Math.PI * 2)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#1565C0'
    ctx.font = '11px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('货物照片', CARD_WIDTH / 2, photoBoxY + 44)
    ctx.textAlign = 'left'
  }

  y = photoBoxY + 96 + 20

  const footerY = CARD_HEIGHT - 72
  ctx.fillStyle = '#F5F9FF'
  drawRoundRect(ctx, 0, footerY, CARD_WIDTH, 72, 12)
  ctx.fill()

  ctx.fillStyle = '#333333'
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`快递员：${record.courier}`, 28, footerY + 20)
  ctx.fillStyle = '#666666'
  ctx.font = '11px system-ui, -apple-system, sans-serif'
  ctx.fillText('SignFlow 物流 · 客服热线：400-888-8888', 28, footerY + 44)
}

export async function downloadReceipt(record: SignRecord): Promise<void> {
  const canvas = document.createElement('canvas')
  await renderReceiptToCanvas(record, canvas)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `receipt-${record.trackingNumber}.png`)
        resolve()
      } else {
        reject(new Error('生成凭证图片失败'))
      }
    }, 'image/png')
  })
}
