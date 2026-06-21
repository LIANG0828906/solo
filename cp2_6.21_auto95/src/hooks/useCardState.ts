import { useState, useCallback, useRef } from 'react';
import type {
  CardState,
  Layer,
  AnimationConfig,
  MusicConfig,
  Recipient,
  PreviewItem,
  TextProperties,
} from '../types/card';
import { DEFAULT_ANIMATION, DEFAULT_MUSIC } from '../types/card';
import { templates } from '../data/templates';
import { replaceTemplateVars, generateThumbnail, exportHighResPng, exportAsZip } from '../utils/export';

const uid = () => `layer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const initialState: CardState = {
  currentTemplateId: null,
  layers: [],
  selectedLayerId: null,
  animation: { ...DEFAULT_ANIMATION },
  music: { ...DEFAULT_MUSIC },
  recipients: [],
  previews: [],
};

export function useCardState() {
  const [state, setState] = useState<CardState>(initialState);
  const cardRef = useRef<HTMLDivElement>(null);

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
      layers: prev.layers.map(l =>
        l.id === layerId ? { ...l, ...updates } : l
      ),
    }));
  }, []);

  const updateTextProps = useCallback((layerId: string, textUpdates: Partial<TextProperties>) => {
    setState(prev => ({
      ...prev,
      layers: prev.layers.map(l =>
        l.id === layerId && l.text
          ? { ...l, text: { ...l.text, ...textUpdates } }
          : l
      ),
    }));
  }, []);

  const addTextLayer = useCallback(() => {
    const textCount = state.layers.filter(l => l.type === 'text').length;
    if (textCount >= 3) return;
    const newLayer: Layer = {
      id: uid(),
      type: 'text',
      x: 100,
      y: 200 + textCount * 100,
      width: 400,
      height: 60,
      rotation: 0,
      opacity: 1,
      zIndex: 2 + textCount,
      text: {
        content: '请输入文字',
        fontFamily: 'noto-sans',
        fontSize: 24,
        lineHeight: 1.5,
        color: '#333333',
        textAlign: 'center',
        strokeColor: '#000000',
        strokeWidth: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowBlur: 0,
        shadowColor: 'rgba(0,0,0,0.5)',
      },
      label: `文字框${textCount + 1}`,
    };
    setState(prev => ({
      ...prev,
      layers: [...prev.layers, newLayer],
      selectedLayerId: newLayer.id,
    }));
  }, [state.layers]);

  const removeLayer = useCallback((layerId: string) => {
    setState(prev => ({
      ...prev,
      layers: prev.layers.filter(l => l.id !== layerId),
      selectedLayerId: prev.selectedLayerId === layerId ? null : prev.selectedLayerId,
    }));
  }, []);

  const updateAnimation = useCallback((updates: Partial<AnimationConfig>) => {
    setState(prev => ({
      ...prev,
      animation: { ...prev.animation, ...updates },
    }));
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
    for (let i = 0; i < state.recipients.length; i++) {
      const recipient = state.recipients[i];
      const mergedLayers = replaceTemplateVars(state.layers, recipient);
      const previewEl = cardRef.current.cloneNode(true) as HTMLElement;
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
    const blob = await exportHighResPng(cardRef.current);
    return blob;
  }, []);

  const exportAllAsZip = useCallback(async (onProgress?: (pct: number) => void) => {
    if (state.previews.length === 0) return;
    const items: { name: string; blob: Blob }[] = [];
    for (let i = 0; i < state.previews.length; i++) {
      const preview = state.previews[i];
      if (cardRef.current) {
        const blob = await exportHighResPng(cardRef.current);
        if (blob) items.push({ name: preview.recipient.name, blob });
      }
      onProgress?.(Math.round(((i + 1) / state.previews.length) * 100));
    }
    await exportAsZip(items, onProgress);
  }, [state.previews]);

  const selectedLayer = state.layers.find(l => l.id === state.selectedLayerId) || null;

  return {
    state,
    selectedLayer,
    cardRef,
    loadTemplate,
    selectLayer,
    updateLayer,
    updateTextProps,
    addTextLayer,
    removeLayer,
    updateAnimation,
    updateMusic,
    setRecipients,
    generatePreviews,
    exportCurrentPng,
    exportAllAsZip,
  };
}
