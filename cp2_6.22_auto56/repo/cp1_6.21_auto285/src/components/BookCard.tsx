import { BookOpen, User, BookMarked } from 'lucide-react'
import { Book, BookCardProps } from '@shared/types'
import { cn } from '@/lib/utils'

const statusConfig: Record<Book['status'], { label: string; className: string }> = {
  available: { label: '可借阅', className: 'status-available' },
  borrowed: { label: '已借出', className: 'status-borrowed' },
  pending: { label: '待审核', className: 'status-pending' },
}

export default function BookCard({ book, onBorrow, disabled }: BookCardProps) {
  const config = statusConfig[book.status]

  const handleBorrow = () => {
    if (!disabled && book.status === 'available') {
      onBorrow(book.id)
    }
  }

  return (
    <div
      className={cn(
        'book-card flex flex-col overflow-hidden',
        disabled && 'opacity-60 cursor-not-allowed'
      )}
    >
      <div className="relative h-40 overflow-hidden">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
            <BookMarked className="w-12 h-12 text-violet-400" />
          </div>
        )}
        <span
          className={cn(
            'absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded-full',
            config.className
          )}
        >
          {config.label}
        </span>
      </div>

      <div className="flex-1 p-3 flex flex-col">
        <h3 className="font-semibold text-sm text-slate-800 line-clamp-1 mb-1">
          {book.title}
        </h3>

        <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
          <User className="w-3 h-3" />
          <span className="line-clamp-1">{book.author}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
          <BookOpen className="w-3 h-3" />
          <span className="line-clamp-1">ISBN: {book.isbn || '未知'}</span>
        </div>

        <div className="mt-auto">
          <button
            onClick={handleBorrow}
            disabled={disabled || book.status !== 'available'}
            className={cn(
              'btn-press w-full py-2 rounded-lg text-sm font-medium transition-all',
              disabled || book.status !== 'available'
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-violet-600 text-white hover:bg-violet-700'
            )}
          >
            {disabled ? '信誉分不足' : book.status === 'available' ? '立即借阅' : '暂不可借'}
          </button>
        </div>
      </div>
    </div>
  )
}
