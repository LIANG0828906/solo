import { useRef, useState, useCallback } from 'react'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { Play, Image } from 'lucide-react'
import type { Work } from '@/types'

interface WorkCardProps {
  work: Work
  onClick: () => void
  index: number
}

export default function WorkCard({ work, onClick, index }: WorkCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState('')
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -10
    const rotateY = ((x - centerX) / centerX) * 10
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.08)`)
  }, [])

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
    setTransform('')
  }, [])

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="card-3d rounded-card overflow-hidden bg-surface-light cursor-pointer animate-fadeInUp shadow-lg"
      style={{
        transform: transform || undefined,
        transition: isHovering ? 'none' : 'transform 0.3s ease, box-shadow 0.3s ease',
        boxShadow: isHovering
          ? '0 25px 50px rgba(79, 70, 229, 0.35), 0 8px 25px rgba(0, 0, 0, 0.45)'
          : '0 4px 20px rgba(0, 0, 0, 0.25)',
        animationDelay: `${index * 0.08}s`,
        opacity: 0,
      }}
    >
      <div className="relative">
        {work.file_type === 'video' ? (
          <div className="relative">
            <LazyLoadImage
              src={work.thumbnail_url}
              alt={work.title}
              effect="opacity"
              className="w-full block"
              wrapperClassName="w-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
            </div>
          </div>
        ) : (
          <LazyLoadImage
            src={work.file_url}
            alt={work.title}
            effect="opacity"
            className="w-full block"
            wrapperClassName="w-full"
          />
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <Image className="w-6 h-6 text-white/70" />
        </div>

        <div className="overlay-blur absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-white text-sm font-medium truncate">{work.title}</h3>
          <p className="text-white/70 text-xs truncate">{work.uploader}</p>
        </div>
      </div>
    </div>
  )
}
