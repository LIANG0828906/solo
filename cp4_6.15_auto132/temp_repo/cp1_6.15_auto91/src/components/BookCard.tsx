import { cn } from '@/lib/utils'
import type { Book } from '@/api'

interface BookCardProps {
  book: Book
  index?: number
  onClick?: (book: Book) => void
  className?: string
}

const categoryLabels: Record<string, string> = {
  novel: '小说',
  documentary: '纪实',
  technology: '科技',
  art: '艺术',
  life: '生活',
}

const transactionTypeLabels: Record<string, string> = {
  exchange: '交换',
  sale: '出售',
}

export default function BookCard({
  book,
  index = 0,
  onClick,
  className,
}: BookCardProps) {
  const staggerClass = `stagger-${Math.min(index % 8 + 1, 8)}`

  const handleClick = () => {
    onClick?.(book)
  }

  return (
    <div
      className={cn(
        'book-card animate-card-unfold',
        staggerClass,
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <div className="book-card-image">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-wood-cream/60 text-4xl font-serif">
            {book.title?.charAt(0) || '书'}
          </div>
        )}
      </div>

      <div className="book-card-title" title={book.title}>
        {book.title}
      </div>

      <div className="book-card-author">
        {book.author}
      </div>

      <div className="book-card-meta">
        <span className="tag text-xs">
          {categoryLabels[book.category] || book.category}
        </span>
        <div className="flex items-center gap-2">
          <span className="tag text-xs">
            {transactionTypeLabels[book.transactionType] || book.transactionType}
          </span>
          {book.transactionType === 'sale' && book.price != null && (
            <span className="text-wood font-semibold text-sm">
              ¥{book.price}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border-light">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{book.publishYear}年</span>
          {book.exchangeCategory && (
            <span>求换: {book.exchangeCategory}</span>
          )}
        </div>
      </div>
    </div>
  )
}

interface BookCardSkeletonProps {
  className?: string
}

export function BookCardSkeleton({ className }: BookCardSkeletonProps) {
  return (
    <div
      className={cn(
        'book-card',
        className
      )}
      style={{ cursor: 'default' }}
    >
      <div className="book-card-image animate-pulse bg-border-light" />
      <div className="h-5 w-3/4 bg-border-light rounded animate-pulse mb-2" />
      <div className="h-4 w-1/2 bg-border-light rounded animate-pulse mb-3" />
      <div className="flex justify-between">
        <div className="h-6 w-16 bg-border-light rounded-full animate-pulse" />
        <div className="h-6 w-12 bg-border-light rounded-full animate-pulse" />
      </div>
    </div>
  )
}
