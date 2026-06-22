import { Clock, Scroll, Presentation, Plus, Download, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimelineStore } from '@/dataManager';
import { useState } from 'react';

export default function Toolbar() {
  const config = useTimelineStore((s) => s.config);
  const setViewMode = useTimelineStore((s) => s.setViewMode);
  const showNotification = useTimelineStore((s) => s.showNotification);
  const showAddEventForm = useTimelineStore((s) => s.showAddEventForm);
  const openExportModal = useTimelineStore((s) => s.openExportModal);
  const showExportModal = useTimelineStore((s) => s.showExportModal);
  const importFromJSON = useTimelineStore((s) => s.importFromJSON);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importFromJSON(file);
      e.target.value = '';
    }
  };

  return (
    <header
      className={cn(
        'w-full h-[60px] bg-white flex items-center justify-between px-4 md:px-6',
        'border-b border-border shadow-[0_1px_0_0_#E5E7EB]',
        'sticky top-0 z-40',
      )}
    >
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
          <Clock className="w-5 h-5 text-primary-600" strokeWidth={2} />
        </div>
        <h1
          className={cn(
            'font-serif font-semibold text-lg text-gray-900 tracking-wide',
            'hidden sm:block',
          )}
        >
          时光织机
        </h1>
      </div>

      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setViewMode('scroll')}
          className={cn(
            'flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-md text-sm font-medium',
            'transition-all duration-200 ease-out',
            config.viewMode === 'scroll'
              ? 'bg-primary text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60',
          )}
        >
          <Scroll className="w-4 h-4" strokeWidth={2} />
          <span className="hidden md:inline">滚动模式</span>
        </button>
        <button
          onClick={() => setViewMode('slides')}
          className={cn(
            'flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-md text-sm font-medium',
            'transition-all duration-200 ease-out',
            config.viewMode === 'slides'
              ? 'bg-primary text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60',
          )}
        >
          <Presentation className="w-4 h-4" strokeWidth={2} />
          <span className="hidden md:inline">幻灯片模式</span>
        </button>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => showAddEventForm()}
          className={cn(
            'flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg bg-primary text-white',
            'text-sm font-medium hover:bg-primary-600 active:bg-primary-700',
            'transition-all duration-200 ease-out shadow-sm',
          )}
        >
          <Plus className="w-4 h-4" strokeWidth={2.25} />
          <span className="hidden sm:inline">新增事件</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setIsExportOpen((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg border border-border bg-white',
              'text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100',
              'transition-all duration-200 ease-out',
            )}
          >
            <Download className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">导出</span>
          </button>

          {isExportOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsExportOpen(false)}
              />
              <div
                className={cn(
                  'absolute right-0 mt-2 w-44 rounded-lg border border-border bg-white shadow-lg py-1 z-20',
                  'animate-[fadeIn_0.15s_ease-out]',
                )}
              >
                <button
                  onClick={() => {
                    openExportModal();
                    setIsExportOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700',
                    'hover:bg-gray-50 transition-colors',
                  )}
                >
                  <Download className="w-4 h-4 text-gray-500" strokeWidth={2} />
                  导出数据
                </button>
                <label
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 cursor-pointer',
                    'hover:bg-gray-50 transition-colors',
                  )}
                >
                  <Upload className="w-4 h-4 text-gray-500" strokeWidth={2} />
                  导入 JSON
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleImport}
                  />
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {showExportModal && null}
    </header>
  );
}
