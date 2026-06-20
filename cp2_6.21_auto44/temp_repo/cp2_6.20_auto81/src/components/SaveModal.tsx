import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import type { SaveData } from '../types';
import dayjs from 'dayjs';

interface SaveModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  onLoad: (save: SaveData) => void;
}

const SaveModal = ({ open, onClose, onSave, onLoad }: SaveModalProps) => {
  const { saves, removeSave } = useGameStore();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      onClick={onClose}
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-lg mx-4 rounded-lg border overflow-hidden animate-fade-in"
        style={{
          backgroundColor: 'rgba(13, 17, 23, 0.95)',
          borderColor: 'var(--border-color)',
          boxShadow: '0 0 40px rgba(88, 166, 255, 0.15)',
          backdropFilter: 'blur(16px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div
            className="font-mono text-sm font-bold uppercase tracking-wider"
            style={{ color: 'var(--text-accent)' }}
          >
            💾 存档管理
          </div>
          <button
            onClick={onClose}
            className="btn-press font-mono text-xl px-2 rounded"
            style={{ color: 'var(--text-secondary)' }}
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={onSave}
            className="btn-press w-full font-mono text-sm py-3 rounded border mb-4 transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-accent)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.15)';
              e.currentTarget.style.borderColor = 'var(--bg-card-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-card)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            [+] 创建新存档
          </button>

          <div
            className="font-mono text-xs uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            已保存的游戏 ({saves.length}/10)
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {saves.length === 0 ? (
              <div
                className="font-mono text-sm italic py-8 text-center"
                style={{ color: 'var(--text-secondary)' }}
              >
                暂无存档
              </div>
            ) : (
              saves.map((save) => (
                <div
                  key={save.id}
                  className="font-mono text-sm p-3 rounded border flex items-center justify-between gap-3 transition-all duration-200 group"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <button
                    onClick={() => onLoad(save)}
                    className="flex-1 text-left"
                    onMouseEnter={(e) => {
                      const parent = e.currentTarget.closest('div');
                      if (parent) {
                        parent.style.backgroundColor = 'rgba(31, 111, 235, 0.1)';
                        parent.style.borderColor = 'var(--bg-card-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      const parent = e.currentTarget.closest('div');
                      if (parent) {
                        parent.style.backgroundColor = 'var(--bg-card)';
                        parent.style.borderColor = 'var(--border-color)';
                      }
                    }}
                  >
                    <div
                      className="text-xs mb-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {dayjs(save.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                    </div>
                    <div style={{ color: 'var(--text-primary)' }}>
                      {save.sceneSummary || '未命名存档'}
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSave(save.id);
                    }}
                    className="btn-press text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      color: 'var(--text-danger)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(248, 81, 73, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    删除
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveModal;
