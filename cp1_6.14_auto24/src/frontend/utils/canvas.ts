export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface ImageProcessResult {
  dataUrl: string
  blob: Blob
  width: number
  height: number
}

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function calculateCropArea(
  imageWidth: number,
  imageHeight: number,
  targetWidth: number,
  targetHeight: number
): CropArea {
  const imageAspect = imageWidth / imageHeight
  const targetAspect = targetWidth / targetHeight

  let cropWidth: number
  let cropHeight: number

  if (imageAspect > targetAspect) {
    cropHeight = imageHeight
    cropWidth = cropHeight * targetAspect
  } else {
    cropWidth = imageWidth
    cropHeight = cropWidth / targetAspect
  }

  return {
    x: (imageWidth - cropWidth) / 2,
    y: (imageHeight - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  }
}

export function processImage(
  img: HTMLImageElement,
  maxWidth: number = 800,
  quality: number = 0.85,
  cropArea?: CropArea
): Promise<ImageProcessResult> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas not supported'))
      return
    }

    let sourceX = 0
    let sourceY = 0
    let sourceWidth = img.naturalWidth
    let sourceHeight = img.naturalHeight

    if (cropArea) {
      sourceX = cropArea.x
      sourceY = cropArea.y
      sourceWidth = cropArea.width
      sourceHeight = cropArea.height
    }

    const aspectRatio = sourceWidth / sourceHeight
    let targetWidth = Math.min(maxWidth, sourceWidth)
    let targetHeight = targetWidth / aspectRatio

    if (sourceWidth <= maxWidth) {
      targetWidth = sourceWidth
      targetHeight = sourceHeight
    }

    canvas.width = targetWidth
    canvas.height = targetHeight

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      targetWidth,
      targetHeight
    )

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'))
          return
        }

        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve({
          dataUrl,
          blob,
          width: targetWidth,
          height: targetHeight,
        })
      },
      'image/jpeg',
      quality
    )
  })
}

export function createPreviewCanvas(
  container: HTMLElement,
  img: HTMLImageElement,
  cropAspect: number = 3 / 4
): {
  canvas: HTMLCanvasElement
  updateCrop: (area: CropArea) => void
} {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  const maxPreviewWidth = Math.min(400, container.clientWidth)
  const previewWidth = maxPreviewWidth
  const previewHeight = previewWidth / cropAspect

  canvas.width = previewWidth
  canvas.height = previewHeight
  canvas.style.maxWidth = '100%'
  canvas.style.borderRadius = '8px'
  canvas.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)'

  const scaleX = previewWidth / img.naturalWidth
  const scaleY = previewHeight / img.naturalHeight
  const scale = Math.min(scaleX, scaleY)

  const drawWidth = img.naturalWidth * scale
  const drawHeight = img.naturalHeight * scale
  const offsetX = (previewWidth - drawWidth) / 2
  const offsetY = (previewHeight - drawHeight) / 2

  function draw(area?: CropArea) {
    ctx.clearRect(0, 0, previewWidth, previewHeight)

    ctx.fillStyle = '#F5F0E8'
    ctx.fillRect(0, 0, previewWidth, previewHeight)

    if (area) {
      const cropPreviewX = offsetX + area.x * scale
      const cropPreviewY = offsetY + area.y * scale
      const cropPreviewW = area.width * scale
      const cropPreviewH = area.height * scale

      ctx.save()
      ctx.strokeStyle = '#5C4033'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(cropPreviewX, cropPreviewY, cropPreviewW, cropPreviewH)
      ctx.restore()

      ctx.save()
      ctx.beginPath()
      ctx.rect(cropPreviewX, cropPreviewY, cropPreviewW, cropPreviewH)
      ctx.clip()
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
      ctx.restore()

      ctx.fillStyle = 'rgba(92, 64, 51, 0.5)'
      ctx.fillRect(0, 0, previewWidth, cropPreviewY)
      ctx.fillRect(0, cropPreviewY + cropPreviewH, previewWidth, previewHeight - cropPreviewY - cropPreviewH)
      ctx.fillRect(0, cropPreviewY, cropPreviewX, cropPreviewH)
      ctx.fillRect(cropPreviewX + cropPreviewW, cropPreviewY, previewWidth - cropPreviewX - cropPreviewW, cropPreviewH)
    } else {
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
    }
  }

  draw()

  return {
    canvas,
    updateCrop: (area: CropArea) => draw(area),
  }
}

export async function processCoverImage(file: File): Promise<ImageProcessResult> {
  const img = await loadImage(file)
  const cropArea = calculateCropArea(img.naturalWidth, img.naturalHeight, 3, 4)
  const result = await processImage(img, 800, 0.85, cropArea)
  return result
}
