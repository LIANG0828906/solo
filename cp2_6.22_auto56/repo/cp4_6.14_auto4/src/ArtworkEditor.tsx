import React, { useState, useEffect, memo } from 'react';
import type { PlacedArtwork } from './types';

interface ArtworkEditorProps {
  artwork: PlacedArtwork;
  onSave: (updates: Partial<PlacedArtwork>) => void;
  onDelete: () => void;
  onClose: () => void;
}

const ArtworkEditor: React.FC<ArtworkEditorProps> = memo(({ artwork, onSave, onDelete, onClose }) => {
  const [title, setTitle] = useState(artwork.title);
  const [width, setWidth] = useState(artwork.width);
  const [height, setHeight] = useState(artwork.height);
  const [rotation, setRotation] = useState<0 | 45 | 90>(artwork.rotation);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleSave = () => {
    onSave({
      title: title.trim() || artwork.title,
      width: Math.max(40, Math.min(200, width)),
      height: Math.max(40, Math.min(200, height)),
      rotation,
    });
    handleClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s ease-gallery',
      }}
    >
      <div
        className="bg-gallery-card backdrop-blur-xl rounded-xl border border-gallery-accent/30 shadow-gallery-hover w-full max-w-md mx-4 overflow-hidden"
        style={{
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="px-6 py-4 border-b border-gallery-accent/20 flex items-center justify-between">
          <h3 className="text-gallery-accent font-bold text-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            编辑展品
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors duration-200 hover:scale-110"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              展品标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gallery-bg/80 border border-gallery-accent/30 rounded-lg px-4 py-2.5 text-white
                       focus:outline-none focus:border-gallery-accent focus:ring-1 focus:ring-gallery-accent/50
                       transition-all duration-200"
              placeholder="输入展品标题"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                宽度 (px)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                min={40}
                max={200}
                className="w-full bg-gallery-bg/80 border border-gallery-accent/30 rounded-lg px-4 py-2.5 text-white
                         focus:outline-none focus:border-gallery-accent focus:ring-1 focus:ring-gallery-accent/50
                         transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                高度 (px)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                min={40}
                max={200}
                className="w-full bg-gallery-bg/80 border border-gallery-accent/30 rounded-lg px-4 py-2.5 text-white
                         focus:outline-none focus:border-gallery-accent focus:ring-1 focus:ring-gallery-accent/50
                         transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-3">
              旋转角度
            </label>
            <div className="flex gap-2">
              {([0, 45, 90] as const).map((angle) => (
                <button
                  key={angle}
                  onClick={() => setRotation(angle)}
                  className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                    ${rotation === angle
                      ? 'bg-gallery-accent text-white shadow-gallery scale-105'
                      : 'bg-gallery-bg/80 text-gray-400 border border-gallery-accent/30 hover:border-gallery-accent/60 hover:text-white hover:scale-105'
                    }`}
                >
                  {angle}°
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              预览
            </label>
            <div className="bg-gallery-bg/80 rounded-lg p-6 flex items-center justify-center border border-gallery-accent/20">
              <div
                className="rounded-lg flex items-center justify-center text-white font-bold shadow-lg"
                style={{
                  width: Math.min(80, width / 2),
                  height: Math.min(80, height / 2),
                  backgroundColor: artwork.color,
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {title.charAt(0) || '?'}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gallery-accent/20 flex items-center justify-between">
          <button
            onClick={onDelete}
            className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg
                     transition-all duration-200 text-sm font-medium hover:scale-105"
          >
            删除展品
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-5 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg
                       transition-all duration-200 text-sm font-medium hover:scale-105"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-gallery-accent hover:bg-gallery-accent-hover text-white rounded-lg
                       transition-all duration-200 text-sm font-medium shadow-gallery hover:shadow-gallery-hover hover:scale-105"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ArtworkEditor.displayName = 'ArtworkEditor';

export default ArtworkEditor;
