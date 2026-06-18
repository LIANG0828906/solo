import { useState, useMemo } from 'react';
import { History, GitCompare, X, Clock, FileText, ChevronRight } from 'lucide-react';
import { useInkFlowStore } from '@/store/useInkFlowStore';
import type { VersionHistory } from '@/types';
import { computeDiff, renderDiffHTML } from '@/utils/diff';
import { formatHistoryDate, formatHistoryTime } from '@/utils/formatTime';

interface VersionHistoryPanelProps {
  chapterId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function VersionHistoryPanel({
  chapterId,
  isOpen,
  onClose,
}: VersionHistoryPanelProps) {
  const allVersions = useInkFlowStore((s) => s.versionHistories);
  const chapterContents = useInkFlowStore((s) => s.chapterContents);
  const createVersionSnapshot = useInkFlowStore((s) => s.createVersionSnapshot);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const chapterVersions = useMemo(
    () =>
      allVersions
        .filter((v) => v.chapterId === chapterId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [allVersions, chapterId]
  );

  const groupedByDate = useMemo(() => {
    const groups: Record<string, VersionHistory[]> = {};
    chapterVersions.forEach((v) => {
      const key = formatHistoryDate(v.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(v);
    });
    return groups;
  }, [chapterVersions]);

  const currentContent = chapterContents[chapterId]?.content || '';

  const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '');

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
    setShowCompare(false);
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setShowCompare(false);
  };

  const handleCreateSnapshot = () => {
    createVersionSnapshot(chapterId);
  };

  const renderCompareView = () => {
    if (selectedIds.length !== 2) return null;
    const v1 = chapterVersions.find((v) => v.id === selectedIds[0]);
    const v2 = chapterVersions.find((v) => v.id === selectedIds[1]);
    if (!v1 || !v2) return null;
    const earlier = new Date(v1.createdAt) < new Date(v2.createdAt) ? v1 : v2;
    const later = earlier === v1 ? v2 : v1;

    const earlierContent =
      earlier.content.startsWith('<') || earlier.content.includes('_v')
        ? stripHtml(currentContent).slice(0, 80) + '... [早期版本内容]'
        : earlier.content;
    const laterContent =
      later.content.startsWith('<') || later.content.includes('_v')
        ? stripHtml(currentContent)
        : later.content;

    const segments = computeDiff(earlierContent, laterContent);
    const diffHTML = renderDiffHTML(segments);

    return (
      <div
        className="mt-4 p-3 rounded-lg border"
        style={{ borderColor: '#E2E8F0', background: '#FAFBFC' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
            <GitCompare size={14} style={{ color: '#6366F1' }} />
            <span>版本对比</span>
          </div>
          <button
            onClick={() => setShowCompare(false)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            收起
          </button>
        </div>
        <div className="flex items-center gap-2 mb-3 text-xs flex-wrap">
          <span className="px-2 py-0.5 rounded" style={{ background: '#FEE2E2', color: '#991B1B' }}>
            旧：{earlier.snapshotName}
          </span>
          <ChevronRight size={12} className="text-gray-400" />
          <span className="px-2 py-0.5 rounded" style={{ background: '#D1FAE5', color: '#065F46' }}>
            新：{later.snapshotName}
          </span>
        </div>
        <div
          className="text-sm p-3 bg-white rounded border border-gray-200 max-h-64 overflow-y-auto whitespace-pre-wrap break-words"
          style={{ fontSize: '13px', lineHeight: '1.8' }}
          dangerouslySetInnerHTML={{ __html: diffHTML }}
        />
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="h-full flex flex-col bg-white overflow-hidden"
      style={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <History size={16} style={{ color: '#6366F1' }} />
          <h3 className="text-sm font-semibold text-gray-800">版本历史</h3>
          <span className="text-xs text-gray-400">({chapterVersions.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCreateSnapshot}
            className="px-2.5 py-1 text-xs font-medium text-white rounded-md transition-all active:scale-[0.96]"
            style={{ background: '#6366F1' }}
          >
            保存快照
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div
          className="px-4 py-2 border-b text-xs"
          style={{ background: 'rgba(99,102,241,0.04)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-500">
              已选择 <span style={{ color: '#6366F1' }} className="font-medium">{selectedIds.length}/2</span> 个版本
              {selectedIds.length === 2 ? (
                showCompare ? '' : '，点击对比'
              ) : (
                '，再选一个进行对比'
              )}
            </span>
            <div className="flex items-center gap-2">
              {selectedIds.length === 2 && !showCompare && (
                <button
                  onClick={() => setShowCompare(true)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-white text-[10px]"
                  style={{ background: '#6366F1' }}
                >
                  <GitCompare size={10} />
                  对比
                </button>
              )}
              {selectedIds.length > 0 && (
                <button
                  onClick={clearSelection}
                  className="text-gray-400 hover:text-gray-600 text-[10px]"
                >
                  清除
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {chapterVersions.length === 0 && (
          <div className="text-center py-12 px-4">
            <FileText size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-xs text-gray-400 mb-3">暂无历史版本</p>
            <button
              onClick={handleCreateSnapshot}
              className="text-xs px-3 py-1.5 rounded-lg text-white transition-all active:scale-[0.96]"
              style={{ background: '#6366F1' }}
            >
              保存当前版本
            </button>
          </div>
        )}

        {Object.entries(groupedByDate).map(([date, versions]) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2 px-1 sticky top-0 z-10 py-1" style={{ background: 'linear-gradient(to bottom, white 60%, transparent)' }}>
              <span className="text-xs font-medium text-gray-400">{date}</span>
            </div>
            <div className="relative pl-4 border-l-2 border-gray-100 ml-1 space-y-2">
              {versions.map((v) => {
                const isSelected = selectedIds.includes(v.id);
                const selectOrder = selectedIds.indexOf(v.id);
                return (
                  <div
                    key={v.id}
                    onClick={() => toggleSelect(v.id)}
                    className="relative cursor-pointer transition-all duration-200"
                  >
                    <div
                      className="p-3 rounded-lg border transition-all active:scale-[0.98]"
                      style={{
                        background: isSelected ? 'rgba(99,102,241,0.08)' : '#F1F5F9',
                        borderColor: isSelected ? '#6366F1' : 'transparent',
                      }}
                    >
                      <div
                        className="absolute -left-[22px] top-4 w-2.5 h-2.5 rounded-full border-2 border-white"
                        style={{
                          background: isSelected ? '#6366F1' : '#CBD5E1',
                          zIndex: 1,
                        }}
                      />
                      {isSelected && (
                        <div
                          className="absolute -left-[29px] top-3 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ background: '#6366F1', zIndex: 2 }}
                        >
                          {selectOrder + 1}
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                              style={{ background: '#6366F1' }}
                            >
                              {v.authorAvatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800 truncate">
                                {v.snapshotName}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                                <Clock size={10} />
                                <span>{formatHistoryTime(v.createdAt)}</span>
                                <span>·</span>
                                <span>{v.authorName}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {showCompare && renderCompareView()}
      </div>

      <style>{`
        .diff-delete {
          background: #FEE2E2;
          padding: 1px 2px;
          border-radius: 2px;
          animation: diffBlink 0.2s ease;
          color: #991B1B;
        }
        .diff-insert {
          background: #D1FAE5;
          padding: 1px 2px;
          border-radius: 2px;
          animation: diffBlink 0.2s ease;
          color: #065F46;
        }
        @keyframes diffBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
