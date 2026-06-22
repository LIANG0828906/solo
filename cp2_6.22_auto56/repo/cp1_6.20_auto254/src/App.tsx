import { useCallback, useState } from 'react';
import Toolbar from '@/modules/Toolbar';
import Journal from '@/modules/Journal';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJournalStore } from '@/store/useJournalStore';
import { exportToPDF } from '@/utils/exportPdf';

export default function App() {
  const {
    present,
    undo,
    redo,
    canUndo,
    canRedo,
    addPage,
    startExport,
    updateExportProgress,
    finishExport,
  } = useJournalStore();

  const [exportModalOpen, setExportModalOpen] = useState(false);

  const handleNewJournal = useCallback(() => {
    window.location.reload();
  }, []);

  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
  }, [redo]);

  const handleNewPage = useCallback(() => {
    addPage();
  }, [addPage]);

  const handleExportPdf = useCallback(async () => {
    if (present.isExporting) return;
    startExport();
    setExportModalOpen(true);

    try {
      await exportToPDF(
        present.title,
        present.pages,
        (progress) => {
          updateExportProgress(progress);
        }
      );
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setTimeout(() => {
        finishExport();
      }, 800);
    }
  }, [present, startExport, updateExportProgress, finishExport]);

  const closeExportModal = () => {
    if (!present.isExporting) {
      setExportModalOpen(false);
    }
  };

  const { isExporting, exportProgress } = present;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E1] via-[#fdf6e8] to-[#f3e9cc]">
      <div className="px-4 pt-4 sm:px-6">
        <Toolbar
          onNewJournal={handleNewJournal}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onNewPage={handleNewPage}
          onExportPdf={handleExportPdf}
          canUndo={canUndo()}
          canRedo={canRedo()}
        />
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <section aria-label="手账本内容区">
          <Journal />
        </section>
      </main>

      {exportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeExportModal}
        >
          <div
            className={cn(
              'relative w-full max-w-sm rounded-2xl bg-[#fdf8f0] p-6 shadow-2xl',
              'border border-[#D7CCC8]'
            )}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="导出进度"
          >
            {!isExporting && (
              <button
                type="button"
                onClick={closeExportModal}
                className="absolute right-4 top-4 text-[#5a7d5a]/60 transition-opacity duration-200 hover:opacity-80"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            <h3 className="mb-4 text-lg font-semibold text-[#3d4f3d]" style={{ fontFamily: "'Patrick Hand', cursive" }}>
              {isExporting ? '正在导出PDF...' : '导出完成'}
            </h3>

            <div className="mb-2 flex items-center justify-between text-sm text-[#5a7d5a]/80">
              <span>{exportProgress}%</span>
              {isExporting && (
                <Loader2 className="h-4 w-4 animate-spin text-[#5a7d5a]" />
              )}
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-[#E8DCC8]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#4CAF50] to-[#00BCD4] transition-all duration-500 ease-out"
                style={{
                  width: `${exportProgress}%`,
                  animation: isExporting && exportProgress > 0 && exportProgress % 10 === 0
                    ? 'elasticBounce 0.4s ease-out'
                    : undefined,
                }}
              />
            </div>

            {!isExporting && (
              <p className="mt-4 text-sm text-[#5a7d5a]/70" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                PDF 文件已成功导出，已开始下载。
              </p>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes elasticBounce {
          0% { transform: scaleY(1); }
          40% { transform: scaleY(1.35); }
          70% { transform: scaleY(0.92); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
