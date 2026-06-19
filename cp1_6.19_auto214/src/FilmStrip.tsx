import { motion, AnimatePresence } from 'framer-motion'
import { useCameraStore, type Photo } from './store'

export function FilmStrip() {
  const { photos, isModalOpen, selectedPhoto, openModal, closeModal } =
    useCameraStore()

  const placeholderPhotos = Array.from({ length: 6 }, (_, i) => ({
    id: `placeholder-${i}`,
    isPlaceholder: true,
  }))

  const displayItems = [...photos, ...placeholderPhotos].slice(0, 6)

  return (
    <>
      <div className="film-strip-container">
        <div className="film-strip">
          <div className="film-perforations-top" aria-hidden="true">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="perforation-hole" />
            ))}
          </div>

          <div className="film-photos-row">
            <AnimatePresence initial={false}>
              {displayItems.map((item, index) => {
                const photo = item as Photo & { isPlaceholder?: boolean }
                if (photo.isPlaceholder) {
                  return (
                    <motion.div
                      key={photo.id}
                      className="film-photo-slot"
                      initial={false}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="film-photo-placeholder">
                        <div className="placeholder-frame" />
                      </div>
                    </motion.div>
                  )
                }

                return (
                  <motion.div
                    key={photo.id}
                    className="film-photo-slot"
                    initial={{ x: -120, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 120, opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    onClick={() => openModal(photo)}
                  >
                    <div className="film-photo-frame">
                      <img
                        src={photo.dataUrl}
                        alt={`胶片照片 ${index + 1}`}
                        className="film-photo-img"
                      />
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          <div className="film-perforations-bottom" aria-hidden="true">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="perforation-hole" />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && selectedPhoto && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={closeModal}
                aria-label="关闭预览"
              >
                ×
              </button>
              <img
                src={selectedPhoto.dataUrl}
                alt="预览照片"
                className="modal-image"
              />
              <div className="modal-info">
                <span>
                  {new Date(
                    selectedPhoto.timestamp
                  ).toLocaleTimeString()}
                </span>
                <span className="modal-filter-info">
                  {selectedPhoto.filterSettings.colorShift === 'warm'
                    ? '暖色调'
                    : '冷色调'}
                  {' · '}
                  颗粒 {selectedPhoto.filterSettings.grainIntensity}%
                  {' · '}
                  晕影 {selectedPhoto.filterSettings.vignetteRadius}%
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .film-strip-container {
          width: 100%;
          overflow: hidden;
          padding: 8px 0;
          background: #1a1a1a;
        }

        .film-strip {
          position: relative;
          background: #2a2a2a;
          height: 100px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
          padding: 4px 0;
        }

        .film-perforations-top,
        .film-perforations-bottom {
          display: flex;
          justify-content: space-around;
          padding: 0 10px;
          height: 8px;
          flex-shrink: 0;
        }

        .perforation-hole {
          width: 6px;
          height: 8px;
          background: #1a1a1a;
          border-radius: 1px;
        }

        .film-photos-row {
          display: flex;
          gap: 8px;
          padding: 0 12px;
          overflow: hidden;
          height: 68px;
          align-items: center;
          justify-content: center;
        }

        .film-photo-slot {
          flex-shrink: 0;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .film-photo-slot:hover {
          transform: scale(1.05);
        }

        .film-photo-frame {
          width: 68px;
          height: 68px;
          padding: 2px;
          background: #1a1a1a;
          border-radius: 1px;
        }

        .film-photo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .film-photo-placeholder {
          width: 68px;
          height: 68px;
          padding: 2px;
          background: #1a1a1a;
          border-radius: 1px;
        }

        .placeholder-frame {
          width: 100%;
          height: 100%;
          background: #3a3a3a;
          border: 1px dashed #4a4a4a;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          cursor: zoom-out;
        }

        .modal-content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          background: #1a1a1a;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          cursor: auto;
        }

        .modal-close {
          position: absolute;
          top: 8px;
          right: 12px;
          background: rgba(0, 0, 0, 0.6);
          border: none;
          color: #fff;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }

        .modal-close:hover {
          background: rgba(0, 0, 0, 0.8);
        }

        .modal-image {
          max-width: 90vw;
          max-height: 70vh;
          display: block;
        }

        .modal-info {
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #d4a574;
          font-family: monospace;
          font-size: 12px;
        }

        .modal-filter-info {
          color: #888;
        }

        @media (max-width: 700px) {
          .film-strip {
            height: 60px;
          }

          .film-photos-row {
            height: 40px;
          }

          .film-photo-frame,
          .film-photo-placeholder {
            width: 40px;
            height: 40px;
          }

          .perforation-hole {
            width: 4px;
            height: 5px;
          }

          .modal-image {
            max-width: 95vw;
            max-height: 60vh;
          }
        }
      `}</style>
    </>
  )
}
