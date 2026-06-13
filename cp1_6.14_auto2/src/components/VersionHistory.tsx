import React, { useState } from 'react';
import { History, ChevronDown, ChevronUp, RotateCcw, Clock, X } from 'lucide-react';
import type { Version } from '../hooks/useDocumentSocket';

interface VersionHistoryProps {
  versions: Version[];
  selectedVersionId: string | null;
  onSelectVersion: (versionId: string | null) => void;
  onRestoreVersion: (versionId: string) => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60 * 1000) {
    return '刚刚';
  }
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))} 分钟前`;
  }
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))} 小时前`;
  }

  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function VersionItem({
  version,
  isSelected,
  onSelect,
  onRestore,
}: {
  version: Version;
  isSelected: boolean;
  onSelect: () => void;
  onRestore: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
        isSelected
          ? 'bg-blue-500/15 border-blue-500/40 shadow-md'
          : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/70 hover:border-slate-600'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-white">版本 {version.versionNumber}</span>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Clock className="w-3 h-3" />
          {formatTime(version.timestamp)}
        </div>
      </div>
      <p className="text-xs text-slate-400 line-clamp-2 mb-2">{version.summary}</p>
      {isSelected && (
        <div className="mt-2 pt-2 border-t border-slate-700/50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRestore();
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm text-blue-400 border border-blue-500/40 rounded-md hover:bg-blue-500/20 hover:border-blue-500/60 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            恢复此版本
          </button>
        </div>
      )}
    </div>
  );
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  selectedVersionId,
  onSelectVersion,
  onRestoreVersion,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const versionListContent = (
    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
      {versions.length === 0 ? (
        <div className="text-center text-slate-500 py-8 text-sm">
          <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>暂无历史版本</p>
        </div>
      ) : (
        versions.map((version) => (
          <VersionItem
            key={version.id}
            version={version}
            isSelected={selectedVersionId === version.id}
            onSelect={() =>
              onSelectVersion(selectedVersionId === version.id ? null : version.id)
            }
            onRestore={() => onRestoreVersion(version.id)}
          />
        ))
      )}
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-slate-900/60 border-r border-slate-800 p-4 h-full">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-semibold text-white">版本历史</h2>
          <span className="ml-auto px-2 py-0.5 bg-slate-700/70 text-slate-300 text-xs rounded-full">
            {versions.length}
          </span>
        </div>
        {versionListContent}
      </aside>

      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex items-center gap-2 text-white"
          >
            <History className="w-5 h-5 text-blue-400" />
            <span className="font-medium">版本历史</span>
            <span className="px-2 py-0.5 bg-slate-700/70 text-slate-300 text-xs rounded-full">
              {versions.length}
            </span>
            {mobileOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {selectedVersionId && (
            <button
              onClick={() => onSelectVersion(null)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-amber-400 bg-amber-500/10 rounded-md"
            >
              <X className="w-3 h-3" />
              退出预览
            </button>
          )}
        </div>

        {mobileOpen && (
          <div className="absolute top-[52px] left-0 right-0 bottom-0 z-50 bg-slate-900/95 backdrop-blur-sm p-4 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">
                {selectedVersionId ? '点击其他版本切换预览' : '点击版本查看内容'}
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {versionListContent}
          </div>
        )}
      </div>
    </>
  );
};
