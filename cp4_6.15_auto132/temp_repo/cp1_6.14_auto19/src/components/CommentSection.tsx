import { useState, type FormEvent } from 'react'
import { Send, User, Loader2 } from 'lucide-react'
import { addComment } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import type { Comment } from '../types'

interface CommentSectionProps {
  itemId: string
  comments: Comment[]
  onCommentAdded: (comment: Comment) => void
}

export default function CommentSection({
  itemId,
  comments,
  onCommentAdded,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const { isAuthenticated } = useAuth()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!isAuthenticated) {
      alert('请先登录')
      return
    }

    const content = newComment.trim()
    if (!content || isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      const comment = await addComment(itemId, content)
      onCommentAdded(comment)
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-card">
      <h3 className="font-serif text-xl font-semibold text-wood-700 mb-4">
        评论 {comments.length}
      </h3>

      {comments.length === 0 ? (
        <div className="text-center text-wood-400 py-8">
          暂无评论，快来抢沙发吧~
        </div>
      ) : (
        <div>
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 py-4 border-b border-primary-100 last:border-0"
            >
              <div className="w-10 h-10 rounded-full bg-eco-100 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-eco-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-wood-700">
                    {comment.username}
                  </span>
                  <span className="text-xs text-wood-400">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-wood-600 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isAuthenticated ? (
        <div className="mt-6 text-center text-wood-400 py-4">
          请先登录后发表评论
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="说说你的看法..."
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-primary-200 bg-primary-50 p-4 pr-16 focus:outline-none focus:ring-2 focus:ring-eco-400 focus:border-transparent transition-all placeholder-wood-400 text-wood-700"
            />
            <span className="absolute right-3 bottom-3 text-xs text-wood-400">
              {newComment.length}/500
            </span>
          </div>
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-eco-500 text-white rounded-lg font-medium hover:bg-eco-600 disabled:bg-eco-300 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  发送中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  发送评论
                </>
