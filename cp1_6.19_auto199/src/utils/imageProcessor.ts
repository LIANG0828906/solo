import { v4 as uuidv4 } from 'uuid'
import type { Photo } from '../store/photoStore'
import { extractDominantColor, getImageDataFromImage } from './colorExtractor'

export interface ProcessResult {
  photo: Photo
  progress: number
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

const compressImage = (
  img: HTMLImageElement,
  maxWidth: number,
  quality: number = 0.85
): { url: string; thumbnailUrl: string; width: number; height: number } => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  const scale = Math.min(1, maxWidth / img.width)
  const width = Math.floor(img.width * scale)
  const height = Math.floor(img.height * scale)

  canvas.width = width
  canvas.height = height
  ctx.drawImage(img, 0, 0, width, height)
  const url = canvas.toDataURL('image/jpeg', quality)

  const thumbScale = Math.min(1, 240 / img.width)
  canvas.width = Math.floor(img.width * thumbScale)
  canvas.height = Math.floor(img.height * thumbScale)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const thumbnailUrl = canvas.toDataURL('image/jpeg', quality)

  return { url, thumbnailUrl, width, height }
}

export const processImageFile = (
  file: File,
  onProgress: (progress: number) => void
): Promise<Photo> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    onProgress(10)

    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string
        onProgress(30)

        const img = await loadImage(dataUrl)
        onProgress(50)

        const compressed = compressImage(img, 800, 0.85)
        onProgress(70)

        const imageData = getImageDataFromImage(img)
        const dominantColor = extractDominantColor(imageData)
        onProgress(90)

        const photo: Photo = {
          id: uuidv4(),
          url: compressed.url,
          thumbnailUrl: compressed.thumbnailUrl,
          width: compressed.width,
          height: compressed.height,
          dominantColor,
          diary: '',
          username: '匿名用户',
          createdAt: new Date().toISOString(),
          emojiCounts: {
            surprised: 0,
            moved: 0,
            funny: 0,
            peaceful: 0,
            happy: 0,
          },
          lightLeakCount: 0,
          lastLightLeakDate: null,
        }

        onProgress(100)
        resolve(photo)
      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const processImageUrl = (
  url: string,
  onProgress: (progress: number) => void
): Promise<Photo> => {
  return new Promise(async (resolve, reject) => {
    try {
      onProgress(20)

      const img = await loadImage(url)
      onProgress(40)

      const compressed = compressImage(img, 800, 0.85)
      onProgress(60)

      const imageData = getImageDataFromImage(img)
      const dominantColor = extractDominantColor(imageData)
      onProgress(80)

      const photo: Photo = {
        id: uuidv4(),
        url: compressed.url,
        thumbnailUrl: compressed.thumbnailUrl,
        width: compressed.width,
        height: compressed.height,
        dominantColor,
        diary: '',
        username: '匿名用户',
        createdAt: new Date().toISOString(),
        emojiCounts: {
          surprised: 0,
          moved: 0,
          funny: 0,
          peaceful: 0,
          happy: 0,
        },
        lightLeakCount: 0,
        lastLightLeakDate: null,
      }

      onProgress(100)
      resolve(photo)
    } catch (err) {
      reject(err)
    }
  })
}
