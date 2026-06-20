import { useState, useRef } from 'react';
import { Plus, Upload, ChevronLeft, ChevronRight, BookOpen, X, Trash2 } from 'lucide-react';
import { useReadingStore } from '../stores/readingStore';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (book: { title: string; author: string; totalPages: number; coverColor: string }) => void;
}

const AddBookModal = ({ isOpen, onClose, onAdd }: AddBookModalProps) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [coverColor, setCoverColor] = useState('#E94560');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && totalPages) {
      onAdd({
        title,
        author,
        totalPages: parseInt(totalPages),
        coverColor,
      });
      setTitle('');
      setAuthor('');
      setTotalPages('');
      setCoverColor('#E94560');
      onClose();
    }
  };

  if (!isOpen) return null;

  const colorOptions = ['#E94560', '#4ECDC4', '#FFD93D', '#6C63FF', '#FF6B6B', '#45B7D1'];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-primary-dark/90 backdrop-blur-md rounded-2xl p-6 w-full max-w-md border border-accent/20 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">添加书籍</h3>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm mb-2">书名</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-primary-card border border-accent/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent transition-colors"
              placeholder="请输入书名"
              required
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-2">作者</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-primary-card border border-accent/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent transition-colors"
              placeholder="请输入作者"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-2">总页数</label>
            <input
              type="number"
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              className="w-full bg-primary-card border border-accent/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent transition-colors"
              placeholder="请输入总页数"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-2">封面颜色</label>
            <div className="flex gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCoverColor(color)}
                  className={`w-10 h-10 rounded-full transition-transform hover:scale-110 ${
                    coverColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-primary-dark scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-white font-medium py-3 rounded-lg transition-colors mt-6"
          >
            添加书籍
          </button>
        </form>
      </div>
    </div>
  );
};

export const BookPanel = () => {
  const {
    books,
    selectedBookId,
    isPanelCollapsed,
    selectBook,
    addBook,
    deleteBook,
    togglePanel,
    getBookProgress,
    importCSV,
  } = useReadingStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        importCSV(content);
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddBook = (bookData: { title: string; author: string; totalPages: number; coverColor: string }) => {
    addBook(bookData);
  };

  if (isPanelCollapsed) {
    return (
      <div className="relative">
        <button
          onClick={togglePanel}
          className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg absolute top-4 left-4 z-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[250px] bg-primary-dark rounded-lg p-4 h-full flex flex-col shrink-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="text-accent" size={24} />
          <h2 className="text-lg font-bold text-white">我的书架</h2>
        </div>
        <button
          onClick={togglePanel}
          className="w-8 h-8 rounded-full bg-primary-card text-text-secondary hover:text-white flex items-center justify-center hover:bg-accent/20 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white text-sm py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          添加
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 bg-primary-card hover:bg-primary-card/80 text-white text-sm py-2 rounded-lg border border-accent/30 transition-colors"
        >
          <Upload size={16} />
          导入
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileImport}
          className="hidden"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {books.length === 0 ? (
          <div className="text-center py-8 text-text-secondary text-sm">
            暂无书籍，点击上方添加
          </div>
        ) : (
          books.map((book) => {
            const progress = getBookProgress(book.id);
            const isSelected = selectedBookId === book.id;

            return (
              <div
                key={book.id}
                onClick={() => selectBook(book.id)}
                className={`relative h-20 bg-primary-card rounded-lg overflow-hidden cursor-pointer transition-all hover:bg-primary-card/80 ${
                  isSelected ? 'ring-2 ring-accent' : ''
                }`}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                  style={{ backgroundColor: book.coverColor }}
                />
                <div className="ml-3 p-3 flex flex-col justify-between h-full">
                  <div>
                    <h4 className="text-white text-sm font-medium truncate">{book.title}</h4>
                    <p className="text-text-secondary text-xs truncate">{book.author}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-primary-dark rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%`, backgroundColor: book.coverColor }}
                      />
                    </div>
                    <span className="text-text-secondary text-xs min-w-[36px] text-right">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBook(book.id);
                  }}
                  className="absolute top-2 right-2 p-1 text-text-secondary hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <AddBookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddBook}
      />
    </div>
  );
};
