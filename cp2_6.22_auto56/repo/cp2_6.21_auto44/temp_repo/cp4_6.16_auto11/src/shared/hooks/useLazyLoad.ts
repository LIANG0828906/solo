import { useEffect, useRef, useState } from 'react';

interface UseLazyLoadOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

export function useLazyLoad<T extends HTMLElement = HTMLElement>(
  options: UseLazyLoadOptions = {}
) {
  const ref = useRef<T | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  const { root = null, rootMargin = '200px', threshold = 0.1 } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element || hasIntersected) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            setHasIntersected(true);
            observer.unobserve(entry.target);
          } else {
            setIsIntersecting(false);
          }
        });
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [root, rootMargin, threshold, hasIntersected]);

  return {
    ref,
    isIntersecting,
    hasIntersected,
  };
}

export function useLazyLoadImage(src: string, options: UseLazyLoadOptions = {}) {
  const { ref, hasIntersected } = useLazyLoad<HTMLImageElement>(options);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageSrc = hasIntersected ? src : '';

  useEffect(() => {
    if (!imageSrc) {
      return;
    }
    setLoaded(false);
    setError(null);

    const img = new Image();
    img.onload = () => {
      setLoaded(true);
    };
    img.onerror = () => {
      setError('Failed to load image');
    };
    img.src = imageSrc;
  }, [imageSrc]);

  return {
    ref,
    src: imageSrc,
    loaded,
    error,
    isVisible: hasIntersected,
  };
}
