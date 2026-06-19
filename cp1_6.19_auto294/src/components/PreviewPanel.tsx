import { useState, useCallback, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore, getFilterCss, type WatermarkPosition } from '@/store'

const getWatermarkStyle = (
  position: WatermarkPosition,
  size: number
): React.CSSProperties => {
  const padding = size
  const base: React.CSSProperties = {
    position: 'absolute',
    fontSize: size,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: 500,
    pointerEvents: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    textShadow: '0 1px 4px rgba(0,0,0,0.3)',
    zIndex: 2,
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

export default function PreviewPanel() {
  const [zoom, setZoom] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    photos,
    selectedIndex,
    isWatermarkVisible,
    watermarkText,
    watermarkSize,
    watermarkPosition,
  } = useStore()

  const selectedPhoto = selectedIndex >= 0 ? photos[selectedIndex] : null

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom((prev) => {
      const next = Math.round((prev + delta) * 100) / 100
      return Math.max(0.5, Math.min(2, next))
    })
  }, [])

  useEffect(() => {
    setZoom(1)
  }, [selectedIndex])

  const showWatermark = isWatermarkVisible && watermarkText.trim().length > 0

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
          padding: '10px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 500, color: '#EAEAEA' }}>
          {selectedPhoto ? (
            <>
              <span style={{ color: '#F39C12', marginRight: 8 }}>
                #{selectedIndex + 1}
              </span>
              {selectedPhoto.name}
            </>
          ) : (
            <span style={{ color: '#8892B0' }}>预览区域</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {selectedPhoto && (
            <div
              style={{
                fontSize: 12,
                color: '#8892B0',
                padding: '4px 10px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 4,
              }}
            >
              缩放 {Math.round(zoom * 100)}%
            </div>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        onWheel={handleWheel}
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          backgroundColor:
            'repeating-conic-gradient(#1a1a2e 0% 25%, #16213e 0% 50%) 50% / 20px 20px',
        }}
      >
        <AnimatePresence mode="wait">
          {selectedPhoto ? (
            <motion.div
              key={selectedPhoto.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'relative',
                maxWidth: '100%',
                maxHeight: '100%',
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.1s ease-out',
                padding: 20,
                boxSizing: 'border-box',
              }}
            >
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.name}
                style={{
                  maxWidth: '85vw',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  display: 'block',
                  filter: getFilterCss(selectedPhoto.currentFilter),
                  transition: 'filter 0.2s ease',
                  borderRadius: 4,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
                draggable={false}
              />

              {showWatermark && (
                <motion.div
                  key={`wm-${watermarkPosition}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    ...getWatermarkStyle(watermarkPosition, watermarkSize),
                    position: 'absolute',
                    padding: 20,
                    boxSizing: 'border-box',
                    ...(() => {
                      const s = getWatermarkStyle(watermarkPosition, watermarkSize)
                      const pad = watermarkSize + 20
                      switch (watermarkPosition) {
                        case 'topLeft':
                          return { ...s, top: pad, left: pad }
                        case 'topRight':
                          return { ...s, top: pad, right: pad }
                        case 'bottomLeft':
                          return { ...s, bottom: pad, left: pad }
                        case 'bottomRight':
                          return { ...s, bottom: pad, right: pad }
                        case 'center':
                          return {
                            ...s,
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                          }
                      }
                    })(),
                  }}
                >
                  {watermarkText}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: '#8892B0',
                fontSize: 14,
              }}
            >
              <div style={{ fontSize: 72, marginBottom: 20 }}>🎨</div>
              <div style={{ marginBottom: 8, fontSize: 16, color: '#EAEAEA' }}>
                从左侧选择一张照片进行预览
              </div>
              <div style={{ fontSize: 12, textAlign: 'center', maxWidth: 280 }}>
                💡 提示：使用鼠标滚轮可缩放图片（50% ~ 200%）
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
