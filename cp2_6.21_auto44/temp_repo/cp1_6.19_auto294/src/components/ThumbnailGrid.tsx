import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, formatFileSize, getFilterCss, type WatermarkPosition } from '@/store'

interface Props {
  columns: number
}

const getWatermarkStyle = (
  position: WatermarkPosition,
  size: number
): React.CSSProperties => {
  const padding = size * 0.4
  const base: React.CSSProperties = {
    position: 'absolute',
    fontSize: size,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: 500,
    pointerEvents: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '80%',
  }

  switch (position) {
    case 'topLeft':
      return { ...base, top: padding, left: padding }
    case 'topRight':
      return { ...base, top: padding, right: padding }
    case 'bottomLeft':
      return { ...base, bottom: padding, left: padding }
    case 'bottomRight':
      return { ...base, bottom: padding, right: padding }
    case 'center':
      return {
        ...base,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
  }
}

export default function ThumbnailGrid({ columns }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragOverRef = useRef(false)

  const {
    photos,
    selectedIndex,
    isWatermarkVisible,
    watermarkText,
    watermarkSize,
    watermarkPosition,
    addPhotos,
    selectPhoto,
    undoFilter,
  } = useStore()

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    addPhotos(Array.from(files))
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragOverRef.current = false
    handleFiles(e.dataTransfer.files)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    dragOverRef.current = true
  }

  const onDragLeave = () => {
    dragOverRef.current = false
  }

  const showWatermark = isWatermarkVisible && watermarkText.trim().length > 0
  const wmSize = Math.max(10, Math.floor(watermarkSize * 0.5))

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: 12,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}
      >
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{
            border: '2px dashed rgba(233,69,96,0.4)',
            borderRadius: 8,
            padding: '16px 12px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: 'rgba(233,69,96,0.05)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#E94560'
            e.currentTarget.style.backgroundColor = 'rgba(233,69,96,0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(233,69,96,0.4)'
            e.currentTarget.style.backgroundColor = 'rgba(233,69,96,0.05)'
          }}
        >
          <div style={{ fontSize: 14, color: '#EAEAEA', marginBottom: 4 }}>
            📷 点击或拖拽上传照片
          </div>
          <div style={{ fontSize: 11, color: '#8892B0' }}>
            支持 JPEG/PNG · 单张 ≤ 10MB · 最多 20 张
          </div>
          <div style={{ fontSize: 11, color: '#F39C12', marginTop: 6 }}>
            已上传 {photos.length} / 20
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png"
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 12,
        }}
      >
        <AnimatePresence mode="popLayout">
          {photos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 200,
                color: '#8892B0',
                fontSize: 13,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div>
              <div>还没有上传照片</div>
            </motion.div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: 10,
              }}
            >
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
                  onClick={() => selectPhoto(index)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    undoFilter(index)
                  }}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: 6,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border:
                      selectedIndex === index
                        ? '2px solid #F39C12'
                        : '2px solid transparent',
                    backgroundColor: '#16213E',
                    boxShadow:
                      selectedIndex === index
                        ? '0 0 0 2px rgba(243,156,18,0.2)'
                        : 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  <img
                    src={photo.url}
                    alt={photo.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      filter: getFilterCss(photo.currentFilter),
                      transition: 'filter 0.2s ease',
                    }}
                    draggable={false}
                  />

                  {showWatermark && (
                    <motion.div
                      key={watermarkPosition}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={getWatermarkStyle(watermarkPosition, wmSize)}
                    >
                      {watermarkText}
                    </motion.div>
                  )}

                  <div
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      minWidth: 22,
                      height: 22,
                      padding: '0 6px',
                      backgroundColor: 'rgba(233,69,96,0.9)',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 11,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    {index + 1}
                  </div>

                  {photo.filterStack.length > 1 && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        undoFilter(index)
                      }}
                      style={{
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        width: 22,
                        height: 22,
                        backgroundColor: 'rgba(15,52,96,0.9)',
                        color: '#EAEAEA',
                        fontSize: 12,
                        borderRadius: 11,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: '1px solid rgba(255,255,255,0.15)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#E94560'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(15,52,96,0.9)'
                      }}
                      title="撤销滤镜 (右键也可撤销)"
                    >
                      ↺
                    </div>
                  )}

                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '4px 6px',
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.85)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {formatFileSize(photo.size)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
