import { useState, useRef, useEffect } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  src: string;
  alt?: string;
  className?: string;
  aspectRatio?: string;
  placeholder?: string;
  onClick?: () => void;
}

const DEFAULT_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTNlOGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTRhM2I4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Yqg5pS/5Liq6aG1PC90ZXh0Pjwvc3ZnPg==';

export default function LazyImage({
  src,
  alt = '',
  className,
  aspectRatio = '16/9',
  placeholder,
  onClick,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || inView) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        });
      },
      { rootMargin: '120px' }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [inView]);

  const finalSrc = src && inView ? src : '';
  const ph = placeholder || DEFAULT_PLACEHOLDER;

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={cn('relative overflow-hidden bg-slate-100', onClick && 'cursor-pointer', className)}
      style={{ aspectRatio }}
    >
      {!error && (
        <>
          <img
            src={ph}
            alt=""
            aria-hidden
            className={cn(
              'absolute inset-0 w-full h-full object-cover select-none pointer-events-none',
              loaded ? 'opacity-0' : 'image-blur-placeholder opacity-100'
            )}
          />
          {finalSrc && (
            <img
              src={finalSrc}
              alt={alt}
              loading="lazy"
              decoding="async"
              onLoad={() => setLoaded(true)}
              onError={() => setError(true)}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-500',
                loaded ? 'opacity-100 image-loaded' : 'opacity-0'
              )}
            />
          )}
        </>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-city-light gap-2">
          <ImageOff size={28} strokeWidth={1.5} />
          <span className="text-xs">图片加载失败</span>
        </div>
      )}
    </div>
  );
}
