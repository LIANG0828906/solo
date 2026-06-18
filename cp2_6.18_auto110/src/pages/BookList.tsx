import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Clock } from 'lucide-react';
import { apiService } from '@/api/apiService';
import { BookCard } from '@/components/BookCard';
import type { Book, PriceRange, Category } from '@/types';
import { PRICE_RANGES, CATEGORIES } from '@/types';
import {
  getSearchHistory,
  addToSearchHistory,
  clearSearchHistory,
  debounce,
  createRipple,
} from '@/utils/helpers';

export const BookList = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const data = await apiService.getBooks();
        setBooks(data);
      } catch (error) {
        console.error('Failed to fetch books:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const matchesSearch =
          book.title.toLowerCase().includes(keyword) ||
          book.author.toLowerCase().includes(keyword);
        if (!matchesSearch) return false;
      }

      if (selectedPriceRange) {
        const { min, max } = selectedPriceRange;
        if (max !== null && (book.price < min || book.price >= max)) return false;
        if (max === null && book.price < min) return false;
      }

      if (selectedCategory && book.category !== selectedCategory.value) {
        return false;
      }

      return true;
    });
  }, [books, searchKeyword, selectedPriceRange, selectedCategory]);

  const handleSearch = debounce((keyword: string) => {
    setSearchKeyword(keyword);
    if (keyword.trim()) {
      addToSearchHistory(keyword.trim());
      setSearchHistory(getSearchHistory());
    }
    setShowHistory(false);
  }, 300);

  const handleHistoryClick = (keyword: string) => {
    setSearchKeyword(keyword);
    searchInputRef.current?.value && (searchInputRef.current.value = keyword);
    setShowHistory(false);
  };

  const clearSearch = () => {
    setSearchKeyword('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    searchInputRef.current?.focus();
  };

  const handlePriceRangeClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    range: PriceRange | null
  ) => {
    createRipple(e);
    setSelectedPriceRange(selectedPriceRange?.label === range?.label ? null : range);
  };

  const handleCategoryClick = (category: Category | null) => {
    setSelectedCategory(selectedCategory?.value === category?.value ? null : category);
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜索书名或作者"
              className="w-full pl-12 pr-10 py-3 rounded-full bg-[#F9FAFB] border border-transparent focus:border-primary focus:bg-white transition-all duration-200 outline-none"
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            />
            {searchKeyword && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors duration-200"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {showHistory && searchHistory.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 z-40 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  搜索历史
                </span>
                <button
                  onClick={() => {
                    clearSearchHistory();
                    setSearchHistory([]);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  清空
                </button>
              </div>
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(item)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">价格：</span>
            {PRICE_RANGES.map((range) => (
              <button
                key={range.label}
                onClick={(e) => handlePriceRangeClick(e, range)}
                className={`px-4 py-2 rounded text-sm font-medium transition-all duration-200 ${
                  selectedPriceRange?.label === range.label
                    ? 'bg-[#3B82F6] text-white'
                    : 'bg-[#F3F4F6] text-[#374151] hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
            {selectedPriceRange && (
              <button
                onClick={(e) => handlePriceRangeClick(e, null)}
                className="text-sm text-gray-500 hover:text-gray-700 ml-2"
              >
                取消筛选
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm text-gray-600">分类：</span>
            {CATEGORIES.map((category) => (
              <button
                key={category.value}
                onClick={() => handleCategoryClick(category)}
                className={`pb-1 text-sm font-medium transition-all duration-200 border-b-2 ${
                  selectedCategory?.value === category.value
                    ? 'border-accent text-primary'
                    : 'border-transparent text-gray-600 hover:text-primary'
                }`}
              >
                {category.label}
              </button>
            ))}
            {selectedCategory && (
              <button
                onClick={() => handleCategoryClick(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                取消筛选
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-full md:w-[240px] h-[360px] bg-white rounded-card shadow-card animate-pulse"
            />
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">暂无符合条件的图书</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
          {filteredBooks.map((book, index) => (
            <BookCard key={book.id} book={book} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};
