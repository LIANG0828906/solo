import React, { useRef } from 'react'
import type { ImageItem, LightingParams } from './utils/imageFilters'
import { calculateLightingFilter } from './utils/imageFilters'
import './ImageGrid.css'

interface ImageGridProps {
  images: ImageItem[]
  lighting: LightingParams
  selectedImageId: string | null
  onSelectImage: (id: string | null) => void
  isResetting?: boolean
}

const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  lighting,
  selectedImageId,
  onSelectImage,
  isResetting = false
}) => {
  const gridRef = useRef<HTMLDivElement>(null)
  const filter = calculateLightingFilter(lighting.angle, lighting.intensity)

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && selectedImageId !== null) {
      onSelectImage(null)
    }
  }

  const handleCardClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (selectedImageId === id) {
      onSelectImage(null)
    } else if (selectedImageId === null) {
      onSelectImage(id)
    }
  }

  const handleCompareClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    onSelectImage(selectedImageId === id ? null : id)
  }

  return (
    <div
      className="image-grid-container"
      onClick={handleContainerClick}
      ref={gridRef}
    >
      <div className={`image-grid ${isResetting ? 'resetting' : ''}`}>
        {Array.from({ length: 6 }).map((_, index) => {
          const image = images[index]
          const isSelected = image ? selectedImageId === image.id : false
          const isBlurred = selectedImageId !== null && !isSelected

          return (
            <div
              key={image?.id || `empty-${index}`}
              className={`image-card ${image ? 'has-image' : 'empty'} ${
                isSelected ? 'selected' : ''
              } ${isBlurred ? 'blurred' : ''} ${
                isResetting ? 'resetting' : ''
              }`}
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
