import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { useGradingStore } from '@/store/useGradingStore';
import type { PopupPosition } from '@/types';

interface CommentPopupProps {
  clickX: number;
  clickY: number;
  paragraphIndex: number;
  onClose: () => void;
}

const POPUP_WIDTH = 360;
const POPUP_HEIGHT = 340;
const PADDING = 16;

export const CommentPopup: React.FC<CommentPopupProps> = ({
  clickX,
  clickY,
  paragraphIndex,
  onClose,
}) => {
  const [content, setContent] = useState('');
  const [type, setType] = useState<'positive' | 'improvement'>('positive');
  const [showAddPreset, setShowAddPreset] = useState(false);
  const [newPresetContent, setNewPresetContent] = useState('');
  const [newPresetType, setNewPresetType] = useState<'positive' | 'improvement'>('positive');
  const [position, setPosition] = useState<PopupPosition>({ top: 0, left: 0 });
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');
  const popupRef = useRef<HTMLDivElement>(null);

  const { essay, presetComments, addComment, addPresetComment, setPopupVisible } =
    useGradingStore();

  useEffect(() => {
    const calculatePosition = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left = clickX - POPUP_WIDTH / 2;
      left = Math.max(PADDING, Math.min(left, viewportWidth - POPUP_WIDTH - PADDING));

      const spaceBelow = viewportHeight - clickY;
      const spaceAbove = clickY;

      let top: number;
      let newPlacement: 'top' | 'bottom';

      if (spaceBelow >= POPUP_HEIGHT + PADDING) {
        top = clickY + 10;
        newPlacement = 'bottom';
      } else if (spaceAbove >= POPUP_HEIGHT + PADDING) {
        top = clickY - POPUP_HEIGHT - 10;
        newPlacement = 'top';
      } else {
        if (spaceBelow > spaceAbove) {
          top = Math.min(clickY + 10, viewportHeight - POPUP_HEIGHT - PADDING);
          newPlacement = 'bottom';
        } else {
          top = Math.max(PADDING, clickY - POPUP_HEIGHT - 10);
          newPlacement = 'top';
        }
      }

      setPosition({ top, left });
      setPlacement(newPlacement);
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [clickX, clickY]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handlePresetClick = (presetContent: string, presetType: 'positive' | 'improvement') => {
    setContent(presetContent);
    setType(presetType);
  };

  const handleSave = async () => {
    if (!content.trim() || !essay) return;
    await addComment({
      essayId: essay.id,
      paragraphIndex,
      content: content.trim(),
      type,
    });
    onClose();
    setPopupVisible(false);
  };

  const handleAddPreset = async () => {
    if (!newPresetContent.trim()) return;
    await addPresetComment({
      content: newPresetContent.trim(),
      type: newPresetType,
    });
    setNewPresetContent('');
    setShowAddPreset(false);
  };

  const filteredPresets = presetComments.filter((p) => p.type === type);

  return (
    <div
      ref={popupRef}
      className="comment-popup"
      style={{
        top: position.top,
        left: position.left,
        animationDirection: placement === 'top' ? 'reverse' : 'normal',
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-text-primary text-sm">
          添加评语 - 第 {paragraphIndex + 1} 段
        </h4>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={16} className="text-text-secondary" />
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setType('positive')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
            type === 'positive'
              ? 'bg-positive text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          正面评价
        </button>
        <button
          onClick={() => setType('improvement')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
            type === 'improvement'
              ? 'bg-improvement text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          待改进
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="请输入评语内容..."
        className="w-full h-20 p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/50 bg-bg-panel text-text-primary placeholder:text-text-secondary"
      />

      <div className="mt-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-text-secondary">预设评语</span>
          <button
            onClick={() => setShowAddPreset(!showAddPreset)}
            className="flex items-center gap-1 text-xs text-brand hover:text-brand-hover transition-colors"
          >
            <Plus size={14} />
            添加预设
          </button>
        </div>

        {showAddPreset && (
          <div className="mb-3 p-2.5 bg-bg-alt rounded-lg animate-fade-in">
            <div className="flex gap-1 mb-2">
              <button
                onClick={() => setNewPresetType('positive')}
                className={`flex-1 py-1 px-2 rounded text-xs transition-all ${
                  newPresetType === 'positive'
                    ? 'bg-positive text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-text-secondary'
                }`}
              >
                正面
              </button>
              <button
                onClick={() => setNewPresetType('improvement')}
                className={`flex-1 py-1 px-2 rounded text-xs transition-all ${
                  newPresetType === 'improvement'
                    ? 'bg-improvement text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-text-secondary'
                }`}
              >
                待改进
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPresetContent}
                onChange={(e) => setNewPresetContent(e.target.value)}
                placeholder="输入新预设评语..."
                className="flex-1 px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-brand/50 bg-bg-panel text-text-primary"
              />
              <button
                onClick={handleAddPreset}
                className="px-2 py-1.5 bg-brand text-white text-xs rounded hover:bg-brand-hover transition-colors"
              >
                <Check size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto scrollbar-thin">
          {filteredPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset.content, preset.type)}
              className={`px-2 py-1 text-xs rounded-full transition-all ${
                preset.type === 'positive'
                  ? 'bg-positive/15 text-positive hover:bg-positive/25'
                  : 'bg-improvement/15 text-improvement hover:bg-improvement/25'
              }`}
            >
              {preset.content}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-text-secondary bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={!content.trim()}
          className="ripple-btn px-4 py-2 text-sm text-white bg-brand rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          保存
        </button>
      </div>
    </div>
  );
};
