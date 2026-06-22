import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Play, Pause, Square, ChevronRight, BookOpen, Sparkles } from 'lucide-react'
import type { Book } from '@/types'

export default function ReadingTimer() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const bookId = searchParams.get('bookId')

  const [book, setBook] = useState<Book | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [pagesRead, setPagesRead] = useState(0)
  const [showCongrats, setShowCongrats] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchBooks = useCallback(async () => {
    const res = await fetch('/api/user/books')
    const data: Book[] = await res.json()
    setBooks(data)
    if (bookId) {
      const found = data.find((b) => b.id === bookId)
      if (found) setBook(found)
    }
  }, [bookId])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 0.5)
      }, 500)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  const handlePageTurn = () => {
    if (!book) return
    setPagesRead((prev) => prev + 1)
  }

  const handleStop = async () => {
    if (!book || (elapsed === 0 && pagesRead === 0)) {
      setIsRunning(false)
      return
    }

    setIsRunning(false)

    await fetch('/api/user/readings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookId: book.id,
        duration: Math.round(elapsed),
        pagesRead,
      }),
    })

    await fetchBooks()

    const updatedBooks = await fetch('/api/user/books').then((r) => r.json())
    const updated = updatedBooks.find((b: Book) => b.id === book.id)
    if (updated) setBook(updated)

    if (updated && updated.status === 'finished') {
      setIsFinished(true)
    }

    setShowCongrats(true)
    setTimeout(() => {
      setShowCongrats(false)
      setIsFinished(false)
      setElapsed(0)
      setPagesRead(0)
    }, 3000)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const selectBook = (b: Book) => {
    setBook(b)
    setElapsed(0)
    setPagesRead(0)
    setIsRunning(false)
  }

  const currentPct = book
    ? Math.min(100, Math.round(((book.currentPage + pagesRead) / book.totalPages) * 100))
    : 0

  if (!book) {
    return (
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">选择书籍开始阅读</h1>
        {books.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-300">
            <BookOpen size={48} />
            <p className="mt-3 text-sm">暂无书籍，请先去书架添加</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {books.map((b) => (
              <button
                key={b.id}
                onClick={() => selectBook(b)}
                className="rounded-xl p-3 bg-white shadow-[0_2px_8px_rgba(74,144,217,0.1)]
                  hover:shadow-[0_4px_16px_rgba(74,144,217,0.2)] hover:-translate-y-0.5
                  transition-all duration-200 text-left"
              >
                <div
                  className="h-20 rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: b.coverColor + '33' }}
                >
                  <BookOpen size={24} style={{ color: b.coverColor }} />
                </div>
                <p className="text-sm font-semibold text-gray-700 truncate">{b.title}</p>
                <p className="text-xs text-gray-400 truncate">{b.author}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setBook(null)}
          className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
        >
          ← 选择书籍
        </button>
      </div>

      <div className="max-w-sm mx-auto">
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(74,144,217,0.12)] p-6">
          <div className="text-center mb-6">
            <div
              className="w-16 h-20 mx-auto rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: book.coverColor + '22' }}
            >
              <BookOpen size={28} style={{ color: book.coverColor }} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">{book.title}</h2>
            <p className="text-sm text-gray-400">{book.author}</p>
          </div>

          <div className="text-center mb-6">
            <div className="text-5xl font-mono font-bold text-gray-800 tracking-wider">
              {formatTime(elapsed)}
            </div>
            <p className="text-xs text-gray-400 mt-1">阅读时长</p>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>{book.currentPage + pagesRead}/{book.totalPages} 页</span>
              <span>{currentPct}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${currentPct}%`,
                  background: `linear-gradient(90deg, ${book.coverColor}88, ${book.coverColor})`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="text-center px-4 py-2 bg-blue-50 rounded-xl">
              <div className="text-lg font-bold text-blue-600">{pagesRead}</div>
              <div className="text-[10px] text-blue-400">本次翻页</div>
            </div>
            <div className="text-center px-4 py-2 bg-blue-50 rounded-xl">
              <div className="text-lg font-bold text-blue-600">{pagesRead * 300}</div>
              <div className="text-[10px] text-blue-400">约读字数</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium
                bg-gradient-to-r from-blue-500 to-blue-400 shadow-md
                hover:scale-105 active:scale-95 transition-transform duration-200"
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
              {isRunning ? '暂停' : '开始'}
            </button>
            <button
              onClick={handlePageTurn}
              disabled={!isRunning}
              className="w-14 flex items-center justify-center py-3 rounded-xl
                bg-blue-50 text-blue-500 font-medium
                hover:bg-blue-100 active:scale-95 transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={22} />
            </button>
            <button
              onClick={handleStop}
              className="w-14 flex items-center justify-center py-3 rounded-xl
                bg-red-50 text-red-400 font-medium
                hover:bg-red-100 active:scale-95 transition-all duration-200"
            >
              <Square size={18} />
            </button>
          </div>
        </div>
      </div>

      {showCongrats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center animate-scale-in max-w-xs">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {isFinished ? '🎉 恭喜读完！' : '👏 干得漂亮！'}
            </h3>
            <p className="text-sm text-gray-500">
              {isFinished
                ? `你读完了「${book.title}」！`
                : `本次阅读 ${formatTime(elapsed)}，翻页 ${pagesRead} 页`}
            </p>
            <button
              onClick={() => { setShowCongrats(false); setIsFinished(false); setElapsed(0); setPagesRead(0) }}
              className="mt-4 px-6 py-2 rounded-lg text-white text-sm font-medium
                bg-gradient-to-r from-blue-500 to-blue-400 hover:scale-105 transition-transform"
            >
              好的
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
