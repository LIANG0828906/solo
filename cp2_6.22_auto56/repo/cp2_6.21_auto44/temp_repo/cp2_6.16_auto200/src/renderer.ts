import type { Template, BannerSize, UserInput, TextStyle, LayoutPosition, GradientColor } from './types'

const FONT_FAMILY = '"Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif'

const createGradient = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gradient: GradientColor
): CanvasGradient => {
  let startX = 0
  let startY = 0
  let endX = width
  let endY = 0

  switch (gradient.direction) {
    case 'vertical':
      startX = 0
      startY = 0
      endX = 0
      endY = height
      break
    case 'horizontal':
      startX = 0
      startY = 0
      endX = width
      endY = 0
      break
    case 'diagonal':
    default:
      startX = 0
      startY = 0
      endX = width
      endY = height
      break
  }

  const grad = ctx.createLinearGradient(startX, startY, endX, endY)
  grad.addColorStop(0, gradient.start)
  grad.addColorStop(1, gradient.end)
  return grad
}

const percentToPx = (percent: number, total: number): number => (percent / 100) * total

const drawBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: GradientColor
): void => {
  ctx.fillStyle = createGradient(ctx, width, height, background)
  ctx.fillRect(0, 0, width, height)
}

const drawPlaceholder = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void => {
  const placeholderGrad = ctx.createLinearGradient(x, y, x + w, y + h)
  placeholderGrad.addColorStop(0, '#E0E0E0')
  placeholderGrad.addColorStop(1, '#BDBDBD')
  ctx.fillStyle = placeholderGrad
  ctx.fillRect(x, y, w, h)

  ctx.fillStyle = '#9E9E9E'
  ctx.font = `${Math.min(w, h) * 0.08}px ${FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('图片加载中...', x + w / 2, y + h / 2)
}

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void => {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

const drawImage = async (
  ctx: CanvasRenderingContext2D,
  imageUrl: string,
  layout: LayoutPosition,
  imageStyle: { borderRadius: number; shadowOffsetX: number; shadowOffsetY: number; shadowBlur: number; shadowColor: string },
  canvasWidth: number,
  canvasHeight: number
): Promise<void> => {
  const x = percentToPx(layout.xPercent, canvasWidth)
  const y = percentToPx(layout.yPercent, canvasHeight)
  const w = percentToPx(layout.widthPercent, canvasWidth)
  const h = percentToPx(layout.heightPercent, canvasHeight)

  if (!imageUrl) {
    drawPlaceholder(ctx, x, y, w, h)
    return
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      ctx.save()
      ctx.shadowColor = imageStyle.shadowColor
      ctx.shadowOffsetX = imageStyle.shadowOffsetX
      ctx.shadowOffsetY = imageStyle.shadowOffsetY
      ctx.shadowBlur = imageStyle.shadowBlur

      roundRect(ctx, x, y, w, h, imageStyle.borderRadius)
      ctx.clip()

      const imgRatio = img.width / img.height
      const boxRatio = w / h
      let drawW = w
      let drawH = h
      let drawX = x
      let drawY = y

      if (imgRatio > boxRatio) {
        drawH = h
        drawW = h * imgRatio
        drawX = x - (drawW - w) / 2
      } else {
        drawW = w
        drawH = w / imgRatio
        drawY = y - (drawH - h) / 2
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH)
      ctx.restore()
      resolve()
    }
    img.onerror = () => {
      drawPlaceholder(ctx, x, y, w, h)
      resolve()
    }
    img.src = imageUrl
  })
}

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] => {
  const words = text.split('')
  const lines: string[] = []
  let currentLine = ''

  for (const char of words) {
    const testLine = currentLine + char
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && currentLine !== '') {
      lines.push(currentLine)
      currentLine = char
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

const setupTextStyle = (
  ctx: CanvasRenderingContext2D,
  style: TextStyle,
  width: number,
  height: number,
  textWidth: number,
  textHeight: number
): void => {
  const fontSize = percentToPx(style.fontSizePercent, Math.min(width, height))
  ctx.font = `${style.fontWeight} ${fontSize}px ${FONT_FAMILY}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  if (style.shadowColor) {
    ctx.shadowColor = style.shadowColor
    ctx.shadowOffsetX = style.shadowOffsetX || 0
    ctx.shadowOffsetY = style.shadowOffsetY || 0
    ctx.shadowBlur = style.shadowBlur || 0
  } else {
    ctx.shadowColor = 'transparent'
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 0
  }

  if (style.useGradient && style.gradientStart && style.gradientEnd) {
    const grad = ctx.createLinearGradient(0, textHeight, textWidth, textHeight)
    grad.addColorStop(0, style.gradientStart)
    grad.addColorStop(1, style.gradientEnd)
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = style.color
  }
}

