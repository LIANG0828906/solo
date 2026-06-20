import React, { useEffect, useRef, useMemo } from 'react'
import { Book, useBookStore } from '../stores/bookStore'
import BookCard from './BookCard'

interface ExploreModeProps {
  books: Book[]
  onCardClick: (book: Book) => void
}

const ExploreMode: React.FC<ExploreModeProps> = ({ books, onCardClick }) => {
  const blinkingBookId = useBookStore(state => state.blinkingBookId)
  const setBlinkingBook = useBookStore(state => state.setBlinkingBook)

  const rafRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)
  const interval = 5000

  const columns = 3

  const columnHeights = useRef<number[]>(Array(columns).fill(0))

  const positionedBooks = useMemo(() => {
    columnHeights.current = Array(columns).fill(0)
    const cardWidth = 260
    const gap = 20

    return books.map((book) => {
      const colIndex = columnHeights.current.indexOf(Math.min(...columnHeights.current))
      const top = columnHeights.current[colIndex]
      const left = colIndex * (cardWidth + gap)
      const height = 320 + (book.review.length > 40 ? 20 : 0) + (book.messages.length > 0 ? 24 : 0)

      columnHeights.current[colIndex] = top + height + gap

      return {
        book,
        style: {
          position: 'absolute' as const,
          top,
          left,
          width: cardWidth
        }
      }
    })
  }, [books])

  const containerWidth = columns * 260 + (columns - 1) * 20
  const containerHeight = Math.max(...columnHeights.current)

  useEffect(() => {
    if (books.length === 0) return

    const tick = (time: number) => {
      if (time - lastTimeRef.current >= interval) {
        lastTimeRef.current = time
        const randomIndex = Math.floor(Math.random() * books.length)
        const randomBook = books[randomIndex]
        setBlinkingBook(randomBook.id)

        setTimeout(() => {
          setBlinkingBook(null)
        }, 500)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame((time) => {
      lastTimeRef.current = time
      tick(time)
    })

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [books, setBlinkingBook])

  return (
    <div style={{ width: '100%', overflowX: 'auto', padding: '20px 0' }}>
      <div
        style={{
          position: 'relative',
          width: containerWidth,
          height: containerHeight,
          margin: '0 auto',
          minWidth: '100%'
        }}
      >
        {positionedBooks.map(({ book, style }) => (
          <BookCard
            key={book.id}
            book={book}
            onClick={() => onCardClick(book)}
            isBlinking={blinkingBookId === book.id}
            style={style}
          />
        ))}
      </div>
    </div>
  )
}

export default ExploreMode
