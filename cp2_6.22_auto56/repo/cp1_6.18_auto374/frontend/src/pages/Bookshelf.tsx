import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import EmptyState from '@/components/EmptyState';
import { booksAPI } from '@/services/api';
import type { Book } from '@/types';

const mockBooks: Book[] = [
  {
    id: '1',
    title: '活着',
    author: '余华',
    cover: 'https://picsum.photos/seed/book1/200/280',
    description: '讲述了农村人福贵悲惨的人生遭遇。',
    progress: 65,
    currentPage: 195,
    totalPages: 300,
    addedAt: '2024-01-15',
    userId: '1',
  },
  {
    id: '2',
    title: '三体',
    author: '刘慈欣',
    cover: 'https://picsum.photos/seed/book2/200/280',
    description: '地球文明向宇宙发出的第一声啼鸣。',
    progress: 30,
    currentPage: 120,
    totalPages: 400,
    addedAt: '2024-02-20',
    userId: '1',
  },
  {
    id: '3',
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    cover: 'https://picsum.photos/seed/book3/200/280',
    description: '布恩迪亚家族七代人的传奇故事。',
    progress: 100,
    currentPage: 360,
    totalPages: 360,
    addedAt: '2024-01-10',
    userId: '1',
  },
];

function Bookshelf() {
  const [books, setBooks] = useState<Book[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState<'isbn' | 'manual'>('manual');
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getBooks();
      setBooks(response.books);
    } catch (error) {
      console.error('Failed to load books:', error);
      setBooks(mockBooks);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bookData = addMode === 'isbn'
        ? { isbn }
        : { title, author, description };

      const response = await booksAPI.addBook(bookData);
      setBooks([...books, response.book]);
      resetForm();
    } catch (error) {
      const newBook: Book = {
        id: uuidv4(),
        title: title || '新书',
        author: author || '未知作者',
        description,
        cover: `https://picsum.photos/seed/${uuidv4()}/200/280`,
        progress: 0,
        currentPage: 0,
        totalPages: 300,
        addedAt: new Date().toISOString().split('T')[0],
        userId: '1',
      };
      setBooks([...books, newBook]);
      resetForm();
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setIsbn('');
    setTitle('');
    setAuthor('');
    setDescription('');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-nord-textDark">我的书架</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-5 py-2.5 bg-nord-accent hover:bg-[#5E81AC] text-white rounded-lg font-medium
            transition-all duration-300 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加书籍
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-nord-textDark">添加书籍</h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setAddMode('isbn')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                  ${addMode === 'isbn' ? 'bg-nord-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                ISBN添加
              </button>
              <button
                onClick={() => setAddMode('manual')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                  ${addMode === 'manual' ? 'bg-nord-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                手动填写
              </button>
            </div>

            <form onSubmit={handleAddBook} className="space-y-4">
              {addMode === 'isbn' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ISBN号
                  </label>
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 transition-all duration-200"
                    placeholder="请输入ISBN号"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      书名
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 transition-all duration-200"
                      placeholder="请输入书名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      作者
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 transition-all duration-200"
                      placeholder="请输入作者"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      简介
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 transition-all duration-200 resize-none"
                      placeholder="请输入书籍简介"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-nord-accent hover:bg-[#5E81AC] text-white rounded-lg font-medium transition-all"
                >
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500">加载中...</div>
      ) : books.length === 0 ? (
        <EmptyState message="书架空空如也，快去添加吧" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              onClick={() => navigate(`/books/${book.id}`)}
              className="w-[220px] mx-auto bg-[#F8F9FA] rounded-xl shadow-md cursor-pointer
                transition-all duration-300 ease hover:-translate-y-1 hover:shadow-xl overflow-hidden"
            >
              <div className="aspect-[3/4] bg-gray-200 overflow-hidden">
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-nord-textDark truncate mb-1">
                  {book.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{book.author}</p>
                <div className="relative">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-nord-progress rounded-full transition-all duration-300"
                      style={{ width: `${book.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {book.progress}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Bookshelf;
