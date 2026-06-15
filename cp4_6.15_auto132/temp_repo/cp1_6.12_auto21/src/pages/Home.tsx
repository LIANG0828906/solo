import { useState } from 'react';
import { BookOpen, ScanLine, MapPin, BarChart3, Download, AlertTriangle, Flame, ChevronUp } from 'lucide-react';
import { useBookStore } from '@/store';
import { useSocket } from '@/hooks/useSocket';
import ShelfView from '@/components/ShelfView';
import GuidePanel from '@/components/GuidePanel';
import ShelfDrawer from '@/components/ShelfDrawer';
import AlertCard from '@/components/AlertCard';
import ReaderAnalysis from '@/components/ReaderAnalysis';
import ExportPanel from '@/components/ExportPanel';

export default function Home() {
  const [scanInput, setScanInput] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    alerts,
    showHeatmap,
    showAnalysis,
    isExporting,
    scanResult,
  } = useBookStore();

  const { scanBook, requestGuide, acknowledgeAlert, requestAnalytics } = useSocket();

  const toggleHeatmap = useBookStore((s) => s.toggleHeatmap);
  const toggleAnalysis = useBookStore((s) => s.toggleAnalysis);
  const setExportState = useBookStore((s) => s.setExportState);

  const handleScan = () => {
    const isbn = scanInput.trim();
    if (!isbn) return;
    scanBook(isbn);
    setScanInput('');
  };

  const handleGuide = (bookId: string, currentZone: string) => {
    requestGuide(bookId, currentZone);
  };

  const handleExport = () => {
    setExportState(true, 0);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: '#F5F0E8' }}>
      <header className="flex items-center gap-3 px-6 py-3 bg-wood-dark text-white shadow-lg z-20 shrink-0">
        <BookOpen className="w-7 h-7 text-gold" />
        <h1 className="text-xl font-bold tracking-wide">智能书架管理系统</h1>
        <div className="flex-1" />
        {alerts.length > 0 && (
          <div className="relative">
            <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
              {alerts.length}
            </span>
          </div>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 shrink-0">
            <div className="flex items-center gap-2 flex-1 max-w-md bg-white/80 rounded-lg px-3 py-1.5 shadow-sm border border-wood-200">
              <ScanLine className="w-4 h-4 text-wood-400" />
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                placeholder="扫描 ISBN 条码..."
                className="flex-1 bg-transparent outline-none text-sm text-wood-800 placeholder:text-wood-300"
              />
            </div>
            {scanResult && (
              <button
                className="btn-press px-3 py-1.5 bg-gold/20 text-gold-dark rounded-lg text-sm font-medium hover:bg-gold/30"
                onClick={() => handleGuide(scanResult.book.id, scanResult.shelf.zone)}
              >
                <MapPin className="w-3.5 h-3.5 inline mr-1" />
                导航
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4">
            <ShelfView />
          </div>
        </div>

        <div className="hidden md:flex w-80 shrink-0 border-l border-wood-200 bg-white/50">
          <GuidePanel />
        </div>

        <div className="absolute top-4 right-4 z-10 hidden md:flex flex-col gap-2">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onAcknowledge={acknowledgeAlert} />
          ))}
        </div>
      </div>

      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-30">
        <button
          onClick={toggleHeatmap}
          className={`btn-press w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors ${
            showHeatmap ? 'bg-orange-500 text-white' : 'bg-white text-wood-500 hover:bg-orange-50'
          }`}
          title="热力图"
        >
          <Flame className="w-5 h-5" />
        </button>
        <button
          onClick={() => { toggleAnalysis(); requestAnalytics(); }}
          className={`btn-press w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors ${
            showAnalysis ? 'bg-blue-500 text-white' : 'bg-white text-wood-500 hover:bg-blue-50'
          }`}
          title="读者分析"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
        <button
          onClick={handleExport}
          className="btn-press w-12 h-12 rounded-full shadow-lg bg-white text-wood-500 hover:bg-wood-50 flex items-center justify-center"
          title="导出 PDF"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20">
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="w-full flex items-center justify-center gap-1 py-2 bg-wood-dark text-white text-sm"
        >
          <ChevronUp className={`w-4 h-4 transition-transform ${drawerOpen ? 'rotate-180' : ''}`} />
          书架详情
        </button>
        {drawerOpen && <ShelfDrawer onClose={() => setDrawerOpen(false)} />}
      </div>

      {showAnalysis && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <ReaderAnalysis onClose={toggleAnalysis} />
        </div>
      )}

      {isExporting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <ExportPanel />
        </div>
      )}
    </div>
  );
}
