import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { JourneyMap } from '@/modules/map/MapContainer'
import { PhotoUploader } from '@/modules/photo/PhotoUploader'
import { PhotoList } from '@/modules/photo/PhotoList'
import { TimelineBar } from '@/modules/timeline/TimelineBar'
import { useJourneyStore } from '@/store/useJourneyStore'

export default function App() {
  const { photos, isAddingLocation, startAddLocation, photos: allPhotos } = useJourneyStore()
  const [isMobile, setIsMobile] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const photosWithoutGPS = allPhotos.filter((p) => !p.hasGPS).length

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        backgroundColor: '#0D1117',
        color: '#C9D1D9',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Roboto, sans-serif',
        overflow: 'hidden'
      }}
    >
      {!isMobile ? (
        <motion.div
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            width: '320px',
            flexShrink: 0,
            backgroundColor: '#161B22',
            borderRight: '1px solid #30363D',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '4px 0 24px rgba(0, 0, 0, 0.3)'
          }}
        >
          <SidebarHeader
            count={photos.length}
            pendingCount={photosWithoutGPS}
            onMarkLocations={() => {
              const first = allPhotos.find((p) => !p.hasGPS)
              if (first) startAddLocation(first.id)
            }}
          />
          <SidebarContent />
        </motion.div>
      ) : (
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  zIndex: 998
                }}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                style={{
                  position: 'fixed',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  maxHeight: '70vh',
                  backgroundColor: '#161B22',
                  borderTop: '1px solid #30363D',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px',
                  zIndex: 999,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '4px',
                    borderRadius: '2px',
                    backgroundColor: '#30363D',
                    margin: '10px auto',
                    flexShrink: 0
                  }}
                />
                <div style={{ padding: '0 16px 16px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <SidebarHeader
                    count={photos.length}
                    pendingCount={photosWithoutGPS}
                    compact
                    onMarkLocations={() => {
                      const first = allPhotos.find((p) => !p.hasGPS)
                      if (first) startAddLocation(first.id)
                    }}
                  />
                  <SidebarContent />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          position: 'relative'
        }}
      >
        {isMobile && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              right: '12px',
              zIndex: 800,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <motion.button
              onClick={() => setDrawerOpen(true)}
              whileHover={{ backgroundColor: '#21262D' }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: '#161B22',
                border: '1px solid #30363D',
                color: '#C9D1D9',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.4)'
              }}
            >
              <span>📸</span>
              <span>照片 ({photos.length})</span>
            </motion.button>

            <div
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: '#161B22',
                border: '1px solid #30363D',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
                fontSize: '11px',
                color: '#8B949E',
                fontWeight: 600
              }}
            >
              🗺️ 旅程可视化
            </div>
          </div>
        )}

        <div style={{ flex: 1, padding: isMobile ? '0' : '16px 16px 0' }}>
          <JourneyMap />
        </div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
        >
          <TimelineBar />
        </motion.div>
      </div>
    </div>
  )
}

interface SidebarHeaderProps {
  count: number
  pendingCount: number
  compact?: boolean
  onMarkLocations: () => void
}

function SidebarHeader({ count, pendingCount, compact, onMarkLocations }: SidebarHeaderProps) {
  const { isAddingLocation } = useJourneyStore()

  return (
    <div
      style={{
        padding: compact ? '8px 4px 12px' : '20px 20px 16px',
        borderBottom: '1px solid #21262D',
        flexShrink: 0
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: compact ? '8px' : '16px'
        }}
      >
        <div>
          <div
            style={{
              fontSize: compact ? '16px' : '20px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #00C4FF, #7B2FF7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '2px'
            }}
          >
            🗺️ 旅程可视化
          </div>
          <div style={{ fontSize: '11px', color: '#6E7681' }}>
            让每段旅程都有故事
          </div>
        </div>
        <div
          style={{
            padding: '6px 12px',
            borderRadius: '20px',
            backgroundColor: '#21262D',
            fontSize: '12px',
            fontWeight: 600,
            color: '#58A6FF'
          }}
        >
          {count} 张
        </div>
      </div>

      {!compact && <PhotoUploader />}

      {pendingCount > 0 && (
        <motion.button
          onClick={onMarkLocations}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '10px',
            cursor: 'pointer',
            background: isAddingLocation
              ? 'linear-gradient(135deg, #3FB950, #1F6FEB)'
              : 'linear-gradient(135deg, #1F6FEB33, #7B2FF733)',
            border: `1px solid ${isAddingLocation ? 'transparent' : '#1F6FEB66'}`,
            color: isAddingLocation ? '#fff' : '#58A6FF',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 100ms ease'
          }}
        >
          <span>{isAddingLocation ? '⏳' : '📍'}</span>
          {isAddingLocation ? '正在标记位置…' : `为 ${pendingCount} 张照片标记位置`}
        </motion.button>
      )}
    </div>
  )
}

function SidebarContent() {
  return (
    <div
      style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 12px 16px 16px'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          paddingRight: '4px'
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#8B949E' }}>
          照片列表
        </span>
        <span
          style={{
            fontSize: '10px',
            padding: '2px 8px',
            borderRadius: '6px',
            backgroundColor: '#21262D',
            color: '#6E7681'
          }}
        >
          按时间排序
        </span>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <PhotoList />
      </div>
    </div>
  )
}
