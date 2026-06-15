import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Coins, Tag, User } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get<Item[]>('/api/items')
      .then(res => setItems(res.data.items || res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="masonry-grid p-4 max-w-6xl mx-auto">
        {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="masonry-grid p-4 max-w-6xl mx-auto">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="masonry-item opacity-0 animate-slideInUp"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <Link to={`/item/${item.id}`}>
            <div className="card-hover bg-card rounded-card overflow-hidden">
              <div className="relative w-full overflow-hidden">
                <img
                  src={item.images[0] || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=a+plain+light+gray+placeholder+square+image&image_size=square_hd'}
                  alt={item.title}
                  className="w-full h-auto object-cover"
                />
                <span className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-600 px-2 py-1 rounded-full">
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
                  <span className="text-xs text-gray-500 truncate flex items-center gap-1">
                    <User size={10} />{item.publisherName}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
