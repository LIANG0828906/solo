import { useRef, useState, useCallback } from 'react'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

export default function ImageUpload({
  images,
  onChange,
  maxImages = 3,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const maxSize = 800
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height
              height = maxSize
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Canvas context not available'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
        img.onerror = () => reject(new Error('Image load failed'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('File read failed'))
      reader.readAsDataURL(file)
    })
  }

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const remainingSlots = maxImages - images.length
      const filesToProcess = Array.from(files).slice(0, remainingSlots)

      try {
        const compressedImages = await Promise.all(
          filesToProcess.map((file) => compressImage(file)),
        )
        onChange([...images, ...compressedImages])
      } catch (error) {
        console.error('Image processing failed:', error)
      }
    },
    [images, maxImages, onChange],
  )

  const handleClick = () => {
    if (images.length >= maxImages) return
    fileInputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
      e.target.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleDelete = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-3">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 group"
          >
            <img
              src={image}
              alt={`Preview ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleDelete(index)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'w-24 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200',
              isDragging
                ? 'border-teal-500 bg-teal-50'
                : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50',
            )}
          >
            <Upload
              size={24}
              className={cn(
                'mb-1 transition-colors',
                isDragging ? 'text-teal-500' : 'text-gray-400',
              )}
            />
            <span
              className={cn(
                'text-xs',
                isDragging ? 'text-teal-500' : 'text-gray-500',
              )}
            >
              {images.length}/{maxImages}
            </span>
          </div>
        )}

        {images.length === 0 && (
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200',
              isDragging
                ? 'border-teal-500 bg-teal-50'
                : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50',
            )}
          >
            <ImageIcon
              size={32}
              className={cn(
                'mb-2 transition-colors',
                isDragging ? 'text-teal-500' : 'text-gray-400',
              )}
            />
            <span
              className={cn(
                'text-sm font-medium',
                isDragging ? 'text-teal-500' : 'text-gray-600',
              )}
            >
              {isDragging ? '释放以上传图片' : '点击或拖拽上传图片'}
            </span>
            <span className="text-xs text-gray-400 mt-1">
              最多上传 {maxImages} 张图片
            </span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  )
}
