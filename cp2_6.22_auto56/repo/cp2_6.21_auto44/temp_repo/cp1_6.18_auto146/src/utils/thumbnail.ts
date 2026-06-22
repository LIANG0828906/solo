import * as React from 'react';

export async function generateThumbnail(
  imageUrl: string,
  maxWidth: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = img.height / img.width;
      canvas.width = maxWidth;
      canvas.height = maxWidth * ratio;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } catch {
        resolve(imageUrl);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

export function useLazyImage(
  ref: React.RefObject<HTMLElement>,
  imageUrl: string,
  rootMargin: string = '100px'
): string | null {
  const [loadedUrl, setLoadedUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setLoadedUrl(imageUrl);
            observer.disconnect();
          }
        });
      },
      { rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, imageUrl, rootMargin]);

  return loadedUrl;
}
