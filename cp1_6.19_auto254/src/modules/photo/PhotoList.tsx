import { motion, AnimatePresence } from 'framer-motion'
import { useJourneyStore } from '@/store/useJourneyStore'

function formatDate(date: Date | null): string {
  if (!date) return '未知时间'
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

export function PhotoList() {
  const {
    photos,
    selectedPhotoId,
    selectPhoto,
    highlightPhoto,
    removePhoto,
    startAddLocation,
    isAddingLocation
  } = useJourneyStore()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflowY: 'auto',
        paddingRight: '4px'
      }}
    >
      <AnimatePresence initial={false}>
        {photos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              textAlign: 'center',
              padding: '40px 16px',
              color: '#8B949E',
              fontSize: '13px'
            }}
          >
            暂无照片，快上传吧～
          </motion.div>
        ) : (
          photos.map((photo, index) => {
            const isSelected = selectedPhotoId === photo.id
            return (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.25, delay: index * 0.02 }}
                onClick={() => {
                  if (isAddingLocation) {
                    startAddLocation(photo.id)
                    return
                  }
                  selectPhoto(isSelected ? null : photo.id)
                  highlightPhoto(photo.id)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? '#21262D' : 'transparent',
                  transition: 'background-color 100ms ease',
                  position: 'relative'
                }}
                whileHover={{ backgroundColor: isSelected ? '#21262D' : '#1C2128' }}
                whileTap={{ backgroundColor: '#21262D' }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '4px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '3px',
                    height: isSelected ? '24px' : '0px',
                    borderRadius: '2px',
                    background: 'linear-gradient(180deg, #00C4FF, #7B2FF7)',
                    transition: 'height 200ms ease'
                  }}
                />
                <img
                  src={photo.thumbnailUrl}
                  alt=""
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    flexShrink: 0,
                    backgroundColor: '#21262D'
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: '#C9D1D9',
                      fontSize: '13px',
                      fontWeight: 500,
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {photo.file.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#8B949E' }}>
                      {formatDate(photo.timestamp)}
                    </span>
                    {!photo.hasGPS && (
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#1F6FEB33',
                          color: '#58A6FF'
                        }}
                      >
                        📍 待标记
                      </span>
                    )}
                  </div>
                </div>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    removePhoto(photo.id)
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#8B949E',
                    cursor: 'pointer',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    fontSize: '16px',
                    lineHeight: 1
                  }}
                  whileHover={{ color: '#F85149', backgroundColor: '#21262D' }}
                  whileTap={{ backgroundColor: '#30363D' }}
                >
                  ×
                </motion.button>
              </motion.div>
            )
          })
        )}
      </AnimatePresence>
    </div>
  )
}
