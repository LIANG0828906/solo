import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { formatRelative } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, Send } from 'lucide-react'
import { useProjectStore } from './store'
import { useActivityStore } from '@/modules/activity/store'
import { CURRENT_USER_NAME } from '@/shared/types'

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase()
}

function formatTime(timestamp: number): string {
  return formatRelative(timestamp, Date.now(), { locale: zhCN })
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projects = useProjectStore(s => s.projects)
  const likesMap = useProjectStore(s => s.likes)
  const commentsMap = useProjectStore(s => s.comments)
  const toggleLike = useProjectStore(s => s.toggleLike)
  const addComment = useProjectStore(s => s.addComment)
  const addActivity = useActivityStore(s => s.addActivity)

  const project = id ? projects.find(p => p.id === id) : undefined
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [fading, setFading] = useState(false)
  const [likeAnimating, setLikeAnimating] = useState(false)
  const [commentText, setCommentText] = useState('')

  const likeCount = id ? (likesMap[id]?.length ?? 0) : 0
  const liked = id ? (likesMap[id]?.includes('current_user') ?? false) : false
  const comments = id ? (commentsMap[id] ?? []) : []

  if (!project || !id) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 mb-4">项目不存在或已删除</p>
        <button
          onClick={() => navigate('/')}
          className="text-[#27AE60] hover:underline"
        >
          返回列表
        </button>
      </div>
    )
  }

  const handlePrevImage = () => {
    if (project.images.length <= 1) return
    setFading(true)
    setTimeout(() => {
      setCurrentImageIndex((prev) =>
        prev === 0 ? project.images.length - 1 : prev - 1
      )
      setFading(false)
    }, 150)
  }

  const handleNextImage = () => {
    if (project.images.length <= 1) return
    setFading(true)
    setTimeout(() => {
      setCurrentImageIndex((prev) =>
        prev === project.images.length - 1 ? 0 : prev + 1
      )
      setFading(false)
    }, 150)
  }

  const handleLike = async () => {
    if (project.author === CURRENT_USER_NAME) return
    setLikeAnimating(true)
    setTimeout(() => setLikeAnimating(false), 200)
    const nowLiked = await toggleLike(id)
    if (nowLiked) {
      await addActivity({
        type: 'like',
        projectId: id,
        projectTitle: project.title,
        user: CURRENT_USER_NAME,
      })
    }
  }

  const handleSubmitComment = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = commentText.trim()
    if (!trimmed) return
    if (trimmed.length > 200) return

    await addComment(id, CURRENT_USER_NAME, trimmed)
    await addActivity({
      type: 'comment',
      projectId: id,
      projectTitle: project.title,
      user: CURRENT_USER_NAME,
      content: trimmed,
    })
    setCommentText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitComment()
    }
  }

  return (
    <div className="w-full">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-600 hover:text-[#27AE60] mb-6 transition-colors"
      >
        <ArrowLeft size={18} />
        返回项目列表
      </button>

      <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="relative bg-[#ECF0F1] aspect-[16/9] max-h-[500px] overflow-hidden">
          <img
            src={project.images[currentImageIndex]}
            alt={project.title}
            className={`w-full h-full object-contain transition-opacity duration-300 ${
              fading ? 'opacity-0' : 'opacity-100'
            }`}
          />
          {project.images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/60 backdrop-blur hover:bg-white flex items-center justify-center transition-all"
              >
                <ChevronLeft size={22} className="text-gray-700" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/60 backdrop-blur hover:bg-white flex items-center justify-center transition-all"
              >
                <ChevronRight size={22} className="text-gray-700" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {project.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setFading(true)
                      setTimeout(() => {
                        setCurrentImageIndex(idx)
                        setFading(false)
                      }, 150)
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-800">{project.title}</h1>
            <button
              onClick={handleLike}
              disabled={project.author === CURRENT_USER_NAME}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                project.author === CURRENT_USER_NAME
                  ? 'opacity-50 cursor-not-allowed border-gray-200'
                  : 'border-gray-200 hover:border-gray-300'
              } ${likeAnimating ? 'scale-110' : 'scale-100'}`}
              style={{ transition: 'transform 0.2s ease-out' }}
              title={project.author === CURRENT_USER_NAME ? '不能给自己点赞' : ''}
            >
              <Heart
                size={20}
                fill={liked ? '#E74C3C' : 'none'}
                color={liked ? '#E74C3C' : '#ccc'}
                className={likeAnimating ? 'scale-110' : 'scale-100'}
                style={{ transition: 'all 0.2s ease-out' }}
              />
              <span className={`text-sm font-medium ${liked ? 'text-[#E74C3C]' : 'text-gray-600'}`}>
                {likeCount}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <span>作者：{project.author}</span>
            <span>·</span>
            <span>{formatTime(project.createdAt)}</span>
          </div>

          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-8">
            {project.description}
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              评论 <span className="text-gray-400 font-normal">({comments.length})</span>
            </h2>

            <form onSubmit={handleSubmitComment} className="flex gap-3 mb-6">
              <div className="w-9 h-9 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                {getInitials(CURRENT_USER_NAME)}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value.slice(0, 200))}
                  onKeyDown={handleKeyDown}
                  placeholder="写下你的评论..."
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-[#27AE60] transition-colors"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-4 py-2.5 rounded-lg bg-[#27AE60] text-white hover:bg-[#219150] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <Send size={16} />
                  发送
                </button>
              </div>
            </form>
            <p className="text-xs text-gray-400 mb-4 -mt-4 ml-12">
              {commentText.length}/200
            </p>

            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-gray-400 text-center py-8">暂无评论，快来抢沙发吧~</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {getInitials(comment.user)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-800">{comment.user}</span>
                        <span className="text-xs text-gray-400">{formatTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
