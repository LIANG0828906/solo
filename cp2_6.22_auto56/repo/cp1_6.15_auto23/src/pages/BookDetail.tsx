import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, BookOpen, Clock, BarChart3 } from 'lucide-react';
import { api } from '@/api';
import type { BookDetail as BookDetailType } from '@/types';
import { BookDetailSkeleton } from '@/components/Skeleton';
import ProgressTrack from '@/components/ProgressTrack';
import TopicsSection from '@/components/TopicsSection';
import CheckInSection from '@/components/CheckInSection';

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressRefreshKey, setProgressRefreshKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getBook(id);
        setBook(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, progressRefreshKey]);

  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      try {
        const data = await api.getBook(id);
        setBook(prev => {
          if (!prev) return data;
          if (JSON.stringify(prev.progress) === JSON.stringify(data.progress) &&
              JSON.stringify(prev.checkIns) === JSON.stringify(data.checkIns)) {
            return prev;
          }
          return data;
        });
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <BookDetailSkeleton />;
  if (!book) return <div className="text-center py-20 text-coffee">书籍不存在</div>;

  const readerCount = book.readers.length;
  const avgProgress = readerCount > 0
    ? Math.round(book.progress.reduce((s, p) => s + (p.currentChapter / p.totalChapters) * 100, 0) / readerCount)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-coffee hover:text-forest transition-colors duration-200 text-sm font-medium group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
        返回书库
      </button>

      <div className="bg-warm-white rounded-card p-6 shadow-soft">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0 w-full md:w-48">
            <div className="aspect-[3/4] rounded-card overflow-hidden shadow-hover bg-latte/20">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-20 h-20 text-latte" />
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-espresso mb-2">{book.title}</h1>
            <p className="text-coffee mb-4">作者：{book.author} · ISBN：{book.isbn || '—'}</p>
            <p className="text-espresso/80 leading-relaxed mb-6">{book.description}</p>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-card bg-gradient-to-br from-cream to-forest-pale/30 border border-forest/10">
                <div className="flex items-center gap-1.5 text-coffee text-xs mb-1">
                  <Users className="w-3.5 h-3.5" />
                  在读人数
                </div>
                <p className="font-serif text-2xl font-bold text-forest">{readerCount}</p>
              </div>
              <div className="p-4 rounded-card bg-gradient-to-br from-cream to-forest-pale/30 border border-forest/10">
                <div className="flex items-center gap-1.5 text-coffee text-xs mb-1">
                  <BarChart3 className="w-3.5 h-3.5" />
                  平均进度
                </div>
                <p className="font-serif text-2xl font-bold text-forest">{avgProgress}%</p>
              </div>
              <div className="p-4 rounded-card bg-gradient-to-br from-cream to-forest-pale/30 border border-forest/10">
                <div className="flex items-center gap-1.5 text-coffee text-xs mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  加入时间
                </div>
                <p className="font-serif text-base font-bold text-forest">
                  {new Date(book.addedAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>

            {readerCount > 0 && (
              <div className="mt-5 pt-5 border-t border-latte/30">
                <p className="text-xs text-coffee mb-2">在读成员</p>
                <div className="flex -space-x-2">
                  {book.readers.slice(0, 8).map(m => (
                    <img
                      key={m.id}
                      src={m.avatar}
                      alt={m.name}
                      title={m.name}
                      className="w-9 h-9 rounded-full object-cover border-2 border-warm-white hover:scale-110 hover:z-10 transition-all duration-200"
                    />
                  ))}
                  {readerCount > 8 && (
                    <div className="w-9 h-9 rounded-full bg-latte/40 border-2 border-warm-white flex items-center justify-center text-xs font-medium text-coffee">
                      +{readerCount - 8}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProgressTrack progressList={book.progress.map(p => ({
        ...p,
        member: book.readers.find(r => r.id === p.memberId)!,
      }))} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopicsSection bookId={book.id} />
        <CheckInSection
          bookId={book.id}
          initialCheckIns={book.checkIns.map(c => ({
            ...c,
            member: book.readers.find(r => r.id === c.memberId)!,
          }))}
          onAdded={() => setProgressRefreshKey(k => k + 1)}
        />
      </div>
    </div>
  );
}
