import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useGraphStore } from '../store/useGraphStore';
import type { Tag } from '../types';
import { TAG_COLORS, TAG_LABELS, getPriorityColor } from '../types';

export const AddIdeaModal: React.FC = () => {
  const {
    isModalOpen,
    modalParentId,
    nodes,
    actions: { closeModal, addNode },
  } = useGraphStore();

  const [title, setTitle] = useState('');
  const [tag, setTag] = useState<Tag>('inspiration');
  const [color, setColor] = useState('#6C63FF');
  const [priority, setPriority] = useState(50);
  const [errors, setErrors] = useState<{ title?: string }>({});

  const parentNode = nodes.find((n) => n.id === modalParentId);

  useEffect(() => {
    if (isModalOpen) {
      setTitle('');
      setTag('inspiration');
      setColor(TAG_COLORS.inspiration);
      setPriority(50);
      setErrors({});
    }
  }, [isModalOpen]);

  const handleTagChange = (newTag: Tag) => {
    setTag(newTag);
    setColor(TAG_COLORS[newTag]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrors({ title: '请输入灵感标题' });
      return;
    }

    addNode({
      title: title.trim(),
      tag,
      color,
      priority,
      parentId: modalParentId,
    });

    closeModal();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  if (!isModalOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div
        className="
          w-[400px] bg-[#1E1E2E] rounded-2xl border-2 border-[#3A3A5C]
          shadow-2xl overflow-hidden
          animate-in fade-in zoom-in-95 duration-200
        "
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(108, 99, 255, 0.1)',
        }}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#2A2A44]">
          <div>
            <h3 className="text-[#E0E0E0] font-bold text-lg">
              {parentNode ? '添加子灵感' : '添加新灵感'}
            </h3>
            {parentNode && (
              <p className="text-[#8C8CAA] text-sm mt-1">
                父节点: {parentNode.title}
              </p>
            )}
          </div>
          <button
            className="
              w-8 h-8 flex items-center justify-center rounded-lg
              text-[#8C8CAA] hover:text-[#E0E0E0] hover:bg-[#2A2A44]
              transition-colors
            "
            onClick={closeModal}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-[#8C8CAA] text-sm font-medium mb-2">
              灵感标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({});
              }}
              placeholder="输入灵感描述..."
              className={`
                w-full px-4 py-3 bg-[#16162A] border rounded-xl
                text-[#E0E0E0] text-sm placeholder-[#6C6C8A]
                focus:outline-none focus:ring-2 transition-all
                ${errors.title
                  ? 'border-[#FF6B6B] focus:ring-[#FF6B6B]/30'
                  : 'border-[#2A2A44] focus:border-[#6C63FF] focus:ring-[#6C63FF]/30'
                }
              `}
              autoFocus
            />
            {errors.title && (
              <p className="text-[#FF6B6B] text-xs mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-[#8C8CAA] text-sm font-medium mb-2">
              标签分类
            </label>
            <div className="flex gap-2">
              {(Object.keys(TAG_LABELS) as Tag[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTagChange(t)}
                  className={`
                    flex-1 py-2.5 px-3 rounded-xl text-sm font-medium
                    transition-all duration-200 border-2
                    ${tag === t
                      ? 'bg-[#2A2A44] border-[#6C63FF] text-[#E0E0E0]'
                      : 'bg-transparent border-[#2A2A44] text-[#8C8CAA] hover:border-[#3A3A5C]'
                    }
                  `}
                >
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                    style={{ backgroundColor: TAG_COLORS[t] }}
                  />
                  {TAG_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[#8C8CAA] text-sm font-medium mb-2">
              自定义颜色
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="
                  w-12 h-12 rounded-xl cursor-pointer
                  bg-transparent border-2 border-[#2A2A44]
                  focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30
                "
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="
                  flex-1 px-4 py-2.5 bg-[#16162A] border-2 border-[#2A2A44]
                  rounded-xl text-[#E0E0E0] text-sm font-mono
                  focus:outline-none focus:border-[#6C63FF]
                  focus:ring-2 focus:ring-[#6C63FF]/30 transition-all
                "
              />
            </div>
          </div>

          <div>
            <label className="block text-[#8C8CAA] text-sm font-medium mb-2">
              优先级
              <span
                className="float-right font-bold"
                style={{ color: getPriorityColor(priority) }}
              >
                {priority}%
              </span>
            </label>
            <div className="relative">
              <div
                className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full left-0 right-0"
                style={{
                  background: 'linear-gradient(to right, #4ECDC4, #FFD93D, #FF6B6B)',
                }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="
                  relative w-full h-8 appearance-none bg-transparent
                  cursor-pointer z-10
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:hover:scale-110
                  [&::-moz-range-thumb]:w-5
                  [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:cursor-pointer
                "
                style={{
                  '--thumb-border': getPriorityColor(priority),
                } as React.CSSProperties}
              />
            </div>
            <div className="flex justify-between text-xs text-[#6C6C8A] mt-1">
              <span>低</span>
              <span>中</span>
              <span>高</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="
                flex-1 py-3 rounded-xl text-sm font-semibold
                bg-[#2A2A44] text-[#E0E0E0]
                hover:bg-[#3A3A5C] transition-colors
              "
            >
              取消
            </button>
            <button
              type="submit"
              className="
                flex-1 py-3 rounded-xl text-sm font-semibold text-white
                transition-all duration-200
                hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
              "
              style={{
                backgroundColor: '#6C63FF',
                boxShadow: '0 4px 12px rgba(108, 99, 255, 0.4)',
              }}
            >
              添加灵感
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
