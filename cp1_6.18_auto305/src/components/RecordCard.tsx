import { useState } from 'react'
import { Heart } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { useImageLazyLoad } from '@/hooks/useImageLazyLoad'
import { useFamily } from '@/context/FamilyContext'
import { getMood } from '@/utils/mood'
import { likeRecord } from '@/utils/api'
import CommentSection from './CommentSection'
import type { Record } from '@/types'

interface RecordCardProps {
  record: Record
  index: number
  onLike: (recordId: string) => void
}

export default function RecordCard({ record, index, onLike }: RecordCardProps) {
  const { ref, isIntersecting } = useIntersectionObserver({ once: true, threshold: 0.1 })
  const { memberInfo } = useFamily()
  const mood = getMood(record.mood)
  const [likes, setLikes] = useState(record.likes)
  const [liked, setLiked] = useState(
    memberInfo ? record.likedBy.includes(memberInfo.memberId) : false
  )
  const [isLiking, setIsLiking] = useState(false)

  const { ref: imgRef, loaded } = useImageLazyLoad({
    src: record.imageUrl || '',
    rootMargin: '200px',
  })

  const handleLike = async () => {
    if (!memberInfo || isLiking) return

    setIsLiking(true)
    try {
      const result = await likeRecord(record.id, { memberId: memberInfo.memberId })
      setLikes(result.likes)
      setLiked(result.liked)
      onLike(record.id)
    } catch (error) {
      console.error('Failed to like record:', error)
    } finally {
      setIsLiking(false)
    }
  }

  const displayContent =
    record.content.length > 140 ? record.content.slice(0, 140) + '...' : record.content

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-card shadow-card bg-white p-4',
        'transition-all duration-300',
        isIntersecting ? 'animate-slide-up' : 'opacity-0 translate-y-8'
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
            style={{ backgroundColor: record.memberAvatarColor }}
          >
            {record.memberName.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-medium text-text-primary">
              {record.memberName}
            </div>
            <div className="text-xs text-text-secondary">
              {formatRelativeTime(record.createdAt)}
            </div>
          </div>
        </div>

        <button
          onClick={handleLike}
          disabled={!memberInfo || isLiking}
          className={cn(
            'like-btn flex items-center gap-1 px-2 py-1 rounded-full',
            'transition-all duration-200',
            liked ? 'liked' : ''
          )}
        >
          <Heart
            size={18}
            className={cn(
              'transition-colors',
              liked ? 'fill-heart-red text-heart-red' : 'text-heart-gray'
            )}
          />
          <span className={cn('text-sm', liked ? 'text-heart-red' : 'text-text-secondary')}>
            {likes}
          </span>
        </button>
      </div>

      <div
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full mb-2"
        style={{ backgroundColor: `${mood.color}20` }}
      >
        <span>{mood.emoji}</span>
        <span className="text-xs font-medium" style={{ color: mood.color }}>
          {mood.name}
        </span>
      </div>

      <p className="text-sm text-text-primary mb-3 leading-relaxed">{displayContent}</p>

      {record.imageUrl && (
        <div className="relative mb-3 rounded-lg overflow-hidden bg-gray-100">
          <img
            ref={imgRef}
            src={loaded ? record.imageUrl : undefined}
            alt="记录图片"
            className={cn(
              'w-full rounded-lg object-cover',
              'transition-opacity duration-300',
              loaded ? 'opacity-100' : 'opacity-0'
            )}
            style={{ aspectRatio: '4/3' }}
          />
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-theme-orange rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      <CommentSection recordId={record.id} comments={record.comments} />
    </div>
  )
}
