import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { drawBookCover, getStatusInfo } from '../utils/bookCover'
import { drawDriftRoute } from '../utils/canvasUtils'
import { DoodleGallery } from '../doodle/DoodleGallery'
import { ArrowLeft, Heart, BookOpen } from 'lucide-react'
import './BookDetail.css'

export function BookDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const books = useAppStore(state => state.books)
  const borrowBook = useAppStore(state => state.borrowBook)
  const returnBook = useAppStore(state => state.returnBook)
  const setCurrentBook = useAppStore(state => state.setCurrentBook)
  
  const book = books.find(b => b.id === id) || null
  
  const coverCanvasRef = useRef<HTMLCanvasElement>(null)
  const routeCanvasRef = useRef<HTMLCanvasElement>(null)
  const [showFullDesc, setShowFullDesc] = useState(false)
  
  useEffect(() => {
    if (id) {
      setCurrentBook(id)
    }
  }, [id, setCurrentBook])
  
  useEffect(() => {
    if (!book) return
    
    const coverCanvas = coverCanvasRef.current
    if (coverCanvas) {
      const ctx = coverCanvas.getContext('2d')
      if (ctx) {
        const dpr = window.devicePixelRatio || 1
        coverCanvas.width = 300 * dpr
        coverCanvas.height = 400 * dpr
        ctx.scale(dpr, dpr)
        coverCanvas.style.width = '300px'
        coverCanvas.style.height = '400px'
        drawBookCover(ctx, 300, 400, book)
      }
    }
    
    const routeCanvas = routeCanvasRef.current
    if (routeCanvas && book.driftHistory.length > 0) {
      const ctx = routeCanvas.getContext('2d')
      if (ctx) {
        const dpr = window.devicePixelRatio || 1
        const width = routeCanvas.clientWidth || 600
        const height = 200
        routeCanvas.width = width * dpr
        routeCanvas.height = height * dpr
        ctx.scale(dpr, dpr)
        routeCanvas.style.width = `${width}px`
        routeCanvas.style.height = `${height}px`
        drawDriftRoute(ctx, width, height, book.driftHistory)
      }
    }
  }, [book])
  
  const handleBorrow = () => {
    if (book && book.status === 'available') {
      borrowBook(book.id)
    }
  }
  
  const handleReturn = () => {
    if (book && book.status === 'drifting') {
      returnBook(book.id)
    }
  }
  
  const handleGoDoodle = () => {
    if (book) {
      navigate(`/book/${book.id}/doodle`)
    }
  }
  
  const handleBack = () => {
    navigate('/')
  }
  
  if (!book) {
    return (
      <div className="book-detail-page">
        <div className="not-found">图书不存在</div>
      </div>
    )
  }
  
  const statusInfo = getStatusInfo(book.status)
  const descLimit = 140
  const isDescLong = book.description.length > descLimit
  const displayDesc = showFullDesc || !isDescLong 
    ? book.description 
    : book.description.slice(0, descLimit) + '...'
  
  const isBorrowable = book.status === 'available'
  const isReturnable = book.status === 'drifting'
  
  return (
    <div className="book-detail-page">
      <div className="detail-nav">
        <button className="back-btn" onClick={handleBack}>
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>
      </div>
      
      <div className="detail-content">
        <div className="book-cover-section">
          <div className="cover-wrapper">
            <canvas
              ref={coverCanvasRef}
              className="detail-cover-canvas"
            />
            <div
              className="detail-status-tag"
              style={{
                backgroundColor: statusInfo.bgColor,
                color: statusInfo.color,
                boxShadow: `0 0 16px ${statusInfo.color}60`,
              }}
            >
              {statusInfo.label}
            </div>
          </div>
        </div>
        
        <div className="book-info-section">
          <h1 className="book-title">{book.title}</h1>
          <p className="book-author">作者：{book.author}</p>
          
          <div className="book-description">
            <h3 className="section-title">📖 内容简介</h3>
            <p className="desc-text">{displayDesc}</p>
            {isDescLong && (
              <button
                className="expand-btn"
                onClick={() => setShowFullDesc(!showFullDesc)}
              >
                {showFullDesc ? '收起' : '展开'}
              </button>
            )}
          </div>
          
          <div className="action-buttons">
            {isBorrowable && (
              <button className="action-btn borrow-btn" onClick={handleBorrow}>
                <BookOpen size={20} />
                开始借阅
              </button>
            )}
            {isReturnable && (
              <button className="action-btn return-btn" onClick={handleReturn}>
                <Heart size={20} />
                归还图书
              </button>
            )}
            <button className="action-btn doodle-btn" onClick={handleGoDoodle}>
              🎨 创作涂鸦
            </button>
          </div>
        </div>
      </div>
      
      <div className="drift-section">
        <h3 className="section-title">🗺️ 漂流路线图</h3>
        <div className="route-canvas-wrapper">
          <canvas
            ref={routeCanvasRef}
            className="route-canvas"
          />
        </div>
        <div className="drift-stats">
          <span>已漂流 {book.driftHistory.length} 个城市</span>
        </div>
      </div>
      
      <div className="gallery-section">
        <h3 className="section-title">🎨 创意涂鸦墙</h3>
        {book && <DoodleGallery bookId={book.id} />}
      </div>
    </div>
  )
}

export default BookDetail
