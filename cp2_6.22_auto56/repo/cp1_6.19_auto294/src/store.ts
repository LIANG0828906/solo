import { create } from 'zustand'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export type FilterType = 'none' | 'vintage' | 'coolGray' | 'vibrant' | 'japanese' | 'monochrome'

export type WatermarkPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center'

export interface Photo {
  id: string
  file: File
  url: string
  name: string
  size: number
  currentFilter: FilterType
  filterStack: FilterType[]
}

interface Store {
  photos: Photo[]
  selectedIndex: number
  filterHistory: FilterType[][]
  watermarkText: string
  watermarkSize: 16 | 24 | 32
  watermarkPosition: WatermarkPosition
  isWatermarkVisible: boolean
  isExporting: boolean

  addPhotos: (files: File[]) => void
  removePhoto: (id: string) => void
  selectPhoto: (index: number) => void
  applyFilter: (filter: FilterType) => void
  undoFilter: (photoIndex: number) => void
  updateWatermark: (updates: Partial<{
    text: string
    size: 16 | 24 | 32
    position: WatermarkPosition
  }>) => void
  toggleWatermark: () => void
  exportAll: () => Promise<void>
}

export const FILTER_PRESETS: Record<Exclude<FilterType, 'none'>, { label: string; css: string }> = {
  vintage: {
    label: '复古暖黄',
    css: 'sepia(0.3) saturate(1.4) contrast(1.1) brightness(1.05) hue-rotate(-10deg)',
  },
  coolGray: {
    label: '冷灰胶片',
    css: 'grayscale(0.2) contrast(1.05) brightness(0.95) saturate(0.85) hue-rotate(10deg)',
  },
  vibrant: {
    label: '高饱和鲜艳',
    css: 'saturate(1.8) contrast(1.15) brightness(1.05)',
  },
  japanese: {
    label: '日系清新',
    css: 'brightness(1.1) contrast(0.95) saturate(0.9) hue-rotate(5deg) sepia(0.1)',
  },
  monochrome: {
    label: '黑白高对比',
    css: 'grayscale(1) contrast(1.3) brightness(1.05)',
  },
}

export const getFilterCss = (filter: FilterType): string => {
  if (filter === 'none') return 'none'
  return FILTER_PRESETS[filter].css
}

const MAX_PHOTOS = 20
const MAX_FILTER_STACK = 4
const MAX_HISTORY = 3

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

export { formatFileSize }

const createPoster = (photos: Photo[]): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const cols = 4
    const rows = 3
    const gap = 4
    const padding = 20
    const cellWidth = 240
    const cellHeight = 160
    const totalWidth = padding * 2 + cols * cellWidth + (cols - 1) * gap
    const totalHeight = padding * 2 + rows * cellHeight + (rows - 1) * gap + 60

    canvas.width = totalWidth
    canvas.height = totalHeight
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#2C3E50'
    ctx.fillRect(0, 0, totalWidth, totalHeight)

    const loadedImages: HTMLImageElement[] = []
    let loaded = 0

    const drawImages = () => {
      for (let i = 0; i < Math.min(photos.length, rows * cols); i++) {
        const row = Math.floor(i / cols)
        const col = i % cols
        const x = padding + col * (cellWidth + gap)
        const y = padding + row * (cellHeight + gap)

        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(x - 2, y - 2, cellWidth + 4, cellHeight + 4)

        const img = loadedImages[i]
        if (img) {
          const scale = Math.max(cellWidth / img.width, cellHeight / img.height)
          const drawW = img.width * scale
          const drawH = img.height * scale
          const offsetX = x + (cellWidth - drawW) / 2
          const offsetY = y + (cellHeight - drawH) / 2

          ctx.save()
          ctx.beginPath()
          ctx.rect(x, y, cellWidth, cellHeight)
          ctx.clip()
          ctx.drawImage(img, offsetX, offsetY, drawW, drawH)
          ctx.restore()
        }
      }

      ctx.font = '24px "Noto Sans SC", sans-serif'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'bottom'
      ctx.fillText('Powered by PhotoLab', totalWidth - 20, totalHeight - 20)

      canvas.toBlob((blob) => {
        resolve(blob!)
      }, 'image/png')
    }

    if (photos.length === 0) {
      drawImages()
      return
    }

    for (let i = 0; i < Math.min(photos.length, rows * cols); i++) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        loadedImages[i] = img
        loaded++
        if (loaded >= Math.min(photos.length, rows * cols)) {
          drawImages()
        }
      }
      img.onerror = () => {
        loaded++
        if (loaded >= Math.min(photos.length, rows * cols)) {
          drawImages()
        }
      }
      img.src = photos[i].url
    }
  })
}

