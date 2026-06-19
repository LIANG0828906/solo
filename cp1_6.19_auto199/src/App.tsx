import { useEffect, useState, useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from './components/Navbar'
import { ColorFilter } from './components/ColorFilter'
import { PhotoCard } from './components/PhotoCard'
import { PhotoDetailModal } from './components/PhotoDetailModal'
import { UploadModal } from './components/UploadModal'
import { usePhotoStore } from './store/photoStore'

function App() {
  const { activeFilter, getFilteredPhotos, getFilterName, selectPhoto, openModal } = usePhotoStore()
  const filteredPhotos = useMemo(() => getFilteredPhotos(), [activeFilter, getFilteredPhotos])
  const filterName = getFilterName()

  const [visibleCount, setVisibleCount] = useState(15)
  const [isLoading, setIsLoading] = useState(false)

  const visiblePhotos = useMemo(
    () => filteredPhotos.slice(0, visibleCount),
    [filteredPhotos, visibleCount]
  )

  const loadMore = useCallback(() => {
    if (isLoading || visibleCount >= filteredPhotos.length) return
    setIsLoading(true)
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 10, filteredPhotos.length))
      setIsLoading(false)
    }, 300)
  }, [isLoading, visibleCount, filteredPhotos.length])

  useEffect(() => {
    setVisibleCount(15)
  }, [activeFilter])

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      if (scrollTop + windowHeight >= documentHeight - 200) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMore])

  const handleCardClick = (id: string) => {
    selectPhoto(id)
    openModal()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Navbar />

      <main
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          padding: '24px 20px',
        }}
      >
        <div
          style={{
            width: '1120px',
            maxWidth: '100%',
            display: 'flex',
            gap: '20px',
          }}
        >
          <ColorFilter />

          <div style={{ flex: 1 }}>
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'baseline',
                gap: '12px',
              }}
            >
              <h1
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#4A3728',
                }}
              >
                {filterName}
              </h1>
              <span
                style={{
                  fontSize: '13px',
                  color: '#8D6E63',
                }}
              >
                共 {filteredPhotos.length} 张照片
              </span>
            </motion.div>

            <div className="masonry-grid">
              <AnimatePresence mode="popLayout">
                {visiblePhotos.map((photo, index) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    index={index}
                    isFilteredIn={true}
                    onClick={() => handleCardClick(photo.id)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {visibleCount < filteredPhotos.length && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  textAlign: 'center',
                  padding: '30px 0',
                }}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
                    style={{
                      width: '24px',
                      height: '24px',
                      margin: '0 auto',
                      borderRadius: '50%',
                      border: '2px solid #D7CCC8',
                      borderTopColor: '#4A3728',
                    }}
                  />
                ) : (
                  <motion.button
                    onClick={loadMore}
                    whileHover={{ backgroundColor: '#5D4636' }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      padding: '10px 28px',
                      borderRadius: '8px',
                      backgroundColor: '#4A3728',
                      color: '#EAE0C8',
                      fontSize: '13px',
                    }}
                  >
                    加载更多
                  </motion.button>
                )}
              </motion.div>
            )}

            {filteredPhotos.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  textAlign: 'center',
                  padding: '80px 20px',
                  color: '#8D6E63',
                }}
              >
                <div
                  style={{
                    fontSize: '48px',
                    marginBottom: '16px',
                  }}
                >
                  📷
                </div>
                <p style={{ fontSize: '14px' }}>暂无该色调的照片</p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>
                  点击右上角"上传照片"添加你的街头摄影作品
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <PhotoDetailModal />
      <UploadModal />
    </div>
  )
}

export default App
