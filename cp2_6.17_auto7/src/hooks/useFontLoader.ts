import { useEffect, useRef } from 'react';
import { useFontStore } from '@/store/fontStore';

declare global {
  interface Window {
    WebFont: {
      load: (config: {
        google?: { families: string[] };
        active?: () => void;
        inactive?: () => void;
      }) => void;
    };
  }
}

export function useFontLoader() {
  const selectedFontId = useFontStore((s) => s.selectedFontId);
  const fonts = useFontStore((s) => s.fonts);
  const setFontLoading = useFontStore((s) => s.setFontLoading);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!selectedFontId) return;

    const font = fonts.find((f) => f.id === selectedFontId);
    if (!font) return;

    if (loadingRef.current) return;
    loadingRef.current = true;
    setFontLoading(true);

    if (typeof window.WebFont !== 'undefined') {
      window.WebFont.load({
        google: { families: [font.googleFontName + ':400,700'] },
        active: () => {
          setFontLoading(false);
          loadingRef.current = false;
        },
        inactive: () => {
          setFontLoading(false);
          loadingRef.current = false;
        },
      });
    } else {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${font.googleFontName.replace(/ /g, '+')}:wght@400;700&display=swap`;
      link.onload = () => {
        setFontLoading(false);
        loadingRef.current = false;
      };
      link.onerror = () => {
        setFontLoading(false);
        loadingRef.current = false;
      };
      document.head.appendChild(link);
    }
  }, [selectedFontId, fonts, setFontLoading]);
}
