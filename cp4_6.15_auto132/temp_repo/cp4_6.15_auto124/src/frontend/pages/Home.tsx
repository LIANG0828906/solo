import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import Carousel from '../components/Carousel';
import BookCard from '../components/BookCard';
import type { Book } from '../types';
import { useStore } from '../store/useStore';

export default function Home() {
  const [featured, setFeatured] = useState<Book[]>([]);
  const [recommended, setRecommended] = useState<Book[]>([]);
  const viewedCategories = useStore((s) => s.viewedCategories);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/books?pageSize=30');
      const data = await res.json();
      const all: Book[] = data.list;

      const bestsellers = all.filter((b) => b.isBestseller);
      setFeatured(bestsellers.slice(0, 5));

      if (viewedCategories.length > 0) {
        const sameCat = all.filter((b) => viewedCategories.includes(b.category));
        setRecommended(sameCat.sort(() => Math.random() - 0.5).slice(0, 8));
      } else {
        setRecommended(bestsellers.slice(0, 8));
      }
    };
    load();
  }, [viewedCategories]);

  return (
    <div className="space-y-10 pb-16">
      <Carousel books={featured} />

      <section>
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="text-accent-500" size={24} />
          <h2 className="text-xl md:text-2xl font-extrabold text-brown-800">猜你喜欢</h2>
          <span className="text-sm text-brown-600 font-medium ml-2">
            {viewedCategories.length ? `基于您浏览过的 ${viewedCategories.join('、')} 类推荐` : '精选畅销书'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {recommended.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>

        {recommended.length === 0 && (
          <div className="py-16 text-center text-brown-600 bg-white rounded-2xl shadow-sm">
            正在为您挑选好书…
          </div>
        )}
      </section>
    </div>
  );
}
