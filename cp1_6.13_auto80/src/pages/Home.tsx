import { useRef, useState } from 'react';
import PatternCanvas, { PatternCanvasRef } from '@/components/PatternCanvas';
import ParamPanel from '@/components/ParamPanel';
import PatternGallery from '@/components/PatternGallery';
import ExportDialog from '@/components/ExportDialog';
import { usePatternStore } from '@/store/patternStore';
import { Download, Hexagon } from 'lucide-react';

export default function Home() {
  const canvasRef = useRef<PatternCanvasRef>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const { params } = usePatternStore();

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0f0f23] text-[#e0e0e0] overflow-hidden">
      <header className="h-14 flex items-center justify-between px-4 border-b border-gray-800 bg-[#1a1a2e]/80 backdrop-blur-sm z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Hexagon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            GeoPatternLab
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-2 px-4 py-2
                       bg-gradient-to-r from-indigo-600 to-purple-600
                       hover:from-indigo-500 hover:to-purple-500
                       text-white text-sm font-medium rounded-lg
                       transition-all duration-300 ease-out
                       hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5
                       active:translate-y-0"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">导出 / 保存</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <ParamPanel />

        <main className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="flex-1 min-h-0 relative">
            <PatternCanvas ref={canvasRef} params={params} />

            <div className="absolute top-3 left-3 text-xs text-gray-500 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg pointer-events-none">
              <span>滚轮缩放 · 拖拽平移</span>
            </div>
          </div>

          <PatternGallery />
        </main>
      </div>

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        canvasRef={canvasRef}
        params={params}
      />
    </div>
  );
}
