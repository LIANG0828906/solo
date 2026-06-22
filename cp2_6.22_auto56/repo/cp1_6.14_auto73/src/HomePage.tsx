import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { boardApi } from './api'
import type { BoardCard } from './types'
import CreateBoardModal from './components/CreateBoardModal'

function HomePage() {
  const navigate = useNavigate()
  const [boards, setBoards] = useState<BoardCard[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const loadingRef = useRef(false)

  const loadBoards = useCallback(async (pageNum: number, append: boolean = false) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const res = await boardApi.getBoards(pageNum, 6)
      if (append) {
        setBoards(prev => [...prev, ...res.boards])
      } else {
        setBoards(res.boards)
      }
      setHasMore(res.hasMore)
      setPage(pageNum)
    } catch (error) {
      console.error('Failed to load boards:', error)
    } finally {
      setLoading(false)
      setInitialLoading(false)
      loadingRef.current = false
    }
  }, [])

  useEffect(() => {
    loadBoards(1, false)
  }, [loadBoards])

  const handleLoadMore = () => {
    loadBoards(page + 1, true)
  }

  const handleBoardClick = (id: string) => {
    navigate(`/board/${id}`)
  }

  const handleCreateBoard = async (title: string, description: string) => {
    try {
      const board = await boardApi.createBoard(title, description)
      setBoards(prev => [{
        id: board.id,
        title: board.title,
        description: board.description,
        imageCount: 0,
        thumbnail: null,
        createdAt: board.createdAt,
      }, ...prev])
      setShowCreateModal(false)
      navigate(`/board/${board.id}`)
    } catch (error) {
      console.error('Failed to create board:', error)
    }
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <h2>我的灵感板</h2>
        <button className="create-btn" onClick={() => setShowCreateModal(true)}>
          + 创建新板
        </button>
      </div>

      {initialLoading ? (
        <div className="empty-state">
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p className="empty-state-text">加载中...</p>
        </div>
      ) : boards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-text">还没有灵感板，点击上方按钮创建第一个</p>
        </div>
      ) : (
        <>
          <div className="boards-grid">
            {boards.map(board => (
              <div
                key={board.id}
                className="board-card"
                onClick={() => handleBoardClick(board.id)}
              >
                <div className="board-card-thumbnail">
                  {board.thumbnail ? (
                    <img src={board.thumbnail} alt={board.title} />
                  ) : null}
                </div>
                <div className="board-card-title">{board.title}</div>
                <div className="board-card-count">{board.imageCount} 张素材</div>
              </div>
            ))}
          </div>

          {hasMore && (
            <button
              className="load-more-btn"
              onClick={handleLoadMore}
              disabled={loading}
            >
              {loading ? '加载中...' : '加载更多'}
            </button>
          )}

          {!hasMore && boards.length > 6 && (
            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              已显示全部灵感板
            </p>
          )}
        </>
      )}

      <CreateBoardModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateBoard}
      />
    </div>
  )
}

export default HomePage
