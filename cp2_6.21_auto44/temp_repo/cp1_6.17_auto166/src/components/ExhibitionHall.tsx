import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore, type Work } from '@/store'
import { fetchExhibition, fetchWorks, likeWork, addComment } from '@/api'
import {
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  X,
  Send,
  Maximize2,
  Minimize2,
} from 'lucide-react'

const TAG_HEX: Record<string, string> = {
  '风光': '#3498DB',
  '人像': '#2ECC71',
  '纪实': '#E67E22',
  '抽象': '#9B59B6',
}

const AVATAR_COLORS = [
  '#E74C3C', '#3498DB', '#2ECC71', '#9B59B6',
  '#E67E22', '#1ABC9C', '#F39C12', '#34495E',
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

interface WallState {
  works: Work[]
  offset: number
}

export default function ExhibitionHall() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { works, setWorks, toggleWorkLike, addComment: addCommentStore, commentPanelWorkId, setCommentPanelWorkId } = useStore()

  const [exhibitionWorks, setExhibitionWorks] = useState<Work[]>([])
  const [walls, setWalls] = useState<[WallState, WallState, WallState]>([
    { works: [], offset: 0 },
    { works: [], offset: 0 },
    { works: [], offset: 0 },
  ])
  const [activeWall, setActiveWall] = useState(1)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const exhibition = await fetchExhibition(id)
      const allWorks = await fetchWorks()
      setWorks(allWorks)
      const exhibitionWorkList = allWorks.filter((w: Work) => exhibition.workIds.includes(w.id))
      setExhibitionWorks(exhibitionWorkList)

      const perWall = Math.ceil(exhibitionWorkList.length / 3)
      const wallData: [WallState, WallState, WallState] = [
        { works: exhibitionWorkList.slice(0, perWall), offset: 0 },
        { works: exhibitionWorkList.slice(perWall, perWall * 2), offset: 0 },
        { works: exhibitionWorkList.slice(perWall * 2), offset: 0 },
      ]
      setWalls(wallData)
      setLoading(false)
    }
    load()
  }, [id])

  const handleLike = async (work: Work, e: React.MouseEvent) => {
    e.stopPropagation()
    const result = await likeWork(work.id, 'visitor')
    toggleWorkLike(work.id, result.liked)
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !commentPanelWorkId) return
    const comment = await addComment(commentPanelWorkId, '观众', commentText.trim())
    addCommentStore(commentPanelWorkId, comment)
    setCommentText('')
  }

  const shiftWall = (wallIdx: number, direction: 1 | -1) => {
    setWalls((prev) => {
      const next = [...prev] as [WallState, WallState, WallState]
      const wall = next[wallIdx]
      const maxOffset = Math.max(0, wall.works.length - 4)
      const newOffset = Math.min(maxOffset, Math.max(0, wall.offset + direction))
      next[wallIdx] = { ...wall, offset: newOffset }
      return next
    })
  }

  const commentWork = exhibitionWorks.find((w) => w.id === commentPanelWorkId)

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-hall-dark-1 to-hall-dark-2">
        <div className="text-white/50 text-lg animate-pulse">正在加载展览...</div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-hall-dark-1 to-hall-dark-2 relative">
      {/* Back button */}
      <button
        className="absolute top-4 left-4 z-30 nav-arrow"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Wall selector */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {['左墙', '后墙', '右墙'].map((label, idx) => (
          <button
            key={label}
            className={`px-4 py-1.5 rounded-full text-sm transition-all duration-300 ${
              activeWall === idx
                ? 'bg-accent text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
            onClick={() => setActiveWall(idx)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 3D Exhibition Room */}
      <div className="exhibition-room w-full h-full relative">
        {/* Floor */}
        <div className="exhibition-floor" />

        {/* Walls */}
        {walls.map((wall, wallIdx) => {
          const wallClasses = [
            'exhibition-wall-left',
            'exhibition-wall-back',
            'exhibition-wall-right',
          ]
          const visibleWorks = wall.works.slice(wall.offset, wall.offset + 4)
          const isBackWall = wallIdx === 1
          const isLeftWall = wallIdx === 0
          const isRightWall = wallIdx === 2

          return (
            <div
              key={wallIdx}
              className={`absolute ${wallClasses[wallIdx]} flex items-center justify-center gap-6 ${
                activeWall === wallIdx ? 'opacity-100 z-10' : 'opacity-30 z-0'
              } transition-opacity duration-400`}
              style={{
                top: isBackWall ? '8%' : '15%',
                left: isBackWall ? '15%' : isLeftWall ? '2%' : undefined,
                right: isRightWall ? '2%' : undefined,
                width: isBackWall ? '70%' : isLeftWall || isRightWall ? '55%' : 'auto',
                height: isBackWall ? '65%' : '50%',
              }}
              onClick={() => setActiveWall(wallIdx)}
            >
              {/* Wall surface */}
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  background: 'linear-gradient(180deg, #2a2a4a 0%, #1e1e3a 100%)',
                  boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3)',
                }}
              />

              {/* Frames on wall */}
              <div className="relative flex items-center justify-center gap-4 sm:gap-6 z-10 px-4">
                {visibleWorks.map((work, frameIdx) => (
                  <div
                    key={work.id}
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedImage(work.id)
                    }}
                  >
                    {/* Frame */}
                    <div
                      className="frame-shadow relative overflow-hidden"
                      style={{
                        width: '200px',
                        height: '280px',
                        border: '8px solid #B8860B',
                        borderRadius: '2px',
                        background: '#111',
                        transition: 'transform 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)'
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
                      }}
                    >
                      <img
                        src={work.imageUrl}
                        alt={work.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info below frame */}
                    <div className="mt-3 text-center">
                      <p className="text-white/80 text-xs font-medium truncate max-w-[200px]">
                        {work.title}
                      </p>
                      <div className="flex items-center justify-center gap-3 mt-1.5">
                        <button
                          className={`heart-btn flex items-center gap-1 text-xs ${
                            work.liked ? 'liked' : ''
                          }`}
                          onClick={(e) => handleLike(work, e)}
                        >
                          <Heart
                            className="w-3.5 h-3.5"
                            fill={work.liked ? '#E74C3C' : 'none'}
                            stroke="#E74C3C"
                          />
                          <span className="text-white/60">{work.likes}</span>
                        </button>
                        <button
                          className="flex items-center gap-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCommentPanelWorkId(work.id)
                          }}
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-white/50" />
                          <span className="text-white/60">{work.comments.length}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: Math.max(0, 4 - visibleWorks.length) }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex flex-col items-center"
                    style={{ width: '200px', height: '280px', border: '8px solid #B8860B33', borderRadius: '2px', background: '#1a1a2e' }}
                  />
                ))}
              </div>

              {/* Navigation arrows */}
              {wall.works.length > 4 && activeWall === wallIdx && (
                <>
                  {wall.offset > 0 && (
                    <button
                      className="nav-arrow absolute left-2 top-1/2 -translate-y-1/2 z-20"
                      onClick={(e) => {
                        e.stopPropagation()
                        shiftWall(wallIdx, -1)
                      }}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  {wall.offset < wall.works.length - 4 && (
                    <button
                      className="nav-arrow absolute right-2 top-1/2 -translate-y-1/2 z-20"
                      onClick={(e) => {
                        e.stopPropagation()
                        shiftWall(wallIdx, 1)
                      }}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Expanded image overlay */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
          onClick={() => setExpandedImage(null)}
        >
          <button
            className="absolute top-4 right-4 nav-arrow"
            onClick={() => setExpandedImage(null)}
          >
            <X className="w-5 h-5" />
          </button>
          {(() => {
            const work = exhibitionWorks.find((w) => w.id === expandedImage)
            if (!work) return null
            return (
              <div
                className="max-w-4xl max-h-[90vh] relative"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={work.imageUrl}
                  alt={work.title}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
                <div className="mt-4 text-center">
                  <h3 className="text-white text-lg font-semibold">{work.title}</h3>
                  {work.cameraParams && (
                    <p className="text-white/50 text-sm mt-1">{work.cameraParams}</p>
                  )}
                  {work.tags.length > 0 && (
                    <div className="flex justify-center gap-2 mt-2">
                      {work.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs rounded-full text-white"
                          style={{ backgroundColor: TAG_HEX[tag] }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-4 mt-3">
                    <button
                      className={`heart-btn flex items-center gap-1.5 ${work.liked ? 'liked' : ''}`}
                      onClick={(e) => handleLike(work, e)}
                    >
                      <Heart
                        className="w-5 h-5"
                        fill={work.liked ? '#E74C3C' : 'none'}
                        stroke="#E74C3C"
                      />
                      <span className="text-white">{work.likes}</span>
                    </button>
                    <button
                      className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedImage(null)
                        setCommentPanelWorkId(work.id)
                      }}
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{work.comments.length}</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Comment Panel */}
      <div
        className={`comment-panel fixed top-0 right-0 h-full w-80 bg-hall-panel rounded-l-panel z-40 flex flex-col ${
          commentPanelWorkId ? 'open' : 'closed'
        }`}
      >
        {commentWork && (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h4 className="text-white font-medium text-sm">{commentWork.title} - 留言</h4>
              <button
                className="p-1 rounded hover:bg-white/10 transition-colors"
                onClick={() => setCommentPanelWorkId(null)}
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {commentWork.comments.length === 0 && (
                <p className="text-white/30 text-sm text-center py-8">暂无留言</p>
              )}
              {commentWork.comments.map((comment) => (
                <div key={comment.id} className="flex gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: getAvatarColor(comment.author) }}
                  >
                    {comment.author.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white/70 text-xs font-medium">{comment.author}</span>
                      <span className="text-white/30 text-[10px]">
                        {new Date(comment.createdAt).toLocaleString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-white/80 text-sm mt-0.5 break-words">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmitComment()
                    }
                  }}
                  placeholder="写下你的留言..."
                  className="flex-1 px-3 py-2 bg-white/10 text-white text-sm rounded-card border border-white/10 outline-none focus:border-accent/50 transition-colors placeholder:text-white/30"
                />
                <button
                  className="p-2 bg-accent rounded-card text-white transition-all hover:bg-accent-hover active:scale-95"
                  onClick={handleSubmitComment}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
