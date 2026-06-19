import { memo, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Photo } from '../store/photoStore'

interface PhotoCardProps {
  photo: Photo
  index: number
  isFilteredIn: boolean
  onClick: () => void
}

export const PhotoCard = memo(
  forwardRef<HTMLDivElement, PhotoCardProps>(function PhotoCard(
    { photo, index, isFilteredIn, onClick },
    ref
  ) {
    return (
      <motion.div
        ref={ref}
        className="masonry-item"
        initial={{ opacity: 0, x: 50, scale: 0.8 }}
        animate={
          isFilteredIn
            ? {
                opacity: 1,
                x: 0,
                scale: 1,
                transition: {
                  duration: 0.5,
                  delay: index * 0.05,
                  ease: 'easeOut',
                },
              }
            : {
                opacity: 0,
                x: -50,
                scale: 0.8,
                transition: {
                  duration: 0.5,
                  delay: index * 0.03,
                  ease: 'easeIn',
                },
              }
        }
        exit={{
          opacity: 0,
          x: -50,
          scale: 0.8,
          transition: {
            duration: 0.5,
            ease: 'easeIn',
          },
        }}
        onClick={onClick}
        style={{
          position: 'relative',
          width: '240px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #D7CCC8',
          overflow: 'hidden',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(74, 55, 40, 0.1)',
          willChange: 'transform, opacity',
        }}
        whileHover={{
          y: -4,
          boxShadow: '0 8px 24px rgba(74, 55, 40, 0.2)',
          transition: { duration: 0.2 },
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <img
            src={photo.thumbnailUrl}
            alt={photo.diary || '街头摄影作品'}
            loading="lazy"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(74, 55, 40, 0) 0%, rgba(74, 55, 40, 0.6) 100%)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                padding: '20px',
                opacity: 0,
                pointerEvents: 'none',
              }}
            >
              <motion.span
                initial={{ y: 10, opacity: 0 }}
                whileHover={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                style={{
                  color: '#EAE0C8',
                  fontSize: '12px',
                  textAlign: 'center',
                }}
              >
                长按触发漏光效果 ✨
              </motion.span>
            </motion.div>
          </AnimatePresence>
        </div>
        <div
          style={{
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              color: '#8D6E63',
            }}
          >
            {photo.username}
          </span>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: photo.dominantColor.hex,
              boxShadow: '0 0 0 1px #D7CCC8',
            }}
            title={photo.dominantColor.name}
          />
        </div>
      </motion.div>
    )
  })
)
