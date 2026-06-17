import { useRef } from 'react';
import { Download, Upload, Menu } from 'lucide-react';
import { useStore } from '@/store';
import { exportToJSON, importFromJSON } from '@/storage/export';
import { EXPORT_BTN, IMPORT_BTN } from '@/shared/types';

interface ToolbarProps {
  onToggleSidebar: () => void;
}

export default function Toolbar({ onToggleSidebar }: ToolbarProps) {
  const nodes = useStore((s) => s.nodes);
  const branches = useStore((s) => s.branches);
  const importData = useStore((s) => s.importData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportToJSON(nodes, branches);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { nodes: importedNodes, branches: importedBranches } = await importFromJSON(file);
      importData(importedNodes, importedBranches);
    } catch (err) {
      alert((err as Error).message);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <header
      className="flex items-center justify-between px-4 py-3 z-30"
      style={{
        background: 'rgba(45,45,68,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(58,58,92,0.5)',
      }}
    >
      <div className="flex items-center gap-3">
        <button
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200"
          style={{ background: '#4A4A6A' }}
          onClick={onToggleSidebar}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#5A5A7A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#4A4A6A';
          }}
        >
          <Menu size={20} className="text-white" />
        </button>
        <h1 className="text-lg font-semibold text-white tracking-wide">
          时序织图
        </h1>
        <span className="text-xs text-white/40 hidden sm:inline">
          可视化时间线规划
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all duration-200"
          style={{
            background: EXPORT_BTN,
            borderRadius: 8,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#7C73FF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = EXPORT_BTN;
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Download size={16} />
          <span className="hidden sm:inline">导出</span>
        </button>

        <button
          onClick={handleImportClick}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all duration-200"
          style={{
            background: IMPORT_BTN,
            borderRadius: 8,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FF7B7B';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = IMPORT_BTN;
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Upload size={16} />
          <span className="hidden sm:inline">导入</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </header>
  );
}
