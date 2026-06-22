import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import type { Layer, CardState, AnimationConfig, MusicConfig, Recipient, TextProperties, PreviewItem } from './types/card';
import { DEFAULT_ANIMATION, DEFAULT_MUSIC } from './types/card';
import { templates } from './data/templates';
import { replaceTemplateVars, generateThumbnail, exportHighResPng, exportAsZip } from './utils/export';
import { EditorCanvas } from './components/EditorCanvas';
import { TemplatePanel } from './components/TemplatePanel';
import { PropertyPanel } from './components/PropertyPanel';
import { PreviewGrid } from './components/PreviewGrid';

const uid = () => `layer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

interface CardContextType {
  state: CardState;
  selectedLayer: Layer | null;
  cardRef: React.RefObject<HTMLDivElement | null>;
  loadTemplate: (id: string) => void;
  selectLayer: (id: string | null) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  updateTextProps: (id: string, updates: Partial<TextProperties>) => void;
  addTextLayer: () => void;
  removeLayer: (id: string) => void;
  updateAnimation: (updates: Partial<AnimationConfig>) => void;
  updateMusic: (updates: Partial<MusicConfig>) => void;
  setRecipients: (r: Recipient[]) => void;
  generatePreviews: () => Promise<void>;
  exportCurrentPng: () => Promise<Blob | null>;
  exportAllAsZip: (onProgress?: (pct: number) => void) => Promise<void>;
  playAnimation: () => void;
}

const CardContext = createContext<CardContextType | null>(null);

export function useCard() {
  const ctx = useContext(CardContext);
  if (!ctx) throw new Error('useCard must be used within CardProvider');
  return ctx;
}

const initialState: CardState = {
  currentTemplateId: null,
  layers: [],
  selectedLayerId: null,
  animation: { ...DEFAULT_ANIMATION },
  music: { ...DEFAULT_MUSIC },
  recipients: [],
  previews: [],
};

export default function App() {
  const [state, setState] = useState<CardState>(initialState);
  const cardRef = useRef<HTMLDivElement>(null);
  const [animKey, setAnimKey] = useState(0);

  const loadTemplate = useCallback((templateId: string) => {
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;
    setState(prev => ({
      ...prev,
      currentTemplateId: templateId,
      layers: tpl.layers.map(l => ({ ...l, id: uid() })),
      animation: { ...tpl.animation },
      selectedLayerId: null,
      previews: [],
    }));
  }, []);

  const selectLayer = useCallback((layerId: string | null) => {
    setState(prev => ({ ...prev, selectedLayerId: layerId }));
  }, []);

  const updateLayer = useCallback((layerId: string, updates: Partial<Layer>) => {
    setState(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === layerId ? { ...l, ...updates } : l),
    }));
  }, []);

  const updateTextProps = useCallback((layerId: string, textUpdates: Partial<TextProperties>) => {
    setState(prev => ({
      ...prev,
      layers: prev.layers.map(l =>
        l.id === layerId && l.text ? { ...l, text: { ...l.text, ...textUpdates } } : l
      ),
    }));
  }, []);

  const addTextLayer = useCallback(() => {
    setState(prev => {
      const textCount = prev.layers.filter(l => l.type === 'text').length;
      if (textCount >= 3) return prev;
      const newLayer: Layer = {
        id: uid(),
        type: 'text',
        x: 100, y: 200 + textCount * 100,
        width: 400, height: 60,
        rotation: 0, opacity: 1, zIndex: 2 + textCount,
        text: {
          content: '请输入文字', fontFamily: 'noto-sans',
          fontSize: 24, lineHeight: 1.5, color: '#333333',
          textAlign: 'center', strokeColor: '#000000', strokeWidth: 0,
          shadowOffsetX: 0, shadowOffsetY: 0, shadowBlur: 0,
          shadowColor: 'rgba(0,0,0,0.5)',
        },
        label: `文字框${textCount + 1}`,
      };
      return { ...prev, layers: [...prev.layers, newLayer], selectedLayerId: newLayer.id };
    });
  }, []);

  const removeLayer = useCallback((layerId: string) => {
    setState(prev => ({
      ...prev,
      layers: prev.layers.filter(l => l.id !== layerId),
      selectedLayerId: prev.selectedLayerId === layerId ? null : prev.selectedLayerId,
    }));
  }, []);

  const updateAnimation = useCallback((updates: Partial<AnimationConfig>) => {
    setState(prev => ({ ...prev, animation: { ...prev.animation, ...updates } }));
  }, []);

  const updateMusic = useCallback((updates: Partial<MusicConfig>) => {
    setState(prev => {
      const newMusic = { ...prev.music, ...updates };
      if (updates.file) {
        if (prev.music.url) URL.revokeObjectURL(prev.music.url);
        newMusic.url = URL.createObjectURL(updates.file);
      }
      return { ...prev, music: newMusic };
    });
  }, []);

  const setRecipients = useCallback((recipients: Recipient[]) => {
    setState(prev => ({ ...prev, recipients }));
  }, []);

  const generatePreviews = useCallback(async () => {
    if (!cardRef.current || state.recipients.length === 0) return;
    const newPreviews: PreviewItem[] = [];
    for (const recipient of state.recipients) {
      try {
        const thumbUrl = await generateThumbnail(cardRef.current);
        newPreviews.push({ recipient, thumbnailUrl: thumbUrl });
      } catch {
        newPreviews.push({ recipient, thumbnailUrl: '' });
      }
    }
    setState(prev => ({ ...prev, previews: newPreviews }));
  }, [state.layers, state.recipients]);

  const exportCurrentPng = useCallback(async () => {
    if (!cardRef.current) return null;
    return exportHighResPng(cardRef.current);
  }, []);

  const exportAllAsZip = useCallback(async (onProgress?: (pct: number) => void) => {
    if (state.previews.length === 0 || !cardRef.current) return;
    const items: { name: string; blob: Blob }[] = [];
    for (let i = 0; i < state.previews.length; i++) {
      const blob = await exportHighResPng(cardRef.current);
      if (blob) items.push({ name: state.previews[i].recipient.name, blob });
      onProgress?.(Math.round(((i + 1) / state.previews.length) * 50));
    }
    await exportAsZip(items, onProgress);
  }, [state.previews]);

  const playAnimation = useCallback(() => {
    setAnimKey(k => k + 1);
  }, []);

  const selectedLayer = state.layers.find(l => l.id === state.selectedLayerId) || null;

  const ctx: CardContextType = {
    state, selectedLayer, cardRef,
    loadTemplate, selectLayer, updateLayer, updateTextProps,
    addTextLayer, removeLayer, updateAnimation, updateMusic,
    setRecipients, generatePreviews, exportCurrentPng, exportAllAsZip,
    playAnimation,
  };

  return (
    <CardContext.Provider value={ctx}>
      <div className="app-layout">
        <TemplatePanel />
        <div className="app-center">
          <EditorCanvas animKey={animKey} />
          <PreviewGrid />
        </div>
        <PropertyPanel />
      </div>
      <style>{`
        .app-layout {
          width: 100vw;
          height: 100vh;
          display: flex;
          background: var(--color-bg);
          overflow: hidden;
        }
        .app-center {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }
        @media (max-width: 1366px) {
          .app-layout {
            flex-direction: column;
          }
          .app-center {
            flex-direction: column;
            flex: 1;
          }
        }
        @media (max-width: 768px) {
          .app-layout {
            flex-direction: column;
          }
        }
      `}</style>
    </CardContext.Provider>
  );
}