const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  style: TextStyle,
  layout: LayoutPosition,
  width: number,
  height: number
): void => {
  if (!text) return

  const x = percentToPx(layout.xPercent, width)
  const y = percentToPx(layout.yPercent, height)
  const maxWidth = percentToPx(layout.widthPercent, width)
  const maxHeight = percentToPx(layout.heightPercent, height)

  setupTextStyle(ctx, style, width, height, x + maxWidth, y)

  const fontSize = percentToPx(style.fontSizePercent, Math.min(width, height))
  const lines = wrapText(ctx, text, maxWidth)
  const lineHeight = fontSize * 1.3
  const totalHeight = lines.length * lineHeight
  const startY = y + (maxHeight - totalHeight) / 2

  lines.forEach((line, index) => {
    const lineY = startY + index * lineHeight
    ctx.fillText(line, x, lineY)
  })

  ctx.shadowColor = 'transparent'
}

const drawButton = (
  ctx: CanvasRenderingContext2D,
  text: string,
  buttonStyle: { backgroundColor: string; borderRadius: number },
  textStyle: TextStyle,
  layout: LayoutPosition,
  width: number,
  height: number
): void => {
  if (!text) return

  const x = percentToPx(layout.xPercent, width)
  const y = percentToPx(layout.yPercent, height)
  const w = percentToPx(layout.widthPercent, width)
  const h = percentToPx(layout.heightPercent, height)

  ctx.save()
  ctx.fillStyle = buttonStyle.backgroundColor
  roundRect(ctx, x, y, w, h, buttonStyle.borderRadius)
  ctx.fill()
  ctx.restore()

  const fontSize = percentToPx(textStyle.fontSizePercent, Math.min(width, height))
  ctx.font = `${textStyle.fontWeight} ${fontSize}px ${FONT_FAMILY}`
  ctx.fillStyle = textStyle.color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'transparent'
  ctx.fillText(text, x + w / 2, y + h / 2)
}

export const renderBannerToCanvas = async (
  canvas: HTMLCanvasElement,
  template: Template,
  size: BannerSize,
  userInput: UserInput
): Promise<void> => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = size.width
  canvas.height = size.height

  ctx.clearRect(0, 0, size.width, size.height)

  drawBackground(ctx, size.width, size.height, template.background)

  await drawImage(
    ctx,
    userInput.imageUrl,
    template.imageLayout,
    template.imageStyle,
    size.width,
    size.height
  )

  drawText(ctx, userInput.title, template.titleStyle, template.titleLayout, size.width, size.height)
  drawText(ctx, userInput.subtitle, template.subtitleStyle, template.subtitleLayout, size.width, size.height)
  drawButton(ctx, userInput.buttonText, template.buttonStyle, template.buttonTextStyle, template.buttonLayout, size.width, size.height)
}

export const canvasToDataUrl = (canvas: HTMLCanvasElement, type: string = 'image/png'): string => {
  return canvas.toDataURL(type)
}

export const canvasToBlob = (canvas: HTMLCanvasElement, type: string = 'image/png'): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type)
  })
}
