import { useBookStore } from './store'
import BookShelf from './BookShelf'
import BookDetail from './BookDetail'
import DonateForm from './DonateForm'
import { AnimatePresence } from 'framer-motion'

function App() {
  const {
    selectedBookId,
    showDonateForm,
    books,
    toggleDonateForm,
    setSelectedBook,
  } = useBookStore()

  const selectedBook = books.find((book) => book.id === selectedBookId) || null

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">漂流书架</h1>
        <p className="app-subtitle">让好书在流转中遇见更多知音</p>
      </header>

      <div className="donate-btn-wrapper">
        <button
          className="donate-btn"
          onClick={toggleDonateForm}
          aria-label="捐赠书籍"
        >
          +
        </button>
      </div>

      <div className="bookshelf-container">
        <BookShelf />
      </div>

      <AnimatePresence>
        {selectedBook && (
          <BookDetail
            book={selectedBook}
            onClose={() => setSelectedBook(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDonateForm && <DonateForm />}
      </AnimatePresence>
    </div>
  )
}

export default App
