import { useEffect, useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import BookShelf from './components/BookShelf';
import StatsPanel from './components/StatsPanel';
import WeeklyReportPage from './components/WeeklyReport';
import { api, type Book } from './api';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [newestId, setNewestId] = useState<string | null>(null);

  const fetchBooks = useCallback(() => {
    const beforeIds = new Set(books.map((b) => b.id));
    api.getBooks().then((list) => {
      setBooks(list);
      const added = list.find((b) => !beforeIds.has(b.id));
      if (added) setNewestId(added.id);
    });
  }, [books]);

  useEffect(() => {
    api.getBooks().then(setBooks);
  }, []);

  const clearNewest = () => setNewestId(null);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="app-container">
            <BookShelf
              books={books}
              onBooksChanged={fetchBooks}
              newestId={newestId}
              onClearNewest={clearNewest}
            />
            <StatsPanel />
          </div>
        }
      />
      <Route path="/weekly-report" element={<WeeklyReportPage />} />
      <Route path="*" element={<WeeklyReportPage />} />
    </Routes>
  );
}
