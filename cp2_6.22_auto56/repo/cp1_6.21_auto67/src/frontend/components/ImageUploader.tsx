import React, { useCallback, useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { validateImage, processImage } from '../utils/imageProcessor'
import { UploadedImage } from '../../shared/types'
import './ImageUploader.css'

interface ImageUploaderProps {
  images: UploadedImage[]
  onImagesChange: (images: UploadedImage[]) => void
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ images, onImagesChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = useCallback(async (files: FileList) => {
    setError(null)
    const newImages: UploadedImage[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const validation = validateImage(file)

      if (!validation.valid) {
        setError(validation.error || '图片校验失败')
        continue
      }

      try {
        const { thumbnail } = await processImage(file)
        newImages.push({
          id: uuidv4(),
          file,
          thumbnail
        })
      } catch (err) {
        setError('图片处理失败，请重试')
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages])
    }
  }, [images, onImagesChange])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
  }, [handleFiles])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
    e.target.value = ''
  }, [handleFiles])

  const handleDelete = useCallback((id: string) => {
    onImagesChange(images.filter(img => img.id !== id))
  }, [images, onImagesChange])

  return (
    <div className="uploader-container">
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          multiple
          onChange={handleInputChange}
          className="file-input"
        />
        {isDragging && <div className="ripple" />}
        <div className="upload-content">
          <Upload className="upload-icon" size={48} />
          <p className="upload-text">拖放图片到此处，或点击上传</p>
          <p className="upload-hint">支持 JPG/PNG 格式，单张最大 5MB</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {images.length > 0 && (
        <div className="thumbnail-list">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="thumbnail-item"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <img src={image.thumbnail} alt="预览" className="thumbnail-image" />
              <button
                className="delete-button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(image.id)
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="empty-state">
          <ImageIcon size={32} className="empty-icon" />
          <p>暂无上传图片</p>
        </div>
      )}
    </div>
  )
}
