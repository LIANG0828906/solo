import { useRef, useCallback, useState } from 'react'

export interface ProcessedPhoto {
  dataUrl: string
  file: File
}

interface PhotoUploaderProps {
  photos: ProcessedPhoto[]
  setPhotos: (photos: ProcessedPhoto[]) => void
  existingPhotos?: string[]
  setExistingPhotos?: (photos: string[]) => void
  maxPhotos?: number
}

function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

function processImage(file: File, targetSize: number = 800): Promise<ProcessedPhoto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > targetSize || height > targetSize) {
          if (width > height) {
            height = Math.round((height * targetSize) / width)
            width = targetSize
          } else {
            width = Math.round((width * targetSize) / height)
            height = targetSize
          }
        }

        const scaleCanvas = document.createElement('canvas')
        scaleCanvas.width = width
        scaleCanvas.height = height
        const scaleCtx = scaleCanvas.getContext('2d')
        if (!scaleCtx) {
          reject(new Error('Canvas 不支持'))
          return
        }
        scaleCtx.imageSmoothingEnabled = true
        scaleCtx.imageSmoothingQuality = 'high'
        scaleCtx.drawImage(img, 0, 0, width, height)

        const side = Math.min(width, height)
        const sx = (width - side) / 2
        const sy = (height - side) / 2

        const cropCanvas = document.createElement('canvas')
        cropCanvas.width = side
        cropCanvas.height = side
        const cropCtx = cropCanvas.getContext('2d')
        if (!cropCtx) {
          reject(new Error('Canvas 不支持'))
          return
        }
        cropCtx.imageSmoothingEnabled = true
        cropCtx.imageSmoothingQuality = 'high'
        cropCtx.drawImage(scaleCanvas, sx, sy, side, side, 0, 0, side, side)

        const dataUrl = cropCanvas.toDataURL('image/jpeg', 0.88)
        const processedFile = dataURLtoFile(dataUrl, `photo_${Date.now()}.jpg`)

        resolve({
          dataUrl,
          file: processedFile
        })
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

export default function PhotoUploader({
  photos,
  setPhotos,
  existingPhotos = [],
  setExistingPhotos,
  maxPhotos = 3
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)
  const [processing, setProcessing] = useState(false)

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const totalExisting = existingPhotos.length + photos.length
    const remaining = maxPhotos - totalExisting
    if (remaining <= 0) return
    const toProcess = Array.from(files).slice(0, remaining).filter(f => f.type.startsWith('image/'))
    if (toProcess.length === 0) return

    setProcessing(true)
    try {
      const processed = await Promise.all(toProcess.map(f => processImage(f)))
      setPhotos([...photos, ...processed])
    } catch (error) {
      console.error('图片处理失败:', error)
    } finally {
      setProcessing(false)
    }
  }, [photos, existingPhotos, setPhotos, maxPhotos])

  const handleRemoveNew = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const handleRemoveExisting = (index: number) => {
    if (setExistingPhotos) {
      setExistingPhotos(existingPhotos.filter((_, i) => i !== index))
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    handleFiles(e.dataTransfer.files)
  }

  const totalCount = existingPhotos.length + photos.length
  const canUpload = totalCount < maxPhotos

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {existingPhotos.map((photo, index) => (
          <div key={`existing-${index}`} className="photo-preview animate-scale-in">
            <img src={photo} alt={`已有图片 ${index + 1}`} />
            {setExistingPhotos && (
              <button
                type="button"
                className="photo-remove-btn"
                onClick={() => handleRemoveExisting(index)}
                title="移除"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {photos.map((photo, index) => (
          <div key={`new-${index}`} className="photo-preview animate-scale-in">
            <img src={photo.dataUrl} alt={`新图片 ${index + 1}`} />
            <button
              type="button"
              className="photo-remove-btn"
              onClick={() => handleRemoveNew(index)}
              title="移除"
            >
              ×
            </button>
          </div>
        ))}
        {canUpload && (
          <div
            className="photo-upload-area"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              aspectRatio: '1',
              opacity: processing ? 0.6 : 1,
              cursor: processing ? 'progress' : 'pointer'
            }}
            onClick={() => !processing && inputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>
                {processing ? '⏳' : '📷'}
              </div>
              <div>{processing ? '处理中...' : '点击或拖拽上传'}</div>
              <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-muted)' }}>
                自动等比缩放裁剪
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
        <span>已选 {totalCount}/{maxPhotos} 张</span>
        <span>还可上传 {maxPhotos - totalCount} 张</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}

export { processImage }
