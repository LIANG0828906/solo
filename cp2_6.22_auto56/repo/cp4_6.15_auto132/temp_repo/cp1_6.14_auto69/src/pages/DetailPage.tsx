import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Scroll, PlayCircle, VideoOff, Heart } from 'lucide-react'
import ImageCarousel from '@/components/ImageCarousel'
import RatingStars from '@/components/RatingStars'
import { getHeritageDetail, rateHeritage } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import type { HeritageItem } from '@/types'

export default function DetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, setAuthModal, toggleFavorite } = useAuthStore()

  const [item, setItem] = useState<HeritageItem | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [storyVisible, setStoryVisible] = useState<boolean>(false)
  const [localRating, setLocalRating] = useState<number>(0)
  const [animatingRating, setAnimatingRating] = useState<boolean>(false)
  const [favoriteAnimating, setFavoriteAnimating] = useState<boolean>(false)

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return
      try {
        setLoading(true)
        setError(null)
        const data = await getHeritageDetail(id)
        setItem(data)
        if (user) {
          const userRating = data.ratings.find((r) => r.userId === user.id)
          setLocalRating(userRating ? userRating.score : 0)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id, user])

  useEffect(() => {
    const timer = setTimeout(() => {
      setStoryVisible(true)
    }, 200)
    return () => clearTimeout(timer)
  }, [item])

  const handleRate = async (score: number) => {
    if (!user) {
      setAuthModal(true)
      return
    }
    if (!item) return
    try {
      setAnimatingRating(true)
      const result = await rateHeritage(item.id, user.id, score)
      setItem((prev) => (prev ? { ...prev, averageRating: result.averageRating } : prev))
      setLocalRating(score)
    } catch {
      setError('评分失败，请重试')
    } finally {
      setTimeout(() => setAnimatingRating(false), 400)
    }
  }

  const handleFavorite = async () => {
    if (!item) return
    const wasFavorited = user?.favorites.includes(item.id) ?? false
    const result = await toggleFavorite(item.id)
    if (result && !wasFavorited) {
      setFavoriteAnimating(true)
      setTimeout(() => setFavoriteAnimating(false), 800)
    }
  }

  const isFavorited = user?.favorites.includes(item?.id ?? '') ?? false

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 flex justify-center items-center min-h-[60vh]">
        <div className="loader-ring" />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-600 text-lg">{error || '未找到该非遗项目'}</p>
        <button className="btn-terracotta" onClick={() => navigate('/')}>
          返回浏览
        </button>
      </div>
    )
  }

  const storyParagraphs = item.story
    .split('</p>')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => (p.endsWith('<p>') ? p : p + '</p>'))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
      <div
        className="mb-6 inline-flex items-center gap-2 text-navy-light hover:text-terracotta transition-colors cursor-pointer"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回列表</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <ImageCarousel images={item.images || []} />
        </div>

        <div>
          <h1 className="font-serif font-bold italic text-4xl sm:text-5xl text-navy mb-4 leading-tight">
            {item.name}
          </h1>

          <div className="flex gap-2 mb-6">
            <span className={`pill-region region-${item.region}`}>{item.region}</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald/15 text-emerald">
              {item.category}
            </span>
          </div>

          <div className="mb-8">
            <h2 className="font-serif text-xl font-bold text-terracotta-dark mb-3 flex items-center gap-2">
              <Scroll className="w-5 h-5 text-terracotta" />
              历史故事
            </h2>
            <div className="prose-heritage">
              {storyVisible &&
                storyParagraphs.map((paragraph, i) => (
                  <div
                    key={i}
                    className="animate-fadeIn"
                    style={{ animationDelay: `${i * 200}ms` }}
                    dangerouslySetInnerHTML={{ __html: paragraph }}
                  />
                ))}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="font-serif text-xl font-bold text-terracotta-dark mb-3 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-terracotta" />
              制作视频
            </h2>
            {item.videoUrl ? (
              <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-xl">
                <iframe
                  src={item.videoUrl}
                  className="w-full h-full"
                  allowFullScreen
                  title={`${item.name} 制作视频`}
                />
              </div>
            ) : (
              <div className="aspect-video w-full rounded-2xl bg-cream-light flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-terracotta/20">
                <VideoOff className="w-16 h-16 text-terracotta/40 mb-3" />
                <span className="text-navy-light">暂无制作视频</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-6 border-t border-terracotta/10">
            <div className="flex items-center gap-3">
              <RatingStars
                rating={localRating || item.averageRating}
                onRate={handleRate}
                size="lg"
                showValue
              />
              {animatingRating && (
                <span className="animate-bounceScale">{item.averageRating.toFixed(1)}</span>
              )}
            </div>

            <button
              className={`relative group px-6 py-3 rounded-xl border transition-all duration-300 font-medium ml-auto flex items-center gap-2 ${
                isFavorited
                  ? 'bg-terracotta text-white border-terracotta'
                  : 'bg-white text-terracotta border-terracotta/30 hover:border-terracotta hover:bg-terracotta/5'
              }`}
              onClick={handleFavorite}
            >
              <Heart
                className={`w-5 h-5 ${isFavorited ? 'fill-white' : ''} ${
                  favoriteAnimating ? 'animate-bounceScale' : ''
                }`}
              />
              <span>{isFavorited ? '已收藏' : '收藏'}</span>
              {favoriteAnimating && (
                <span className="absolute inset-0 rounded-xl border-2 border-terracotta animate-pulseRing" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
