import React from 'react'
import { useNavigate } from 'react-router-dom'

export interface BookCardProps {
  id: string
  title: string
  author: string
  coverUrl: string
  status: 'available' | 'borrowed'
  avgRating: number
  borrowCount: number
  distance?: string
  onBorrow?: () => void
  showBorrowButton?: boolean
}

const BookCard: React.FC<BookCardProps> = ({
  id,
  title,
  author,
  coverUrl,
  status,
  avgRating,
  borrowCount,
  distance,
  onBorrow,
  showBorrowButton = false,
}) => {
  const navigate = useNavigate()

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/book/${id}`)
  }

  const handleBorrow = (e: React.MouseEvent) => {
    e.stopPropagation()
    onBorrow?.()
  }

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`text-sm ${
              i < fullStars
                ? 'text-amber-400'
                : i === fullStars && hasHalfStar
                ? 'text-amber-400'
                : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
        <span className="text-xs text-brown ml-1 font-medium">{rating.toFixed(1)}</span>
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      className="book-card group relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-hover"
      style={{
        background: 'rgba(250, 247, 242, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(250, 247, 242, 0.8)',
        boxShadow: '0 8px 32px rgba(92, 64, 51, 0.15)',
      }}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={coverUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brown/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-2 left-2">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${
              status === 'available' ? 'bg-marker-blue' : 'bg-marker-red'
            }`}
          >
            {status === 'available' ? '可借阅' : '已借出'}
          </span>
        </div>

        {distance && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-cream/90 text-brown">
              {distance}
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-serif font-semibold text-brown text-sm truncate mb-1 group-hover:text-brown-dark transition-colors">
          {title}
        </h3>
        <p className="text-xs text-brown-light truncate mb-2">{author}</p>

        <div className="flex items-center justify-between">
          {renderStars(avgRating)}
          <span className="text-xs text-brown-light">
            被借阅 {borrowCount} 次
          </span>
        </div>

        {showBorrowButton && status === 'available' && (
          <button
            onClick={handleBorrow}
            className="mt-3 w-full py-2 bg-brown text-cream rounded-lg text-sm font-medium hover:bg-brown-dark transition-colors duration-200"
          >
            申请借阅
          </button>
        )}
      </div>
    </div>
  )
}

export default BookCard
