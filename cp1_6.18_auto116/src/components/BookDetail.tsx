import { useState } from 'react';
import { BookOpen, Clock, FileText, Plus } from 'lucide-react';
import { useReadingStore } from '../stores/readingStore';

export const BookDetail = ({ onAddSession }: { onAddSession?: () => void }) => {
  const { books, selectedBookId, addSession, getBookProgress } = useReadingStore();
  const selectedBook = books.find((b) => b.id === selectedBookId);

  const [date, setDate] = useState('');
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [duration, setDuration] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBookId && date && startPage && endPage && duration) {
      addSession({
        bookId: selectedBookId,
        date,
        startPage: parseInt(startPage),
        endPage: parseInt(endPage),
        duration: parseInt(duration),
      });
      setDate('');
      setStartPage('');
      setEndPage('');
      setDuration('');
      onAddSession?.();
    }
  };

  if (!selectedBook) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-secondary">
        <div className="text-center">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p>请从左侧选择一本书籍</p>
        </div>
      </div>
    );
  }

  const progress = getBookProgress(selectedBook.id);
  const sortedSessions = [...selectedBook.sessions].sort((a, b) => b.date.localeCompare(a.date));
  const totalRead = Math.max(...selectedBook.sessions.map((s) => s.endPage), 0);
  const totalTime = selectedBook.sessions.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      <div className="bg-primary-card rounded-lg p-6 animate-fade-in">
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-20 rounded-lg flex items-center justify-center text-white text-2xl font-bold shrink-0"
            style={{ backgroundColor: selectedBook.coverColor }}
          >
            {selectedBook.title.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white mb-1 truncate">{selectedBook.title}</h2>
            <p className="text-text-secondary text-sm mb-3">{selectedBook.author}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <FileText size={14} className="text-accent" />
                <span>{totalRead} / {selectedBook.totalPages} 页</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Clock size={14} className="text-accent-teal" />
                <span>{totalTime} 分钟</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-text-secondary mb-1">
                <span>阅读进度</span>
                <span className="text-accent font-medium">{progress.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-primary-dark rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: selectedBook.coverColor }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="backdrop-blur-md rounded-xl p-5 border border-accent/30"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      >
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Plus size={18} className="text-accent" />
          添加阅读会话
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-text-secondary text-xs mb-1.5">日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-primary-card/80 border border-accent/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-text-secondary text-xs mb-1.5">起始页</label>
            <input
              type="number"
              value={startPage}
              onChange={(e) => setStartPage(e.target.value)}
              className="w-full bg-primary-card/80 border border-accent/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="起始页"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-text-secondary text-xs mb-1.5">结束页</label>
            <input
              type="number"
              value={endPage}
              onChange={(e) => setEndPage(e.target.value)}
              className="w-full bg-primary-card/80 border border-accent/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="结束页"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-text-secondary text-xs mb-1.5">时长(分钟)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-primary-card/80 border border-accent/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="分钟"
              min="1"
              required
            />
          </div>
          <div className="col-span-2 md:col-span-4">
            <button
              type="submit"
              className="w-full md:w-auto px-8 bg-accent hover:bg-accent/90 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              记录阅读
            </button>
          </div>
        </form>
      </div>

      <div className="flex-1 bg-primary-card rounded-lg p-4 overflow-hidden flex flex-col min-h-0">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-accent-teal" />
          阅读记录
        </h3>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {sortedSessions.length === 0 ? (
            <p className="text-text-secondary text-sm text-center py-8">暂无阅读记录</p>
          ) : (
            sortedSessions.map((session) => (
              <div
                key={session.id}
                className="bg-primary-dark/50 rounded-lg p-3 flex items-center justify-between hover:bg-primary-dark/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-1 h-8 rounded-full"
                    style={{ backgroundColor: selectedBook.coverColor }}
                  />
                  <div>
                    <p className="text-white text-sm font-medium">{session.date}</p>
                    <p className="text-text-secondary text-xs">
                      第 {session.startPage} - {session.endPage} 页
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-accent font-semibold">{session.endPage - session.startPage} 页</p>
                  <p className="text-text-secondary text-xs">{session.duration} 分钟</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
