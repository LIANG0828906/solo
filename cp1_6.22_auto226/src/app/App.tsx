import { useRef, useCallback, useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { extractFrames } from '@/engine/FrameExtractor';
import { MarkManager } from '@/storage/MarkManager';
import { FrameGrid } from '@/ui/FrameGrid';
import { MarkPanel } from '@/ui/MarkPanel';
import { MarkData } from '@/types';
import {
  Upload,
  Search,
  Download,
  Film,
  Trash2,
  ChevronDown,
  FolderOpen,
  Loader2,
  Menu,
  X,
} from 'lucide-react';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    projects,
    currentProjectId,
    frames,
    marks,
    activeFrameId,
    ratingFilter,
    isExtracting,
    extractionProgress,
    extractionTotal,
    setRatingFilter,
    setActiveFrameId,
    setIsExtracting,
    setExtractionProgress,
    setExtractionTotal,
    addProject,
    loadProject,
    deleteProject,
    saveMark,
    deleteMark,
    getFilteredFrames,
  } = useAppStore();

  const [rawSearch, setRawSearch] = useState('');
  const debouncedSearch = useDebounce(rawSearch, 300);

  useEffect(() => {
    useAppStore.getState().setSearchQuery(debouncedSearch);
  }, [debouncedSearch]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsExtracting(true);
      setExtractionProgress(0);
      setExtractionTotal(0);

      try {
        const extractedFrames = await extractFrames(
          file,
          { intervalSec: 2 },
          (current, total) => {
            setExtractionTotal(total);
            setExtractionProgress(current);
          }
        );
        addProject(file.name, extractedFrames);
      } catch (err) {
        console.error('Frame extraction failed:', err);
      } finally {
        setIsExtracting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [addProject, setIsExtracting, setExtractionProgress, setExtractionTotal]
  );

  const handleFrameClick = useCallback(
    (frameId: string) => setActiveFrameId(frameId),
    [setActiveFrameId]
  );

  const handleSaveMark = useCallback(
    (mark: MarkData) => saveMark(mark),
    [saveMark]
  );

  const handleDeleteMark = useCallback(
    (frameId: string) => deleteMark(frameId),
    [deleteMark]
  );

  const handleExportJSON = useCallback(() => {
    const filtered = getFilteredFrames();
    const markList = filtered
      .map((f) => marks[f.id])
      .filter((m): m is MarkData => !!m);
    MarkManager.exportJSON(markList, filtered);
  }, [getFilteredFrames, marks]);

  const handleExportCSV = useCallback(() => {
    const filtered = getFilteredFrames();
    const markList = filtered
      .map((f) => marks[f.id])
      .filter((m): m is MarkData => !!m);
    MarkManager.exportCSV(markList, filtered);
  }, [getFilteredFrames, marks]);

  const activeFrame = frames.find((f) => f.id === activeFrameId);
  const filteredFrames = getFilteredFrames();

  return (
    <div className="flex h-screen bg-[#0F172A] text-[#E2E8F0] overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed z-40 flex h-full w-[260px] flex-shrink-0 flex-col border-r border-[#334155] bg-[#1E293B] transition-transform duration-200 md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#334155] px-4 py-4">
          <div className="flex items-center gap-2">
            <Film size={20} className="text-[#3B82F6]" />
            <h1 className="text-base font-bold tracking-tight">FrameMark</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1 text-[#64748B] hover:text-white md:hidden"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-[#64748B]">
            项目列表
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          {projects.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-[#64748B]">
              暂无项目
            </p>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                onClick={() => {
                  loadProject(project.id);
                  setSidebarOpen(false);
                }}
                className={`sidebar-item group mb-1 flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${
                  currentProjectId === project.id
                    ? 'bg-[#334155] border-l-[3px] border-[#3B82F6]'
                    : 'hover:bg-[#334155]/50 border-l-[3px] border-transparent'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{project.fileName}</p>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    {project.frameCount} 帧 · {project.markCount} 标记
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProject(project.id);
                  }}
                  className="ml-1 rounded p-1 text-[#64748B] opacity-0 transition-opacity hover:bg-[#EF4444]/20 hover:text-[#EF4444] group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex flex-shrink-0 items-center gap-3 border-b border-[#1E293B] bg-[#0F172A] px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded p-1.5 text-[#64748B] hover:text-white md:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
            />
            <input
              type="text"
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              placeholder="搜索标签或备注..."
              className="w-full rounded-lg border border-[#334155] bg-[#1E293B] py-2 pl-9 pr-3 text-sm text-[#E2E8F0] placeholder-[#64748B] outline-none transition-colors focus:border-[#3B82F6]"
            />
          </div>

          <div className="relative">
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(Number(e.target.value))}
              className="appearance-none rounded-lg border border-[#334155] bg-[#1E293B] py-2 pl-3 pr-8 text-sm text-[#E2E8F0] outline-none transition-colors focus:border-[#3B82F6] cursor-pointer"
            >
              <option value={0}>全部评分</option>
              {[1, 2, 3, 4, 5].map((s) => (
                <option key={s} value={s}>
                  {s} 星
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B]"
            />
          </div>

          <div className="hidden h-6 w-px bg-[#334155] sm:block" />

          <button
            onClick={handleExportJSON}
            disabled={filteredFrames.length === 0}
            className="hidden items-center gap-1.5 rounded-lg border border-[#334155] bg-[#1E293B] px-3 py-2 text-sm font-medium text-[#94A3B8] transition-colors hover:bg-[#334155] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed sm:flex"
          >
            <Download size={14} />
            JSON
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filteredFrames.length === 0}
            className="hidden items-center gap-1.5 rounded-lg border border-[#334155] bg-[#1E293B] px-3 py-2 text-sm font-medium text-[#94A3B8] transition-colors hover:bg-[#334155] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed sm:flex"
          >
            <Download size={14} />
            CSV
          </button>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden">
          {frames.length === 0 && !isExtracting ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-6">
                <div className="rounded-2xl bg-[#1E293B] p-8 text-center">
                  <FolderOpen size={48} className="mx-auto mb-4 text-[#3B82F6]" />
                  <h2 className="mb-2 text-xl font-semibold">开始使用</h2>
                  <p className="mb-6 text-sm text-[#64748B]">
                    选择一个视频文件，系统将自动提取关键帧
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#3B82F6] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
                  >
                    <Upload size={16} />
                    选择视频
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-shrink-0 items-center justify-between border-b border-[#1E293B] bg-[#0F172A] px-4 py-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#3B82F6] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
                  >
                    <Upload size={14} />
                    选择视频
                  </button>
                  <span className="text-xs text-[#64748B]">
                    {filteredFrames.length} / {frames.length} 帧
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportJSON}
                    disabled={filteredFrames.length === 0}
                    className="flex items-center gap-1 rounded border border-[#334155] bg-[#1E293B] px-2 py-1 text-xs text-[#94A3B8] transition-colors hover:bg-[#334155] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed sm:hidden"
                  >
                    <Download size={12} />
                    JSON
                  </button>
                  <button
                    onClick={handleExportCSV}
                    disabled={filteredFrames.length === 0}
                    className="flex items-center gap-1 rounded border border-[#334155] bg-[#1E293B] px-2 py-1 text-xs text-[#94A3B8] transition-colors hover:bg-[#334155] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed sm:hidden"
                  >
                    <Download size={12} />
                    CSV
                  </button>
                  {isExtracting && (
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-[#3B82F6]" />
                      <span className="text-xs text-[#94A3B8]">
                        提取中 {extractionProgress}/{extractionTotal}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {isExtracting && extractionTotal > 0 && (
                <div className="px-4 py-1">
                  <div className="h-1 overflow-hidden rounded-full bg-[#1E293B]">
                    <div
                      className="h-full rounded-full bg-[#3B82F6] transition-all duration-300"
                      style={{
                        width: `${(extractionProgress / extractionTotal) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                <FrameGrid
                  frames={filteredFrames}
                  marks={marks}
                  onFrameClick={handleFrameClick}
                />
              </div>
            </>
          )}
        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm"
        onChange={handleFileSelect}
        className="hidden"
      />

      {activeFrameId && activeFrame && (
        <MarkPanel
          frameId={activeFrame.id}
          frameIndex={activeFrame.index}
          timestamp={activeFrame.timestamp}
          existingMark={marks[activeFrame.id]}
          onSave={handleSaveMark}
          onDelete={handleDeleteMark}
          onClose={() => setActiveFrameId(null)}
        />
      )}
    </div>
  );
}
