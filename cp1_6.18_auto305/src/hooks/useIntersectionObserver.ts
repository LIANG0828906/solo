import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  once?: boolean;
}

interface UseIntersectionObserverReturn {
  ref: (element: Element | null) => void;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    once = false,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasIntersected = useRef(false);

  const setRef = (element: Element | null) => {
    if (observerRef.current && elementRef.current) {
      observerRef.current.unobserve(elementRef.current);
    }
    elementRef.current = element;
    if (element) {
      observerRef.current?.observe(element);
    }
  };

  useEffect(() => {
    hasIntersected.current = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setEntry(entry);

        if (entry.isIntersecting) {
          setIsIntersecting(true);
          if (once) {
            hasIntersected.current = true;
            observer.unobserve(entry.target);
          }
        } else if (!once) {
          setIsIntersecting(false);
        }
      },
      { threshold, root, rootMargin }
    );

    observerRef.current = observer;

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [threshold, root, rootMargin, once]);

  return { ref: setRef, isIntersecting, entry };
}
