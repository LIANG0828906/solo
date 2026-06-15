import { useRef, useState, useCallback, useEffect } from 'react'
import { X, Upload, Image as ImageIcon, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

interface CropState {
  x: number
  y: number
  width: number
  height: number
}

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se' | null

export default function ImageUpload({
  images,
  onChange,
  maxImages = 3,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropImageIndex, setCropImageIndex] = useState<number | null>(null)
  const [cropImageSrc, setCropImageSrc] = useState<string>('')
  const [cropState, setCropState] = useState<CropState>({ x: 50, y: 50, width: 200, height: 200 })
  const [dragMode, setDragMode] = useState<DragMode>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number; crop: CropState } | null>(null)
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const CANVAS_WIDTH = 500
  const CANVAS_HEIGHT = 400

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

  const openCropModal = (index: number) => {
    setCropImageIndex(index)
    setCropImageSrc(images[index])
    setCropModalOpen(true)
  }

  const closeCropModal = () => {
    setCropModalOpen(false)
    setCropImageIndex(null)
    setCropImageSrc('')
    setImageNaturalSize(null)
    setDragMode(null)
    setDragStart(null)
  }

  useEffect(() => {
    if (!cropModalOpen || !cropImageSrc) return

    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      setImageNaturalSize({ width: img.width, height: img.height })

      const scale = Math.min(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height, 1)
      const displayWidth = img.width * scale
      const displayHeight = img.height * scale

      const initialSize = Math.min(displayWidth, displayHeight) * 0.6
      setCropState({
        x: (CANVAS_WIDTH - initialSize) / 2,
        y: (CANVAS_HEIGHT - initialSize) / 2,
        width: initialSize,
        height: initialSize,
      })
    }
    img.src = cropImageSrc
  }, [cropModalOpen, cropImageSrc])

  useEffect(() => {
    if (!canvasRef.current || !imageRef.current || !imageNaturalSize) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const img = imageRef.current
    const scale = Math.min(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height, 1)
    const displayWidth = img.width * scale
    const displayHeight = img.height * scale
    const offsetX = (CANVAS_WIDTH - displayWidth) / 2
    const offsetY = (CANVAS_HEIGHT - displayHeight) / 2

    ctx.drawImage(img, offsetX, offsetY, displayWidth, displayHeight)

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.save()
    ctx.beginPath()
    ctx.rect(cropState.x, cropState.y, cropState.width, cropState.height)
    ctx.clip()
    ctx.drawImage(img, offsetX, offsetY, displayWidth, displayHeight)
    ctx.restore()

    ctx.strokeStyle = '#2D9B8E'
    ctx.lineWidth = 2
    ctx.strokeRect(cropState.x, cropState.y, cropState.width, cropState.height)

    const handleSize = 10
    const corners = [
      { x: cropState.x, y: cropState.y, cursor: 'nw' },
      { x: cropState.x + cropState.width, y: cropState.y, cursor: 'ne' },
      { x: cropState.x, y: cropState.y + cropState.height, cursor: 'sw' },
      { x: cropState.x + cropState.width, y: cropState.y + cropState.height, cursor: 'se' },
    ]

    corners.forEach((corner) => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize)
      ctx.strokeStyle = '#2D9B8E'
      ctx.lineWidth = 1
      ctx.strokeRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize)
    })
  }, [cropState, imageNaturalSize, cropModalOpen])

  useEffect(() => {
    if (!previewCanvasRef.current || !imageRef.current || !imageNaturalSize) return

    const previewCanvas = previewCanvasRef.current
    const previewCtx = previewCanvas.getContext('2d')
    if (!previewCtx) return

    const previewSize = 150
    previewCanvas.width = previewSize
    previewCanvas.height = previewSize

    const img = imageRef.current
    const scale = Math.min(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height, 1)
    const displayWidth = img.width * scale
    const displayHeight = img.height * scale
    const offsetX = (CANVAS_WIDTH - displayWidth) / 2
    const offsetY = (CANVAS_HEIGHT - displayHeight) / 2

    const sourceX = (cropState.x - offsetX) / scale
    const sourceY = (cropState.y - offsetY) / scale
    const sourceWidth = cropState.width / scale
    const sourceHeight = cropState.height / scale

    previewCtx.fillStyle = '#f3f4f6'
    previewCtx.fillRect(0, 0, previewSize, previewSize)

    if (sourceWidth > 0 && sourceHeight > 0) {
      const previewScale = Math.min(previewSize / sourceWidth, previewSize / sourceHeight)
      const destWidth = sourceWidth * previewScale
      const destHeight = sourceHeight * previewScale
      const destX = (previewSize - destWidth) / 2
      const destY = (previewSize - destHeight) / 2

      previewCtx.drawImage(
        img,
        Math.max(0, sourceX),
        Math.max(0, sourceY),
        Math.min(img.width, sourceWidth),
        Math.min(img.height, sourceHeight),
        destX,
        destY,
        destWidth,
        destHeight,
      )
    }
  }, [cropState, imageNaturalSize, cropModalOpen])

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const getDragMode = (x: number, y: number): DragMode => {
    const handleSize = 12
    const { x: cx, y: cy, width: cw, height: ch } = cropState

    if (Math.abs(x - cx) < handleSize && Math.abs(y - cy) < handleSize) return 'nw'
    if (Math.abs(x - (cx + cw)) < handleSize && Math.abs(y - cy) < handleSize) return 'ne'
    if (Math.abs(x - cx) < handleSize && Math.abs(y - (cy + ch)) < handleSize) return 'sw'
    if (Math.abs(x - (cx + cw)) < handleSize && Math.abs(y - (cy + ch)) < handleSize) return 'se'

    if (x > cx && x < cx + cw && y > cy && y < cy + ch) return 'move'

    return null
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)
    const mode = getDragMode(pos.x, pos.y)
    if (mode) {
      setDragMode(mode)
      setDragStart({ x: pos.x, y: pos.y, crop: { ...cropState } })
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)

    if (!dragMode || !dragStart) {
      const mode = getDragMode(pos.x, pos.y)
      const canvas = canvasRef.current
      if (canvas) {
        if (mode === 'move') {
          canvas.style.cursor = 'move'
        } else if (mode) {
          canvas.style.cursor = `${mode}-resize`
        } else {
          canvas.style.cursor = 'default'
        }
      }
      return
    }

    const dx = pos.x - dragStart.x
    const dy = pos.y - dragStart.y
    const { crop: startCrop } = dragStart

    let newCrop: CropState = { ...startCrop }

    const img = imageRef.current
    if (!img || !imageNaturalSize) return

    const scale = Math.min(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height, 1)
    const displayWidth = img.width * scale
    const displayHeight = img.height * scale
    const offsetX = (CANVAS_WIDTH - displayWidth) / 2
    const offsetY = (CANVAS_HEIGHT - displayHeight) / 2
    const minX = offsetX
    const minY = offsetY
    const maxX = offsetX + displayWidth
    const maxY = offsetY + displayHeight

    switch (dragMode) {
      case 'move':
        newCrop.x = Math.max(minX, Math.min(maxX - startCrop.width, startCrop.x + dx))
        newCrop.y = Math.max(minY, Math.min(maxY - startCrop.height, startCrop.y + dy))
        break
      case 'nw':
        newCrop.x = Math.max(minX, Math.min(startCrop.x + startCrop.width - 20, startCrop.x + dx))
        newCrop.y = Math.max(minY, Math.min(startCrop.y + startCrop.height - 20, startCrop.y + dy))
        newCrop.width = startCrop.width - (newCrop.x - startCrop.x)
        newCrop.height = startCrop.height - (newCrop.y - startCrop.y)
        break
      case 'ne':
        newCrop.y = Math.max(minY, Math.min(startCrop.y + startCrop.height - 20, startCrop.y + dy))
        newCrop.width = Math.max(20, Math.min(maxX - startCrop.x, startCrop.width + dx))
        newCrop.height = startCrop.height - (newCrop.y - startCrop.y)
        break
      case 'sw':
        newCrop.x = Math.max(minX, Math.min(startCrop.x + startCrop.width - 20, startCrop.x + dx))
        newCrop.width = startCrop.width - (newCrop.x - startCrop.x)
        newCrop.height = Math.max(20, Math.min(maxY - startCrop.y, startCrop.height + dy))
        break
      case 'se':
        newCrop.width = Math.max(20, Math.min(maxX - startCrop.x, startCrop.width + dx))
        newCrop.height = Math.max(20, Math.min(maxY - startCrop.y, startCrop.height + dy))
        break
    }

    setCropState(newCrop)
  }

  const handleCanvasMouseUp = () => {
    setDragMode(null)
    setDragStart(null)
  }

  const handleCanvasMouseLeave = () => {
    setDragMode(null)
    setDragStart(null)
  }

  const handleCropConfirm = async () => {
    if (cropImageIndex === null || !imageRef.current || !imageNaturalSize) return

    const img = imageRef.current
    const scale = Math.min(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height, 1)
    const displayWidth = img.width * scale
    const displayHeight = img.height * scale
    const offsetX = (CANVAS_WIDTH - displayWidth) / 2
    const offsetY = (CANVAS_HEIGHT - displayHeight) / 2

    const sourceX = (cropState.x - offsetX) / scale
    const sourceY = (cropState.y - offsetY) / scale
    const sourceWidth = cropState.width / scale
    const sourceHeight = cropState.height / scale

    const cropCanvas = document.createElement('canvas')
    const maxSize = 800
    let cropWidth = sourceWidth
    let cropHeight = sourceHeight

    if (cropWidth > cropHeight) {
      if (cropWidth > maxSize) {
        cropHeight = (cropHeight * maxSize) / cropWidth
        cropWidth = maxSize
      }
    } else {
      if (cropHeight > maxSize) {
        cropWidth = (cropWidth * maxSize) / cropHeight
        cropHeight = maxSize
      }
    }

    cropCanvas.width = cropWidth
    cropCanvas.height = cropHeight
    const cropCtx = cropCanvas.getContext('2d')
    if (!cropCtx) return

    cropCtx.drawImage(
      img,
      Math.max(0, sourceX),
      Math.max(0, sourceY),
      Math.min(img.width, sourceWidth),
      Math.min(img.height, sourceHeight),
      0,
      0,
      cropWidth,
      cropHeight,
    )

    const croppedImage = cropCanvas.toDataURL('image/jpeg', 0.8)

    const newImages = [...images]
    newImages[cropImageIndex] = croppedImage
    onChange(newImages)

    closeCropModal()
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
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => openCropModal(index)}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(index)
              }}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 z-10"
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

      {cropModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">裁剪图片</h3>
              <button
                type="button"
                onClick={closeCropModal}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="flex gap-6">
              <div className="flex-1">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="border border-gray-200 rounded-lg bg-gray-50 w-full"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseLeave}
                />
              </div>

              <div className="w-40 flex flex-col">
                <p className="text-sm font-medium text-gray-600 mb-2">预览</p>
                <div className="w-36 h-36 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                  <canvas ref={previewCanvasRef} className="max-w-full max-h-full" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={closeCropModal}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                className="px-4 py-2 text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors flex items-center gap-2"
              >
                <Check size={16} />
                确认裁剪
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
