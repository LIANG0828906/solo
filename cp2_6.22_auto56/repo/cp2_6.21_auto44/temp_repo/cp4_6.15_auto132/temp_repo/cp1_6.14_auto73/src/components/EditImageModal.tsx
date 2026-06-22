import { useState } from 'react'
import type { ColorItem, ImageItem } from '../types'

interface EditImageModalProps {
  open: boolean
  image: ImageItem | null
  onClose: () => void
  onSave: (imageId: string, composition: string, colors: ColorItem[]) => void
}

function EditImageModal({ open, image, onClose, onSave }: EditImageModalProps) {
  const [composition, setComposition] = useState('')
  const [colors, setColors] = useState<ColorItem[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleOpen = () => {
    if (image) {
      setComposition(image.composition)
      setColors([...image.colors])
    }
  }

  if (!open || !image) return null

  const handleColorChange = (index: number, hex: string) => {
    const newColors = [...colors]
    const validHex = hex.startsWith('#') ? hex : '#' + hex
    newColors[index] = {
      ...newColors[index],
      hex: validHex,
    }
    setColors(newColors)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    const newColors = [...colors]
    const [draggedItem] = newColors.splice(draggedIndex, 1)
    newColors.splice(index, 0, draggedItem)
    setColors(newColors)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleSave = () => {
    onSave(image.id, composition, colors)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <h3 className="modal-title">编辑图片信息</h3>

        <div className="form-group">
          <label>构图描述</label>
          <input
            type="text"
            value={composition}
            onChange={e => setComposition(e.target.value)}
            placeholder="如：对称构图、三分法"
          />
        </div>

        <div className="form-group">
          <label>颜色提取（拖拽调整顺序）</label>
          <div className="edit-image-colors">
            {colors.map((color, index) => (
              <div
                key={index}
                className="edit-color-item"
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={e => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <div
                  className="edit-color-preview"
                  style={{ backgroundColor: color.hex }}
                />
                <input
                  type="text"
                  className="edit-color-input"
                  value={color.hex}
                  onChange={e => handleColorChange(index, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditImageModal
