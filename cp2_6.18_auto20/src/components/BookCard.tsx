import { memo } from 'react'
import { MessageCircle, Star, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BookListWithStats } from '@/types'

interface BookCardProps {
  bookList: BookListWithStats
  rank: number
  onClick: () => void
}

function BookCard({ bookList, rank, onClick }: BookCardProps) {
  const isTopRank = rank === 1
  const hasRating = bookList.averageRating > 0
  const hasComments = bookList.commentCount > 0
  const hasAnyActivity = hasRating || hasComments

  return (
    <div
      onClick={onClick}
      className={cn(
        'w-[280px] rounded-xl p-5 cursor-pointer transition-all duration-500',
        'hover:-translate-y-1 hover:shadow-lg duration-200',
        isTopRank
          ? 'bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] shadow-md'
          : 'bg-white shadow-md'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg',
            isTopRank
              ? 'bg-amber-500 text-white'
              : rank === 2
              ? 'bg-gray-400 text-white'
              : rank === 3
              ? 'bg-amber-700 text-white'
              : 'bg-gray-200 text-gray-600'
          )}
        >
          {rank}
        </div>
        <div className="flex items-center gap-1 text-orange-500">
          <Flame className="w-4 h-4 fill-current" />
          <span className="text-sm font-semibold">
            {bookList.hotScore.toFixed(1)}
          </span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
        {bookList.title}
      </h3>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
        {bookList.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {bookList.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        {hasAnyActivity ? (
          <>
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <Star className={cn('w-4 h-4', hasRating && 'text-amber-500 fill-amber-500')} />
              <span className={cn('font-medium', hasRating ? 'text-amber-600' : 'text-gray-400')}>
                {hasRating ? bookList.averageRating.toFixed(1) : '--'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <MessageCircle className="w-4 h-4" />
              <span>{bookList.commentCount}</span>
            </div>
          </>
        ) : (
          <span className="text-xs text-gray-400 italic">暂无评价</span>
        )}
      </div>
    </div>
  )
}

export default memo(BookCard, (prevProps, nextProps) => {
  return (
    prevProps.bookList.id === nextProps.bookList.id &&
    prevProps.rank === nextProps.rank &&
    prevProps.bookList.averageRating === nextProps.bookList.averageRating &&
    prevProps.bookList.commentCount === nextProps.bookList.commentCount &&
    prevProps.bookList.hotScore === nextProps.bookList.hotScore
  )
})
