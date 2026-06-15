import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Coins, Tag, Loader2 } from 'lucide-react';

interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  images: string[];
  publisherId: string;
  publisherName: string;
  publisherAvatar: string;
  stock: number;
  status: 'pending' | 'approved' | 'exchanged';
  createdAt: string;
}

interface ItemsResponse {
  items: Item[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

const AVATAR_COLORS = [
  'bg-primary', 'bg-green-400', 'bg-orange-400',
  'bg-purple-400', 'bg-pink-400', 'bg-teal-400',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function SkeletonCard() {
  return (
    <div className="masonry-item">
      <div className="bg-card rounded-card overflow-hidden">
        <div className="skeleton w-full h-48" />
        <div className="p-3 space-y-2">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="flex items-center gap-2">
            <div className="skeleton h-6 w-6 rounded-full" />
            <div className="skeleton h-3 w-16 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadItems = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await axios.get<{ success: boolean; data: ItemsResponse }>('/api/items', {
        params: { page: pageNum, limit: 8 },
      });
      const data = res.data.data;
      setItems(prev => isInitial ? data.items : [...prev, ...data.items]);
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch {
      if (isInitial) setItems([]);
    } finally {
      if (isInitial) setLoading(false);
      else setLoadingMore(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadItems(1, true);
  }, [loadItems]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadItems(page + 1);
        }
      },
      { rootMargin: '200px' }
    );

    const target = observerRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loading, loadingMore, page, loadItems]);

  if (loading) {
    return (
      <div className="masonry-grid p-4 md:p-6 max-w-6xl mx-auto">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="masonry-grid">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="masonry-item opacity-0 animate-slideInUp"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <Link to={`/item/${item.id}`} className="block">
              <div className="bg-card rounded-card overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ease-out active:scale-[0.98]">
                <div className="relative w-full overflow-hidden">
                  <img
                    src={item.images[0] || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=a+plain+light+gray+placeholder+square+image&image_size=square_hd'}
                    alt={item.title}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                  <span className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-600 px-2 py-1 rounded-full shadow-sm">
                    <Tag size={12} />{item.category}
                  </span>
                  <span className="absolute top-2 right-2 flex items-center gap-1 gradient-primary text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                    <Coins size={12} />{item.points}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`${getAvatarColor(item.publisherName)} w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {item.publisherName.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      {item.publisherName}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div ref={observerRef} className="flex justify-center py-6">
        {loadingMore && (
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        )}
        {!hasMore && items.length > 0 && (
          <p className="text-sm text-gray-400">— 已经到底啦 —</p>
        )}
      </div>
    </div>
  );
}
