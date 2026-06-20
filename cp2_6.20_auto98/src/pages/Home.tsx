import { useEffect, useState } from 'react';
import UploadArea from '@/components/UploadArea';
import ExtractedColors from '@/components/ExtractedColors';
import PalettePanel from '@/components/PalettePanel';
import SavedPalettes from '@/components/SavedPalettes';
import ExportModal from '@/components/ExportModal';
import Header from '@/components/Header';
import { useAppStore } from '@/store/useAppStore';
import { extractColors } from '@/modules/colorExtractor';
import {
  generateMonochromatic,
  generateComplementary,
  generateTriadic,
} from '@/modules/paletteGenerator';
import type { Color, SavedPalette, GeneratedPaletteType } from '@/types';

export default function Home() {
  const themeMode = useAppStore((s) => s.themeMode);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const setPalettes = useAppStore((s) => s.setPalettes);
  const initFromLocalStorage = useAppStore((s) => s.initFromLocalStorage);
  const palettes = useAppStore((s) => s.palettes);
  const lockedIndices = useAppStore((s) => s.lockedIndices);
  const activeType = useAppStore((s) => s.activeType);
  const onActiveTypeChange = useAppStore((s) => s.onActiveTypeChange);
  const onColorClick = useAppStore((s) => s.onColorClick);
  const onColorChange = useAppStore((s) => s.onColorChange);
  const savedPalettes = useAppStore((s) => s.savedPalettes);
  const searchKeyword = useAppStore((s) => s.searchKeyword);
  const filterTag = useAppStore((s) => s.filterTag);
  const onSearch = useAppStore((s) => s.onSearch);
  const onFilterTag = useAppStore((s) => s.onFilterTag);
  const onLoad = useAppStore((s) => s.onLoad);
  const onDelete = useAppStore((s) => s.onDelete);
  const savePalette = useAppStore((s) => s.savePalette);
  const activePaletteType = useAppStore((s) => s.activePaletteType);
  const exportModalOpen = useAppStore((s) => s.exportModalOpen);
  const exportPalette = useAppStore((s) => s.exportPalette);
  const setExportModalOpen = useAppStore((s) => s.setExportModalOpen);
  const setExportPalette = useAppStore((s) => s.setExportPalette);

  const [showSavePrompt, setShowSavePrompt] = useState(false);

  useEffect(() => {
    initFromLocalStorage();
  }, [initFromLocalStorage]);

  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxSize = 800;
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);

        const colors = extractColors(imageData, 5);

        if (colors.length > 0) {
          const baseColor = colors[0];
          setPalettes({
            extracted: colors,
            monochromatic: generateMonochromatic(baseColor),
            complementary: generateComplementary(baseColor),
            triadic: generateTriadic(baseColor),
          });
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const generatedPalettes = {
    monochromatic: palettes.monochromatic,
    complementary: palettes.complementary,
    triadic: palettes.triadic,
  };

  const hasPalette = palettes.extracted.length > 0 ||
    palettes.monochromatic.length > 0 ||
    palettes.complementary.length > 0 ||
    palettes.triadic.length > 0;

  const handleSaveClick = () => {
    setShowSavePrompt(true);
  };

  const handleSaveConfirm = () => {
    const nameInput = prompt('请输入配色方案名称：', '我的配色方案');
    if (!nameInput) {
      setShowSavePrompt(false);
      return;
    }
    const tagsInput = prompt('请输入标签（用逗号分隔）：', '');
    const tags = tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : [];
    savePalette(nameInput, tags);
    setShowSavePrompt(false);
  };

  const handleExportClick = () => {
    const currentColors: Color[] = palettes[activePaletteType] || [];
    if (currentColors.length === 0) return;

    const exportData = {
      id: 'temp',
      name: `导出 - ${activePaletteType}`,
      colors: currentColors,
      type: activePaletteType,
      tags: [] as string[],
      createdAt: Date.now(),
    };
    setExportPalette(exportData);
    setExportModalOpen(true);
  };

  const handleExportClose = () => {
    setExportModalOpen(false);
    setExportPalette(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        themeMode={themeMode}
        onThemeToggle={toggleTheme}
        onExportClick={handleExportClick}
        onSaveClick={handleSaveConfirm}
        hasPalette={hasPalette}
      />

      <main className="p-4 lg:p-6">
        <div className="flex gap-4 lg:gap-6 h-[calc(100vh-80px)] min-h-[600px]">
          <aside
            className="flex flex-col gap-4 flex-shrink-0 overflow-y-auto"
            style={{ width: '300px' }}
          >
            <UploadArea onFileSelect={processImage} />
            <ExtractedColors />
          </aside>

          <section className="flex-1 min-w-0">
            <PalettePanel
              palettes={generatedPalettes}
              lockedIndices={lockedIndices}
              activeType={activeType as GeneratedPaletteType}
              onActiveTypeChange={onActiveTypeChange}
              onColorClick={onColorClick}
              onColorChange={onColorChange}
            />
          </section>

          <aside
            className="hidden lg:flex flex-shrink-0 overflow-y-auto"
            style={{ width: '320px' }}
          >
            <SavedPalettes
              palettes={savedPalettes as SavedPalette[]}
              searchKeyword={searchKeyword}
              filterTag={filterTag}
              onSearch={onSearch}
              onFilterTag={onFilterTag}
              onLoad={onLoad}
              onDelete={onDelete}
            />
          </aside>
        </div>
      </main>

      <ExportModal
        palette={exportPalette ? { colors: exportPalette.colors, name: exportPalette.name } : null}
        onClose={handleExportClose}
      />
    </div>
  );
}
