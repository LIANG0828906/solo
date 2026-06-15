import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, User, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useBookStore } from '@/stores/bookStore';
import { STATUS_LABELS, BookStatus } from '@/types';
import { cn } from '@/lib/utils';
import TimelineMap from '@/components/TimelineMap';
import BookForm from '@/components/BookForm';

const statusFlow: BookStatus[] = ['pending', 'drifting', 'arrived'];

const statusColorMap: Record<string, string> = {
  pending: 'bg-pending text-white',
  drifting: 'bg-drifting text-white',
  arrived: 'bg-arrived text-white',
};

const nextStatusLabel: Record<BookStatus, string> = {
  pending: '开始漂流',
  drifting: '确认到达',
  arrived: '重新漂流',
};

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { getBookById, updateBookStatus, fetchBooks, loading } = useBookStore();

  const [showEditForm, setShowEditForm] = useState(false);

  const book = id ? getBookById(id) : undefined;

  useEffect(() => {
    void fetchBooks();
  }, [fetchBooks]);

  if (!loading && !book) {
    return <Navigate to="/" replace />;
  }

  if (!book) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-oak-500">加载中...</div>
      </div>
    );
  }

  const currentIndex = statusFlow.indexOf(book.status);
  const nextStatus =
    currentIndex < statusFlow.length - 1
      ? statusFlow[currentIndex + 1]
      : 'pending';

  const handleStatusChange = async () => {
    await updateBookStatus(book.id, nextStatus);
  };

  const firstChar = book.title.charAt(0);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-oak-200/50 bg-white/70 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-oak-600 transition-colors hover:bg-oak-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="truncate text-lg font-bold text-oak-800">
            书籍详情
          </h1>
          <button
            onClick={() => setShowEditForm(true)}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-oak-600 transition-colors hover:bg-oak-100"
          >
            <Edit3 size={18} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="overflow-hidden rounded-2xl bg-white shadow-card">
          <div className="flex gap-5 p-5">
            <div className="h-40 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-oak-200 to-oak-400 shadow-md">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-5xl font-serif text-white/90 drop-shadow-lg">
                    {firstChar}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-bold text-oak-800">
                  {book.title}
                </h2>
                <span
                  className={cn(
                    'flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium',
                    statusColorMap[book.status]
                  )}
                >
                  {STATUS_LABELS[book.status]}
                </span>
              </div>

              <p className="text-sm text-oak-600">{book.author}</p>

              {book.isbn && (
                <p className="text-xs text-oak-400">ISBN: {book.isbn}</p>
              )}

              <div className="flex items-center gap-1 text-sm text-oak-500">
                <MapPin size={14} />
                <span>{book.currentLocation}</span>
              </div>

              <div className="flex items-center gap-1 text-xs text-oak-400">
                <User size={12} />
                <span>发起人：{book.creatorName}</span>
              </div>

              <div className="flex items-center gap-1 text-xs text-oak-400">
                <Clock size={12} />
                <span>
                  创建于{' '}
                  {format(book.createdAt, 'yyyy-MM-dd', { locale: zhCN })}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-oak-100 p-5">
            <button
              onClick={handleStatusChange}
              className={cn(
                'w-full rounded-xl py-3 text-sm font-medium text-white shadow-card',
                'transition-all duration-200 hover:shadow-card-hover',
                'active:scale-[0.98]',
                nextStatus === 'pending' && 'bg-pending hover:bg-orange-600',
                nextStatus === 'drifting' && 'bg-drifting hover:bg-green-600',
                nextStatus === 'arrived' && 'bg-arrived hover:bg-blue-600'
              )}
            >
              {nextStatusLabel[book.status]}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <TimelineMap bookId={book.id} />
        </div>
      </main>

      <BookForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        book={book}
      />
    </div>
  );
}
