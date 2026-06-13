import { useRef, useCallback } from 'react'

interface PhotoUploaderProps {
  photos: string[]
  setPhotos: (photos: string[]) => void
  maxPhotos?: number
}

export default function PhotoUploader({ photos, setPhotos, maxPhotos = 3 }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const maxSize = 800
          let width = img.width
          let height = img.height

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height * maxSize) / width)
              width = maxSize
            } else {
              width = Math.round((width * maxSize) / height)
              height = maxSize
            }
          }

          const scaleCanvas = document.createElement('canvas')
          scaleCanvas.width = width
          scaleCanvas.height = height
          const scaleCtx = scaleCanvas.getContext('2d')!
          scaleCtx.drawImage(img, 0, 0, width, height)

          const side = Math.min(width, height)
          const sx = (width - side) / 2
          const sy = (height - side) / 2

          const cropCanvas = document.createElement('canvas')
          cropCanvas.width = side
          cropCanvas.height = side
          const cropCtx = cropCanvas.getContext('2d')!
          cropCtx.drawImage(scaleCanvas, sx, sy, side, side, 0, 0, side, side)

          const result = cropCanvas.toDataURL('image/jpeg', 0.85)
          resolve(result)
        }
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsDataURL(file)
    })
  }

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const remaining = maxPhotos - photos.length
    const toProcess = Array.from(files).slice(0, remaining)

    try {
      const processed = await Promise.all(toProcess.map(processImage))
      setPhotos([...photos, ...processed])
    } catch (error) {
      console.error('图片处理失败:', error)
    }
  }, [photos, setPhotos, maxPhotos])

  const handleRemove = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    setPhotos(newPhotos)
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

  const canUpload = photos.length < maxPhotos

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {photos.map((photo, index) => (
          <div key={index} className="photo-preview">
            <img src={photo} alt={`图片 ${index + 1}`} />
            <button
              type="button"
              className="photo-remove-btn"
              onClick={() => handleRemove(index)}
            >
              ×
            </button>
          </div>
        ))}
        {canUpload && (
          <div
            className="photo-upload-area"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '1' }}
            onClick={() => inputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>📷</div>
              <div>点击或拖拽上传</div>
            </div>
          </div>
        )}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        还可上传 {maxPhotos - photos.length} 张
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
