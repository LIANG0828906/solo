import { useState, useCallback, useMemo } from 'react'
import { Book, SearchFilter as SearchFilterType } from '@shared/types'
import axios from 'axios'
import Navbar from '@/components/Navbar'
import SearchFilter from '@/components/SearchFilter'
import BookPublishForm from '@/components/BookPublishForm'
import BookCard from '@/components/BookCard'
import ConfirmModal from '@/components/ConfirmModal'
import { BookOpen } from 'lucide-react'

interface HomeProps {
  books: Book[]
  onBooksChange: (books: Book[]) => void
  currentUserId: string
}

export default function Home({ books, onBooksChange, currentUserId }: HomeProps) {
  const [filters, setFilters] = useState<SearchFilterType>({
    keyword: '',
    searchBy: 'all',
    status: 'all'
  })
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const suggestions = useMemo(() => {
    const titles = [...new Set(books.map(b => b.title))]
    const authors = [...new Set(books.map(b => b.author))]
    return [...titles, ...authors]
  }, [books])

  const handleFilterChange = useCallback((newFilters: SearchFilterType) => {
    setFilters(newFilters)
  }, [])

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      if (filters.status !== 'all' && book.status !== filters.status) {
        return false
      }

      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase()
        const searchFields: string[] = []

        if (filters.searchBy === 'title' || filters.searchBy === 'all') {
          searchFields.push(book.title.toLowerCase())
        }
        if (filters.searchBy === 'author' || filters.searchBy === 'all') {
          searchFields.push(book.author.toLowerCase())
        }

        return searchFields.some(field => field.includes(keyword))
      }

      return true
    })
  }, [books, filters])

  const handlePublish = async (bookData: Omit<Book, 'id' | 'createdAt'>) => {
    try {
      const response = await axios.post('/api/books', bookData)
      onBooksChange([response.data, ...books])
    } catch (error) {
      console.error('Failed to publish book:', error)
    }
  }

  const handleBorrow = (bookId: string) => {
    const book = books.find(b => b.id === bookId)
    if (book) {
      setSelectedBook(book)
      setIsModalOpen(true)
    }
  }

  const handleConfirmBorrow = async () => {
    if (!selectedBook) return

    try {
      await axios.post('/api/loans', {
        bookId: selectedBook.id,
        borrowerId: currentUserId,
        lenderId: selectedBook.ownerId
      })

      const updatedBooks = books.map(b =>
        b.id === selectedBook.id ? { ...b, status: 'pending' as const } : b
      )
      onBooksChange(updatedBooks)
      setIsModalOpen(false)
      setSelectedBook(null)
    } catch (error) {
      console.error('Failed to borrow book:', error)
    }
  }

  const handleSearch = (keyword: string) => {
    setFilters(prev => ({ ...prev, keyword }))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onSearch={handleSearch} currentUserId={currentUserId} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookPublishForm onPublish={handlePublish} currentUserId={currentUserId} />

        <SearchFilter
          onFilterChange={handleFilterChange}
          suggestions={suggestions}
        />

        {filteredBooks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm animate-fade-in-up">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">暂无图书</h3>
            <p className="text-slate-400">
              {filters.keyword || filters.status !== 'all'
                ? '没有找到符合条件的图书，请尝试调整筛选条件'
                : '快来发布第一本图书吧！'}
            </p>
          </div>
        ) : (
          <div className="bookshelf-grid">
            {filteredBooks.map((book, index) => (
              <div
                key={book.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-fade-in-up opacity-0"
              >
                <BookCard
                  book={book}
                  onBorrow={handleBorrow}
                  disabled={book.ownerId === currentUserId}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedBook(null)
        }}
        onConfirm={handleConfirmBorrow}
        book={selectedBook}
      />
    </div>
  )
}
