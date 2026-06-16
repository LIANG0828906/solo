import { useEffect, useState } from 'react';
import { useNoteStore, Version } from '@/store/noteStore';
import { X, RotateCcw, Trash2 } from 'lucide-react';

interface HistoryModalProps {
  noteId: string;
  onClose: () => void;
}

const formatTimestamp = (timestamp: number): string => {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
};

const HistoryModal = ({ noteId, onClose }: HistoryModalProps) => {
  const { notes, restoreVersion, deleteVersion } = useNoteStore();
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const note = notes.find((n) => n.id === noteId);
  const versions = note?.versionHistory || [];

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleRestore = (versionId: string) => {
    if (confirmRestore === versionId) {
      restoreVersion(noteId, versionId);
      setConfirmRestore(null);
      handleClose();
    } else {
      setConfirmRestore(versionId);
    }
  };

  const handleDelete = (versionId: string) => {
    deleteVersion(noteId, versionId);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={handleOverlayClick}
    >
      <div
        className={`relative bg-[var(--color-paper)] rounded-lg shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col transition-transform duration-200 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-300">
          <h2 className="text-lg font-bold text-[var(--color-wood-dark)]">版本历史</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title="关闭"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {versions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              暂无历史版本
            </div>
          ) : (
            <div className="space-y-3">
              {versions.slice(0, 10).map((version: Version, index: number) => (
                <div
                  key={version.id}
                  className="p-3 bg-white/70 rounded-lg border border-gray-200 hover:border-[var(--color-bronze)] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--color-wood-dark)]">
                      {formatTimestamp(version.createdAt)}
                    </span>
                    <span className="text-xs text-gray-500">
                      版本 {index + 1}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {version.content ? version.content.slice(0, 100) : '（空内容）'}
                    {version.content && version.content.length > 100 ? '...' : ''}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestore(version.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        confirmRestore === version.id
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-[var(--color-bronze)] text-white hover:bg-[var(--color-bronze-hover)]'
                      }`}
                    >
                      <RotateCcw size={14} />
                      <span>{confirmRestore === version.id ? '确认恢复' : '恢复'}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(version.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                      <span>删除</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-300 text-center text-xs text-gray-500">
          最多保留 10 个版本
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
