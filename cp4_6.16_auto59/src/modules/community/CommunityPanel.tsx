import React, { useState, useMemo, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { v4 as uuidv4 } from 'uuid'
import { Recipe, CuisineType, CuisineColor, CuisineLabel } from '../recipes/types'
import { useRecipesStore } from '../recipes/store'
import { Comment } from './types'

interface CommunityPanelProps {
  onEditRecipe: (recipeId: string) => void
  onViewRecipe: (recipeId: string) => void
}

type ViewMode = 'grid' | 'detail' | 'edit'
type SortMode = 'latest' | 'popular' | 'rating' | 'time'

const MOCK_COMMENTS: Record<string, Comment[]> = {
  default: [
    {
      id: 'c1',
      recipeId: '',
      userId: 'u1',
      username: '美食探索者',
      avatar: '🧑‍🍳',
      content: '这个食谱太棒了！按照步骤做出来的味道非常好，家人都很喜欢～',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      likes: 12,
      isLiked: false
    },
    {
      id: 'c2',
      recipeId: '',
      userId: 'u2',
      username: '厨房小白',
      avatar: '👨‍🍳',
      content: '作为一个新手，这个食谱的步骤描述非常详细，我终于成功了！感谢分享！',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      likes: 8,
      isLiked: true
    },
    {
      id: 'c3',
      recipeId: '',
      userId: 'u3',
      username: '资深吃货',
      avatar: '👩‍🍳',
      content: '稍微调整了一下调料比例，加了点香菜提味，感觉更香了！',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      likes: 5,
      isLiked: false
    }
  ]
}

const safeCall = (fn: any, ...args: any[]) => {
  if (typeof fn === 'function') return fn(...args)
  return undefined
}

export const CommunityPanel: React.FC<CommunityPanelProps> = ({ onEditRecipe, onViewRecipe }) => {
  const store = useRecipesStore()
  const recipes = store?.recipes ?? []
  const toggleFavorite = (id: string) => safeCall(useRecipesStore.getState()?.toggleFavorite, id)
  const addRating = (id: string, rating: number) => safeCall(useRecipesStore.getState()?.addRating, id, rating)
  const incrementViews = (id: string) => safeCall(useRecipesStore.getState()?.incrementViews, id)
  const createRecipe = (data: any) => safeCall(useRecipesStore.getState()?.createRecipe, data)
  const deleteRecipe = (id: string) => safeCall(useRecipesStore.getState()?.deleteRecipe, id)

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('latest')
  const [filterCuisine, setFilterCuisine] = useState<CuisineType | 'all'>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<number | 'all'>('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [myRating, setMyRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS.default)
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isCommentAnimating, setIsCommentAnimating] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(0)

  const selectedRecipe = useMemo(
    () => recipes.find((r) => r.id === selectedRecipeId) || null,
    [recipes, selectedRecipeId]
  )

  const sortedAndFilteredRecipes = useMemo(() => {
    let result = [...recipes]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.author.toLowerCase().includes(q)
      )
    }

    if (filterCuisine !== 'all') {
      result = result.filter((r) => r.cuisine === filterCuisine)
    }

    if (filterDifficulty !== 'all') {
      result = result.filter((r) => r.difficulty === filterDifficulty)
    }

    if (showFavoritesOnly) {
      result = result.filter((r) => r.isFavorite)
    }

    switch (sortMode) {
      case 'latest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'popular':
        result.sort((a, b) => b.views - a.views)
        break
      case 'rating':
        result.sort((a, b) => {
          const avgA = a.ratings.length ? a.ratings.reduce((x, y) => x + y, 0) / a.ratings.length : 0
          const avgB = b.ratings.length ? b.ratings.reduce((x, y) => x + y, 0) / b.ratings.length : 0
          return avgB - avgA
        })
        break
      case 'time':
        result.sort((a, b) => a.totalTime - b.totalTime)
        break
    }

    return result
  }, [recipes, searchQuery, filterCuisine, filterDifficulty, showFavoritesOnly, sortMode])

  const recipeSteps = useMemo(() => {
    if (!selectedRecipe) return []
    return [...selectedRecipe.blocks].sort((a, b) => a.order - b.order)
  }, [selectedRecipe])

  const recipeIngredients = useMemo(() => {
    if (!selectedRecipe) return []
    const map = new Map<string, { name: string; emoji: string; quantity: number; unit: string }>()
    selectedRecipe.blocks.forEach((block) => {
      block.ingredients.forEach((ing) => {
        const key = `${ing.name}-${ing.unit}`
        if (map.has(key)) {
          map.get(key)!.quantity += ing.quantity
        } else {
          map.set(key, { name: ing.name, emoji: ing.emoji, quantity: ing.quantity, unit: ing.unit })
        }
      })
    })
    return Array.from(map.values())
  }, [selectedRecipe])

  const avgRating = useMemo(() => {
    if (!selectedRecipe || selectedRecipe.ratings.length === 0) return 0
    return selectedRecipe.ratings.reduce((a, b) => a + b, 0) / selectedRecipe.ratings.length
  }, [selectedRecipe])

  useEffect(() => {
    setCompletedSteps(new Set())
    setMyRating(0)
    setHoverRating(0)
    setCommentText('')
    if (selectedRecipe) {
      const s = useRecipesStore.getState()
      if (s && typeof s.incrementViews === 'function') {
        s.incrementViews(selectedRecipe.id)
      }
    }
  }, [selectedRecipeId])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = () => setScrollY(el.scrollTop)
    el.addEventListener('scroll', handler)
    return () => el.removeEventListener('scroll', handler)
  }, [viewMode])

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipeId(recipe.id)
    setViewMode('detail')
    onViewRecipe(recipe.id)
  }

  const handleCreateNew = () => {
    const newRecipe = createRecipe({ title: '我的新食谱' })
    onEditRecipe(newRecipe.id)
  }

  const handleToggleStep = (order: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(order)) {
        next.delete(order)
      } else {
        next.add(order)
      }
      return next
    })
  }

  const handleSubmitRating = (score: number) => {
    if (!selectedRecipe) return
    setMyRating(score)
    addRating(selectedRecipe.id, score)
  }

  const handleSubmitComment = () => {
    if (!commentText.trim() || !selectedRecipe) return
    setIsCommentAnimating(true)
    const newComment: Comment = {
      id: uuidv4(),
      recipeId: selectedRecipe.id,
      userId: 'me',
      username: '我',
      avatar: '😊',
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false
    }
    setComments((prev) => [newComment, ...prev])
    setCommentText('')
    setTimeout(() => setIsCommentAnimating(false), 600)
  }

  const handleToggleCommentLike = (commentId: string) => {
    setLikedComments((prev) => {
      const next = new Set(prev)
      if (next.has(commentId)) {
        next.delete(commentId)
      } else {
        next.add(commentId)
      }
      return next
    })
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              isLiked: !c.isLiked,
              likes: c.isLiked ? c.likes - 1 : c.likes + 1
            }
          : c
      )
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#FBF7F2]" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
      <style>{`
        @keyframes pageFlip {
          0% { transform: perspective(1200px) rotateY(90deg) translateX(200px); opacity: 0; }
          100% { transform: perspective(1200px) rotateY(0deg) translateX(0); opacity: 1; }
        }
        .page-flip {
          animation: pageFlip 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: left center;
        }
        @keyframes slideBack {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(-100px); opacity: 0; }
        }
        @keyframes checkmarkPop {
          0% { transform: scale(0) rotate(-180deg); }
          50% { transform: scale(1.3) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .checkmark-pop { animation: checkmarkPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes bubbleUp {
          0% { transform: translateY(40px) scale(0.8); opacity: 0; }
          60% { transform: translateY(-8px) scale(1.05); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .bubble-up { animation: bubbleUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes cardLift {
          0% { transform: translateY(0); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
          100% { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(139, 94, 60, 0.18); }
        }
        .museum-card:hover {
          animation: cardLift 0.3s ease forwards;
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(139, 94, 60, 0.18);
        }
        @keyframes starPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.25); }
        }
        .star-hover:hover { animation: starPulse 0.3s ease; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.5s ease forwards; }
        @keyframes likeBurst {
          0% { transform: scale(1); }
          50% { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
        .like-burst { animation: likeBurst 0.3s ease; }
      `}</style>

      {viewMode === 'grid' && (
        <>
          <header className="flex-shrink-0 bg-gradient-to-r from-[#F5E6D3] via-[#F7EAD8] to-[#F5E6D3] border-b border-[#E8DCC8] px-8 py-5">
            <div className="flex items-center justify-between gap-6 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8B5E3C] to-[#D4A574] flex items-center justify-center text-2xl shadow-lg shadow-[#8B5E3C]/20">
                  🍳
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#5C4033]" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                    RecipeCanvas
                  </h1>
                  <p className="text-[#A0876D] text-sm">探索 · 创作 · 分享你的美食故事</p>
                </div>
              </div>
              <button
                onClick={handleCreateNew}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5E3C] to-[#7A4F2E] text-white font-medium hover:shadow-lg hover:shadow-[#8B5E3C]/25 transition-all flex items-center gap-2 group"
              >
                <span className="group-hover:rotate-90 transition-transform">+</span>
                创作新食谱
              </button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="搜索食谱、食材或作者..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-11 rounded-xl bg-white/80 backdrop-blur border border-[#E8DCC8] text-sm text-[#5C4033] placeholder:text-[#B8A894] focus:outline-none focus:border-[#D4A574] focus:ring-2 focus:ring-[#D4A574]/20 transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B8A894]">🔍</span>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/60 backdrop-blur border border-[#E8DCC8]">
                {(
                  [
                    { key: 'all', label: '全部', color: '#8B5E3C' },
                    { key: 'chinese', label: '中餐', color: '#C8102E' },
                    { key: 'western', label: '西餐', color: '#1E3A5F' },
                    { key: 'japanese', label: '日食', color: '#88A878' },
                    { key: 'dessert', label: '甜品', color: '#9B7EBD' }
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setFilterCuisine(opt.key)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filterCuisine === opt.key
                        ? 'text-white shadow-sm'
                        : 'text-[#7A6650] hover:bg-white'
                    }`}
                    style={
                      filterCuisine === opt.key
                        ? { backgroundColor: opt.color }
                        : undefined
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-3.5 py-2 rounded-xl bg-white/60 backdrop-blur border border-[#E8DCC8] text-sm text-[#5C4033] focus:outline-none focus:border-[#D4A574]"
              >
                <option value="all">全部难度</option>
                <option value={1}>⭐ 入门</option>
                <option value={2}>⭐⭐ 简单</option>
                <option value={3}>⭐⭐⭐ 中等</option>
                <option value={4}>⭐⭐⭐⭐ 困难</option>
                <option value={5}>⭐⭐⭐⭐⭐ 大师</option>
              </select>

              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="px-3.5 py-2 rounded-xl bg-white/60 backdrop-blur border border-[#E8DCC8] text-sm text-[#5C4033] focus:outline-none focus:border-[#D4A574]"
              >
                <option value="latest">最新发布</option>
                <option value="popular">最多浏览</option>
                <option value="rating">评分最高</option>
                <option value="time">耗时最短</option>
              </select>

              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                  showFavoritesOnly
                    ? 'bg-[#E8A838] text-white shadow-sm'
                    : 'bg-white/60 backdrop-blur border border-[#E8DCC8] text-[#7A6650] hover:bg-white'
                }`}
              >
                <span>{showFavoritesOnly ? '❤️' : '🤍'}</span>
                收藏
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="flex items-center justify-between mb-5">
              <div className="text-sm text-[#A0876D]">
                共 <span className="font-bold text-[#8B5E3C]">{sortedAndFilteredRecipes.length}</span> 份创意食谱
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {sortedAndFilteredRecipes.map((recipe, idx) => {
                const recipeAvg = recipe.ratings.length
                  ? recipe.ratings.reduce((a, b) => a + b, 0) / recipe.ratings.length
                  : 0
                return (
                  <div
                    key={recipe.id}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    onMouseEnter={() => setHoveredCard(recipe.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => handleViewRecipe(recipe)}
                    className="museum-card fade-in-up rounded-2xl overflow-hidden bg-white border border-[#EFE4D4] cursor-pointer transition-all duration-300 relative"
                  >
                    <div
                      className="absolute top-0 left-0 w-4 h-14 rounded-tr-xl rounded-bl-xl z-10 shadow-md"
                      style={{ backgroundColor: CuisineColor[recipe.cuisine] }}
                    />
                    <div
                      className="absolute top-2 left-6 rotate-[-8deg] text-[10px] font-bold text-white px-2 py-0.5 rounded-md shadow-sm z-10"
                      style={{ backgroundColor: CuisineColor[recipe.cuisine] }}
                    >
                      {CuisineLabel[recipe.cuisine]}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(recipe.id)
                      }}
                      className={`absolute top-3 right-3 w-9 h-9 rounded-full z-20 flex items-center justify-center backdrop-blur transition-all ${
                        recipe.isFavorite
                          ? 'bg-red-500/90 text-white shadow-lg'
                          : 'bg-white/80 text-[#B8A894] hover:bg-white hover:text-red-400'
                      }`}
                    >
                      <span className={recipe.isFavorite ? 'like-burst' : ''}>
                        {recipe.isFavorite ? '❤️' : '🤍'}
                      </span>
                    </button>

                    <div
                      className="relative h-44 overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${CuisineColor[recipe.cuisine]}25 0%, ${CuisineColor[recipe.cuisine]}08 50%, #FFF9F0 100%)`
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="text-7xl transition-transform duration-500"
                          style={{
                            transform: hoveredCard === recipe.id ? 'scale(1.15) rotate(-5deg)' : 'scale(1)',
                            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.1))'
                          }}
                        >
                          {recipe.cuisine === 'chinese' ? '🥢' : recipe.cuisine === 'western' ? '🍝' : recipe.cuisine === 'japanese' ? '🍣' : '🍰'}
                        </div>
                      </div>
                      <div
                        className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/15 to-transparent"
                      />
                    </div>

                    <div className="p-4">
                      <h3
                        className="font-bold text-[#5C4033] text-base mb-1.5 line-clamp-1"
                        style={{ fontFamily: "'Noto Serif SC', serif" }}
                      >
                        {recipe.title}
                      </h3>
                      {recipe.description && (
                        <p className="text-[#A0876D] text-xs mb-3 line-clamp-2 leading-relaxed h-8">
                          {recipe.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mb-3 text-xs">
                        <div className="flex items-center gap-1 text-[#8B5E3C]">
                          <span>⏱️</span>
                          <span className="font-medium">{recipe.totalTime}分钟</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <span key={i} className={i <= recipe.difficulty ? 'text-[#E8A838] text-xs' : 'text-[#E8DCC8] text-xs'}>
                              ★
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-[#A0876D]">
                          <span>👁️</span>
                          <span>{recipe.views}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#F5EDE0]">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D4A574] to-[#8B5E3C] flex items-center justify-center text-sm">
                            {recipe.authorAvatar}
                          </div>
                          <span className="text-xs text-[#7A6650] font-medium">{recipe.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[#E8A838] text-sm">★</span>
                          <span className="text-xs font-bold text-[#5C4033]">
                            {recipeAvg > 0 ? recipeAvg.toFixed(1) : '—'}
                          </span>
                          <span className="text-[10px] text-[#B8A894]">({recipe.ratings.length})</span>
                        </div>
                      </div>

                      {hoveredCard === recipe.id && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent rounded-2xl flex items-end justify-center pb-5 fade-in-up">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditRecipe(recipe.id)
                            }}
                            className="px-5 py-2 rounded-xl bg-white/95 backdrop-blur text-[#8B5E3C] text-sm font-bold shadow-xl hover:bg-white transition-all"
                          >
                            ✏️ 编辑食谱
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowDeleteConfirm(recipe.id)
                            }}
                            className="ml-2 px-4 py-2 rounded-xl bg-red-500/90 backdrop-blur text-white text-sm font-bold shadow-xl hover:bg-red-500 transition-all"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>

                    {showDeleteConfirm === recipe.id && (
                      <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl z-30 flex items-center justify-center p-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="bg-white rounded-2xl p-5 shadow-2xl w-full">
                          <h4 className="font-bold text-[#5C4033] mb-2">确认删除？</h4>
                          <p className="text-sm text-[#A0876D] mb-4">删除后将无法恢复这份食谱</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowDeleteConfirm(null)}
                              className="flex-1 py-2 rounded-lg bg-[#F5E6D3] text-[#8B5E3C] text-sm font-medium hover:bg-[#E8D4BE] transition-colors"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => {
                                deleteRecipe(recipe.id)
                                setShowDeleteConfirm(null)
                              }}
                              className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                            >
                              确认删除
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {sortedAndFilteredRecipes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-7xl mb-4">🍽️</div>
                <h3 className="text-[#8B5E3C] font-bold text-lg mb-2">暂无符合条件的食谱</h3>
                <p className="text-[#A0876D] text-sm mb-6">尝试调整筛选条件，或者创作你的第一份食谱吧！</p>
                <button
                  onClick={handleCreateNew}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5E3C] to-[#7A4F2E] text-white font-medium hover:shadow-lg transition-all"
                >
                  + 创作新食谱
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {viewMode === 'detail' && selectedRecipe && (
        <div className="h-full flex flex-col page-flip">
          <div className="relative flex-shrink-0 h-72 overflow-hidden" style={{
            background: `linear-gradient(135deg, ${CuisineColor[selectedRecipe.cuisine]}35 0%, ${CuisineColor[selectedRecipe.cuisine]}15 40%, #FBF7F2 100%)`
          }}>
            <div
              className="absolute inset-0 transition-transform duration-100 will-change-transform"
              style={{
                transform: `translateY(${scrollY * 0.3}px)`,
                opacity: Math.max(0.3, 1 - scrollY / 300)
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-[180px] opacity-90" style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))' }}>
                  {selectedRecipe.cuisine === 'chinese' ? '🥢' : selectedRecipe.cuisine === 'western' ? '🍝' : selectedRecipe.cuisine === 'japanese' ? '🍣' : '🍰'}
                </div>
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FBF7F2]" />

            <div className="absolute top-0 left-0 right-0 z-10 p-5">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setViewMode('grid')
                    setSelectedRecipeId(null)
                  }}
                  className="w-10 h-10 rounded-full bg-white/80 backdrop-blur text-[#8B5E3C] font-bold hover:bg-white transition-all flex items-center justify-center shadow-md"
                >
                  ←
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditRecipe(selectedRecipe.id)}
                    className="px-4 py-2 rounded-full bg-white/80 backdrop-blur text-[#8B5E3C] text-sm font-medium hover:bg-white transition-all shadow-md flex items-center gap-1.5"
                  >
                    ✏️ 编辑
                  </button>
                  <button
                    onClick={() => toggleFavorite(selectedRecipe.id)}
                    className={`w-10 h-10 rounded-full backdrop-blur flex items-center justify-center shadow-md transition-all ${
                      selectedRecipe.isFavorite
                        ? 'bg-red-500 text-white'
                        : 'bg-white/80 text-[#B8A894] hover:bg-white'
                    }`}
                  >
                    {selectedRecipe.isFavorite ? '❤️' : '🤍'}
                  </button>
                </div>
              </div>
            </div>

            <div
              className="absolute left-5 top-24 rotate-[-6deg] px-4 py-1.5 rounded-full text-white text-sm font-bold shadow-lg z-10"
              style={{ backgroundColor: CuisineColor[selectedRecipe.cuisine] }}
            >
              {CuisineLabel[selectedRecipe.cuisine]}
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 pb-10 -mt-8 relative z-20">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl shadow-xl shadow-[#8B5E3C]/10 p-8 mb-6 border border-[#F0E6D6]">
                <h1 className="text-3xl font-bold text-[#5C4033] mb-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                  {selectedRecipe.title}
                </h1>
                {selectedRecipe.description && (
                  <p className="text-[#7A6650] leading-relaxed mb-5">{selectedRecipe.description}</p>
                )}

                <div className="flex items-center gap-5 flex-wrap pb-5 mb-5 border-b border-[#F0E6D6]">
                  <div className="flex items-center gap-1.5 text-[#8B5E3C]">
                    <span>⏱️</span>
                    <span className="font-bold">{selectedRecipe.totalTime}分钟</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[#A0876D] text-sm mr-1">难度</span>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className={i <= selectedRecipe.difficulty ? 'text-[#E8A838]' : 'text-[#E8DCC8]'}>
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-[#A0876D]">
                    <span>👁️</span>
                    <span>{selectedRecipe.views} 浏览</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#A0876D]">
                    <span>📅</span>
                    <span>{format(new Date(selectedRecipe.createdAt), 'yyyy年M月d日', { locale: zhCN })}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D4A574] to-[#8B5E3C] flex items-center justify-center text-xl shadow-md">
                      {selectedRecipe.authorAvatar}
                    </div>
                    <div>
                      <div className="font-bold text-[#5C4033]">{selectedRecipe.author}</div>
                      <div className="text-xs text-[#A0876D]">美食创作者</div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button
                          key={i}
                          onMouseEnter={() => setHoverRating(i)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => handleSubmitRating(i)}
                          className="star-hover text-xl transition-colors"
                        >
                          <span className={i <= (hoverRating || myRating) ? 'text-[#E8A838]' : 'text-[#E8DCC8]'}>
                            ★
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="text-xs text-[#A0876D]">
                      {avgRating > 0 ? (
                        <>
                          <span className="font-bold text-[#8B5E3C]">{avgRating.toFixed(1)}</span> 分
                          · {selectedRecipe.ratings.length} 人评分
                          {myRating > 0 && <> · 你的评分: <span className="font-bold text-[#E8A838]">{myRating}</span></>}
                        </>
                      ) : (
                        <>暂无评分，点击星星来评价</>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-3xl shadow-lg shadow-[#8B5E3C]/8 p-6 border border-[#F0E6D6] sticky top-6">
                    <h2 className="font-bold text-[#8B5E3C] text-lg mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-[#F5E6D3] flex items-center justify-center">🥗</span>
                      食材清单
                    </h2>
                    {recipeIngredients.length === 0 ? (
                      <p className="text-[#B8A894] text-sm italic text-center py-6">暂无食材</p>
                    ) : (
                      <div className="space-y-1.5">
                        {recipeIngredients.map((ing, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF4EB] hover:bg-[#F5E6D3] transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl">{ing.emoji}</span>
                              <span className="text-[#5C4033] font-medium text-sm">{ing.name}</span>
                            </div>
                            <span className="text-[#8B5E3C] font-bold text-sm">
                              {ing.quantity} {ing.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <div className="bg-white rounded-3xl shadow-lg shadow-[#8B5E3C]/8 p-6 border border-[#F0E6D6]">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-bold text-[#8B5E3C] text-lg flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-[#F5E6D3] flex items-center justify-center">📋</span>
                        烹饪步骤
                      </h2>
                      {completedSteps.size > 0 && (
                        <div className="text-sm text-[#A0876D]">
                          已完成 <span className="font-bold text-[#88A878]">{completedSteps.size}</span> / {recipeSteps.length}
                        </div>
                      )}
                    </div>

                    {recipeSteps.length === 0 ? (
                      <p className="text-[#B8A894] text-sm italic text-center py-10">暂无步骤</p>
                    ) : (
                      <div className="space-y-5">
                        {recipeSteps.map((block, idx) => {
                          const isDone = completedSteps.has(block.order)
                          return (
                            <div
                              key={block.id}
                              style={{ animationDelay: `${idx * 80}ms` }}
                              className={`relative fade-in-up rounded-2xl p-5 transition-all ${
                                isDone
                                  ? 'bg-gradient-to-br from-[#EAF5E8] to-[#F0FAF0] border border-[#C5E6C0]'
                                  : 'bg-[#FAF4EB] border border-[#EFE4D4] hover:bg-[#F5EDE0]'
                              }`}
                            >
                              <div className="flex gap-4">
                                <button
                                  onClick={() => handleToggleStep(block.order)}
                                  className={`relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all ${
                                    isDone
                                      ? 'bg-gradient-to-br from-[#6BAF5F] to-[#4A8A40] shadow-lg shadow-[#6BAF5F]/30'
                                      : 'bg-gradient-to-br from-[#D4A574] to-[#8B5E3C] shadow-lg shadow-[#8B5E3C]/25 hover:scale-105'
                                  }`}
                                >
                                  {isDone ? (
                                    <span className="checkmark-pop text-sm">✓</span>
                                  ) : (
                                    block.order
                                  )}
                                </button>
                                <div className="flex-1 min-w-0 pt-1">
                                  <h3 className={`font-bold mb-1.5 ${isDone ? 'text-[#4A6A40] line-through opacity-70' : 'text-[#5C4033]'}`}>
                                    {block.title}
                                  </h3>
                                  {block.description && (
                                    <p className={`text-sm leading-relaxed ${isDone ? 'text-[#7A9A70]' : 'text-[#7A6650]'}`}>
                                      {block.description}
                                    </p>
                                  )}
                                  {block.ingredients.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                      {block.ingredients.map((ing) => (
                                        <span
                                          key={ing.id}
                                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${
                                            isDone
                                              ? 'bg-white/70 text-[#4A6A40]'
                                              : 'bg-white text-[#8B5E3C]'
                                          }`}
                                        >
                                          <span>{ing.emoji}</span>
                                          {ing.name}
                                          <span className="opacity-70">{ing.quantity}{ing.unit}</span>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-lg shadow-[#8B5E3C]/8 p-6 border border-[#F0E6D6]">
                <h2 className="font-bold text-[#8B5E3C] text-lg mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#F5E6D3] flex items-center justify-center">💬</span>
                  美食交流
                  <span className="ml-2 text-sm font-normal text-[#A0876D]">({comments.length} 条评论)</span>
                </h2>

                <div className={`mb-6 ${isCommentAnimating ? 'bubble-up' : ''}`}>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A574] to-[#8B5E3C] flex items-center justify-center text-lg">
                      😊
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            handleSubmitComment()
                          }
                        }}
                        placeholder="分享你的烹饪心得、改良建议或成果照片..."
                        rows={3}
                        className="w-full p-4 rounded-2xl bg-[#FAF4EB] border border-[#EFE4D4] text-sm text-[#5C4033] placeholder:text-[#B8A894] focus:outline-none focus:border-[#D4A574] focus:ring-2 focus:ring-[#D4A574]/20 resize-none transition-all"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-[#B8A894]">
                          支持 Markdown · Ctrl+Enter 发送
                        </span>
                        <button
                          onClick={handleSubmitComment}
                          disabled={!commentText.trim()}
                          className={`px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                            commentText.trim()
                              ? 'bg-gradient-to-r from-[#8B5E3C] to-[#7A4F2E] text-white hover:shadow-lg hover:shadow-[#8B5E3C]/20'
                              : 'bg-[#F0E6D6] text-[#B8A894] cursor-not-allowed'
                          }`}
                        >
                          <span>📨</span>
                          发送评论
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative pl-6">
                  <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#D4A574] via-[#E8D4BE] to-transparent" />

                  <div className="space-y-5">
                    {comments.map((comment, idx) => (
                      <div
                        key={comment.id}
                        style={{ animationDelay: `${idx * 60}ms` }}
                        className={`relative fade-in-up ${
                          comment.userId === 'me' ? 'bubble-up' : ''
                        }`}
                      >
                        <div className="absolute left-[-28px] top-3 w-3.5 h-3.5 rounded-full border-2 border-white bg-gradient-to-br from-[#D4A574] to-[#8B5E3C] shadow-md z-10" />

                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#F5E6D3] to-[#E8D4BE] flex items-center justify-center text-lg shadow-sm">
                            {comment.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-bold text-[#5C4033] text-sm">{comment.username}</span>
                              {comment.userId === 'me' && (
                                <span className="px-2 py-0.5 rounded-full bg-[#8B5E3C] text-[10px] font-bold text-white">
                                  我
                                </span>
                              )}
                              <span className="text-xs text-[#A0876D]">
                                {format(new Date(comment.createdAt), 'M月d日 HH:mm', { locale: zhCN })}
                              </span>
                            </div>
                            <div className="p-3.5 rounded-2xl rounded-tl-sm bg-[#FAF4EB] text-sm text-[#5C4033] leading-relaxed shadow-sm">
                              {comment.content}
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <button
                                onClick={() => handleToggleCommentLike(comment.id)}
                                className={`flex items-center gap-1 text-xs transition-all ${
                                  likedComments.has(comment.id) || comment.isLiked
                                    ? 'text-red-500 font-medium'
                                    : 'text-[#A0876D] hover:text-red-400'
                                }`}
                              >
                                <span className={likedComments.has(comment.id) ? 'like-burst inline-block' : ''}>
                                  {likedComments.has(comment.id) || comment.isLiked ? '❤️' : '🤍'}
                                </span>
                                {comment.likes > 0 && <span>{comment.likes}</span>}
                              </button>
                              <button className="flex items-center gap-1 text-xs text-[#A0876D] hover:text-[#8B5E3C] transition-colors">
                                <span>↩️</span> 回复
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
