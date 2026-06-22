import { useState, useEffect, useRef, useCallback } from 'react'
import { getComments, createComment } from '@/utils/api'
import type { Comment, CreateCommentRequest } from '@/types'
import { formatDate, formatTime } from '@/utils/format'
import { cn } from '@/lib/utils'

interface CommentSectionProps {
  episodeId: string
  currentTime: number
  onMarkTimestamp: (timestamp: number) => void
}

const PAGE_SIZE = 10

export default function CommentSection({
  episodeId,
  currentTime,
  onMarkTimestamp,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newCommentId, setNewCommentId] = useState<string | null>(null)
  const pageRef = useRef(1)
  const loadingRef = useRef(false)
  const observerRef = useRef<HTMLDivElement>(null)

  const loadComments = useCallback(
    async (pageNum: number, reset = false) => {
      if (loadingRef.current) return
      loadingRef.current = true
      setLoading(true)
      try {
        const response = await getComments(episodeId, pageNum, PAGE_SIZE)
        if (reset) {
          setComments(response.list)
          pageRef.current = 1
        } else {
          setComments((prev) => [...prev, ...response.list])
        }
        setHasMore(response.list.length === PAGE_SIZE && pageNum * PAGE_SIZE < response.total)
      } catch (error) {
        console.error('加载留言失败:', error)
      } finally {
        loadingRef.current = false
        setLoading(false)
      }
    },
    [episodeId],
  )

  useEffect(() => {
    setComments([])
    setHasMore(true)
    pageRef.current = 1
    loadComments(1, true)
  }, [episodeId, loadComments])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current && comments.length > 0) {
          pageRef.current += 1
          loadComments(pageRef.current)
        }
      },
      { threshold: 0.1 },
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, comments.length, loadComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim() || !content.trim() || submitting) return

    setSubmitting(true)
    try {
      const data: CreateCommentRequest = {
        nickname: nickname.trim(),
        content: content.trim(),
      }
      const newComment = await createComment(episodeId, data)
      setComments((prev) => [newComment, ...prev])
      setNewCommentId(newComment.id)
      setContent('')
      setTimeout(() => setNewCommentId(null), 600)
    } catch (error) {
      console.error('提交留言失败:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkTimestamp = (commentId: string) => {
    const timestamp = Math.floor(currentTime)
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, timestamp } : c)),
    )
    onMarkTimestamp(timestamp)
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="mb-5 rounded-[10px] bg-background-darker p-5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]">
        <h3 className="mb-4 text-lg font-semibold text-text-light">发表留言</h3>
        <input
          type="text"
          placeholder="你的昵称"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className={cn(
            'mb-3 w-full rounded-lg border border-gray-700 bg-background-dark px-4 py-2.5 text-text-light outline-none transition-all',
            'placeholder:text-gray-500',
            'focus:border-primary focus:ring-1 focus:ring-primary',
          )}
        />
        <textarea
          placeholder="写下你的想法..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className={cn(
            'mb-4 w-full resize-none rounded-lg border border-gray-700 bg-background-dark px-4 py-2.5 text-text-light outline-none transition-all',
            'placeholder:text-gray-500',
            'focus:border-primary focus:ring-1 focus:ring-primary',
          )}
        />
        <button
          type="submit"
          disabled={submitting || !nickname.trim() || !content.trim()}
          className={cn(
            'rounded-lg bg-primary px-6 py-2.5 font-medium text-white transition-all hover:bg-primary/90',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {submitting ? '提交中...' : '提交留言'}
        </button>
      </form>

      <div className="space-y-5">
        {comments.map((comment, index) => (
          <div
            key={comment.id}
            ref={index === comments.length - 1 ? observerRef : null}
            className={cn(
              'rounded-[10px] bg-background-darker p-5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]',
              comment.id === newCommentId && 'animate-fadeIn',
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-primary">{comment.nickname}</span>
              <span className="text-sm text-gray-400">{formatDate(comment.createdAt)}</span>
            </div>
            <p className="mb-3 whitespace-pre-wrap text-text-light">{comment.content}</p>
            <div className="flex items-center justify-between">
              {comment.timestamp !== undefined ? (
                <span className="text-sm text-secondary-cyan">
                  时间点: {formatTime(comment.timestamp)}
                </span>
              ) : (
                <span />
              )}
              <button
                onClick={() => handleMarkTimestamp(comment.id)}
                className="rounded-md border border-primary/50 px-3 py-1 text-sm text-primary transition-all hover:bg-primary hover:text-white"
              >
                标记时间点
              </button>
            </div>
          </div>
        ))}

        {loading && comments.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-primary" />
          </div>
        )}

        {!hasMore && comments.length > 0 && (
          <div className="py-4 text-center text-gray-500">没有更多留言了</div>
        )}

        {!loading && comments.length === 0 && (
          <div className="rounded-[10px] bg-background-darker p-10 text-center text-gray-500 shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]">
            暂无留言，快来发表第一条吧～
          </div>
        )}
      </div>
    </div>
  )
}
