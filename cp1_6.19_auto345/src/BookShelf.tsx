import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBookStore, Book } from './store'

const BOOKS_PER_SHELF = 5

interface BookSpineProps {
  book: Book
  index: number
}

function BookSpine({ book, index }: BookSpineProps) {
  const { setHoveredBook, setSelectedBook, hoveredBookId, clearNewFlag } = useBookStore()
  const isHovered = hoveredBookId === book.id
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (book.isNew && !hasAnimated.current) {
      const timer = setTimeout(() => {
        clearNewFlag(book.id)
        hasAnimated.current = true
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [book.isNew, book.id, clearNewFlag])

  const handleMouseEnter = () => {
    setHoveredBook(book.id)
  }

  const handleMouseLeave = () => {
    setHoveredBook(null)
  }

  const handleClick = () => {
    setSelectedBook(book.id)
  }

  return (
    <motion.div
      className="book-spine-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      initial={book.isNew ? { x: 100, opacity: 0 } : false}
      animate={{ x: 0, opacity: 1 }}
      transition={{
        duration: 0.3,
        ease: 'easeOut',
        delay: index * 0.05,
      }}
      whileHover={{
        y: -20,
        rotateZ: -10,
        transition: { duration: 0.5, ease: 'easeOut' },
      }}
      style={{ zIndex: isHovered ? 10 : 1 }}
    >
      <div
        className={`book-spine ${book.status}`}
        style={{ backgroundColor: book.color }}
      >
        <span className="book-spine-title">{book.title}</span>
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            className={`book-tooltip visible`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="tooltip-title">{book.title}</div>
            <div className="tooltip-donor">捐赠者：{book.donor}</div>
            <div className={`tooltip-status ${book.status}`}>
              {book.status === 'available' ? '可借' : '借出中'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function BookShelf() {
  const { books } = useBookStore()

  const shelves: Book[][] = []
  for (let i = 0; i < 3; i++) {
    const start = i * BOOKS_PER_SHELF
    const end = start + BOOKS_PER_SHELF
    shelves.push(books.slice(start, end))
  }

  return (
    <div className="bookshelf">
      {shelves.map((shelfBooks, shelfIndex) => (
        <div key={shelfIndex} className="shelf-row">
          {shelfBooks.map((book, bookIndex) => (
            <BookSpine
              key={book.id}
              book={book}
              index={shelfIndex * BOOKS_PER_SHELF + bookIndex}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default BookShelf
