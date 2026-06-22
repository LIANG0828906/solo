import { useEffect, useRef, useState } from 'react';

export const useLazyImage = () => {
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const src = entry.target.getAttribute('data-src');
            if (src) {
              (entry.target as HTMLImageElement).src = src;
              setLoaded((prev) => ({ ...prev, [src]: true }));
              observerRef.current?.unobserve(entry.target);
            }
          }
        });
      },
      { rootMargin: '100px' }
    );
    return () => observerRef.current?.disconnect();
  }, []);

  const observe = (el: HTMLImageElement | null) => {
    if (el && observerRef.current) {
      observerRef.current.observe(el);
    }
  };

  return { loaded, observe };
};
