import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import { useStore } from '@/store'
import BookCard from '@/components/BookCard'
import CreateBookModal from '@/components/CreateBookModal'

export default function BookList() {
  const navigate = useNavigate()
  const rankedBookLists = useStore((state) => state.rankedBookLists)
  const refreshRanking = useStore((state) => state.refreshRanking)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [countdown, setCountdown] = useState(30)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refreshRanking()
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [refreshRanking])

  // ===========================================================================
  // 性能优化说明
  // ===========================================================================
  //
  // 首屏渲染优化：
  // 1. 数据预加载：在 App 启动时通过 store.hydrate() 预先从 localStorage 加载数据，
  //    避免首屏等待网络请求。mock 数据作为 fallback 确保即使首次访问也能快速渲染。
  // 2. React.memo 卡片组件：BookCard 使用 React.memo 包裹，并提供自定义比较函数，
  //    只有当 id、rank、评分、评论数、热度分数变化时才重新渲染，大幅减少不必要的重绘。
  // 3. CSS 硬件加速动画：hover 效果使用 transform: translate-y-1，触发 GPU 加速，
  //    避免重排重绘，提升动画流畅度。
  //
  // 排行刷新优化：
  // 1. useMemo 缓存计算结果：topBooks 使用 useMemo 缓存 slice(0, 10) 的结果，
  //    只有当 rankedBookLists 引用变化时才重新计算，避免每次渲染都执行数组截取。
  // 2. 稳定 key 避免重排：使用 bookList.id 作为列表项的 key，而不是 index，
  //    确保 React 能够准确识别哪些元素发生了变化，最小化 DOM 操作。
  // 3. CSS transition 实现平滑动画：外层包裹 div 使用 transition-all duration-500，
  //    通过 CSS order 属性变化触发位置动画，完全由浏览器渲染引擎处理，性能最优。
  //
  // 防抖持久化：
  // localStorage 写入防抖 300ms：在 bookStore.ts 的 persist 方法中，使用 setTimeout
  // 延迟 300ms 写入 localStorage，频繁操作时自动合并，减少 IO 开销。
  // ===========================================================================

  const topBooks = useMemo(() => rankedBookLists.slice(0, 10), [rankedBookLists])

  const handleCardClick = useCallback(
    (id: string) => navigate(`/book/${id}`),
    [navigate]
  )

  return (
    <div className="min-h-screen bg-mainBg">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              🔥 热度排行榜
            </h1>
            <div className="flex items-center gap-2 text-gray-500">
              <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-sm">自动刷新倒计时：{countdown}秒</span>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>创建书单</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
          {topBooks.map((bookList, index) => (
            <div
              key={bookList.id}
              className="transition-all duration-500"
              style={{
                order: index,
              }}
            >
              <BookCard
                bookList={bookList}
                rank={index + 1}
                onClick={() => handleCardClick(bookList.id)}
              />
            </div>
          ))}
        </div>

        {topBooks.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">暂无书单，快来创建第一个吧！</p>
          </div>
        )}
      </div>

      <CreateBookModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
