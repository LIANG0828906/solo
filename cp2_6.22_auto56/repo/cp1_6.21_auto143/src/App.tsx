import { useState, useEffect } from 'react';
import BookShelf from './components/BookShelf';
import CardFlow from './components/CardFlow';
import TagChart from './components/TagChart';
import { bookApi, Book, Excerpt, TagFrequency } from './utils/api';

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [excerpts, setExcerpts] = useState<Excerpt[]>([]);
  const [tagFrequencies, setTagFrequencies] = useState<TagFrequency[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    const book = books.find(b => b.id === selectedBookId);
    setSelectedBook(book || null);
  }, [selectedBookId, books]);

  async function loadBooks() {
    try {
      const response = await bookApi.getAll();
      if (response.success && response.data) {
        setBooks(response.data);
        if (response.data.length > 0) {
          setSelectedBookId(response.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load books:', error);
    }
  }

  async function handleBookSelect(bookId: string) {
    setSelectedBookId(bookId);
    setSelectedTag(null);
  }

  async function handleTagSelect(tag: string | null) {
    setSelectedTag(tag);
  }

  const filteredExcerpts = selectedTag
    ? excerpts.filter(e => e.tags.includes(selectedTag))
    : excerpts;

  return (
    <div style={styles.appContainer}>
      <div style={styles.sidebar}>
        <div style={styles.logoSection}>
          <h1 style={styles.logo}>📚 书虫脉动</h1>
          <p style={styles.logoSubtitle}>阅读知识管理助手</p>
        </div>

        <BookShelf
          books={books}
          selectedBookId={selectedBookId}
          onSelect={handleBookSelect}
        />

        {selectedBookId && (
          <TagChart
            bookId={selectedBookId}
            tagFrequencies={tagFrequencies}
            setTagFrequencies={setTagFrequencies}
            selectedTag={selectedTag}
            onTagSelect={handleTagSelect}
          />
        )}
      </div>

      <div style={styles.mainContent}>
        {selectedBook ? (
          <CardFlow
            bookId={selectedBook.id}
            bookTitle={selectedBook.title}
            excerpts={excerpts}
            setExcerpts={setExcerpts}
            filteredExcerpts={filteredExcerpts}
            selectedTag={selectedTag}
            loading={loading}
            setLoading={setLoading}
          />
        ) : (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>请从左侧选择一本书开始</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    minWidth: '900px',
  },
  sidebar: {
    width: '280px',
    backgroundColor: '#F1F5F9',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  logoSection: {
    padding: '24px 20px',
    borderBottom: '1px solid #E2E8F0',
  },
  logo: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#1E293B',
  },
  logoSubtitle: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: '#64748B',
  },
  mainContent: {
    flex: 1,
    background: 'linear-gradient(180deg, #FAFAFA 0%, #F3F4F6 100%)',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: '16px',
    color: '#94A3B8',
  },
};

export default App;
