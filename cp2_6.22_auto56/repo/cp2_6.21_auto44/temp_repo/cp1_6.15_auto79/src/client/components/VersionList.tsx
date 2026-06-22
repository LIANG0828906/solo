import { useState, useEffect, useMemo } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Version, Note, DiffNote } from '@/types';

interface VersionListProps {
  versions: Version[];
  currentNotes: Note[];
  onShowDiff?: (diff: DiffNote[]) => void;
  onRestore?: (version: Version) => void;
}

const formatRelativeTime = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  return date.toLocaleDateString('zh-CN');
};

const computeDiff = (current: Note[], snapshot: Note[]): DiffNote[] => {
  const currentIds = new Set(current.map((n) => n.id));
  const snapshotIds = new Set(snapshot.map((n) => n.id));
  const diff: DiffNote[] = [];

  for (const note of snapshot) {
    if (!currentIds.has(note.id)) {
      diff.push({ note, type: 'removed' });
    }
  }
  for (const note of current) {
    if (!snapshotIds.has(note.id)) {
      diff.push({ note, type: 'added' });
    }
  }

  return diff;
};

const getInitials = (name: string) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

const getAvatarColor = (id: string) => {
  const colors = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-yellow-500 to-orange-500',
    'from-red-500 to-pink-500',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function VersionList({
  versions,
  currentNotes,
  onShowDiff,
  onRestore,
}: VersionListProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [highlightedVersionId, setHighlightedVersionId] = useState<string | null>(null);
  const [restoreConfirmVersion, setRestoreConfirmVersion] = useState<Version | null>(null);
  const [restoring, setRestoring] = useState(false);

  const sortedVersions = useMemo(() => {
    return [...versions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [versions]);

  useEffect(() => {
    if (highlightedVersionId) {
      const timer = setTimeout(() => setHighlightedVersionId(null), 3800);
      return () => clearTimeout(timer);
    }
  }, [highlightedVersionId]);

  const handleVersionClick = (version: Version) => {
    setSelectedVersionId(version.id);
    setHighlightedVersionId(version.id);
    const diff = computeDiff(currentNotes, version.snapshot);
    if (onShowDiff) {
      onShowDiff(diff);
    }
  };

  const handleRestoreClick = (e: React.MouseEvent, version: Version) => {
    e.stopPropagation();
    setRestoreConfirmVersion(version);
  };

  const confirmRestore = () => {
    if (restoreConfirmVersion) {
      setRestoring(true);
      setTimeout(() => {
        if (onRestore) {
          onRestore(restoreConfirmVersion);
        }
        setRestoring(false);
        setRestoreConfirmVersion(null);
      }, 500);
    }
  };

  return (
    <div className="h-full w-full md:w-[30%] bg-[var(--bg-secondary)] border-l border-white/10 flex flex-col">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          版本历史
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          共 {versions.length} 个版本
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
        {sortedVersions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--text-secondary)]">
            <RotateCcw className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm">暂无版本记录</p>
          </div>
        )}

        {sortedVersions.map((version) => {
          const diff = computeDiff(currentNotes, version.snapshot);
          const addedCount = diff.filter((d) => d.type === 'added').length;
          const removedCount = diff.filter((d) => d.type === 'removed').length;

          return (
            <div
              key={version.id}
              onClick={() => handleVersionClick(version)}
              className={cn(
                'relative p-3 rounded-lg cursor-pointer transition-all duration-200',
                'border border-transparent hover:border-white/10',
                selectedVersionId === version.id
                  ? 'bg-[var(--card-bg)] border-white/20'
                  : 'hover:bg-white/5',
                highlightedVersionId === version.id && 'diff-highlight'
              )}
            >
              {highlightedVersionId === version.id && (
                <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                  {diff.map((d, idx) => (
                    <div
                      key={d.note.id + idx}
                      className={cn(
                        'diff-highlight absolute h-1 rounded',
                        d.type === 'added' ? 'bg-green-500/40' : 'bg-red-500/40'
                      )}
                      style={{
                        left: `${(idx / Math.max(diff.length, 1)) * 100}%`,
                        top: `${Math.random() * 80 + 10}%`,
                        width: `${Math.random() * 20 + 10}%`,
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full bg-gradient-to-br flex-shrink-0',
                    getAvatarColor(version.creatorId),
                    'flex items-center justify-center text-white text-xs font-semibold'
                  )}
                >
                  {getInitials(version.creatorName)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {version.name}
                    </h4>
                    <button
                      onClick={(e) => handleRestoreClick(e, version)}
                      className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white bg-[#e94560] hover:bg-[#d13a54] transition-colors duration-200"
                    >
                      <RotateCcw className="w-3 h-3" />
                      恢复
                    </button>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {formatRelativeTime(version.createdAt)} · {version.creatorName}
                  </p>

                  {selectedVersionId === version.id && (addedCount > 0 || removedCount > 0) && (
                    <div className="flex gap-3 mt-2">
                      {addedCount > 0 && (
                        <span className="text-xs text-green-400">
                          +{addedCount} 新增
                        </span>
                      )}
                      {removedCount > 0 && (
                        <span className="text-xs text-red-400">
                          -{removedCount} 删除
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {restoreConfirmVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 modal-ripple" />
          <div
            className={cn(
              'relative glass-panel rounded-2xl p-6 w-[90%] max-w-sm',
              'border border-white/10 shadow-2xl',
              'modal-slide-up'
            )}
          >
            <button
              onClick={() => setRestoreConfirmVersion(null)}
              className="absolute top-3 right-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#e94560]/20 flex items-center justify-center">
                <RotateCcw className="w-7 h-7 text-[#e94560]" />
              </div>

              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                恢复到该版本？
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                {restoreConfirmVersion.name}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mb-6">
                {formatRelativeTime(restoreConfirmVersion.createdAt)} · {restoreConfirmVersion.creatorName}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mb-6">
                当前未保存的修改将会丢失
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setRestoreConfirmVersion(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-primary)] text-sm font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmRestore}
                  disabled={restoring}
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all',
                    'bg-[#e94560] hover:bg-[#d13a54]',
                    restoring && 'opacity-70 cursor-not-allowed',
                    restoring && 'content-fade-in'
                  )}
                >
                  {restoring ? '恢复中...' : '确认恢复'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
