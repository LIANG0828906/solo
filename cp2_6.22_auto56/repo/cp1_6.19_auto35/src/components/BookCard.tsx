import { useState } from 'react'
import { Star, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLibraryStore } from '@/data/store'

interface BookCardProps {
  bookId: string
}

export default function BookCard({ bookId }: BookCardProps) {
  const [isClicking, setIsClicking] = useState(false)
  const navigate = useNavigate()
  const book = useLibraryStore((s) => s.getBookById(bookId))
  const avgRating = useLibraryStore((s) => s.getBookAverageRating(bookId))

  if (!book) return null

  const handleClick = () => {
    setIsClicking(true)
    setTimeout(() => {
      navigate(`/book/${book.id}`)
    }, 250)
  }

  return (
    <div
      onClick={handleClick}
      className={`group bg-white rounded-card shadow-card border border-surface-100 overflow-hidden cursor-pointer
        hover:shadow-card-hover hover:-translate-y-2 transition-all duration-300
        ${isClicking ? 'animate-card-click' : ''}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-100">
        <img
          src={book.cover}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            target.nextElementSibling?.classList.remove('hidden')
          }}
        />
        <div className="hidden absolute inset-0 flex flex-col items-center justify-center bg-surface-100 text-surface-400">
          <BookOpen className="w-10 h-10 mb-2" />
          <span className="text-xs">{book.category}</span>
        </div>
        <div className="absolute top-2 right-2">
          <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-primary-600 border border-primary-100">
            {book.category}
          </span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-serif text-sm font-semibold text-surface-800 truncate mb-1">
          {book.title}
        </h3>
        <p className="text-xs text-surface-500 truncate mb-2">{book.author}</p>
        <div className="flex items-center gap-1">
          {avgRating > 0 ? (
            <>
              <Star className="w-3.5 h-3.5 text-accent-500 fill-accent-500" />
              <span className="text-xs font-medium text-surface-600">{avgRating}</span>
            </>
          ) : (
            <span className="text-xs text-surface-400">暂无评分</span>
          )}
        </div>
      </div>
    </div>
  )
}
