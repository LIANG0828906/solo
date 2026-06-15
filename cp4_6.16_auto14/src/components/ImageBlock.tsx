import React, { useCallback, useRef, useState } from 'react'
import type { ImageBlock as ImageBlockType } from '@/types'

interface ImageBlockProps {
  block: ImageBlockType
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<ImageBlockType>) => void
  onDragStart: (e: React.MouseEvent) => void
}

const ImageBlock: React.FC<ImageBlockProps> = React.memo(({ block, isSelected, onSelect, onUpdate, onDragStart }) => {
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
    if (e.button === 0) {
      onDragStart(e)
    }
  }, [onSelect, onDragStart])

  const handleLoadUrl = useCallback(() => {
    if (urlInput.trim()) {
      onUpdate({ url: urlInput.trim() })
      setUrlInput('')
    }
  }, [urlInput, onUpdate])

  const handleUrlKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleLoadUrl()
    }
  }, [handleLoadUrl])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text')
    if (pasted) {
      e.preventDefault()
      onUpdate({ url: pasted.trim() })
      setUrlInput('')
    }
  }, [onUpdate])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      if (dataUrl) {
        onUpdate({ url: dataUrl })
      }
    }
    reader.readAsDataURL(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onUpdate])

  return (
    <div
      className={`absolute rounded-lg transition-all duration-200 bg-white ${isSelected
        ? 'border-2 border-[#FF9800]'
        : 'border-2 border-transparent shadow-md hover:shadow-lg'
      }`}
      style={{
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        animation: isSelected ? 'pulse-glow 2s ease-in-out infinite' : 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      {block.url ? (
        <img
          src={block.url}
          alt={block.alt || ''}
          className="w-full h-full object-contain rounded-lg pointer-events-none select-none"
          draggable={false}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 p-4 h-full">
          <div className="text-gray-400 text-xs mb-1">添加图片</div>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleUrlKeyDown}
            onPaste={handlePaste}
            placeholder="粘贴图片URL..."
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#FF9800] transition-colors duration-200"
            onMouseDown={(e) => e.stopPropagation()}
          />
          <button
            onClick={handleLoadUrl}
            className="px-4 py-1.5 bg-[#FF9800] text-white text-sm rounded-md hover:bg-[#F57C00] transition-colors duration-200"
            onMouseDown={(e) => e.stopPropagation()}
          >
            加载图片
          </button>
          <span className="text-gray-300 text-xs">或</span>
          <label
            className="px-4 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-md cursor-pointer hover:border-[#FF9800] hover:text-[#FF9800] transition-colors duration-200"
            onMouseDown={(e) => e.stopPropagation()}
          >
            上传文件
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  )
})

ImageBlock.displayName = 'ImageBlock'

export default ImageBlock
