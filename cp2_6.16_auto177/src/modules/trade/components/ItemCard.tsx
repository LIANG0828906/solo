import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Item, getStatusColor, getStatusText } from '../models';

interface ItemCardProps {
  item: Item;
  onClick?: (item: Item) => void;
}

export default function ItemCard({ item, onClick }: ItemCardProps) {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              setInView(true);
              observer.disconnect();
            }
          });
        },
        { rootMargin: '100px' }
      );
      observer.observe(el);
      return () => observer.disconnect();
    } else {
      setInView(true);
    }
  }, []);

  const handleClick = () => {
    if (onClick) {
      onClick(item);
    } else {
      navigate(`/item/${item.id}`);
    }
  };

  const statusColor = getStatusColor(item.status);
  const statusText = getStatusText(item.status);

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
      style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        contain: 'content',
        willChange: 'transform, box-shadow',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-5px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
    >
      <div ref={imgRef} className="relative aspect-square overflow-hidden bg-gray-100">
        {!loaded && <div className="absolute inset-0 skeleton" />}
        {inView && item.images[0] && (
          <img
            src={item.images[0]}
            alt={item.title}
            className={`w-full h-full object-cover ${loaded ? 'img-loaded' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
            loading="lazy"
          />
        )}
        <span
          className="absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full text-white"
          style={{ backgroundColor: statusColor }}
        >
          {statusText}
        </span>
      </div>

      <div className="p-3.5">
        <h3 className="text-sm font-semibold text-secondary line-clamp-1 mb-1.5">
          {item.title}
        </h3>
        <div className="flex items-center justify-between">
          <span
            className="text-lg font-bold"
            style={{ color: '#E67E22' }}
          >
            ¥{item.price}
          </span>
          <span className="text-xs text-secondary/50 bg-bg px-2 py-0.5 rounded-full">
            {item.condition}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[10px] text-secondary/40 bg-secondary/5 px-1.5 py-0.5 rounded">
            {item.category}
          </span>
        </div>
      </div>
    </div>
  );
}
