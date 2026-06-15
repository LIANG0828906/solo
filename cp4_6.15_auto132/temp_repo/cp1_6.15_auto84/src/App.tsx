import React, { useRef, useState, useCallback, useEffect } from 'react'
import ImageGrid from './ImageGrid'
import LightingControls from './LightingControls'
import type { ImageItem, LightingParams } from './utils/imageFilters'
import './App.css'

const DEFAULT_LIGHTING: LightingParams = {
  angle: 45,
  intensity: 80
}

const App: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([])
  const [lighting, setLighting] = useState<LightingParams>(DEFAULT_LIGHTING)
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resetTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        window.clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFilesSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      const remainingSlots = 6 - images.length
      const filesToProcess = Array.from(files).slice(0, remainingSlots)

      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      const validFiles = filesToProcess.filter((f) =>
        validTypes.includes(f.type)
      )

      const newImages: ImageItem[] = []
      let processed = 0

      if (validFiles.length === 0) {
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      validFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (ev) => {
          processed++
          const dataUrl = ev.target?.result as string
          if (dataUrl) {
            newImages.push({
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              url: dataUrl,
              name: file.name
            })
          }
          if (processed === validFiles.length) {
            setImages((prev) => [...prev, ...newImages].slice(0, 6))
          }
        }
        reader.readAsDataURL(file)
      })

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [images.length]
  )

  const handleReset = useCallback(() => {
    setIsResetting(true)
    setSelectedImageId(null)

    requestAnimationFrame(() => {
      setLighting(DEFAULT_LIGHTING)
    })

    if (resetTimeoutRef.current) {
      window.clearTimeout(resetTimeoutRef.current)
    }
    resetTimeoutRef.current = window.setTimeout(() => {
      setIsResetting(false)
    }, 500)
  }, [])

  const handleLightingChange = useCallback((newLighting: LightingParams) => {
    setLighting(newLighting)
  }, [])

  return (
    <div className={`app-container ${isResetting ? 'resetting' : ''}`}>
      <div className="top-bar">
        <button
          className="upload-button"
          onClick={handleUploadClick}
          disabled={images.length >= 6}
          title={
            images.length >= 6 ? '已达最大数量（6张）' : '上传图片（jpeg/png/webp）'
          }
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: 6 }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          上传图片
        </button>
        <div className="image-count">
          {images.length} / 6 张作品
        </div>
      </div>

      <ImageGrid
        images={images}
        lighting={lighting}
        selectedImageId={selectedImageId}
        onSelectImage={setSelectedImageId}
        isResetting={isResetting}
      />

      <LightingControls
        lighting={lighting}
        onChange={handleLightingChange}
        onReset={handleReset}
        isResetting={isResetting}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFilesSelected}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default App
