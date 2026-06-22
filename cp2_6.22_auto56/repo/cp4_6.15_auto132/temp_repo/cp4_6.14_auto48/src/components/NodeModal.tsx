import { useState, useEffect, useRef } from 'react';
import { useDebateStore } from '@/store/debateStore';
import { NodeType, NODE_COLORS, NODE_LABELS } from '@/types';
import { X } from 'lucide-react';

const NODE_TYPES: NodeType[] = ['pro', 'con', 'free'];

export default function NodeModal() {
  const { modalOpen, editingNode, newNodePosition, addNode, updateNode, closeModal } =
    useDebateStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<NodeType>('free');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modalOpen) {
      if (editingNode) {
        setTitle(editingNode.title);
        setContent(editingNode.content);
        setType(editingNode.type);
      } else {
        setTitle('');
        setContent('');
        setType('free');
      }
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [modalOpen, editingNode]);

  if (!modalOpen) return null;

  const handleSave = () => {
    if (!title.trim()) return;
    if (editingNode) {
      updateNode(editingNode.id, { title: title.trim(), content: content.trim(), type });
    } else {
      const x = newNodePosition?.x ?? 200;
      const y = newNodePosition?.y ?? 200;
      addNode(title.trim(), content.trim(), type, x, y);
    }
    closeModal();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal} onKeyDown={handleKeyDown}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 font-display">
            {editingNode ? '编辑论点' : '添加论点'}
          </h2>
          <button
            onClick={closeModal}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-600 mb-1">论点类型</label>
          <div className="flex gap-2">
            {NODE_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: type === t ? NODE_COLORS[t] : '#f1f5f9',
                  color: type === t ? 'white' : '#475569',
                }}
              >
                {NODE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-600 mb-1">标题</label>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入论点标题..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-debate-pro/40 focus:border-debate-pro"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            详细论据
            <span className="text-gray-400 font-normal ml-1">（支持 Markdown）</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="输入详细论据内容..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-debate-pro/40 focus:border-debate-pro resize-none font-mono"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={closeModal}
            className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm text-white font-medium transition-opacity hover:opacity-90"
            style={{ background: NODE_COLORS[type] }}
          >
            {editingNode ? '保存修改' : '添加论点'}
          </button>
        </div>
      </div>
    </div>
  );
}
