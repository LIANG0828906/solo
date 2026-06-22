import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  BrandState,
  BrandContextType,
  CanvasElement,
  FontConfig,
  CanvasPreset,
  BrandColor,
} from '../types';

const DEFAULT_PRESETS: CanvasPreset[] = [
  { id: 'preset-1', name: '竖版海报', width: 1080, height: 1920 },
  { id: 'preset-2', name: '公众号首图', width: 1200, height: 630 },
  { id: 'preset-3', name: 'Instagram帖子', width: 1080, height: 1080 },
  { id: 'preset-4', name: '网页Banner', width: 1920, height: 1080 },
];

const DEFAULT_COLOR_PALETTE: BrandColor[] = [
  { name: '深蓝', value: '#2C3E50' },
  { name: '珊瑚红', value: '#E74C3C' },
  { name: '橙黄', value: '#F39C12' },
  { name: '翠绿', value: '#27AE60' },
  { name: '天蓝', value: '#3498DB' },
  { name: '紫罗兰', value: '#9B59B6' },
  { name: '深黑', value: '#1A1A2E' },
  { name: '品红', value: '#E91E63' },
  { name: '青色', value: '#00BCD4' },
  { name: '石灰', value: '#CDDC39' },
  { name: '米白', value: '#F5F5DC' },
  { name: '银灰', value: '#95A5A6' },
];

const DEFAULT_TITLE_FONT: FontConfig = {
  family: 'Inter',
  size: 32,
  weight: 700,
  lineHeight: 1.2,
};

const DEFAULT_BODY_FONT: FontConfig = {
  family: 'Inter',
  size: 16,
  weight: 400,
  lineHeight: 1.5,
};

export function useBrandState(): BrandContextType {
  const [brandName, setBrandName] = useState('Unbranded');
  const [logoSrc, setLogoSrcState] = useState<string | null>(null);
  const [colorPalette, setColorPalette] = useState<BrandColor[]>(DEFAULT_COLOR_PALETTE);
  const [selectedColor, setSelectedColor] = useState('#2C3E50');
  const [titleFont, setTitleFont] = useState<FontConfig>(DEFAULT_TITLE_FONT);
  const [bodyFont, setBodyFont] = useState<FontConfig>(DEFAULT_BODY_FONT);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [presets] = useState<CanvasPreset[]>(DEFAULT_PRESETS);

  const updateBrandName = useCallback((name: string) => {
    setBrandName(name);
  }, []);

  const setLogoSrc = useCallback((src: string | null) => {
    setLogoSrcState(src);
    if (src) {
      const preset = DEFAULT_PRESETS[0];
      const maxWidth = preset.width * 0.6;
      setElements((prev) => {
        const logoId = prev.find((el) => el.type === 'logo')?.id;
        if (logoId) {
          return prev.map((el) =>
            el.type === 'logo' ? { ...el, src, scale: 1 } as CanvasElement : el
          );
        }
        return [
          ...prev,
          {
            id: uuidv4(),
            type: 'logo',
            src,
            x: 20,
            y: 20,
            width: maxWidth,
            height: maxWidth,
            scale: 1,
            rotation: 0,
            zIndex: prev.length,
          } as CanvasElement,
        ];
      });
    }
  }, []);

  const addCustomColor = useCallback((color: string) => {
    setColorPalette((prev) => {
      const exists = prev.some((c) => c.value.toLowerCase() === color.toLowerCase());
      if (exists) return prev;
      return [...prev, { name: `自定义${prev.length - 11}`, value: color }];
    });
    setSelectedColor(color);
  }, []);

  const selectColor = useCallback((color: string) => {
    setSelectedColor(color);
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== selectedElementId) return el;
        if (el.type === 'rectangle') {
          return { ...el, fill: color } as CanvasElement;
        }
        if (el.type === 'text') {
          return { ...el, color } as CanvasElement;
        }
        return el;
      })
    );
  }, [selectedElementId]);

  const updateTitleFont = useCallback((font: Partial<FontConfig>) => {
    setTitleFont((prev) => ({ ...prev, ...font }));
  }, []);

  const updateBodyFont = useCallback((font: Partial<FontConfig>) => {
    setBodyFont((prev) => ({ ...prev, ...font }));
  }, []);

  const addElement = useCallback(
    (element: Omit<CanvasElement, 'id' | 'zIndex'>) => {
      const newElement: CanvasElement = {
        ...element,
        id: uuidv4(),
        zIndex: elements.length,
      } as CanvasElement;
      setElements((prev) => [...prev, newElement]);
      setSelectedElementId(newElement.id);
    },
    [elements.length]
  );

  const updateElementPosition = useCallback((id: string, x: number, y: number) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, x, y } : el))
    );
  }, []);

  const updateElementContent = useCallback(
    (id: string, updates: Partial<CanvasElement>) => {
      setElements((prev) =>
        prev.map((el) => (el.id === id ? ({ ...el, ...updates } as CanvasElement) : el))
      );
    },
    []
  );

  const selectElement = useCallback((id: string | null) => {
    setSelectedElementId(id);
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedElementId(null);
  }, []);

  const value = useMemo<BrandContextType>(
    () => ({
      brandName,
      logoSrc,
      colorPalette,
      selectedColor,
      titleFont,
      bodyFont,
      elements,
      selectedElementId,
      presets,
      updateBrandName,
      setLogoSrc,
      addCustomColor,
      selectColor,
      updateTitleFont,
      updateBodyFont,
      addElement,
      updateElementPosition,
      updateElementContent,
      selectElement,
      deleteElement,
    }),
    [
      brandName,
      logoSrc,
      colorPalette,
      selectedColor,
      titleFont,
      bodyFont,
      elements,
      selectedElementId,
      presets,
      updateBrandName,
      setLogoSrc,
      addCustomColor,
      selectColor,
      updateTitleFont,
      updateBodyFont,
      addElement,
      updateElementPosition,
      updateElementContent,
      selectElement,
      deleteElement,
    ]
  );

  return value;
}
