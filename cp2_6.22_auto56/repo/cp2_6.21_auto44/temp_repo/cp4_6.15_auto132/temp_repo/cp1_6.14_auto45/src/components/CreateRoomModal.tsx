import { useState } from 'react';
import { X, Sparkles, Tag } from 'lucide-react';

const AVAILABLE_TAGS = ['UI设计', '功能优化', '市场策略', '技术架构', '用户体验', '商业模式', '运营推广', '数据分析'];

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; tags: string[] }) => void;
}

export default function CreateRoomModal({ isOpen, onClose, onSubmit }: CreateRoomModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim(), tags });
    setName('');
    setDescription('');
    setTags([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-[#16213e] rounded-2xl border border-white/10 shadow-2xl fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[#ffd700]" />
            <h2 className="text-xl font-bold text-[#e0e0e0]">创建头脑风暴房间</h2>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#e0e0e0] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#e0e0e0] mb-1.5">房间名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="给你的头脑风暴起个名字"
              className="w-full"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#e0e0e0] mb-1.5">主题描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述这次头脑风暴的主题和目标..."
              className="w-full min-h-[80px] resize-y"
              maxLength={300}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#e0e0e0] mb-1.5">
              <Tag size={14} className="inline mr-1" />
              标签（可选）
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    tags.includes(tag)
                      ? 'bg-[#ffd700] text-[#1a1a2e] font-medium'
                      : 'bg-[#1a1a2e] text-[#9ca3af] border border-white/10 hover:border-[#ffd700]/30'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary px-5 py-2">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="btn-primary px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            创建房间
          </button>
        </div>
      </div>
    </div>
  );
}
