import { useState, useEffect, useCallback } from 'react';
import { Palette, Trash2, Save, Sparkles } from 'lucide-react';
import ColorExtractor from '@/components/ColorExtractor';
import ColorPanel from '@/components/ColorPanel';
import { getPalettes, savePalette, deletePalette, type ColorPalette } from '@/api/colorApi';

export default function App() {
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [currentColors, setCurrentColors] = useState<string[]>([]);
  const [savedPalettes, setSavedPalettes] = useState<ColorPalette[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadSavedPalettes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getPalettes();
      if (response.success && response.data) {
        setSavedPalettes(response.data);
      }
    } catch (error) {
      console.error('加载色板失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSavedPalettes();
  }, [loadSavedPalettes]);

  const handleColorsExtracted = useCallback((colors: string[]) => {
    setExtractedColors(colors);
    setCurrentColors(colors);
  }, []);

  const handleImageProcessed = useCallback((imageUrl: string) => {
    setCurrentImageUrl(imageUrl);
  }, []);

  const handleColorsChange = useCallback((colors: string[]) => {
    setCurrentColors(colors);
  }, []);

  const handleSavePalette = useCallback(async () => {
    if (currentColors.length === 0) return;

    setIsLoading(true);
    try {
      const response = await savePalette(currentColors, undefined, currentImageUrl || undefined);
      if (response.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        await loadSavedPalettes();
      }
    } catch (error) {
      console.error('保存色板失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentColors, currentImageUrl, loadSavedPalettes]);

  const handleDeletePalette = useCallback(
    async (id: string) => {
      try {
        await deletePalette(id);
        setSavedPalettes((prev) => prev.filter((p) => p.id !== id));
      } catch (error) {
        console.error('删除色板失败:', error);
      }
    },
    []
  );

  const handleLoadPalette = useCallback((palette: ColorPalette) => {
    setExtractedColors(palette.colors);
    setCurrentColors(palette.colors);
    if (palette.imageUrl) {
      setCurrentImageUrl(palette.imageUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400 flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">灵感调色板</h1>
              <p className="text-xs text-gray-500">从图片中提取配色方案</p>
            </div>
          </div>
          {saveSuccess && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium animate-bounce">
              <Save className="w-4 h-4" />
              保存成功
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">上传图片</h2>
          </div>
          <ColorExtractor
            onColorsExtracted={handleColorsExtracted}
            onImageProcessed={handleImageProcessed}
          />
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">提取的色彩</h2>
              {currentColors.length > 0 && (
                <span className="text-sm text-gray-500">({currentColors.length}种)</span>
              )}
            </div>
          </div>
          <ColorPanel
            colors={currentColors}
            onColorsChange={handleColorsChange}
            onSave={handleSavePalette}
          />
        </section>

        {savedPalettes.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Save className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">我的色板库</h2>
                <span className="text-sm text-gray-500">({savedPalettes.length}个)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedPalettes.map((palette) => (
                <div
                  key={palette.id}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1"
                >
                  <div
                    className="h-24 flex"
                    onClick={() => handleLoadPalette(palette)}
                  >
                    {palette.colors.map((color, i) => (
                      <div
                        key={i}
                        className="flex-1 transition-all duration-300"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {palette.colors.length} 种色彩
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(palette.createdAt)}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePalette(palette.id);
                      }}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {savedPalettes.length === 0 && !isLoading && extractedColors.length === 0 && (
          <section className="text-center py-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200">
            <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">还没有保存的色板</h3>
            <p className="text-gray-500 text-sm">上传图片提取色彩，然后保存你的第一个配色方案</p>
          </section>
        )}
      </main>

      <footer className="border-t border-gray-100 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center text-sm text-gray-500">
          灵感调色板 — 为创意工作者打造的色彩提取工具
        </div>
      </footer>
    </div>
  );
}
