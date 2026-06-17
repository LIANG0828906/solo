import { useState, useEffect } from 'react'
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

  const topBooks = rankedBookLists.slice(0, 10)

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
                onClick={() => navigate(`/book/${bookList.id}`)}
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
