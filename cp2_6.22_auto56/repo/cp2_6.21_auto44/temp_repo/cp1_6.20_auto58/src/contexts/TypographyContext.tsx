import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Preset, TypographyParams } from '../types';

const FONT_KEY = 'font_pairing_studio_fonts';
const PRESETS_KEY = 'font_pairing_studio_presets';

const defaultParams: TypographyParams = {
  headingFont: 'Merriweather',
  bodyFont: 'Roboto',
  headingSize: 42,
  bodySize: 18,
  lineHeight: 1.6,
  letterSpacing: 0,
  paragraphSpacing: 16,
  textAlign: 'left',
  deviceWidth: 1280,
};

interface TypographyContextValue {
  params: TypographyParams;
  updateParams: (partial: Partial<TypographyParams>) => void;
  setHeadingFont: (name: string) => void;
  setBodyFont: (name: string) => void;
  presets: Preset[];
  savePreset: (name?: string) => Preset;
  applyPreset: (id: string) => void;
  lastSavedPreset: Preset | null;
}

const TypographyContext = createContext<TypographyContextValue | null>(null);

export function TypographyProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useState<TypographyParams>(() => {
    try {
      const savedFonts = localStorage.getItem(FONT_KEY);
      if (savedFonts) {
        const parsed = JSON.parse(savedFonts);
        return { ...defaultParams, ...parsed };
      }
    } catch {
    }
    return defaultParams;
  });

  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const saved = localStorage.getItem(PRESETS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
    }
    return [];
  });

  const [lastSavedPreset, setLastSavedPreset] = useState<Preset | null>(null);

  useEffect(() => {
    localStorage.setItem(
      FONT_KEY,
      JSON.stringify({
        headingFont: params.headingFont,
        bodyFont: params.bodyFont,
      })
    );
  }, [params.headingFont, params.bodyFont]);

  useEffect(() => {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  }, [presets]);

  const updateParams = (partial: Partial<TypographyParams>) => {
    setParams((prev) => ({ ...prev, ...partial }));
  };

  const setHeadingFont = (name: string) => {
    setParams((prev) => ({ ...prev, headingFont: name }));
  };

  const setBodyFont = (name: string) => {
    setParams((prev) => ({ ...prev, bodyFont: name }));
  };

  const savePreset = (name?: string): Preset => {
    const newPreset: Preset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: name ?? `Preset ${presets.length + 1}`,
      params: { ...params },
      createdAt: Date.now(),
    };
    setPresets((prev) => [...prev, newPreset]);
    setLastSavedPreset(newPreset);
    return newPreset;
  };

  const applyPreset = (id: string) => {
    const preset = presets.find((p) => p.id === id);
    if (preset) {
      setParams({ ...preset.params });
    }
  };

  const value = useMemo(
    () => ({
      params,
      updateParams,
      setHeadingFont,
      setBodyFont,
      presets,
      savePreset,
      applyPreset,
      lastSavedPreset,
    }),
    [params, presets, lastSavedPreset]
  );

  return (
    <TypographyContext.Provider value={value}>
      {children}
    </TypographyContext.Provider>
  );
}

export function useTypography() {
  const ctx = useContext(TypographyContext);
  if (!ctx) {
    throw new Error('useTypography must be used within TypographyProvider');
  }
  return ctx;
}
