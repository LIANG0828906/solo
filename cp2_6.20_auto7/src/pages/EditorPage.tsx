import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Panel from '@/modules/panel/Panel';
import Canvas from '@/modules/canvas/Canvas';
import PropertyPanel from '@/modules/panel/PropertyPanel';
import { useResumeStore } from '@/store/resumeStore';
import { exportPDF } from '@/modules/export/ExportPDF';
import ShareLink from '@/modules/export/ShareLink';
import { Undo2, Redo2, Download, FileText } from 'lucide-react';
import { useState } from 'react';

export default function EditorPage() {
  const { undo, redo, historyIndex, history, components } = useResumeStore();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportPDF();
    } finally {
      setExporting(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-slate-50">
        <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200/60 shadow-sm z-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center">
                <FileText size={14} className="text-white" />
              </div>
              <h1 className="text-base font-semibold text-slate-700 tracking-tight">
                ResuMix
              </h1>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">线上简历制作工具</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="撤销"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="重做"
            >
              <Redo2 size={16} />
            </button>

            <div className="w-px h-5 bg-slate-200 mx-1" />

            <ShareLink />

            <button
              onClick={handleExport}
              disabled={exporting || components.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-white text-sm font-medium hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={15} />
              {exporting ? '导出中...' : '导出PDF'}
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <Panel />
          <Canvas />
          <PropertyPanel />
        </div>
      </div>
    </DndProvider>
  );
}
