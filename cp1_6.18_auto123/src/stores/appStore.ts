import { create } from 'zustand';
import {
  AppState,
  FontGeneProfile,
  CharGlyph,
  InputMode,
  GENE_DEFAULTS,
} from '../types';

interface AppActions {
  setInputMode: (mode: InputMode) => void;
  setUploadedImage: (image: string | null) => void;
  setRecognizedGlyphs: (glyphs: CharGlyph[]) => void;
  updateGeneProfile: (partial: Partial<FontGeneProfile>) => void;
  setPreviewText: (text: string) => void;
  setExporting: (exporting: boolean) => void;
  setExportProgress: (progress: number) => void;
  setShowExportToast: (show: boolean) => void;
  resetAll: () => void;
}

export const useAppStore = create<AppState & AppActions>((set) => ({
  inputMode: 'upload',
  uploadedImage: null,
  recognizedGlyphs: [],
  geneProfile: { ...GENE_DEFAULTS },
  previewText: '永和天下之人大小国中',
  isExporting: false,
  exportProgress: 0,
  showExportToast: false,

  setInputMode: (mode) => set({ inputMode: mode }),
  setUploadedImage: (image) => set({ uploadedImage: image }),
  setRecognizedGlyphs: (glyphs) => set({ recognizedGlyphs: glyphs }),
  updateGeneProfile: (partial) =>
    set((state) => ({
      geneProfile: { ...state.geneProfile, ...partial },
    })),
  setPreviewText: (text) => set({ previewText: text }),
  setExporting: (exporting) => set({ isExporting: exporting }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  setShowExportToast: (show) => set({ showExportToast: show }),
  resetAll: () =>
    set({
      uploadedImage: null,
      recognizedGlyphs: [],
      geneProfile: { ...GENE_DEFAULTS },
      isExporting: false,
      exportProgress: 0,
    }),
}));

export const selectInputMode = (state: AppState) => state.inputMode;
export const selectUploadedImage = (state: AppState) => state.uploadedImage;
export const selectRecognizedGlyphs = (state: AppState) => state.recognizedGlyphs;
export const selectGeneProfile = (state: AppState) => state.geneProfile;
export const selectPreviewText = (state: AppState) => state.previewText;
export const selectIsExporting = (state: AppState) => state.isExporting;
export const selectExportProgress = (state: AppState) => state.exportProgress;
export const selectShowExportToast = (state: AppState) => state.showExportToast;
