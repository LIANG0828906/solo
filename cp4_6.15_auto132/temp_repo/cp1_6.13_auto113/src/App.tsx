import { useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle, Download } from 'lucide-react';
import { ControlPanel } from './modules/editor/ControlPanel';
import { CanvasView } from './modules/editor/CanvasView';
import { generatePattern, type MosaicCell, type GridType } from './modules/generator';
import { exportSVG, exportPNG } from './modules/export/ExportManager';

const DEFAULT_PALETTE = ['#9d4edd', '#7b2cbf', '#5a189a', '#3c096c', '#240046', '#10002b'];
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 480;

function App() {
  const [palette, setPalette] = useState<string[]>(DEFAULT_PALETTE);
  const [gridType, setGridType] = useState<GridType>('square');
  const [density, setDensity] = useState(20);
  const [cells, setCells] = useState<MosaicCell[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [showExportProgress, setShowExportProgress] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const initializedRef = useRef(false);

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);

    requestAnimationFrame(() => {
      const newCells = generatePattern({
        palette,
        gridType,
        density,
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
      });

      setTimeout(() => {
        setCells(newCells);
        setIsGenerating(false);
      }, 100);
    });
  }, [palette, gridType, density]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      handleGenerate();
    }
  }, [handleGenerate]);

  const handleCellsChange = useCallback((newCells: MosaicCell[]) => {
    setCells(newCells);
  }, []);

  const showToast = useCallback((message: string) => {
    setSuccessMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 2000);
  }, []);

  const handleExportSVG = useCallback(() => {
    if (cells.length === 0) return;

    setIsExporting(true);
    setShowExportProgress(true);

    setTimeout(() => {
      exportSVG(cells, CANVAS_WIDTH, CANVAS_HEIGHT);
      setIsExporting(false);
      setShowExportProgress(false);
      showToast('SVG 导出成功！');
    }, 800);
  }, [cells, showToast]);

  const handleExportPNG = useCallback(async () => {
    if (cells.length === 0) return;

    setIsExporting(true);
    setShowExportProgress(true);

    try {
      await exportPNG(cells, CANVAS_WIDTH, CANVAS_HEIGHT, 1920, 1080);
      showToast('PNG 导出成功！');
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setIsExporting(false);
      setShowExportProgress(false);
    }
  }, [cells, showToast]);

  const togglePanel = useCallback(() => {
    setPanelExpanded((prev) => !prev);
  }, []);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#0d0d1a] text-white">
      <ControlPanel
        palette={palette}
        gridType={gridType}
        density={density}
        isGenerating={isGenerating}
        isExporting={isExporting}
        panelExpanded={panelExpanded}
        onPaletteChange={setPalette}
        onGridTypeChange={setGridType}
        onDensityChange={setDensity}
        onGenerate={handleGenerate}
        onExportSVG={handleExportSVG}
        onExportPNG={handleExportPNG}
        onTogglePanel={togglePanel}
      />

      <CanvasView
        cells={cells}
        gridType={gridType}
        palette={palette}
        canvasWidth={CANVAS_WIDTH}
        canvasHeight={CANVAS_HEIGHT}
        density={density}
        onCellsChange={handleCellsChange}
      />

      {showExportProgress && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-purple-900/50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 via-purple-400 to-yellow-400 animate-pulse"
            style={{
              width: '100%',
              animation: 'progressPulse 0.8s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {showSuccessToast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-[#2a1a4e]/95 backdrop-blur-md border border-green-500/50 rounded-xl px-8 py-5 shadow-2xl flex items-center gap-3 animate-bounce">
            <CheckCircle className="text-green-400" size={24} />
            <span className="text-white font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {showExportProgress && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#2a1a4e]/90 backdrop-blur-md border border-purple-500/40 rounded-full px-6 py-2.5 flex items-center gap-2 shadow-xl">
          <Download size={16} className="text-yellow-400 animate-bounce" />
          <span className="text-sm text-purple-200">下载中...</span>
        </div>
      )}

      <style>{`
        @keyframes progressPulse {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

export default App;
