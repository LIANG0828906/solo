import { useEffect, useRef, useState } from 'react';

interface UseImageLazyLoadOptions {
  src: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
}

interface UseImageLazyLoadReturn {
  ref: (element: HTMLImageElement | null) => void;
  loaded: boolean;
  error: boolean;
  currentSrc: string;
}

export function useImageLazyLoad({
  src,
  placeholder = '',
  threshold = 0.1,
  rootMargin = '200px',
  onLoad,
  onError,
}: UseImageLazyLoadOptions): UseImageLazyLoadReturn {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasTriggeredRef = useRef(false);

  const setRef = (element: HTMLImageElement | null) => {
    if (observerRef.current && imgRef.current) {
      observerRef.current.unobserve(imgRef.current);
    }
    imgRef.current = element;
    if (element && !hasTriggeredRef.current) {
      observerRef.current?.observe(element);
    }
  };

  useEffect(() => {
    hasTriggeredRef.current = false;
    setLoaded(false);
    setError(false);
    setCurrentSrc(placeholder);

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          observer.unobserve(entry.target);

          const img = new Image();
          img.src = src;

          img.onload = () => {
            setCurrentSrc(src);
            setLoaded(true);
            onLoad?.();
          };

          img.onerror = () => {
            setError(true);
            onError?.();
          };
        }
      },
      { threshold, rootMargin }
    );

    observerRef.current = observer;

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [src, placeholder, threshold, rootMargin, onLoad, onError]);

  return { ref: setRef, loaded, error, currentSrc };
}