const applyFilterToCanvas = (img: HTMLImageElement, filterCss: string): Blob => {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!

  if (filterCss !== 'none') {
    ctx.filter = filterCss
  }
  ctx.drawImage(img, 0, 0)

  const data = canvas.toDataURL('image/png')
  const byteString = atob(data.split(',')[1])
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new Blob([ab], { type: 'image/png' })
}

export const useStore = create<Store>((set, get) => ({
  photos: [],
  selectedIndex: -1,
  filterHistory: [],
  watermarkText: '',
  watermarkSize: 24,
  watermarkPosition: 'bottomRight',
  isWatermarkVisible: false,
  isExporting: false,

  addPhotos: (files) => {
    const validFiles = files.filter((f) => {
      const isImage = f.type === 'image/jpeg' || f.type === 'image/png'
      const isSizeOk = f.size <= 10 * 1024 * 1024
      return isImage && isSizeOk
    })

    const currentPhotos = get().photos
    const remaining = MAX_PHOTOS - currentPhotos.length
    const toAdd = validFiles.slice(0, remaining)

    const newPhotos: Photo[] = toAdd.map((file, i) => ({
      id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      currentFilter: 'none',
      filterStack: ['none'],
    }))

    const updatedPhotos = [...currentPhotos, ...newPhotos]
    const newHistory = updatedPhotos.map((p) => [...p.filterStack])

    set({
      photos: updatedPhotos,
      filterHistory: newHistory,
      selectedIndex: get().selectedIndex === -1 && updatedPhotos.length > 0 ? 0 : get().selectedIndex,
    })
  },

  removePhoto: (id) => {
    const photos = get().photos
    const idx = photos.findIndex((p) => p.id === id)
    if (idx === -1) return

    URL.revokeObjectURL(photos[idx].url)
    const newPhotos = photos.filter((p) => p.id !== id)
    const newHistory = get().filterHistory.filter((_, i) => i !== idx)

    let newSelected = get().selectedIndex
    if (newPhotos.length === 0) {
      newSelected = -1
    } else if (idx === newSelected) {
      newSelected = Math.min(idx, newPhotos.length - 1)
    } else if (idx < newSelected) {
      newSelected--
    }

    set({
      photos: newPhotos,
      filterHistory: newHistory,
      selectedIndex: newSelected,
    })
  },

  selectPhoto: (index) => {
    if (index >= 0 && index < get().photos.length) {
      set({ selectedIndex: index })
    }
  },

  applyFilter: (filter) => {
    const { photos, filterHistory } = get()
    if (photos.length === 0) return

    const newPhotos = photos.map((p) => {
      const newStack = [...p.filterStack]
      if (newStack.length >= MAX_FILTER_STACK) {
        newStack.shift()
      }
      newStack.push(filter)
      return {
        ...p,
        currentFilter: filter,
        filterStack: newStack,
      }
    })

    const newHistory = filterHistory.map((h, i) => {
      const nh = [...h, newPhotos[i].currentFilter]
      return nh.length > MAX_HISTORY ? nh.slice(-MAX_HISTORY) : nh
    })

    set({ photos: newPhotos, filterHistory: newHistory })
  },

  undoFilter: (photoIndex) => {
    const { photos, filterHistory } = get()
    if (photoIndex < 0 || photoIndex >= photos.length) return

    const photo = photos[photoIndex]
    const newStack = [...photo.filterStack]
    if (newStack.length > 1) {
      newStack.pop()
    }

    const newFilter = newStack[newStack.length - 1] || 'none'
    const newPhotos = [...photos]
    newPhotos[photoIndex] = {
      ...photo,
      currentFilter: newFilter,
      filterStack: newStack,
    }

    const newHistory = [...filterHistory]
    const photoHistory = [...(newHistory[photoIndex] || [])]
    if (photoHistory.length > 0) {
      photoHistory.pop()
    }
    newHistory[photoIndex] = photoHistory

    set({ photos: newPhotos, filterHistory: newHistory })
  },

  updateWatermark: (updates) => {
    const current = get()
    set({
      watermarkText: updates.text !== undefined ? updates.text : current.watermarkText,
      watermarkSize: updates.size !== undefined ? updates.size : current.watermarkSize,
      watermarkPosition: updates.position !== undefined ? updates.position : current.watermarkPosition,
    })
  },

  toggleWatermark: () => {
    set((s) => ({ isWatermarkVisible: !s.isWatermarkVisible }))
  },

  exportAll: async () => {
    const { photos, watermarkText, watermarkSize, watermarkPosition, isWatermarkVisible } = get()
    if (photos.length === 0) return

    set({ isExporting: true })

    try {
      const zip = new JSZip()

      const watermarkStyle = isWatermarkVisible && watermarkText
        ? { text: watermarkText, size: watermarkSize, position: watermarkPosition }
        : null

      const processPhotos = async () => {
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i]
          const img = new Image()
          img.crossOrigin = 'anonymous'

          await new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
            img.src = photo.url
          })

          const filterCss = getFilterCss(photo.currentFilter)
          let blob: Blob

          if (filterCss !== 'none' || watermarkStyle) {
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext('2d')!

            if (filterCss !== 'none') {
              ctx.filter = filterCss
            }
            ctx.drawImage(img, 0, 0)
            ctx.filter = 'none'

            if (watermarkStyle) {
              ctx.font = `${watermarkStyle.size}px "Noto Sans SC", sans-serif`
              ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'

              const padding = watermarkStyle.size
              let x = padding
              let y = padding
              const metrics = ctx.measureText(watermarkStyle.text)
              const textW = metrics.width
              const textH = watermarkStyle.size

              switch (watermarkStyle.position) {
                case 'topLeft':
                  x = padding
                  y = padding + textH
                  break
                case 'topRight':
                  x = canvas.width - padding - textW
                  y = padding + textH
                  break
                case 'bottomLeft':
                  x = padding
                  y = canvas.height - padding
                  break
                case 'bottomRight':
                  x = canvas.width - padding - textW
                  y = canvas.height - padding
                  break
                case 'center':
                  x = (canvas.width - textW) / 2
                  y = (canvas.height + textH) / 2
                  break
              }

              ctx.fillText(watermarkStyle.text, x, y)
            }

            const data = canvas.toDataURL('image/png')
            const byteString = atob(data.split(',')[1])
            const ab = new ArrayBuffer(byteString.length)
            const ia = new Uint8Array(ab)
            for (let j = 0; j < byteString.length; j++) {
              ia[j] = byteString.charCodeAt(j)
            }
            blob = new Blob([ab], { type: 'image/png' })
          } else {
            blob = photo.file
          }

          const ext = photo.name.toLowerCase().endsWith('.png') ? '.png' : '.jpg'
          const baseName = photo.name.replace(/\.[^.]+$/, '')
          zip.file(`${String(i + 1).padStart(2, '0')}_${baseName}${ext}`, blob)
        }
      }

      await processPhotos()

      const posterBlob = await createPoster(photos)
      zip.file('poster.png', posterBlob)

      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, `PhotoBatch_${Date.now()}.zip`)
    } finally {
      set({ isExporting: false })
    }
  },
}))
