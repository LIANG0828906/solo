import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { toPng } from 'html-to-image';

export type LayoutType = 'center' | 'left' | 'wrap';
export type ColorSchemeType = 'dark' | 'gradient' | 'morandi' | 'warm' | 'mint' | 'white';
export type FontType = 'serif' | 'sans-serif' | 'monospace';

interface ColorScheme {
  background: string;
  textColor: string;
  subtitleColor: string;
  swatchBg: string;
}

interface PosterStyle {
  containerStyle: React.CSSProperties;
  titleStyle: React.CSSProperties;
  subtitleStyle: React.CSSProperties;
  isFontTransitioning: boolean;
}

interface UsePostGeneratorParams {
  title: string;
  subtitle: string;
  layout: LayoutType;
  colorScheme: ColorSchemeType;
  font: FontType;
}

interface UsePostGeneratorReturn {
  posterStyle: PosterStyle;
  exportPoster: () => Promise<void>;
  isExporting: boolean;
  previewRef: React.RefObject<HTMLDivElement>;
}

const COLOR_SCHEMES: Record<ColorSchemeType, ColorScheme> = {
  dark: {
    background: '#1A1A2E',
    textColor: '#FFFFFF',
    subtitleColor: 'rgba(255,255,255,0.8)',
    swatchBg: '#1A1A2E',
  },
  gradient: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#FFFFFF',
    subtitleColor: 'rgba(255,255,255,0.85)',
    swatchBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  morandi: {
    background: '#C6B4B0',
    textColor: '#4A4A4A',
    subtitleColor: '#6B6B6B',
    swatchBg: '#C6B4B0',
  },
  warm: {
    background: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
    textColor: '#FFFFFF',
    subtitleColor: 'rgba(255,255,255,0.85)',
    swatchBg: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
  },
  mint: {
    background: '#A8E6CF',
    textColor: '#2D6A4F',
    subtitleColor: '#40916C',
    swatchBg: '#A8E6CF',
  },
  white: {
    background: '#FFFFFF',
    textColor: '#212529',
    subtitleColor: '#495057',
    swatchBg: '#FFFFFF',
  },
};

const FONT_FAMILIES: Record<FontType, string> = {
  'serif': 'Georgia, "Times New Roman", Times, serif',
  'sans-serif': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  'monospace': '"Courier New", Courier, "Lucida Console", Monaco, monospace',
};

export const COLOR_SCHEME_LIST: { key: ColorSchemeType; name: string; swatch: string }[] = [
  { key: 'dark', name: '深色主题', swatch: COLOR_SCHEMES.dark.swatchBg },
  { key: 'gradient', name: '渐变紫蓝', swatch: COLOR_SCHEMES.gradient.swatchBg },
  { key: 'morandi', name: '莫兰迪', swatch: COLOR_SCHEMES.morandi.swatchBg },
  { key: 'warm', name: '温暖橙黄', swatch: COLOR_SCHEMES.warm.swatchBg },
  { key: 'mint', name: '清新薄荷', swatch: COLOR_SCHEMES.mint.swatchBg },
  { key: 'white', name: '简约纯白', swatch: COLOR_SCHEMES.white.swatchBg },
];

export const LAYOUT_LIST: { key: LayoutType; name: string; description: string }[] = [
  { key: 'center', name: '居中', description: '标题位于画面中心' },
  { key: 'left', name: '左对齐', description: '标题在左侧1/3处' },
  { key: 'wrap', name: '环绕', description: '副标题弯曲环绕标题' },
];

