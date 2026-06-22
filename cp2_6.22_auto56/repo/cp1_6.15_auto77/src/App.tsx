import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ColorWheel from './ColorWheel';
import PaletteGenerator from './PaletteGenerator';
import ColorPreview from './ColorPreview';
import HistoryPanel from './HistoryPanel';
import type { HSV, Palette, HistoryItem } from './utils/types';
import { generateAllPalettes, hsvToHex, generateId } from './utils/colorUtils';
import { Palette as PaletteIcon } from 'lucide-react';

const DEFAULT_HSV: HSV = { h: 210, s: 80, v: 90 };
const MAX_HISTORY = 10;

const App: React.FC = () => {
  const [primaryHSV, setPrimaryHSV] = useState<HSV>(DEFAULT_HSV);
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState<number>(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [previewAnimating, setPreviewAnimating] = useState(false);
  const lastSavedRef = useRef<string>('');

  const palettes = useMemo(() => generateAllPalettes(primaryHSV), [primaryHSV]);
  const selectedPalette = palettes[selectedPaletteIndex] || null;
  const primaryHex = useMemo(() => hsvToHex(primaryHSV), [primaryHSV]);

  useEffect(() => {
    const paletteKey = `${primaryHex}-${selectedPaletteIndex}`;
    if (lastSavedRef.current !== paletteKey) {
      lastSavedRef.current = paletteKey;
      if (selectedPalette) {
        setHistory((prev) => {
          const newItem: HistoryItem = {
            id: generateId(),
            primaryColor: primaryHex,
            palette: selectedPalette,
            timestamp: Date.now(),
          };
          const filtered = prev.filter((item) => {
            return !(item.primaryColor === primaryHex && item.palette.type === selectedPalette.type);
          });
          return [newItem, ...filtered].slice(0, MAX_HISTORY);
        });
      }
    }
  }, [primaryHex, selectedPaletteIndex, selectedPalette]);

  const handleHSVChange = useCallback((newHSV: HSV) => {
    setPrimaryHSV(newHSV);
  }, []);

  const handlePaletteSelect = useCallback((index: number) => {
    if (index !== selectedPaletteIndex) {
      setPreviewAnimating(true);
      setTimeout(() => {
        setSelectedPaletteIndex(index);
        setTimeout(() => setPreviewAnimating(false), 50);
      }, 250);
    }
  }, [selectedPaletteIndex]);

  const handleHistoryRestore = useCallback((item: HistoryItem) => {
    setPreviewAnimating(true);
    setTimeout(() => {
      const newHSV: HSV = {
        h: item.palette.type === 'monochromatic' ? 0 : 0,
        s: 80,
        v: 90,
      };
      try {
        const r = parseInt(item.primaryColor.slice(1, 3), 16);
        const g = parseInt(item.primaryColor.slice(3, 5), 16);
        const b = parseInt(item.primaryColor.slice(5, 7), 16);
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;
        let h = 0;
        const s = max === 0 ? 0 : (d / max) * 100;
        const v = (max / 255) * 100;
        if (d !== 0) {
          if (max === r) h = (((g - b) / d) % 6) * 60;
          else if (max === g) h = (((b - r) / d) + 2) * 60;
          else h = (((r - g) / d) + 4) * 60;
          if (h < 0) h += 360;
        }
        newHSV.h = h;
        newHSV.s = s;
        newHSV.v = v;
      } catch (_) { /* noop */ }

      setPrimaryHSV(newHSV);
      const paletteIdx = palettes.findIndex((p) => p.type === item.palette.type);
      if (paletteIdx >= 0) {
        setSelectedPaletteIndex(paletteIdx);
      }
      setTimeout(() => setPreviewAnimating(false), 50);
    }, 300);
  }, [palettes]);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return (
    <div className="app-root">
      <style>{`
        .app-root {
          min-height: 100vh;
          width: 100%;
          padding: 24px;
          background: radial-gradient(ellipse at top, #1a1a2e 0%, #0f0f1a 100%);
          transition: padding var(--transition-normal);
        }
        .app-header {
          max-width: 1600px;
          margin: 0 auto 24px auto;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 8px;
        }
        .app-logo {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        .app-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: 0.5px;
        }
        .app-subtitle {
          font-size: 13px;
          color: var(--text-secondary);
          margin-left: auto;
        }
        .app-grid {
          max-width: 1600px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(320px, 380px) minmax(320px, 420px) 1fr;
          gap: 20px;
          padding-right: 20px;
          transition: all var(--transition-normal);
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .app-grid {
            grid-template-columns: minmax(300px, 1fr) minmax(300px, 1fr);
            padding-right: 20px;
          }
          .app-grid > *:nth-child(3) {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 767px) {
          .app-root {
            padding: 16px;
          }
          .app-grid {
            grid-template-columns: 1fr;
            padding-right: 0;
          }
          .app-header {
            flex-wrap: wrap;
          }
          .app-subtitle {
            margin-left: 0;
            width: 100%;
          }
        }
      `}</style>

      <header className="app-header">
        <div className="app-logo">
          <PaletteIcon size={22} color="#fff" />
        </div>
        <h1 className="app-title">ColorLab 调色板生成器</h1>
        <span className="app-subtitle">拖拽色环选择主色，自动生成专业配色方案</span>
      </header>

      <main className="app-grid">
        <ColorWheel hsv={primaryHSV} onChange={handleHSVChange} />
        <PaletteGenerator
          palettes={palettes}
          selectedIndex={selectedPaletteIndex}
          onSelect={handlePaletteSelect}
        />
        <ColorPreview palette={selectedPalette} animating={previewAnimating} />
      </main>

      <HistoryPanel
        history={history}
        onRestore={handleHistoryRestore}
        onClear={handleClearHistory}
      />
    </div>
  );
};

export default App;
