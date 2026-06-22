import { useState, useEffect, useRef } from 'react';
import { MarkData, TagItem, getRandomColor, PRESET_COLORS } from '@/types';
import { X, Star, Plus } from 'lucide-react';

interface MarkPanelProps {
  frameId: string;
  frameIndex: number;
  timestamp: number;
  existingMark?: MarkData;
  onSave: (mark: MarkData) => void;
  onDelete: (frameId: string) => void;
  onClose: () => void;
}

export function MarkPanel({
  frameId,
  frameIndex,
  timestamp,
  existingMark,
  onSave,
  onDelete,
  onClose,
}: MarkPanelProps) {
  const [tags, setTags] = useState<TagItem[]>(existingMark?.tags ?? []);
  const [rating, setRating] = useState(existingMark?.rating ?? 0);
  const [note, setNote] = useState(existingMark?.note ?? '');
  const [tagInput, setTagInput] = useState('');
  const [visible, setVisible] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleAddTag = () => {
    const name = tagInput.trim();
    if (!name || tags.length >= 5) return;
    if (tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) return;
    const color = PRESET_COLORS[tags.length % PRESET_COLORS.length];
    setTags([...tags, { name, color }]);
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({
      frameId,
      tags,
      rating,
      note: note.slice(0, 200),
    });
    handleClose();
  };

  const handleDelete = () => {
    onDelete(frameId);
    handleClose();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-[#00000080]" />
      <div
        className={`mark-panel relative z-10 w-full max-w-lg rounded-2xl bg-[#1E293B] p-6 shadow-2xl transition-all duration-300 md:rounded-2xl md:max-h-[90vh] max-md:h-full max-md:max-h-full max-md:rounded-none ${
          visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#E2E8F0]">
              帧 #{frameIndex + 1}
            </h3>
            <p className="text-sm text-[#64748B]">{formatTime(timestamp)}</p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-[#94A3B8] transition-colors hover:bg-[#334155] hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          <div className="mark-input-fade">
            <label className="mb-2 block text-sm font-medium text-[#94A3B8]">
              标签 ({tags.length}/5)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="tag-pill inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                  <button
                    onClick={() => handleRemoveTag(i)}
                    className="ml-0.5 hover:opacity-70"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="输入标签后按回车添加"
                disabled={tags.length >= 5}
                className="flex-1 rounded-lg border border-[#475569] bg-[#0F172A] px-3 py-2 text-sm text-[#E2E8F0] placeholder-[#64748B] outline-none transition-colors focus:border-[#3B82F6] disabled:opacity-50"
              />
              <button
                onClick={handleAddTag}
                disabled={tags.length >= 5 || !tagInput.trim()}
                className="rounded-lg bg-[#3B82F6] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#94A3B8]">
              评分
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star === rating ? 0 : star)}
                  className="star-btn p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={24}
                    className={star <= rating ? 'text-[#EAB308]' : 'text-[#475569]'}
                    fill={star <= rating ? '#EAB308' : 'none'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mark-input-fade">
            <label className="mb-2 block text-sm font-medium text-[#94A3B8]">
              备注 ({note.length}/200)
            </label>
            <textarea
              ref={noteRef}
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              placeholder="添加备注..."
              rows={3}
              className="w-full rounded-lg border border-[#475569] bg-[#0F172A] px-3 py-2 text-sm text-[#E2E8F0] placeholder-[#64748B] outline-none transition-colors focus:border-[#3B82F6] resize-none"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={handleDelete}
            className="rounded-lg border border-[#EF4444]/50 px-4 py-2 text-sm font-medium text-[#EF4444] transition-colors hover:bg-[#EF4444]/10"
          >
            删除标记
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="rounded-lg border border-[#475569] px-4 py-2 text-sm font-medium text-[#94A3B8] transition-colors hover:bg-[#334155]"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
