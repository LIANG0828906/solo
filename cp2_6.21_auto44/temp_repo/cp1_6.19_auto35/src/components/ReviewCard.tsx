import StarRating from './StarRating'

interface ReviewCardProps {
  userName: string
  rating: number
  comment: string
  createdAt: string
  isNew?: boolean
}

export default function ReviewCard({ userName, rating, comment, createdAt, isNew = false }: ReviewCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div
      className={`bg-white rounded-card p-4 shadow-card border border-surface-100 ${
        isNew ? 'animate-slide-in-top' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-xs font-bold text-primary-600">
              {userName.charAt(0)}
            </span>
          </div>
          <span className="text-sm font-medium text-surface-800">{userName}</span>
        </div>
        <span className="text-xs text-surface-400">{formatDate(createdAt)}</span>
      </div>
      <div className="mb-2">
        <StarRating value={rating} readonly size="sm" />
      </div>
      <p className="text-sm text-surface-600 leading-relaxed">{comment}</p>
    </div>
  )
}
