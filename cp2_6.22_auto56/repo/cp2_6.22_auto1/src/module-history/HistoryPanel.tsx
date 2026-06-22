import { useState, useRef, useCallback, useEffect } from 'react';
import { useYjsStore } from '@/hooks/useYjsStore';
import { IDocumentVersion } from '@/shared/types';
import { DiffViewer } from '@/module-history/DiffViewer';
import { X, History, RotateCcw, GitCompare } from 'lucide-react';
import * as Y from 'yjs';
import { cn } from '@/lib/utils';

interface HistoryPanelProps {
  doc: Y.Doc;
  onClose: () => void;
}

const ITEM_HEIGHT = 72;
const BUFFER = 3;

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return new Date(timestamp).toLocaleString('zh-CN');
}

export default function HistoryPanel({ doc, onClose }: HistoryPanelProps) {
  const versions = useYjsStore((s) => s.versions);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDiff, setShowDiff] = useState(false);
  const [diffPair, setDiffPair] = useState<{ old: IDocumentVersion; new: IDocumentVersion } | null>(null);
  const [labelInputs, setLabelInputs] = useState<Record<string, string>>({});
  const [scrollTop, setScrollTop] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const visibleHeight = listRef.current?.clientHeight ?? 600;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
  const endIndex = Math.min(
    versions.length,
    Math.ceil((scrollTop + visibleHeight) / ITEM_HEIGHT) + BUFFER
  );
  const visibleVersions = versions.slice(startIndex, endIndex);
  const totalHeight = versions.length * ITEM_HEIGHT;
  const offsetY = startIndex * ITEM_HEIGHT;

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (listRef.current && versions.length > 0) {
      listRef.current.scrollTop = 0;
    }
  }, [versions.length]);

  const handleScroll = useCallback(() => {
    if (listRef.current) {
      setScrollTop(listRef.current.scrollTop);
    }
  }, []);

  const handleVersionClick = useCallback((version: IDocumentVersion, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedIds((prev) => {
        if (prev.includes(version.id)) {
          return prev.filter((id) => id !== version.id);
        }
        if (prev.length >= 2) {
          return [prev[1], version.id];
        }
        return [...prev, version.id];
      });
    } else {
      setSelectedIds((prev) =>
        prev.includes(version.id) ? prev.filter((id) => id !== version.id) : [version.id]
      );
    }
  }, []);

  const handleCompare = useCallback(() => {
    if (selectedIds.length === 2) {
      const oldVer = versions.find((v) => v.id === selectedIds[0]);
      const newVer = versions.find((v) => v.id === selectedIds[1]);
      if (oldVer && newVer) {
        const sorted = [oldVer, newVer].sort((a, b) => a.timestamp - b.timestamp);
        setDiffPair({ old: sorted[0], new: sorted[1] });
        setShowDiff(true);
      }
    }
  }, [selectedIds, versions]);

  const handleRestore = useCallback(
    (version: IDocumentVersion) => {
      const confirmed = window.confirm(`确定要恢复到「${version.label ?? formatRelativeTime(version.timestamp)}」吗？当前未保存的内容将丢失。`);
      if (!confirmed) return;

      const ytext = doc.getText('content');
      doc.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, version.snapshot);
      });
    },
    [doc]
  );

  const handleLabelSubmit = useCallback(
    (versionId: string) => {
      const label = labelInputs[versionId]?.trim();
      if (!label) return;
      useYjsStore.getState().updateVersionLabel(versionId, label);
      setLabelInputs((prev) => {
        const next = { ...prev };
        delete next[versionId];
        return next;
      });
    },
    [labelInputs]
  );

  if (showDiff && diffPair) {
    return (
      <DiffViewer
        oldText={diffPair.old.snapshot}
        newText={diffPair.new.snapshot}
        oldLabel={diffPair.old.label ?? formatRelativeTime(diffPair.old.timestamp)}
        newLabel={diffPair.new.label ?? formatRelativeTime(diffPair.new.timestamp)}
        onClose={() => {
          setShowDiff(false);
          setDiffPair(null);
        }}
      />
    );
  }

  return (
    <div
      ref={panelRef}
      className={cn(
        'fixed right-0 top-0 h-full w-[320px] z-50',
        'bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl',
        'border-l border-border-light dark:border-border-dark',
        'shadow-2xl',
        'animate-slide-in-right',
        'flex flex-col',
        'outline-none'
      )}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className={cn('flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark')}>
        <div className="flex items-center gap-2 text-text-light dark:text-text-dark font-sans font-semibold">
          <History size={18} />
          <span>版本历史</span>
        </div>
        <button
          onClick={onClose}
          className={cn(
            'p-1 rounded-md',
            'text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark',
            'hover:bg-black/5 dark:hover:bg-white/5',
            'transition-colors duration-200'
          )}
        >
          <X size={18} />
        </button>
      </div>

      {selectedIds.length === 2 && (
        <div className={cn('px-4 py-2 border-b border-border-light dark:border-border-dark')}>
          <button
            onClick={handleCompare}
            className={cn(
              'flex items-center gap-2 w-full justify-center',
              'px-3 py-2 rounded-lg',
              'bg-accent text-white font-sans text-sm font-medium',
              'hover:brightness-110 active:brightness-90',
              'transition-all duration-200'
            )}
          >
            <GitCompare size={14} />
            对比两个版本
          </button>
        </div>
      )}

      <div
        ref={listRef}
        onScroll={handleScroll}
        className={cn('flex-1 overflow-y-auto', 'scroll-smooth')}
      >
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
            <History size={40} className="text-muted-light dark:text-muted-dark opacity-40" />
            <p className="text-muted-light dark:text-muted-dark text-sm font-sans text-center">
              暂无版本记录
            </p>
            <p className="text-muted-light dark:text-muted-dark text-xs font-sans text-center opacity-70">
              编辑文档时保存的版本将显示在此处
            </p>
          </div>
        ) : (
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
              {visibleVersions.map((version) => {
                const isSelected = selectedIds.includes(version.id);
                return (
                  <div
                    key={version.id}
                    style={{ height: ITEM_HEIGHT }}
                    className={cn(
                      'px-3 py-2 border-b border-border-light/50 dark:border-border-dark/50',
                      'cursor-pointer transition-colors duration-150',
                      isSelected
                        ? 'bg-accent/10 dark:bg-accent/15 border-l-2 border-l-accent'
                        : 'hover:bg-black/3 dark:hover:bg-white/5 border-l-2 border-l-transparent'
                    )}
                    onClick={(e) => handleVersionClick(version, e)}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-sans text-text-light dark:text-text-dark truncate">
                          {formatRelativeTime(version.timestamp)}
                        </p>
                        <p className="text-xs font-sans text-muted-light dark:text-muted-dark mt-0.5 truncate">
                          {version.author}
                        </p>
                        {version.label && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-sans font-medium bg-accent/10 text-accent rounded">
                            {version.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(version);
                          }}
                          className={cn(
                            'p-1 rounded',
                            'text-muted-light dark:text-muted-dark hover:text-warning',
                            'hover:bg-warning/10',
                            'transition-colors duration-150'
                          )}
                          title="恢复此版本"
                        >
                          <RotateCcw size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="text"
                        placeholder="添加标签..."
                        value={labelInputs[version.id] ?? ''}
                        onChange={(e) =>
                          setLabelInputs((prev) => ({ ...prev, [version.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.stopPropagation();
                            handleLabelSubmit(version.id);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          'flex-1 px-1.5 py-0.5 text-[11px] font-sans',
                          'bg-transparent border border-border-light/50 dark:border-border-dark/50 rounded',
                          'text-text-light dark:text-text-dark',
                          'placeholder:text-muted-light/50 dark:placeholder:text-muted-dark/50',
                          'focus:outline-none focus:border-accent/50',
                          'transition-colors duration-150'
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
