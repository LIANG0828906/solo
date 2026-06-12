import { useState, useCallback, useEffect, useRef } from 'react';
import PreviewPanel from './PreviewPanel';
import ControlPanel from './ControlPanel';
import { exportCSS } from './utils/exportCSS';
import type { TypographyStyle } from './utils/exportCSS';

const GOOGLE_FONTS = [
  'Roboto',
  'Noto Serif SC',
  'Playfair Display',
  'Lora',
  'Merriweather',
  'Montserrat',
];

const fontLinkIds = new Set<string>();

function loadGoogleFont(fontFamily: string): Promise<void> {
  if (fontLinkIds.has(fontFamily)) return Promise.resolve();

  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.id = `font-${fontFamily.replace(/\s+/g, '-')}`;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      fontFamily
    )}:wght@300;400;700&display=swap`;
    link.onload = () => {
      fontLinkIds.add(fontFamily);
      resolve();
    };
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

export default function App() {
  const [style, setStyle] = useState<TypographyStyle>({
    fontFamily: 'Noto Serif SC',
    fontSize: 24,
    fontWeight: 'regular',
    color: '#333333',
  });

  const [fontLoaded, setFontLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFontLoaded(false);
    loadGoogleFont(style.fontFamily).then(() => {
      setFontLoaded(true);
    });
  }, [style.fontFamily]);

  useEffect(() => {
    GOOGLE_FONTS.forEach((f) => loadGoogleFont(f));
  }, []);

  const handleCopy = useCallback(() => {
    const css = exportCSS(style);
    navigator.clipboard.writeText(css).then(() => {
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => {
        setCopied(false);
      }, 300);
    });
  }, [style]);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        margin: 0,
        padding: 0,
      }}
    >
      <ControlPanel
        style={style}
        onChange={setStyle}
        onCopy={handleCopy}
        copied={copied}
      />
      <PreviewPanel style={style} fontLoaded={fontLoaded} />
    </div>
  );
}
