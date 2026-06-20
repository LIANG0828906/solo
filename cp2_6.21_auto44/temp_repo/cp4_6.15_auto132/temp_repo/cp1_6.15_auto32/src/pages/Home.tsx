import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import BookCard from '../BookCard';
import BookDetail from '../BookDetail';
import { api, type Book } from '../api';

const Home: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const result = await api.getBooks(1, 50);
        setBooks(result.books);
      } catch (error) {
        console.error('Failed to fetch books:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleFavorite = async (bookId: string) => {
    try {
      const result = await api.toggleFavorite(bookId);
      setFavorites(result.favorites);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="text-center mb-8 sm:mb-12 fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-warmOrange/10 text-warmOrangeDark rounded-full text-sm font-medium mb-4">
          <Sparkles size={16} />
          新学期开始啦，快来淘好课本
        </div>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl text-[#3D2B1F] mb-3">
          书换书 · 校园课本交换
        </h1>
        <p className="text-woodDark text-base sm:text-lg max-w-xl mx-auto">
          让闲置的课本流动起来，省钱又环保，还能认识同专业的小伙伴
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8 fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-wood" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索课本名称、作者或课程编号..."
            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border-2 border-wood/10 shadow-soft focus:border-warmOrange/40 focus:ring-4 focus:ring-warmOrange/10 outline-none transition-all text-[#3D2B1F]"
          />
        </div>
        <button className="btn-press flex items-center justify-center gap-2 px-6 py-3.5 bg-white border-2 border-wood/10 text-[#3D2B1F]/80 rounded-2xl shadow-soft hover:bg-creamDark transition-colors font-medium">
          <SlidersHorizontal size={18} />
          筛选
        </button>
      </div>

      {loading ? (
        <div className="masonry">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="masonry-item">
              <div className="bg-white rounded-2xl overflow-hidden shadow-soft animate-pulse">
                <div className="aspect-[4/3] bg-creamDark" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-creamDark rounded w-3/4" />
                  <div className="h-4 bg-creamDark rounded w-1/2" />
                  <div className="h-4 bg-creamDark rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="masonry">
          {filteredBooks.map((book, idx) => (
            <BookCard
              key={book.id}
              book={book}
              index={idx}
              onClick={() => setSelectedBookId(book.id)}
              isFavorite={favorites.includes(book.id)}
              onToggleFavorite={() => handleToggleFavorite(book.id)}
            />
          ))}
        </div>
      )}

      {filteredBooks.length === 0 && !loading && (
        <div className="text-center py-20">
          <p className="text-woodDark text-lg">没有找到匹配的课本</p>
        </div>
      )}

      {selectedBookId && (
        <BookDetail bookId={selectedBookId} onClose={() => setSelectedBookId(null)} />
      )}
    </div>
  );
};

export default Home;
