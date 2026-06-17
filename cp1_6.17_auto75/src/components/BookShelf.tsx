import { useState, useRef, useMemo } from 'react'
import { useBookStore } from '../store/bookStore'
import type { Book } from '../types'

const BOOKS_PER_SHELF = 12

export default function BookShelf() {
  const books = useBookStore((s) => s.books)
  const getFilteredBooks = useBookStore((s) => s.getFilteredBooks)
  const setSelectedBook = useBookStore((s) => s.setSelectedBook)
  const reorderBooks = useBookStore((s) => s.reorderBooks)
  const filteredBooks = getFilteredBooks()

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
  const dragBookRef = useRef<Book | null>(null)

  const shelves = useMemo(() => {
    const result: Book[][] = []
    for (let i = 0; i < filteredBooks.length; i += BOOKS_PER_SHELF) {
      result.push(filteredBooks.slice(i, i + BOOKS_PER_SHELF))
    }
    if (result.length === 0) result.push([])
    return result
  }, [filteredBooks])

  const handleDragStart = (e: React.DragEvent, book: Book, index: number) => {
    dragBookRef.current = book
    setDraggedIndex(index)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', book.id)
  }

  const handleDrag = (e: React.DragEvent) => {
    if (e.clientX && e.clientY) {
      setDragPosition({ x: e.clientX, y: e.clientY })
    }
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      reorderBooks(draggedIndex, targetIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
    setDragPosition(null)
    dragBookRef.current = null
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
    setDragPosition(null)
    dragBookRef.current = null
  }

  const handleBookClick = (book: Book) => {
    if (draggedIndex === null) {
      setSelectedBook(book)
    }
  }

  let globalIndex = 0

  return (
    <aside className="bookshelf-panel">
      <div className="bookshelf-header">📚 我的书架</div>
      <div className="shelf-container">
        {shelves.map((shelfBooks, shelfIdx) => (
          <div key={shelfIdx} className="shelf-row">
            {shelfBooks.map((book) => {
              const currentIndex = globalIndex++
              const isDragging = draggedIndex === currentIndex
              const isDragOver = dragOverIndex === currentIndex

              return (
                <div
                  key={book.id}
                  className={`book-spine ${book.status === 'borrowed' ? 'borrowed' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                  style={{
                    backgroundColor: book.spineColor,
                    width: book.spineWidth,
                    transition: isDragging ? 'none' : 'all 0.2s ease',
                  }}
                  draggable
                  onClick={() => handleBookClick(book)}
                  onDragStart={(e) => handleDragStart(e, book, currentIndex)}
                  onDrag={handleDrag}
                  onDragOver={(e) => handleDragOver(e, currentIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, currentIndex)}
                  onDragEnd={handleDragEnd}
                  title={`${book.title} - ${book.author}`}
                >
                  {book.title}
                </div>
              )
            })}
            {shelfBooks.length === 0 && (
              <div
                style={{
                  color: 'rgba(255,248,231,0.4)',
                  fontSize: 12,
                  padding: '0 12px',
                  alignSelf: 'center',
                  width: '100%',
                  textAlign: 'center',
                }}
              >
                {filteredBooks.length === 0 ? '暂无书籍，扫描ISBN添加吧' : '继续添加书籍'}
              </div>
            )}
          </div>
        ))}
      </div>

      {dragPosition && dragBookRef.current && (
        <div
          style={{
            position: 'fixed',
            left: dragPosition.x - dragOffset.x,
            top: dragPosition.y - dragOffset.y,
            pointerEvents: 'none',
            zIndex: 9999,
            opacity: 0.8,
          }}
        >
          <div
            className="book-spine"
            style={{
              backgroundColor: dragBookRef.current.spineColor,
              width: dragBookRef.current.spineWidth,
            }}
          >
            {dragBookRef.current.title}
          </div>
        </div>
      )}
    </aside>
  )
}
