import { BookOpen, User, Calendar, Star } from 'lucide-react'
import { LoanWithBook } from '@shared/types'
import { cn } from '@/lib/utils'

interface LoanRecordItemProps {
  loan: LoanWithBook
  type: 'borrowed' | 'lent'
  onRate?: (loanId: string, rating: number) => void
  userRating?: number
}

const statusConfig = {
  pending: { label: '待确认', className: 'status-pending' },
  active: { label: '进行中', className: 'status-active' },
  overdue: { label: '已逾期', className: 'status-overdue' },
  returned: { label: '已完成', className: 'status-returned' }
}

export default function LoanRecordItem({ loan, type, onRate, userRating }: LoanRecordItemProps) {
  const config = statusConfig[loan.status]
  const isReturned = loan.status === 'returned'
  const canRate = isReturned && !userRating && onRate

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex gap-4 hover:shadow-md transition-shadow animate-fade-in-up">
      {loan.book.coverImage ? (
        <img
          src={loan.book.coverImage}
          alt={loan.book.title}
          className="book-cover-thumb flex-shrink-0"
        />
      ) : (
        <div className="book-cover-thumb bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-6 h-6 text-violet-400" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-800 line-clamp-1">{loan.book.title}</h3>
            <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
              <User className="w-3.5 h-3.5" />
              <span className="line-clamp-1">{loan.book.author}</span>
            </div>
          </div>
          <span
            className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0',
              config.className
            )}
          >
            {config.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-2">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>借阅: {formatDate(loan.borrowDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>到期: {formatDate(loan.dueDate)}</span>
          </div>
          {loan.returnDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>归还: {formatDate(loan.returnDate)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {type === 'borrowed' ? '借入' : '借出'}
          </span>

          {canRate && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 mr-1">评分:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => onRate?.(loan.id, star)}
                  className="star-rating p-0.5"
                >
                  <Star
                    className={cn(
                      'w-4 h-4 transition-colors',
                      star <= (userRating || 0)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-300 hover:text-amber-400'
                    )}
                  />
                </button>
              ))}
            </div>
          )}

          {userRating && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">已评分:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'w-4 h-4',
                    star <= userRating
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-300'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
