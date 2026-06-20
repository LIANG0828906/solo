import { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import type { Tag } from '@/types';

const categoryStyles: Record<Tag['category'], string> = {
  tech: 'bg-garden-tag-blue text-garden-tag-blue-text',
  life: 'bg-garden-tag-green text-garden-tag-green-text',
  study: 'bg-garden-tag-purple text-garden-tag-purple-text',
};

interface TagCapsuleProps {
  tag: Tag;
  editable?: boolean;
  onRename?: (tagId: string, newName: string) => void;
}

export default function TagCapsule({ tag, editable = false, onRename }: TagCapsuleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(tag.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (editable && onRename) {
      setEditValue(tag.name);
      setIsEditing(true);
    }
  };

  const handleCommit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== tag.name && onRename) {
      onRename(tag.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(tag.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <span
        className={`tag-capsule ${categoryStyles[tag.category]} gap-1 pr-1`}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleCommit}
          className="bg-transparent border-none outline-none w-20 text-xs font-medium"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCommit();
          }}
          className="hover:bg-black/10 rounded p-0.5"
        >
          <Check size={10} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCancel();
          }}
          className="hover:bg-black/10 rounded p-0.5"
        >
          <X size={10} />
        </button>
      </span>
    );
  }

  return (
    <span
      className={`tag-capsule ${categoryStyles[tag.category]} ${editable ? 'cursor-pointer select-none' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      {tag.name}
    </span>
  );
}
