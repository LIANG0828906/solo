import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CalendarCheck, BookOpen } from 'lucide-react';
import { useStore } from '@/store/index';
import BookRecommendation from '@/components/BookRecommendation';

export default function Home() {
  const { checkInRecords, fetchRecords, bookLists, fetchBookLists } = useStore();

  useEffect(() => {
    fetchRecords();
    fetchBookLists();
  }, [fetchRecords, fetchBookLists]);

  const monthlyDuration = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return checkInRecords
      .filter((r) => {
        const d = new Date(r.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, r) => sum + r.duration, 0);
  }, [checkInRecords]);

  const checkInDays = checkInRecords.length;

  const readBookCount = useMemo(() => {
    const readList = bookLists.find((l) => l.type === 'read');
    return readList ? readList.books.length : 0;
  }, [bookLists]);

  const stats = [
    { label: '本月阅读时长', value: `${monthlyDuration} 分钟`, icon: Clock, color: 'text-orange' },
    { label: '打卡天数', value: `${checkInDays} 天`, icon: CalendarCheck, color: 'text-orange-light' },
    { label: '已读书籍', value: `${readBookCount} 本`, icon: BookOpen, color: 'text-orange-dark' },
  ];

  return (
    <div className="container mx-auto px-4 pt-20 pb-8">
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card flex items-center gap-4 p-5">
            <div className={`${stat.color} bg-cream-dark/50 flex h-12 w-12 items-center justify-center rounded-lg`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-text-muted">{stat.label}</p>
              <p className="text-xl font-semibold text-text">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <BookRecommendation />
      </div>

      <div className="flex gap-4">
        <Link to="/checkin" className="btn-primary">
          开始打卡
        </Link>
        <Link to="/reviews" className="btn-ghost">
          写书评
        </Link>
      </div>
    </div>
  );
}
