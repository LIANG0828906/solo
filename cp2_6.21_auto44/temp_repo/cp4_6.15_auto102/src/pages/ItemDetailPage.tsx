import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Coins, ArrowLeft } from 'lucide-react';
import axios from 'axios';

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

const categoryColors: Record<string, string> = {
  '教材书籍': 'bg-blue-100 text-blue-700',
  '电子产品': 'bg-purple-100 text-purple-700',
  '服饰鞋包': 'bg-pink-100 text-pink-700',
  '生活用品': 'bg-amber-100 text-amber-700',
  '运动器材': 'bg-green-100 text-green-700',
  '其他': 'bg-gray-100 text-gray-700',
};

const AVATAR_COLORS = [
  'bg-primary', 'bg-green-400', 'bg-orange-400',
  'bg-purple-400', 'bg-pink-400', 'bg-teal-400',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [scale, setScale] = useState(1);
  const touchRef = useRef({ startX: 0, startY: 0, dist: 0, initialDist: 0 });

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/items/${id}`).then((res) => {
      setItem(res.data.data?.item || res.data.item || res.data);
      setCurrent(0);
      setScale(1);
    }).finally(() => setLoading(false));
  }, [id]);

  const images = item?.images ?? [];
  const prev = useCallback(() => setCurrent((c) => (c > 0 ? c - 1 : images.length - 1)), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c < images.length - 1 ? c + 1 : 0)), [images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchRef.current.initialDist = Math.hypot(dx, dy);
      touchRef.current.dist = touchRef.current.initialDist;
    } else {
      touchRef.current.startX = e.touches[0].clientX;
      touchRef.current.startY = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const newScale = Math.min(3, Math.max(1, scale * (dist / touchRef.current.dist)));
      setScale(newScale);
      touchRef.current.dist = dist;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (scale > 1) { setScale(1); return; }
    if (e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - touchRef.current.startX;
      const dy = Math.abs(e.changedTouches[0].clientY - touchRef.current.startY);
      if (Math.abs(dx) > 50 && dy < 100) dx < 0 ? next() : prev();
    }
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-3/5 animate-pulse bg-gray-200 rounded-card h-80" />
        <div className="md:w-2/5 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-10 bg-gray-200 rounded w-1/2" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    </div>
  );

  if (!item) return (
    <div className="flex items-center justify-center h-96 text-gray-400">
      <p>物品不存在或已下架</p>
    </div>
  );

  const badgeColor = categoryColors[item.category] ?? categoryColors['其他'];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-gray-500 hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm">返回</span>
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Image Carousel */}
        <div className="md:w-3/5">
          <div
            className="relative overflow-hidden rounded-card bg-gray-100 select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="aspect-[4/3] relative">
              {images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                    i === current ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={i === current ? { transform: `scale(${scale})`, transition: 'transform 0.15s ease' } : undefined}
                  draggable={false}
                />
              ))}
            </div>

            {images.length > 1 && (
              <>
                <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <span key={i} className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white w-5' : 'bg-white/50'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Item Info */}
        <div className="md:w-2/5 space-y-5">
          <h1 className="font-display font-bold text-2xl md:text-3xl text-gray-900">{item.title}</h1>

          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
            {item.category}
          </span>

          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-primary" />
            <span className="text-3xl font-display font-bold text-primary">{item.points}</span>
            <span className="text-gray-400 text-sm">积分</span>
          </div>

          <p className="text-gray-600 leading-relaxed whitespace-pre-line">{item.description}</p>

          <div className="flex items-center gap-3 pt-2">
            {item.publisherAvatar ? (
              <img src={item.publisherAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className={`w-10 h-10 rounded-full ${getAvatarColor(item.publisherName)} flex items-center justify-center text-white font-bold`}>
                {item.publisherName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-800">{item.publisherName}</p>
              <p className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString('zh-CN')}</p>
            </div>
          </div>

          <p className={`text-sm font-medium ${item.stock > 2 ? 'text-green-600' : 'text-orange-500'}`}>
            {item.stock > 2 ? '库存充足' : '库存紧张'}（剩余 {item.stock} 件）
          </p>

          <button
            onClick={() => window.alert('交换申请已提交！')}
            className={`w-full py-3 rounded-card text-white font-display font-bold text-lg transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 ${
              item.stock > 2
                ? 'bg-gradient-to-r from-[#34d399] to-[#6ee7b7]'
                : 'bg-gradient-to-r from-[#fb923c] to-[#fbbf24]'
            }`}
          >
            申请交换
          </button>
        </div>
      </div>
    </div>
  );
}
