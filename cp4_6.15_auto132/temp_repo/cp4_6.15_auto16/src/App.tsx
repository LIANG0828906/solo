import React, { useCallback, useRef, useState } from 'react';
import { useKanbanStore } from './store';
import Timeline from './Timeline';
import FilterBar from './FilterBar';
import TaskInput from './TaskInput';
import StatsPanel from './StatsPanel';
import { Plus, Download, Upload, BarChart3, Menu, X } from 'lucide-react';

function ImportDialog({ onClose, onImport }: { onClose: () => void; onImport: (json: string, strategy: 'overwrite' | 'skip') => void }) {
  const [json, setJson] = useState('');
  const [strategy, setStrategy] = useState<'overwrite' | 'skip'>('skip');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setJson(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="modal-content bg-kanban-card border border-kanban-border rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-kanban-border">
          <h3 className="text-sm font-semibold text-kanban-text">导入JSON数据</h3>
          <button onClick={onClose} className="text-kanban-text-muted hover:text-kanban-text transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-kanban-text-muted mb-1.5">选择文件</label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="w-full text-xs text-kanban-text file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-kanban-accent file:text-white hover:file:bg-kanban-accent/90 file:cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs text-kanban-text-muted mb-1.5">或粘贴JSON内容</label>
            <textarea
              value={json}
              onChange={(e) => setJson(e.target.value)}
              rows={6}
              placeholder='{"version":1,"tasks":[...]}'
              className="w-full bg-kanban-bg border border-kanban-border rounded-lg px-3 py-2 text-xs text-kanban-text placeholder:text-kanban-text-muted outline-none focus:border-kanban-accent transition-colors font-mono resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-kanban-text-muted mb-2">ID冲突处理策略</label>
            <div className="flex gap-2">
              <label className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs ${strategy === 'overwrite' ? 'border-kanban-accent bg-kanban-accent/10 text-kanban-accent' : 'border-kanban-border text-kanban-text-muted hover:border-kanban-text-muted'}`}>
                <input type="radio" name="import-strategy" checked={strategy === 'overwrite'} onChange={() => setStrategy('overwrite')} className="sr-only" />
                覆盖已有
              </label>
              <label className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs ${strategy === 'skip' ? 'border-kanban-accent bg-kanban-accent/10 text-kanban-accent' : 'border-kanban-border text-kanban-text-muted hover:border-kanban-text-muted'}`}>
                <input type="radio" name="import-strategy" checked={strategy === 'skip'} onChange={() => setStrategy('skip')} className="sr-only" />
                跳过冲突
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 bg-kanban-bg border border-kanban-border rounded-lg text-sm text-kanban-text-muted hover:text-kanban-text btn-hover">取消</button>
            <button
              onClick={() => { if (json.trim()) { onImport(json, strategy); onClose(); } }}
              disabled={!json.trim()}
              className="flex-1 px-4 py-2 bg-kanban-accent text-white rounded-lg text-sm font-medium btn-hover hover:bg-kanban-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              确认导入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const openModal = useKanbanStore((s) => s.openModal);
  const exportTasks = useKanbanStore((s) => s.exportTasks);
  const importTasks = useKanbanStore((s) => s.importTasks);
  const deleteConfirm = useKanbanStore((s) => s.deleteConfirm);
  const closeDeleteConfirm = useKanbanStore((s) => s.closeDeleteConfirm);
  const deleteTask = useKanbanStore((s) => s.deleteTask);
  const notification = useKanbanStore((s) => s.notification);
  const hideNotification = useKanbanStore((s) => s.hideNotification);
  const filterBarCollapsed = useKanbanStore((s) => s.filterBarCollapsed);
  const toggleFilterBar = useKanbanStore((s) => s.toggleFilterBar);
  const tasks = useKanbanStore((s) => s.tasks);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    const json = exportTasks();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanban-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    useKanbanStore.getState().showNotification('导出成功', 'success');
  }, [exportTasks]);

  const handleImport = useCallback((json: string, strategy: 'overwrite' | 'skip') => {
    importTasks(json, strategy);
  }, [importTasks]);

  return (
    <div className="h-screen w-screen flex flex-col bg-kanban-bg font-inter overflow-hidden">
      {notification.open && (
        <div className={`animate-toast-in fixed top-0 left-0 right-0 z-[60] flex items-center justify-center py-2.5 text-sm font-medium ${
          notification.type === 'success' ? 'bg-kanban-low/90 text-white' :
          notification.type === 'error' ? 'bg-kanban-high/90 text-white' :
          'bg-kanban-medium/90 text-white'
        }`}>
          <span className="mr-4">{notification.message}</span>
          <button onClick={hideNotification} className="text-white/70 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-kanban-card border-b border-kanban-border">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFilterBar}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-kanban-bg border border-kanban-border text-kanban-text-muted hover:text-kanban-text btn-hover"
          >
            <Menu size={16} />
          </button>
          <h1 className="text-base font-bold text-kanban-text tracking-tight">
            <span className="text-kanban-accent">Gantt</span>Flow
          </h1>
          <span className="text-[10px] text-kanban-text-muted bg-kanban-bg px-2 py-0.5 rounded-full">
            {tasks.length} 个任务
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal('create')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-kanban-accent text-white rounded-lg text-xs font-medium btn-hover hover:bg-kanban-accent/90"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">新建任务</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-kanban-bg border border-kanban-border rounded-lg text-xs text-kanban-text-muted hover:text-kanban-text btn-hover"
          >
            <Download size={14} />
            <span className="hidden sm:inline">导出</span>
          </button>
          <button
            onClick={() => setImportDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-kanban-bg border border-kanban-border rounded-lg text-xs text-kanban-text-muted hover:text-kanban-text btn-hover"
          >
            <Upload size={14} />
            <span className="hidden sm:inline">导入</span>
          </button>
        </div>
      </header>

      {!filterBarCollapsed && <FilterBar />}

      <div className="flex-1 overflow-hidden">
        <Timeline />
      </div>

      <StatsPanel />
      <TaskInput />

      {deleteConfirm.open && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeDeleteConfirm}>
          <div className="modal-content bg-kanban-card border border-kanban-border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-kanban-text mb-2">确认删除</h3>
            <p className="text-xs text-kanban-text-muted mb-5">此操作不可撤销，确定要删除该任务吗？</p>
            <div className="flex gap-3">
              <button
                onClick={closeDeleteConfirm}
                className="flex-1 px-4 py-2 bg-kanban-bg border border-kanban-border rounded-lg text-sm text-kanban-text-muted hover:text-kanban-text btn-hover"
              >
                取消
              </button>
              <button
                onClick={() => deleteTask(deleteConfirm.taskId!)}
                className="flex-1 px-4 py-2 bg-kanban-high text-white rounded-lg text-sm font-medium btn-hover hover:bg-kanban-high/90"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {importDialogOpen && (
        <ImportDialog
          onClose={() => setImportDialogOpen(false)}
          onImport={handleImport}
        />
      )}

      <input ref={fileInputRef} type="file" accept=".json" className="hidden" />
    </div>
  );
}
