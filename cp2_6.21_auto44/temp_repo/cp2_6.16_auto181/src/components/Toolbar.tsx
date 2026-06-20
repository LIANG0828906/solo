import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ConfirmDialog } from './ConfirmDialog';

interface ToolbarProps {
  onToggleDrawer?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onToggleDrawer }) => {
  const {
    story,
    newStory,
    saveStory,
    exportStory,
    generateShareCode,
    enterPlayerMode,
  } = useStore();

  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = () => {
    saveStory();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const handleShare = () => {
    const code = generateShareCode();
    setShareCode(code);
  };

  const copyShareCode = () => {
    if (shareCode) {
      navigator.clipboard.writeText(shareCode);
    }
  };

  return (
    <>
      <div
        className="flex items-center justify-between px-6 py-3 shadow-md"
        style={{ backgroundColor: '#4A2C2A' }}
      >
        <div className="flex items-center gap-4">
          <button
            className="mobile-drawer-toggle text-white text-2xl"
            onClick={onToggleDrawer}
          >
            ☰
          </button>
          <h1
            className="font-bangers text-3xl tracking-wider"
            style={{ color: '#FFF8E7' }}
          >
            PixelStory
          </h1>
          <span className="text-sm opacity-70 hidden md:inline" style={{ color: '#FFF8E7' }}>
            交互式连环漫画编辑器
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="text-sm hidden sm:inline px-3 py-1 rounded-lg"
            style={{ backgroundColor: 'rgba(255,248,231,0.1)', color: '#FFF8E7' }}
          >
            📚 {story.title}
          </span>

          <button
            className="btn"
            style={{ backgroundColor: 'transparent', border: '2px solid #FFF8E7', color: '#FFF8E7' }}
            onClick={() => setShowNewConfirm(true)}
          >
            ✨ 新建
          </button>

          <button
            className="btn"
            style={{ backgroundColor: 'transparent', border: '2px solid #FFF8E7', color: '#FFF8E7' }}
            onClick={handleSave}
          >
            💾 保存
          </button>

          <button
            className="btn"
            style={{ backgroundColor: 'transparent', border: '2px solid #FFF8E7', color: '#FFF8E7' }}
            onClick={exportStory}
          >
            📤 导出
          </button>

          <button
            className="btn"
            style={{ backgroundColor: 'transparent', border: '2px solid #FFF8E7', color: '#FFF8E7' }}
            onClick={handleShare}
          >
            🔗 分享
          </button>

          <button
            className="btn"
            style={{ backgroundColor: '#E63946' }}
            onClick={enterPlayerMode}
          >
            ▶️ 播放
          </button>
        </div>
      </div>

      {savedMessage && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up px-6 py-3 rounded-xl text-white shadow-lg"
          style={{ backgroundColor: '#4A2C2A' }}
        >
          ✅ 故事已保存
        </div>
      )}

      <ConfirmDialog
        open={showNewConfirm}
        title="新建故事"
        message="确定要新建一个故事吗？当前未保存的内容将丢失。"
        confirmText="新建"
        onConfirm={() => {
          newStory();
          setShowNewConfirm(false);
        }}
        onCancel={() => setShowNewConfirm(false)}
      />

      {shareCode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShareCode(null)}
        >
          <div
            className="animate-zoom-in bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: '#4A2C2A' }}>
              🔗 分享故事
            </h3>
            <p className="mb-4 text-gray-600">复制以下分享码，其他人可以通过此分享码加载您的故事：</p>
            <div
              className="flex items-center gap-2 mb-6 p-4 rounded-xl text-2xl font-mono font-bold tracking-widest"
              style={{ backgroundColor: '#FFF8E7', color: '#E63946' }}
            >
              <span className="flex-1">{shareCode}</span>
              <button className="btn btn-accent" onClick={copyShareCode}>
                📋 复制
              </button>
            </div>
            <div className="flex justify-end">
              <button className="btn" onClick={() => setShareCode(null)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
