import { create } from 'zustand';
import type { Font, FilterState, PreviewParams, FontCategory, FontTag } from '@/types/font';
import fontsData from '@/data/fonts.json';

function filterFonts(fonts: Font[], filter: FilterState): Font[] {
  return fonts.filter((font) => {
    if (filter.category !== 'all' && font.category !== filter.category) return false;
    if (filter.tags.length > 0 && !filter.tags.some((t) => font.tags.includes(t))) return false;
    if (filter.searchText && !font.name.toLowerCase().includes(filter.searchText.toLowerCase())) return false;
    return true;
  });
}

interface FontStoreState {
  fonts: Font[];
  filter: FilterState;
  selectedFontId: string | null;
  selectedFontLoading: boolean;
  compareFontIds: string[];
  previewParams: PreviewParams;
  filteredFonts: Font[];
  setFilterCategory: (c: FontCategory | 'all') => void;
  toggleFilterTag: (t: FontTag) => void;
  setSearchText: (t: string) => void;
  selectFont: (id: string) => void;
  setFontLoading: (loading: boolean) => void;
  toggleCompareFont: (id: string) => void;
  setPreviewParams: (p: Partial<PreviewParams>) => void;
}

const initialFilter: FilterState = {
  category: 'all',
  tags: [],
  searchText: '',
};

const initialPreviewParams: PreviewParams = {
  text: 'The quick brown fox jumps over the lazy dog.',
  fontSize: 24,
  lineHeight: 1.4,
  color: '#333333',
  backgroundColor: '#FFFFFF',
};

const fonts: Font[] = fontsData as Font[];

export const useFontStore = create<FontStoreState>((set, get) => ({
  fonts,
  filter: initialFilter,
  selectedFontId: null,
  selectedFontLoading: false,
  compareFontIds: [],
  previewParams: initialPreviewParams,
  filteredFonts: filterFonts(fonts, initialFilter),

  setFilterCategory: (category) => {
    const newFilter = { ...get().filter, category };
    set({ filter: newFilter, filteredFonts: filterFonts(get().fonts, newFilter) });
  },

  toggleFilterTag: (tag) => {
    const currentTags = get().filter.tags;
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    const newFilter = { ...get().filter, tags: newTags };
    set({ filter: newFilter, filteredFonts: filterFonts(get().fonts, newFilter) });
  },

  setSearchText: (searchText) => {
    const newFilter = { ...get().filter, searchText };
    set({ filter: newFilter, filteredFonts: filterFonts(get().fonts, newFilter) });
  },

  selectFont: (id) => {
    set({ selectedFontId: id, selectedFontLoading: true });
  },

  setFontLoading: (loading) => {
    set({ selectedFontLoading: loading });
  },

  toggleCompareFont: (id) => {
    const current = get().compareFontIds;
    if (current.includes(id)) {
      set({ compareFontIds: current.filter((fid) => fid !== id) });
    } else if (current.length < 4) {
      set({ compareFontIds: [...current, id] });
    }
  },

  setPreviewParams: (params) => {
    set({ previewParams: { ...get().previewParams, ...params } });
  },
}));
