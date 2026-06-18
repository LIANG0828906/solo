import { useState, useRef, useCallback } from 'react'
import { Upload } from 'lucide-react'

const MOOD_LABELS: Record<string, string> = {
  happy: '快乐',
  calm: '平静',
  sad: '忧伤',
  miss: '思念',
}

interface PhotoUploaderProps {
  mood: 'happy' | 'calm' | 'sad' | 'miss' | null
  onPhotoReady?: (photo: string | undefined) => void
}

export default function PhotoUploader({ mood, onPhotoReady }: PhotoUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processImage = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 200
        canvas.height = 200
        const ctx = canvas.getContext('2d')!

        const scale = Math.max(200 / img.width, 200 / img.height)
        const x = (200 - img.width * scale) / 2
        const y = (200 - img.height * scale) / 2
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

        const today = new Date().toISOString().split('T')[0]
        ctx.font = '12px sans-serif'
        ctx.fillStyle = '#FFFFFF'
        ctx.textAlign = 'right'
        ctx.fillText(today, 192, 192)

        if (mood) {
          const label = MOOD_LABELS[mood]
          ctx.font = '12px sans-serif'
          const textWidth = ctx.measureText(label).width
          ctx.fillStyle = 'rgba(0,0,0,0.6)'
          const rx = (200 - textWidth - 16) / 2
          ctx.beginPath()
          ctx.roundRect(rx, 4, textWidth + 16, 24, 8)
          ctx.fill()
          ctx.fillStyle = '#FFFFFF'
          ctx.textAlign = 'center'
          ctx.fillText(label, 100, 21)
        }

        const dataUrl = canvas.toDataURL('image/png')
        setPreviewUrl(dataUrl)
        onPhotoReady?.(dataUrl)
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [mood, onPhotoReady])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) processImage(file)
  }, [processImage])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processImage(file)
  }, [processImage])

  const handleReset = useCallback(() => {
    setPreviewUrl(null)
    onPhotoReady?.(undefined)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [onPhotoReady])

  if (previewUrl) {
    return (
      <div className="flex flex-col items-center gap-2">
        <img src={previewUrl} alt="preview" className="w-[200px] h-[200px] rounded-xl object-cover" />
        <button
          onClick={handleReset}
          className="text-sm text-[#A29BFE] hover:text-[#6C5CE7] transition-colors duration-300 ease-smooth"
        >
          重新选择
        </button>
      </div>
    )
  }

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className="mx-auto w-[200px] h-[200px] flex flex-col items-center justify-center cursor-pointer rounded-xl transition-all duration-300 ease-smooth"
      style={{
        border: isDragging ? '2px solid #A29BFE' : '2px dashed #A29BFE',
        animation: isDragging ? 'flashBorder 0.6s ease 2' : 'none',
      }}
    >
      <Upload size={24} className="text-[#A29BFE] mb-2" />
      <span className="text-sm text-[#A29BFE]">📷 点击或拖放上传封面照片</span>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
