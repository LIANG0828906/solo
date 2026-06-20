import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { drawBookCover, getStatusInfo } from '../utils/bookCover'
import type { Book } from '../types'
import './BookList.css'

const CARD_WIDTH = 200
const CARD_HEIGHT = 280
const CARD_GAP = 24
const VISIBLE_COUNT = 10
const BUFFER_COUNT = 4

function BookCard({ book, index }: { book: Book; index: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const navigate = useNavigate()
  const statusInfo = getStatusInfo(book.status)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const dpr = window.devicePixelRatio || 1
    canvas.width = CARD_WIDTH * dpr
    canvas.height = CARD_HEIGHT * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = `${CARD_WIDTH}px`
    canvas.style.height = `${CARD_HEIGHT}px`
    
    drawBookCover(ctx, CARD_WIDTH, CARD_HEIGHT, book)
  }, [book])
  
  const handleClick = () => {
    navigate(`/book/${book.id}`)
  }
  
  return (
    <div
      className="book-card"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        top: Math.floor(index / 4) * (CARD_HEIGHT + CARD_GAP),
        left: (index % 4) * (CARD_WIDTH + CARD_GAP),
      }}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        className="book-cover-canvas"
      />
      <div
        className="status-tag"
        style={{
          backgroundColor: statusInfo.bgColor,
          color: statusInfo.color,
          boxShadow: `0 0 12px ${statusInfo.color}50`,
        }}
      >
        {statusInfo.label}
      </div>
      <div className="book-card-info">
        <div className="book-card-title">{book.title}</div>
        <div className="book-card-author">{book.author}</div>
      </div>
    </div>
  )
}

export function BookList() {
  const books = useAppStore(state => state.books)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  
  const totalCols = 4
  const totalRows = Math.ceil(books.length / totalCols)
  const totalHeight = totalRows * (CARD_HEIGHT + CARD_GAP) - CARD_GAP
  
  const visibleStartRow = Math.max(0, Math.floor(scrollTop / (CARD_HEIGHT + CARD_GAP)) - BUFFER_COUNT
  const visibleEndRow = visibleStartRow + Math.ceil(containerHeight / (CARD_HEIGHT + CARD_GAP)) + BUFFER_COUNT * 2
  
  const startIndex = Math.max(0, visibleStartRow * totalCols)
  const endIndex = Math.min(books.length, visibleEndRow * totalCols)
  
  const visibleBooks = books.slice(startIndex, endIndex)
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])
  
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    
    setContainerHeight(container.clientHeight)
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })
    
    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [])
  
  return (
    <div className="book-list-page">
      <div className="page-header">
        <h1 className="page-title">📚 童书漂流站</h1>
        <p className="page-subtitle">共 {books.length} 本好书等你来发现</p>
      </div>
      
      <div
        ref={scrollRef}
        className="book-list-container"
        onScroll={handleScroll}
      >
        <div
          className="book-list-content"
          style={{ height: totalHeight }}
        >
          {visibleBooks.map((book, i) => (
            <BookCard
              key={book.id}
              book={book}
              index={startIndex + i}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default BookList
