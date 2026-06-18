import React, { useRef } from 'react'
import { useDrag } from 'react-dnd'
import { motion } from 'framer-motion'
import { useEditor } from '@/context/EditorContext'
import type { StickerTemplate } from '@/types'
import './StickerLibrary.css'

interface DraggableStickerProps {
  template: StickerTemplate
}

const DraggableSticker: React.FC<DraggableStickerProps> = ({ template }) => {
  const { addSticker } = useEditor()
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'sticker',
    item: template,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  const handleClick = () => {
    addSticker(template, 300 + Math.random() * 100, 200 + Math.random() * 100)
  }

  return (
    <motion.div
      ref={drag}
      className="sticker-item"
      onClick={handleClick}
      whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      transition={{ duration: 0.2 }}
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      {template.type === 'preset' ? (
        <span className="sticker-emoji">{template.content}</span>
      ) : (
        <img src={template.content} alt="uploaded" className="sticker-image" draggable={false} />
      )}
    </motion.div>
  )
}

const StickerLibrary: React.FC = () => {
  const { stickerTemplates, addImageSticker } = useEditor()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('仅支持 JPG 和 PNG 格式')
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      const img = new Image()
      img.onload = () => {
        addImageSticker(dataUrl, img.width, img.height)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="sticker-library">
      <h3 className="library-title">贴纸库</h3>
      <motion.button
        className="upload-btn"
        onClick={handleUploadClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        📷 上传照片
      </motion.button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <div className="sticker-grid">
        {stickerTemplates.map((tpl) => (
          <DraggableSticker key={tpl.id} template={tpl} />
        ))}
      </div>
    </div>
  )
}

export default StickerLibrary
