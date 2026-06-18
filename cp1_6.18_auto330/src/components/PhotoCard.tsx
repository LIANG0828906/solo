import { useEffect, useState } from 'react'
import type { Photo } from '../data/photos'

interface PhotoCardProps {
  photo: Photo
  scale?: number
  positionSeed?: number
}

function getNotePosition(seed: number): 'pos-tl' | 'pos-br' {
  return seed % 2 === 0 ? 'pos-tl' : 'pos-br'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}.${month.toString().padStart(2, '0')}.${day.toString().padStart(2, '0')}`
}

export default function PhotoCard({ photo, scale = 1, positionSeed = 0 }: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setImgError(false)
  }, [photo.id])

  const notePos = getNotePosition(positionSeed)

  return (
    <div
      className="photo-card"
      style={{ transform: `scale(${scale})` }}
    >
      <img
        src={photo.imageUrl}
        alt={photo.title}
        className="photo-image"
        style={{
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.4s ease',
          display: imgError ? 'none' : 'block'
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setImgError(true)}
        draggable={false}
      />
      {imgError && (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(245, 230, 200, 0.5)',
            fontSize: '14px'
          }}
        >
          图片加载失败
        </div>
      )}

      <div className={`handwritten-note ${notePos}`}>
        {photo.note}
      </div>

      <div className="photo-meta">
        {photo.title} · {formatDate(photo.date)}
      </div>
    </div>
  )
}
