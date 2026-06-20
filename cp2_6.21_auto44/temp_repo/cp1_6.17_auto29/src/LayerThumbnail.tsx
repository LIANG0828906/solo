import React, { useEffect, useRef } from 'react'
import type { Layer } from './types'

interface LayerThumbnailProps {
  layer: Layer
}

const LayerThumbnail: React.FC<LayerThumbnailProps> = ({ layer }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 40
    canvas.width = size
    canvas.height = size

    ctx.clearRect(0, 0, size, size)

    if (layer.type === 'image' && layer.imageSrc) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const scale = Math.max(size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        const x = (size - w) / 2
        const y = (size - h) / 2

        ctx.drawImage(img, x, y, w, h)
      }
      img.src = layer.imageSrc
    } else if (layer.type === 'text' && layer.text) {
      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(0, 0, size, size)
      ctx.fillStyle = layer.text.color
      ctx.font = `${layer.text.fontWeight} 12px ${layer.text.fontFamily.split(',')[0].replace(/'/g, '')}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Aa', size / 2, size / 2)
    }
  }, [layer])

  return (
    <div className="layer-thumbnail">
      <canvas ref={canvasRef} />
    </div>
  )
}

export default LayerThumbnail
