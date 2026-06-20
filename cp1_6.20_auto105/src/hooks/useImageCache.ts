import { useCallback, useRef } from 'react';

const MAX_CACHE = 5;

export function useImageCache() {
  const cacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const orderRef = useRef<string[]>([]);

  const preload = useCallback((urls: string[]) => {
    urls.forEach((url) => {
      if (!url || cacheRef.current.has(url)) return;
      const img = new Image();
      img.src = url;
      cacheRef.current.set(url, img);
      orderRef.current.push(url);
      if (orderRef.current.length > MAX_CACHE) {
        const oldUrl = orderRef.current.shift()!;
        const oldImg = cacheRef.current.get(oldUrl);
        if (oldImg) {
          oldImg.src = '';
          cacheRef.current.delete(oldUrl);
        }
      }
    });
  }, []);

  const ensure = useCallback(
    (url: string) => {
      if (url && !cacheRef.current.has(url)) preload([url]);
    },
    [preload]
  );

  return { preload, ensure } as const;
}
