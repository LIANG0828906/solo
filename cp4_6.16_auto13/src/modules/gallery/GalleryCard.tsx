import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import { useGalleryStore } from '@/store/useGalleryStore';
import type { GalleryPost } from '@/types';

interface GalleryCardProps {
  post: GalleryPost;
  onClick: () => void;
}

const CARD_HEIGHTS = [320, 360, 400, 440, 380, 420, 340, 460];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function GalleryCard({ post, onClick }: GalleryCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const { isLikeAnimating } = useGalleryStore();

  const animating = isLikeAnimating[post.id] ?? false;
  const height = CARD_HEIGHTS[hashString(post.id) % CARD_HEIGHTS.length];

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="mb-6 break-inside-avoid"
      style={{ height }}
    >
      <div
        ref={imgRef}
        onClick={onClick}
        className="group relative h-full w-[280px] cursor-pointer overflow-hidden rounded-3xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.2)]"
      >
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100" />
        )}
        {inView && (
          <img
            src={post.thumbnail}
            alt={post.title}
            onLoad={() => setLoaded(true)}
            className={`h-full w-full object-cover transition-opacity duration-500 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        <div
          className={`absolute bottom-0 left-0 right-0 flex items-center gap-2.5 bg-white/40 p-3 backdrop-blur-xl border-t border-white/50 transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={post.authorAvatar}
            alt={post.authorName}
            className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white/70"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-gray-800">
              {post.authorName}
            </div>
          </div>
          <div
            className={`flex items-center gap-1 text-sm font-semibold transition-transform duration-300 ease-out ${
              animating ? 'scale-130' : 'scale-100'
            }`}
            style={{
              animation: animating
                ? 'likeBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                : 'none',
            }}
          >
            <Heart
              size={18}
              className={post.likedByMe ? 'fill-red-500 text-red-500' : 'text-gray-700'}
              strokeWidth={2}
            />
            <span className="text-gray-800">{post.likes}</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes likeBounce {
          0% { transform: scale(1); }
          40% { transform: scale(1.3); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
