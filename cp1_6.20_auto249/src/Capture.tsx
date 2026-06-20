import { FlowerParams, generateFlowerHash, formatDateTime } from './utils/flowerUtils'

export async function generateCapture(
  canvas: HTMLCanvasElement,
  params: FlowerParams
): Promise<void> {
  const captureCanvas = document.createElement('canvas')
  captureCanvas.width = 512
  captureCanvas.height = 512
  const ctx = captureCanvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 512, 512)

  const sourceSize = Math.min(canvas.width, canvas.height)
  const targetSize = 320
  const sx = (canvas.width - sourceSize) / 2
  const sy = (canvas.height - sourceSize) / 2
  const dx = (512 - targetSize) / 2
  const dy = 60

  ctx.drawImage(
    canvas,
    sx, sy, sourceSize, sourceSize,
    dx, dy, targetSize, targetSize
  )

  const hashId = generateFlowerHash(params)
  const dateTime = formatDateTime(new Date())

  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#333333'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`#${hashId}`, 256, 420)

  ctx.font = '14px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#666666'
  ctx.fillText(dateTime, 256, 450)

  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 1
  ctx.strokeRect(20, 20, 472, 472)

  return new Promise((resolve) => {
    captureCanvas.toBlob((blob) => {
      if (!blob) {
        resolve()
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `flower_${hashId}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      resolve()
    }, 'image/png')
  })
}
