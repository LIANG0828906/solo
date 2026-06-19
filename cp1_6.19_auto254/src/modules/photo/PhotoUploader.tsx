import { useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import exifr from 'exifr'
import { useJourneyStore } from '@/store/useJourneyStore'
import type { Photo } from '@/types'

const MAX_FILE_SIZE = 8 * 1024 * 1024

function createThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const size = Math.min(img.width, img.height)
        const offsetX = (img.width - size) / 2
        const offsetY = (img.height - size) / 2
        canvas.width = 120
        canvas.height = 120
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, 120, 120)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function PhotoUploader() {
  const inputRef = useRef<HTMLInputElement>(null)
  const addPhotos = useJourneyStore((s) => s.addPhotos)

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter(
        (f) =>
        (f.type === 'image/jpeg' ||
          f.type === 'image/png' ||
          f.type === 'image/jpg') &&
        f.size <= MAX_FILE_SIZE
      )

      const processedPhotos: Photo[] = []

      for (const file of fileArray) {
        try {
          const url = URL.createObjectURL(file)
          const thumbnailUrl = await createThumbnail(file)

          let lat: number | undefined
          let lng: number | undefined
          let timestamp: Date | null = null

          try {
            const exif = await exifr.parse(file, {
              gps: true,
              exif: true
            })

            if (exif?.latitude && exif?.longitude) {
              lat = Number(exif.latitude.toFixed(4))
              lng = Number(exif.longitude.toFixed(4))
            }

            if (exif?.DateTimeOriginal || exif?.CreateDate || exif?.ModifyDate) {
              timestamp = exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate
            }
          } catch {
            // noop
          }

          if (!timestamp) {
            timestamp = new Date(file.lastModified)
          }

          processedPhotos.push({
            id: uuidv4(),
            file,
            url,
            thumbnailUrl,
            lat,
            lng,
            timestamp,
            hasGPS: !!(lat && lng)
          })
        } catch {
          // noop
        }
      }

      if (processedPhotos.length > 0) {
        addPhotos(processedPhotos)
      }
    },
    [addPhotos]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer.files?.length) {
        processFiles(e.dataTransfer.files)
      }
    },
    [processFiles]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        processFiles(e.target.files)
      }
    },
    [processFiles]
  )

  return (
    <motion.div
      className="uploader"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{
        border: '2px dashed #30363D',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 100ms ease',
        marginBottom: '16px',
        userSelect: 'none'
      }}
      whileHover={{
        borderColor: '#58A6FF',
        backgroundColor: '#161B22'
      }}
      whileTap={{ backgroundColor: '#21262D' }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        multiple
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
      <div style={{ color: '#C9D1D9', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
        点击或拖拽上传照片
      </div>
      <div style={{ color: '#8B949E', fontSize: '12px' }}>
        支持 JPEG/PNG，单张最大 8MB
      </div>
    </motion.div>
  )
}
