import { useEffect, useRef, useState } from 'react';

export function useLazyImage() {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = imgRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(element);
          }
        });
      },
      { rootMargin: '100px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { imgRef, isLoaded, isInView, setIsLoaded };
}
