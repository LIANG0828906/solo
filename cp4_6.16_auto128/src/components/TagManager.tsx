import { useState, useRef, useEffect } from 'react';
import { useNoteStore } from '@/store/noteStore';
import { TAG_COLORS } from '@/utils/constants';
import { X, Plus } from 'lucide-react';

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const getTagColor = (tagName: string): string => {
  const hash = hashString(tagName);
  const index = hash % TAG_COLORS.length;
  return TAG_COLORS[index];
};

interface TagManagerProps {
  noteId: string;
}

const TagManager = ({ noteId }: TagManagerProps) => {
  const { notes, addTag, removeTag } = useNoteStore();
  const [newTag, setNewTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const note = notes.find((n) => n.id === noteId);
  const tags = note?.tags || [];

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      addTag(noteId, trimmedTag);
      setNewTag('');
    }
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTag();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    removeTag(noteId, tag);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <div
          key={tag}
          className="group relative flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-medium transition-all duration-200 hover:scale-105"
          style={{ backgroundColor: getTagColor(tag) }}
          title={tag}
        >
          <span className="max-w-[120px] truncate">{tag}</span>
          <button
            onClick={() => handleRemoveTag(tag)}
            className="ml-1 p-0.5 rounded-full opacity-60 hover:opacity-100 hover:bg-white/20 transition-opacity"
            title={`删除标签 ${tag}`}
          >
            <X size={14} />
          </button>
        </div>
      ))}

      {isAdding ? (
        <input
          ref={inputRef}
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleAddTag}
          placeholder="输入标签名..."
          className="px-3 py-1 bg-transparent border border-dashed border-gray-400 rounded-full text-sm outline-none focus:border-gray-600 w-32"
        />
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 px-3 py-1 rounded-full border border-dashed border-gray-400 text-gray-500 text-sm hover:border-gray-600 hover:text-gray-700 transition-colors"
        >
          <Plus size={14} />
          <span>添加标签</span>
        </button>
      )}
    </div>
  );
};

export default TagManager;