export const FONT_LIST: { key: FontType; name: string }[] = [
  { key: 'serif', name: 'Serif' },
  { key: 'sans-serif', name: 'Sans-serif' },
  { key: 'monospace', name: 'Monospace' },
];

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function usePostGenerator(params: UsePostGeneratorParams): UsePostGeneratorReturn {
  const { title, subtitle, layout, colorScheme, font } = params;

  const debouncedTitle = useDebouncedValue(title, 300);
  const debouncedSubtitle = useDebouncedValue(subtitle, 300);

  const previewRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isFontTransitioning, setIsFontTransitioning] = useState(false);
  const prevFontRef = useRef<FontType>(font);

  useEffect(() => {
    if (prevFontRef.current !== font) {
      setIsFontTransitioning(true);
      const timer = setTimeout(() => {
        setIsFontTransitioning(false);
      }, 300);
      prevFontRef.current = font;
      return () => clearTimeout(timer);
    }
  }, [font]);

  const scheme = COLOR_SCHEMES[colorScheme];
  const fontFamily = FONT_FAMILIES[font];

  const posterStyle = useMemo<PosterStyle>(() => {
    const baseTitleStyle: React.CSSProperties = {
      fontFamily,
      color: scheme.textColor,
      fontWeight: 700,
      fontSize: '48px',
      lineHeight: 1.2,
      margin: 0,
      wordBreak: 'break-word',
      maxWidth: '500px',
      transition: 'all 0.4s ease-out, color 0.5s ease, font-family 0.3s ease',
      opacity: isFontTransitioning ? 0 : 1,
    };

    const baseSubtitleStyle: React.CSSProperties = {
      fontFamily,
      color: scheme.subtitleColor,
      fontWeight: 400,
      fontSize: '20px',
      lineHeight: 1.6,
      margin: 0,
      wordBreak: 'break-word',
      maxWidth: '500px',
      transition: 'all 0.4s ease-out, color 0.5s ease, font-family 0.3s ease',
      opacity: isFontTransitioning ? 0 : 1,
    };

    let titleStyle: React.CSSProperties = {};
    let subtitleStyle: React.CSSProperties = {};
    let textAlign: React.CSSProperties['textAlign'] = 'center';
    let alignItems: React.CSSProperties['alignItems'] = 'center';
    let justifyContent: React.CSSProperties['justifyContent'] = 'center';
    let padding = '';

    switch (layout) {
      case 'center':
        textAlign = 'center';
        alignItems = 'center';
        justifyContent = 'center';
        padding = '60px 50px';
        titleStyle = {
          marginBottom: '32px',
        };
        break;
      case 'left':
        textAlign = 'left';
        alignItems = 'flex-start';
        justifyContent = 'center';
        padding = '60px 0 60px 200px';
        titleStyle = {
          marginBottom: '32px',
          maxWidth: '360px',
        };
        subtitleStyle = {
          maxWidth: '360px',
        };
        break;
      case 'wrap':
        textAlign = 'center';
        alignItems = 'center';
        justifyContent = 'center';
        padding = '60px 50px';
        titleStyle = {
          marginBottom: '0',
          fontSize: '56px',
          position: 'relative',
        };
        subtitleStyle = {
          marginTop: '16px',
          maxWidth: '480px',
          fontStyle: 'italic',
          letterSpacing: '0.04em',
        };
        break;
    }

    return {
      containerStyle: {
        width: '600px',
        height: '800px',
        background: scheme.background,
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        borderRadius: '8px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: layout === 'wrap' ? 'column' : 'column',
        alignItems,
        justifyContent,
        padding,
        boxSizing: 'border-box',
        transition: 'background 0.5s ease, box-shadow 0.3s ease',
      },
      titleStyle: {
        ...baseTitleStyle,
        textAlign,
        ...titleStyle,
      },
      subtitleStyle: {
        ...baseSubtitleStyle,
        textAlign,
        ...subtitleStyle,
      },
      isFontTransitioning,
    };
  }, [debouncedTitle, debouncedSubtitle, layout, colorScheme, fontFamily, scheme, isFontTransitioning]);

  const exportPoster = useCallback(async () => {
    if (!previewRef.current) return;

    setIsExporting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = await toPng(previewRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `poster_${timestamp}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('导出失败:', err);
    } finally {
      setTimeout(() => {
        setIsExporting(false);
      }, 500);
    }
  }, []);

  return {
    posterStyle,
    exportPoster,
    isExporting,
    previewRef,
  };
}
