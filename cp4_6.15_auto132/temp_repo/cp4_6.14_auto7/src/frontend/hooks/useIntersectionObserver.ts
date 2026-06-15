import { useRef, useEffect, useState, useCallback } from 'react';

interface UseIntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  triggerOnce?: boolean;
  onChange?: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void;
}

export function useIntersectionObserver<T extends Element>(
  options: UseIntersectionObserverOptions = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<T | null>(null);
  const isObservingRef = useRef(false);

  const {
    root = null,
    rootMargin = '100px 0px',
    threshold = 0,
    triggerOnce = false,
    onChange,
  } = options;

  const cleanUp = useCallback(() => {
    if (observerRef.current) {
      if (elementRef.current && isObservingRef.current) {
        try {
          observerRef.current.unobserve(elementRef.current);
        } catch {
          // ignore
        }
      }
      try {
        observerRef.current.disconnect();
      } catch {
        // ignore
      }
      observerRef.current = null;
      isObservingRef.current = false;
    }
  }, []);

  const setRef = useCallback(
    (node: T | null) => {
      cleanUp();
      elementRef.current = node;

      if (node && typeof IntersectionObserver !== 'undefined') {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const intersecting = entry.isIntersecting;

              if (intersecting) {
                setIsIntersecting(true);
                if (onChange) onChange(true, entry);
                if (triggerOnce) {
                  try {
                    observer.unobserve(entry.target);
                    isObservingRef.current = false;
                  } catch {
                    // ignore
                  }
                }
              } else if (!triggerOnce) {
                setIsIntersecting(false);
                if (onChange) onChange(false, entry);
              }
            });
          },
          { root, rootMargin, threshold }
        );

        try {
          observer.observe(node);
          observerRef.current = observer;
          isObservingRef.current = true;
        } catch (err) {
          console.warn('IntersectionObserver observe failed:', err);
        }
      }
    },
    [root, rootMargin, threshold, triggerOnce, onChange, cleanUp]
  );

  useEffect(() => {
    return () => {
      cleanUp();
    };
  }, [cleanUp]);

  return { ref: setRef, isIntersecting };
}
