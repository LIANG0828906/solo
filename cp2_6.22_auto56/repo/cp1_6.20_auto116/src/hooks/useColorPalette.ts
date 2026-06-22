import { useState, useCallback, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { HSLColor, HarmonyType, Palette, FavoriteItem } from '../types/color';
import { HARMONY_NAMES } from '../types/color';
import { generateAllHarmonies } from '../utils/harmonyAlgorithms';
import { applyGradientMapChunked } from '../utils/gradientMap';
import { addFavorite, removeFavorite, clearFavorites, loadFavorites } from '../utils/storage';

const DEFAULT_COLORS_PER_PALETTE = 5;

const createInitialPalette = (type: HarmonyType, colors: HSLColor[]): Palette => ({
  id: uuidv4(),
  name: HARMONY_NAMES[type],
  type,
  colors,
  locked: Array(colors.length).fill(false),
  createdAt: Date.now(),
});

export const useColorPalette = () => {
  const [baseColor, setBaseColor] = useState<HSLColor>({ h: 210, s: 70, l: 50 });
  const [selectedPaletteType, setSelectedPaletteType] = useState<HarmonyType>('analogous');
  const [gradientSteps, setGradientSteps] = useState<number>(5);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const [lockedMap, setLockedMap] = useState<Record<HarmonyType, (HSLColor | null)[]>>({
    monochromatic: Array(DEFAULT_COLORS_PER_PALETTE).fill(null),
    complementary: Array(DEFAULT_COLORS_PER_PALETTE).fill(null),
    analogous: Array(DEFAULT_COLORS_PER_PALETTE).fill(null),
    triadic: Array(DEFAULT_COLORS_PER_PALETTE).fill(null),
    tetradic: Array(DEFAULT_COLORS_PER_PALETTE).fill(null),
  });

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const harmonyColors = useMemo(() => {
    return generateAllHarmonies(baseColor, lockedMap, DEFAULT_COLORS_PER_PALETTE);
  }, [baseColor, lockedMap]);

  const palettes = useMemo<Record<HarmonyType, Palette>>(() => {
    const types: HarmonyType[] = ['monochromatic', 'complementary', 'analogous', 'triadic', 'tetradic'];
    return types.reduce((acc, type) => {
      acc[type] = createInitialPalette(type, harmonyColors[type]);
      return acc;
    }, {} as Record<HarmonyType, Palette>);
  }, [harmonyColors]);

  const selectedPalette = useMemo(() => {
    return palettes[selectedPaletteType];
  }, [palettes, selectedPaletteType]);

  const updateBaseColor = useCallback((color: HSLColor) => {
    setBaseColor(color);
  }, []);

  const updateBrightness = useCallback((brightness: number) => {
    setBaseColor(prev => ({ ...prev, l: brightness }));
  }, []);

  const updateSaturation = useCallback((saturation: number) => {
    setBaseColor(prev => ({ ...prev, s: saturation }));
  }, []);

  const updateHue = useCallback((hue: number) => {
    setBaseColor(prev => ({ ...prev, h: hue }));
  }, []);

  const randomizeBaseColor = useCallback(() => {
    const newColor: HSLColor = {
      h: Math.floor(Math.random() * 360),
      s: 50 + Math.floor(Math.random() * 40),
      l: 35 + Math.floor(Math.random() * 30),
    };
    setBaseColor(newColor);
  }, []);

  const toggleLockColor = useCallback((paletteType: HarmonyType, colorIndex: number) => {
    setLockedMap(prev => {
      const paletteLocks = [...prev[paletteType]];
      const currentColor = harmonyColors[paletteType][colorIndex];

      if (paletteLocks[colorIndex]) {
        paletteLocks[colorIndex] = null;
      } else {
        paletteLocks[colorIndex] = { ...currentColor };
      }

      return {
        ...prev,
        [paletteType]: paletteLocks,
      };
    });
  }, [harmonyColors]);

  const isColorLocked = useCallback((paletteType: HarmonyType, colorIndex: number): boolean => {
    return lockedMap[paletteType]?.[colorIndex] !== null;
  }, [lockedMap]);

  const applyGradientMapping = useCallback(async (
    imageData: ImageData,
    palette: HSLColor[],
    preserveLuminance: boolean = true
  ): Promise<ImageData | null> => {
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const sortedPalette = [...palette].sort((a, b) => a.l - b.l);
      const result = await applyGradientMapChunked(
        imageData,
        sortedPalette,
        preserveLuminance,
        5000,
        (progress) => setProcessingProgress(progress)
      );
      return result;
    } catch (error) {
      console.error('Gradient mapping failed:', error);
      return null;
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, []);

  const saveToFavorites = useCallback((palette: Palette, name?: string) => {
    const item: FavoriteItem = {
      id: uuidv4(),
      name: name || `${palette.name} - ${new Date().toLocaleTimeString()}`,
      palette: { ...palette, id: uuidv4(), createdAt: Date.now() },
      createdAt: Date.now(),
    };
    const updated = addFavorite(item);
    setFavorites(updated);
    return item;
  }, []);

  const deleteFavorite = useCallback((id: string) => {
    const updated = removeFavorite(id);
    setFavorites(updated);
  }, []);

  const clearAllFavorites = useCallback(() => {
    const updated = clearFavorites();
    setFavorites(updated);
  }, []);

  const applyFavoritePalette = useCallback((favorite: FavoriteItem) => {
    const { palette } = favorite;
    const firstUnlockedColor = palette.colors.find((_, i) => !palette.locked[i]);

    if (firstUnlockedColor) {
      setBaseColor(firstUnlockedColor);
    }

    setSelectedPaletteType(palette.type);

    setLockedMap(prev => ({
      ...prev,
      [palette.type]: palette.locked.map((locked, i) => locked ? { ...palette.colors[i] } : null),
    }));
  }, []);

  const setPaletteLockedState = useCallback((paletteType: HarmonyType, locked: boolean[]) => {
    setLockedMap(prev => {
      const currentColors = harmonyColors[paletteType];
      return {
        ...prev,
        [paletteType]: locked.map((l, i) => l ? { ...currentColors[i] } : null),
      };
    });
  }, [harmonyColors]);

  return {
    baseColor,
    updateBaseColor,
    updateBrightness,
    updateSaturation,
    updateHue,
    randomizeBaseColor,
    palettes,
    selectedPalette,
    selectedPaletteType,
    setSelectedPaletteType,
    toggleLockColor,
    isColorLocked,
    setPaletteLockedState,
    gradientSteps,
    setGradientSteps,
    applyGradientMapping,
    isProcessing,
    processingProgress,
    favorites,
    saveToFavorites,
    deleteFavorite,
    clearAllFavorites,
    applyFavoritePalette,
  };
};

export type UseColorPaletteReturn = ReturnType<typeof useColorPalette>;
