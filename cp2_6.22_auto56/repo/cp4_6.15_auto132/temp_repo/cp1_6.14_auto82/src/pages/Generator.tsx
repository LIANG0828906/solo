import { useRef, useState } from 'react';
import { X, Edit3 } from 'lucide-react';
import { NewspaperCanvas } from '@/components/NewspaperCanvas';
import ControlPanel from '@/components/ControlPanel';
import ExportModal from '@/components/ExportModal';
import { useCoverStore } from '@/store/useCoverStore';
import { downloadPng, downloadPdf, generateThumbnail } from '@/utils/exporter';

export default function Generator() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const currentCover = useCoverStore((state) => state.currentCover);
  const saveToHistory = useCoverStore((state) => state.saveToHistory);
  const editingId = useCoverStore((state) => state.editingId);
  const clearEditing = useCoverStore((state) => state.clearEditing);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleOpenExport = () => {
    setIsExportModalOpen(true);
  };

  const handleExport = async (format: 'png' | 'pdf') => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      if (format === 'png') {
        await downloadPng(canvasRef.current, 'newspaper-cover');
      } else {
        await downloadPdf(canvasRef.current, 'newspaper-cover');
      }
      setTimeout(() => {
        setIsExportModalOpen(false);
        setIsExporting(false);
      }, 800);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
      setIsExporting(false);
    }
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    try {
      const thumbnail = await generateThumbnail(canvasRef.current);
      saveToHistory(thumbnail);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleClearEditing = () => {
    clearEditing();
  };

  return (
    <div className="paper-texture min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {editingId && (
          <div className="mb-6 flex items-center justify-between gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200 animate-fadeIn">
            <div className="flex items-center gap-3">
              <Edit3 className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">正在编辑历史记录</p>
                <p className="text-sm text-amber-600">修改后保存将创建新的历史记录</p>
              </div>
            </div>
            <button
              onClick={handleClearEditing}
              className="p-2 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="section-title animate-fadeIn">创作空间</h1>
          <p className="mt-3 text-ink/60 font-serif animate-fadeIn animation-delay-200">
            沉浸式创作你的专属报纸封面
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 w-full animate-slideUp animation-delay-200">
            <div className="flex justify-center">
              <NewspaperCanvas coverData={currentCover} canvasRef={canvasRef} />
            </div>
          </div>

          <div className="w-full lg:w-[380px] flex-shrink-0 animate-slideUp">
            <div className="sticky top-8">
              <ControlPanel
                onExport={handleOpenExport}
                onSave={handleSave}
              />
              {saveSuccess && (
                <div className="mt-4 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-center animate-fadeIn">
                  ✓ 已保存到历史记录
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ExportModal
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        exporting={isExporting}
      />
    </div>
  );
}
