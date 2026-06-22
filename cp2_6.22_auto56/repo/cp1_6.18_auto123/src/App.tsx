import React, { useEffect } from 'react';
import { FontCanvas } from './components/FontCanvas';
import { ControlPanel } from './components/ControlPanel';
import { PreviewArea } from './components/PreviewArea';
import { useAppStore, selectShowExportToast } from './stores/appStore';
import { FontRecognizer } from './engine/fontRecognizer';

const App: React.FC = () => {
  const showExportToast = useAppStore(selectShowExportToast);
  const setRecognizedGlyphs = useAppStore((state) => state.setRecognizedGlyphs);

  useEffect(() => {
    const defaultGlyphs = FontRecognizer.getPredefinedGlyphs();
    setRecognizedGlyphs(defaultGlyphs);
  }, [setRecognizedGlyphs]);

  return (
    <div className="min-h-screen bg-[#1E1E2E] text-white">
      <header className="py-4 px-6 border-b border-[#2D2D44]">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#4ECDC4] flex items-center justify-center">
              <span className="text-white font-bold text-lg">基</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">字体基因编辑器</h1>
              <p className="text-[12px] text-[#888899]">Font Gene Editor</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[12px] text-[#888899]">
            <span className="px-2 py-1 rounded-md bg-[#2D2D44]">React</span>
            <span className="px-2 py-1 rounded-md bg-[#2D2D44]">TypeScript</span>
            <span className="px-2 py-1 rounded-md bg-[#2D2D44]">Zustand</span>
            <span className="px-2 py-1 rounded-md bg-[#2D2D44]">Vite</span>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-[60%] flex flex-col">
            <FontCanvas />
          </div>

          <div className="w-full md:w-[40%] flex flex-col gap-4">
            <ControlPanel />
            <PreviewArea />
          </div>
        </div>
      </main>

      <footer className="py-4 px-6 border-t border-[#2D2D44] mt-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-[12px] text-[#6B6B7B]">
          <p>© 2026 字体基因编辑器 | 让每个字符都有独特的基因</p>
          <p>
            支持字体：
            <span className="text-[#4ECDC4] mx-1">楷体</span>
            <span className="text-[#FF6584] mx-1">行书</span>
            <span className="text-[#6C63FF] mx-1">黑体</span>
            及自定义风格
          </p>
        </div>
      </footer>

      {showExportToast && (
        <div
          className="
            fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
            bg-black/80 text-white px-8 py-4 rounded-xl text-lg font-medium
            z-50 pointer-events-none
            animate-[fadeInOut_2s_ease-in-out_forwards]
          "
        >
          字体已导出 ✓
        </div>
      )}

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        }
        
        @media (max-width: 767px) {
          .md\\:w-\\[60\\%\\] {
            width: 100% !important;
          }
          .md\\:w-\\[40\\%\\] {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
