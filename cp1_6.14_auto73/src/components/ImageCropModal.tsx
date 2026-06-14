import { useState, useRef, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import type { ColorItem } from './types'

interface ImageCropModalProps {
  open: boolean
  imageFile: File | null
  onConfirm: (croppedFile: File) => void
  onCancel: () => void
}

function ImageCropModal({ open, imageFile, onConfirm, onCancel }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleConfirm = async () => {
    if (!imageFile || !croppedAreaPixels) return

    const image = new Image()
    const url = URL.createObjectURL(imageFile)

    await new Promise<void>((resolve) => {
      image.onload = () => resolve()
      image.src = url
    })

    const canvas = canvasRef.current || document.createElement('canvas')
    canvas.width = croppedAreaPixels.width
    canvas.height = croppedAreaPixels.height
    const ctx = canvas.getContext('2d')!

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
    )

    URL.revokeObjectURL(url)

    canvas.toBlob((blob) => {
      if (!blob) return
      const croppedFile = new File([blob], imageFile!.name, {
        type: imageFile!.type,
        lastModified: Date.now(),
      })
      onConfirm(croppedFile)
    }, imageFile.type)
  }

  if (!open || !imageFile) return null

  const imageUrl = URL.createObjectURL(imageFile)

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 640, width: '95%' }}
      >
        <h3 className="modal-title">裁剪图片</h3>

        <div style={{
          position: 'relative',
          width: '100%',
          height: 400,
          background: '#1e293b',
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
            缩放: {zoom.toFixed(1)}x
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>
            取消
          </button>
          <button className="btn-primary" onClick={handleConfirm}>
            确认裁剪并上传
          </button>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
}

export default ImageCropModal
