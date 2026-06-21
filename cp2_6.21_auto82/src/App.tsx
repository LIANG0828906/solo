import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import PalettePreview from './PalettePreview';
import ColorPicker from './ColorPicker';
import ColorDetailPanel from './ColorDetailPanel';
import AnalysisPanel from './AnalysisPanel';
import EmotionTags from './EmotionTags';
import ExportToolbar from './ExportToolbar';
import {
  PaletteColor,
  generateId,
  hexToHsl,
  hexToRgb,
  isValidHex,
} from './colorEngine';

const DEFAULT_SLOTS = 6;
const MAX_SLOTS = 12;

const DEFAULT_PALETTE = [
  '#00B4D8',
  '#7209B7',
  '#F72585',
  '#4CC9F0',
  '#4361EE',
  '#3A0CA3',
];

function createPaletteColor(hex: string): PaletteColor {
  const rgb = hexToRgb(hex);
  const hsl = hexToHsl(hex);
  return {
    id: generateId(),
    hex: hex.toUpperCase(),
    rgb,
    hsl,
  };
}

function createEmptyPaletteColor(): PaletteColor {
  return {
    id: generateId(),
    hex: '',
    rgb: { r: 0, g: 0, b: 0 },
    hsl: { h: 0, s: 0, l: 0 },
  };
}

function initDefaultPalette(): PaletteColor[] {
  const colors: PaletteColor[] = DEFAULT_PALETTE.map((hex) => createPaletteColor(hex));
  while (colors.length < DEFAULT_SLOTS) colors.push(createEmptyPaletteColor());
  return colors;
}

interface ToastState {
  msg: string;
  ok: boolean;
  id: number;
}

const App: React.FC = () => {
  const [palette, setPalette] = useState<PaletteColor[]>(initDefaultPalette);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const initial = initDefaultPalette();
    return initial[0]?.id ?? null;
  });
  const [currentPickerColor, setCurrentPickerColor] = useState<string>(DEFAULT_PALETTE[0]);
  const [blendColor1Idx, setBlendColor1Idx] = useState<number | null>(0);
  const [blendColor2Idx, setBlendColor2Idx] = useState<number | null>(1);
  const [toast, setToast] = useState<ToastState | null>(null);

  const selectedColor = useMemo(
    () => palette.find((c) => c.id === selectedId) ?? null,
    [palette, selectedId]
  );

  useEffect(() => {
    if (selectedColor?.hex) {
      setCurrentPickerColor(selectedColor.hex);
    }
  }, [selectedId]);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const updateColorHex = useCallback(
    (id: string, hex: string) => {
      if (!isValidHex(hex)) return;
      const upper = hex.toUpperCase();
      setPalette((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const rgb = hexToRgb(upper);
          const hsl = hexToHsl(upper);
          return { ...c, hex: upper, rgb, hsl };
        })
      );
    },
    []
  );

  const handlePickerColorChange = useCallback(
    (hex: string) => {
      setCurrentPickerColor(hex);
      if (selectedId) {
        updateColorHex(selectedId, hex);
      }
    },
    [selectedId, updateColorHex]
  );

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      const color = palette.find((c) => c.id === id);
      if (color?.hex) setCurrentPickerColor(color.hex);
    },
    [palette]
  );

  const handleReorder = useCallback((fromIdx: number, toIdx: number) => {
    setPalette((prev) => {
      if (fromIdx < 0 || toIdx < 0 || fromIdx >= prev.length || toIdx >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }, []);

  const handleRemove = useCallback(
    (id: string) => {
      setPalette((prev) => {
        const idx = prev.findIndex((c) => c.id === id);
        if (idx === -1) return prev;
        const next = prev.map((c) => (c.id === id ? createEmptyPaletteColor() : c));
        return next;
      });
      if (selectedId === id) {
        setSelectedId(null);
      }
      showToast('颜色已移除');
    },
    [selectedId, showToast]
  );

  const handleAddSlot = useCallback(() => {
    setPalette((prev) => {
      if (prev.length >= MAX_SLOTS) return prev;
      return [...prev, createEmptyPaletteColor()];
    });
  }, []);

  const handleBlendAdd = useCallback(
    (hex: string) => {
      if (!isValidHex(hex)) return;
      setPalette((prev) => {
        const emptyIdx = prev.findIndex((c) => !c.hex);
        const newColor = createPaletteColor(hex);
        if (emptyIdx !== -1) {
          const next = [...prev];
          next[emptyIdx] = newColor;
          return next;
        }
        if (prev.length < MAX_SLOTS) {
          return [...prev, newColor];
        }
        showToast('调色板已满，无法添加更多颜色', false);
        return prev;
      });
      showToast(`混合色 ${hex.toUpperCase()} 已追加`);
    },
    [showToast]
  );

  const handleSelectBlendColor = useCallback((idx: number, which: 1 | 2) => {
    if (which === 1) setBlendColor1Idx(idx);
    else setBlendColor2Idx(idx);
  }, []);

  const handlePickHarmony = useCallback(
    (hex: string) => {
      if (!isValidHex(hex)) return;
      setPalette((prev) => {
        const emptyIdx = prev.findIndex((c) => !c.hex);
        const newColor = createPaletteColor(hex);
        if (emptyIdx !== -1) {
          const next = [...prev];
          next[emptyIdx] = newColor;
          return next;
        }
        if (prev.length < MAX_SLOTS) {
          return [...prev, newColor];
        }
        showToast('调色板已满', false);
        return prev;
      });
      showToast(`已添加调和色 ${hex.toUpperCase()}`);
    },
    [showToast]
  );

  return (
    <div className="app-container">
      <div className="gradient-bar" />
      <header className="app-header">
        <div>
          <div className="app-title">
            <Sparkles
              size={18}
              style={{ verticalAlign: '-3px', marginRight: '8px', opacity: 0.8 }}
            />
            Color Palette Studio
          </div>
          <div className="app-subtitle">交互式颜色调色板生成与分析工具</div>
        </div>
        <EmotionTags colors={palette} />
      </header>

      <main className="app-main">
        <section className="left-panel">
          <div className="panel">
            <PalettePreview
              colors={palette}
              selectedId={selectedId}
              onSelect={handleSelect}
              onReorder={handleReorder}
              onRemove={handleRemove}
              onAddSlot={handleAddSlot}
              maxColors={MAX_SLOTS}
            />
          </div>

          <div className="panel">
            <AnalysisPanel
              colors={palette}
              selectedHex={selectedColor?.hex ?? null}
            />
          </div>

          <div className="panel">
            <ExportToolbar colors={palette} onToast={showToast} />
          </div>
        </section>

        <section className="right-panel">
          <div className="panel">
            <ColorPicker
              currentColor={currentPickerColor}
              paletteColors={palette}
              onColorChange={handlePickerColorChange}
              onBlendAdd={handleBlendAdd}
              onSelectBlendColor={handleSelectBlendColor}
              blendColor1Idx={blendColor1Idx}
              blendColor2Idx={blendColor2Idx}
            />
          </div>

          <div className="panel">
            <ColorDetailPanel
              color={selectedColor}
              onPickHarmony={handlePickHarmony}
            />
          </div>
        </section>
      </main>

      {toast && (
        <div className={`toast ${toast.ok ? 'success' : ''}`} key={toast.id}>
          <CheckCircle2 size={16} className="toast-icon" />
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default App;
