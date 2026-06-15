import React from 'react'
import type { ImageItem, LightingParams } from './utils/imageFilters'
import { calculateLightingFilter } from './utils/imageFilters'
import './ImageGrid.css'

interface ImageGridProps {
  images: ImageItem[]
  lighting: LightingParams
  selectedImageId: string | null
  onSelectImage: (id: string | null) => void
}

const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  lighting,
  selectedImageId,
  onSelectImage
}) => {
  const filter = calculateLightingFilter(lighting.angle, lighting.intensity)

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && selectedImageId !== null) {
      onSelectImage(null)
    }
  }

  const handleCardClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (selectedImageId === id) {
      onSelectImage(null)
    }
  }

  const handleCompareClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    onSelectImage(selectedImageId === id ? null : id)
  }

  return (
    <div
      className="image-grid-container"
      onClick={handleBackgroundClick}
    >
      <div className="image-grid">
        {Array.from({ length: 6 }).map((_, index) => {
          const image = images[index]
          const isSelected = image && selectedImageId === image.id
          const isBlurred = selectedImageId !== null && !isSelected

          return (
            <div
              key={image?.id || `empty-${index}`}
              className={`image-card ${image ? 'has-image' : 'empty'} ${
                isSelected ? 'selected' : ''
              } ${isBlurred ? 'blurred' : ''}`}
              onClick={(e) => image && handleCardClick(e, image.id)}
            >
              {image ? (
                <>
                  <img
                    src={image.url}
                    alt={image.name}
                    draggable={false}
                    style={{ filter }}
                  />
                  <div
                    className="compare-icon"
                    onClick={(e) => handleCompareClick(e, image.id)}
                    title="对比"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="13 17 18 12 13 7"></polyline>
                      <polyline points="6 17 11 12 6 7"></polyline>
                    </svg>
                  </div>
                </>
              ) : (
                <div className="empty-placeholder">
                  <span>空位 {index + 1}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ImageGrid
