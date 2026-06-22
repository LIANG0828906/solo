import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Palette, ColorSwatch } from './types';
import * as Store from './PaletteStore';

interface PaletteContextValue {
  palettes: Palette[];
  selectedId: string | null;
  selectedPalette: Palette | null;
  loading: boolean;
  createPalette: () => Promise<Palette>;
  removePalette: (id: string) => Promise<void>;
  selectPalette: (id: string) => void;
  updateName: (id: string, name: string) => Promise<void>;
  setRating: (id: string, rating: number) => Promise<void>;
  addTag: (id: string, tag: string) => Promise<void>;
  removeTag: (id: string, tag: string) => Promise<void>;
  addColor: (id: string, hex: string) => Promise<void>;
  removeColor: (paletteId: string, colorId: string) => Promise<void>;
  reorderColors: (
    paletteId: string,
    fromIndex: number,
    toIndex: number
  ) => Promise<void>;
  filterTags: string[];
  setFilterTags: React.Dispatch<React.SetStateAction<string[]>>;
  minRating: number;
  setMinRating: React.Dispatch<React.SetStateAction<number>>;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  allTags: string[];
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

export const PaletteProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [search, setSearch] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [list, tags] = await Promise.all([
      Store.getAllPalettes(),
      Store.getAllTags(),
    ]);
    setPalettes(list);
    setAllTags(tags);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll().then(() => {
      Store.getAllPalettes().then((list) => {
        if (list.length > 0) {
          setSelectedId((prev) => prev || list[0].id);
        }
      });
    });
  }, [loadAll]);

  const refresh = useCallback(async () => {
    const [list, tags] = await Promise.all([
      Store.getAllPalettes(),
      Store.getAllTags(),
    ]);
    setPalettes(list);
    setAllTags(tags);
  }, []);

  const selectedPalette = useMemo(
    () => palettes.find((p) => p.id === selectedId) ?? null,
    [palettes, selectedId]
  );

  const createPalette = useCallback(async () => {
    const created = await Store.createPalette();
    await refresh();
    setSelectedId(created.id);
    return created;
  }, [refresh]);

  const removePalette = useCallback(
    async (id: string) => {
      await Store.deletePalette(id);
      await refresh();
      if (selectedId === id) {
        setSelectedId((prev) => {
          const list = palettes.filter((p) => p.id !== id);
          return list[0]?.id ?? null;
        });
      }
    },
    [palettes, refresh, selectedId]
  );

  const selectPalette = useCallback((id: string) => setSelectedId(id), []);

  const updateName = useCallback(
    async (id: string, name: string) => {
      await Store.updatePalette(id, { name });
      await refresh();
    },
    [refresh]
  );

  const setRating = useCallback(
    async (id: string, rating: number) => {
      await Store.updatePalette(id, { rating });
      await refresh();
    },
    [refresh]
  );

  const addTag = useCallback(
    async (id: string, tag: string) => {
      const pal = palettes.find((p) => p.id === id);
      if (!pal) return;
      if (pal.tags.includes(tag)) return;
      await Store.updatePalette(id, { tags: [...pal.tags, tag] });
      await refresh();
    },
    [palettes, refresh]
  );

  const removeTag = useCallback(
    async (id: string, tag: string) => {
      const pal = palettes.find((p) => p.id === id);
      if (!pal) return;
      await Store.updatePalette(id, {
        tags: pal.tags.filter((t) => t !== tag),
      });
      await refresh();
    },
    [palettes, refresh]
  );

  const addColor = useCallback(
    async (id: string, hex: string) => {
      await Store.addColorToPalette(id, hex);
      await refresh();
    },
    [refresh]
  );

  const removeColor = useCallback(
    async (paletteId: string, colorId: string) => {
      await Store.removeColorFromPalette(paletteId, colorId);
      await refresh();
    },
    [refresh]
  );

  const reorderColors = useCallback(
    async (paletteId: string, fromIndex: number, toIndex: number) => {
      await Store.reorderColors(paletteId, fromIndex, toIndex);
      await refresh();
    },
    [refresh]
  );

  const value = useMemo<PaletteContextValue>(
    () => ({
      palettes,
      selectedId,
      selectedPalette,
      loading,
      createPalette,
      removePalette,
      selectPalette,
      updateName,
      setRating,
      addTag,
      removeTag,
      addColor,
      removeColor,
      reorderColors,
      filterTags,
      setFilterTags,
      minRating,
      setMinRating,
      search,
      setSearch,
      allTags,
    }),
    [
      palettes,
      selectedId,
      selectedPalette,
      loading,
      createPalette,
      removePalette,
      selectPalette,
      updateName,
      setRating,
      addTag,
      removeTag,
      addColor,
      removeColor,
      reorderColors,
      filterTags,
      minRating,
      search,
      allTags,
    ]
  );

  return (
    <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
  );
};

export const usePalette = () => {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error('usePalette must be used within PaletteProvider');
  return ctx;
};
