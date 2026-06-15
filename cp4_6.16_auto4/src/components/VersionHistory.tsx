import { useEffect, useState } from 'react';
import { useDocStore } from '../store/useDocStore';
import { useSocket } from '../hooks/useSocket';
import { Clock, RotateCcw, X, History, Loader2 } from 'lucide-react';
import type { VersionSnapshot } from '../../shared/types';

export default function VersionHistory() {
  const activeDocId = useDocStore((s) => s.activeDocId);
  const showVersionHistory = useDocStore((s) => s.showVersionHistory);
  const setShowVersionHistory = useDocStore((s) => s.setShowVersionHistory);
  const { getSocket } = useSocket();

  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [rollingBack, setRollingBack] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !showVersionHistory || !activeDocId) return;

    setLoading(true);

    const handleVersionList = (data: { docId: string; versions: VersionSnapshot[] }) => {
      if (data.docId === activeDocId) {
        setVersions(data.versions.sort((a, b) => b.createdAt - a.createdAt));
        setLoading(false);
      }
    };

    const handleVersionSaved = (data: { docId: string; version: VersionSnapshot }) => {
      if (data.docId === activeDocId) {
        setVersions((prev) => [data.version, ...prev].sort((a, b) => b.createdAt - a.createdAt));
      }
    };

    socket.on('version-list', handleVersionList);
    socket.on('version-saved', handleVersionSaved);

    socket.emit('get-versions', { docId: activeDocId });

    return () => {
      socket.off('version-list', handleVersionList);
      socket.off('version-saved', handleVersionSaved);
    };
  }, [showVersionHistory, activeDocId, getSocket]);

  const handleRollback = (versionId: string) => {
    const socket = getSocket();
    if (!socket || !activeDocId) return;

    setRollingBack(versionId);
    socket.emit('rollback-version', { docId: activeDocId, versionId });

    setTimeout(() => {
      setRollingBack(null);
      socket.emit('get-versions', { docId: activeDocId });
    }, 500);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} 小时前`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!showVersionHistory) return null;

  return (
    <div className="absolute top-0 right-0 w-72 h-full bg-white shadow-xl border-l border-navy-50 z-30 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-navy-50">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-navy" />
          <span className="text-sm font-bold text-navy">版本历史</span>
        </div>
        <button
          onClick={() => setShowVersionHistory(false)}
          className="p-1 hover:bg-navy-50 rounded transition-colors"
        >
          <X className="w-4 h-4 text-navy-300" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-navy-300 animate-spin" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12 text-navy-300 text-sm">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>暂无历史版本</p>
            <p className="text-xs mt-1">每5分钟自动保存一次</p>
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className="p-3 bg-navy-50/50 rounded-lg hover:bg-navy-50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-navy font-medium">
                      {index === 0 ? '当前版本' : formatTime(version.createdAt)}
                    </div>
                    <div className="text-xs text-navy-400 mt-0.5">
                      {new Date(version.createdAt).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRollback(version.id)}
                    disabled={rollingBack === version.id || index === 0}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-navy-400 hover:text-navy hover:bg-white rounded transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {rollingBack === version.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3 h-3" />
                    )}
                    回滚
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-navy-50 bg-navy-50/30">
        <p className="text-[10px] text-navy-400 text-center">
          每 5 分钟自动保存一次快照
        </p>
      </div>
    </div>
  );
}
