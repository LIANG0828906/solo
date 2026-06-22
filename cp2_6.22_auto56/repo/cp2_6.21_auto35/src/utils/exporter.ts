import html2canvas from 'html2canvas'
import GIF from 'gif.js'

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function exportPNG(canvas: HTMLCanvasElement, filename: string = 'neon-text.png') {
  const dataUrl = canvas.toDataURL('image/png')
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  downloadBlob(blob, filename)
}

export async function exportPNGFromContainer(
  container: HTMLElement,
  filename: string = 'neon-text.png',
) {
  const canvas = await html2canvas(container, {
    backgroundColor: '#0a0a0e',
    useCORS: true,
    allowTaint: true,
    scale: 2,
  })
  canvas.toBlob((blob) => {
    if (blob) {
      downloadBlob(blob, filename)
    }
  }, 'image/png')
}

export interface GifExportOptions {
  canvas: HTMLCanvasElement
  width: number
  height: number
  totalFrames: number
  fps: number
  onProgress?: (frame: number, total: number) => void
  onFrame?: (frameIndex: number) => void | Promise<void>
  filename?: string
}

export async function exportGif({
  canvas,
  width,
  height,
  totalFrames,
  fps,
  onProgress,
  onFrame,
  filename = 'neon-text.gif',
}: GifExportOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const targetWidth = Math.min(width, 960)
      const targetHeight = Math.round((targetWidth / width) * height)
      const delay = Math.round(1000 / fps)

      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: targetWidth,
        height: targetHeight,
        workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js',
      })

      const offscreen = document.createElement('canvas')
      offscreen.width = targetWidth
      offscreen.height = targetHeight
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true })!

      let currentFrame = 0

      const processNextFrame = async () => {
        if (currentFrame >= totalFrames) {
          gif.on('finished', (blob: Blob) => {
            downloadBlob(blob, filename)
            resolve()
          })
          gif.render()
          return
        }

        try {
          if (onFrame) {
            await onFrame(currentFrame)
          }

          await new Promise((r) => requestAnimationFrame(() => r(null)))

          if (targetWidth === width && targetHeight === height) {
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
            if (gl) {
              const pixels = new Uint8Array(width * height * 4)
              const gl2 = gl as WebGL2RenderingContext | WebGLRenderingContext
              gl2.readPixels(0, 0, width, height, gl2.RGBA, gl2.UNSIGNED_BYTE, pixels)
              const imageData = new ImageData(
                new Uint8ClampedArray(pixels),
                width,
                height,
              )
              const tempCanvas = document.createElement('canvas')
              tempCanvas.width = width
              tempCanvas.height = height
              tempCanvas.getContext('2d')!.putImageData(imageData, 0, 0)
              offCtx.save()
              offCtx.translate(0, targetHeight)
              offCtx.scale(1, -1)
              offCtx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight)
              offCtx.restore()
            } else {
              offCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight)
            }
          } else {
            offCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight)
          }

          const frameImageData = offCtx.getImageData(0, 0, targetWidth, targetHeight)
          gif.addFrame(frameImageData, { delay, copy: true })

          currentFrame++
          if (onProgress) {
            onProgress(currentFrame, totalFrames)
          }

          setTimeout(processNextFrame, 0)
        } catch (err) {
          reject(err)
        }
      }

      processNextFrame()
    } catch (err) {
      reject(err)
    }
  })
}
