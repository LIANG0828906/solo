import { useState, useEffect } from 'react';
import { useStore } from '@/store/index';
import BookReview from '@/components/BookReview';

export default function ReviewsPage() {
  const { books, fetchRecommendations } = useStore();
  const [selectedBookId, setSelectedBookId] = useState<string>('');

  useEffect(() => {
    if (books.length === 0) fetchRecommendations();
  }, [books.length, fetchRecommendations]);

  useEffect(() => {
    if (books.length > 0 && !selectedBookId) {
      setSelectedBookId(books[0].id);
    }
  }, [books, selectedBookId]);

  return (
    <div className="container mx-auto px-4 pt-20 pb-8">
      <h1 className="mb-6 font-serif text-2xl font-bold text-text">书评</h1>

      <div className="mb-6">
        <select
          value={selectedBookId}
          onChange={(e) => setSelectedBookId(e.target.value)}
          className="rounded-lg border border-cream-dark bg-white px-4 py-2.5 text-sm text-text outline-none transition-colors focus:border-orange"
        >
          {books.map((book) => (
            <option key={book.id} value={book.id}>
              {book.title}
            </option>
          ))}
        </select>
      </div>

      {selectedBookId && <BookReview bookId={selectedBookId} />}
    </div>
  );
}
