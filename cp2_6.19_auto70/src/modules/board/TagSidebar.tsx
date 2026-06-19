import React, { useState } from 'react';
import { Tag, Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import type { Tag as TagType } from '@/types';
import useBoardStore from '@/store/boardStore';
import { adjustColorBrightness } from '@/utils/colorUtils';
import { useClickOutside } from '@/hooks/useClickOutside';

interface TagSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function TagSidebar({ isMobile = false, onClose }: TagSidebarProps) {
  const { tags, selectedTagId, setSelectedTag, addTag, deleteTag } = useBoardStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  
  const inputRef = useClickOutside<HTMLDivElement>(() => {
    setIsAdding(false);
    setNewTagName('');
  }, isAdding);

  const handleAddTag = () => {
    const trimmed = newTagName.trim();
    if (trimmed) {
      addTag(trimmed);
      setNewTagName('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTagName('');
    }
  };

  const toggleTagExpand = (tagId: string) => {
    setExpandedTags(prev => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  const allCardsCount = tags.reduce((sum, t) => sum + t.cardCount, 0);

  return (
    <aside className={`tag-sidebar ${isMobile ? 'mobile' : ''}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">标签</h2>
        {isMobile && onClose && (
          <button className="sidebar-close" onClick={onClose}>
            <X size={20} />
          </button>
        )}
      </div>
      
      <div className="sidebar-content">
        <button
          className={`tag-item ${selectedTagId === null ? 'active' : ''}`}
          onClick={() => setSelectedTag(null)}
        >
          <div className="tag-dot all-dot" />
          <span className="tag-name">全部素材</span>
          <span className="tag-count">{allCardsCount}</span>
        </button>
        
        <div className="tag-list">
          {tags.map((tag) => (
            <div key={tag.id} className="tag-row">
              <button
                className={`tag-item ${selectedTagId === tag.id ? 'active' : ''}`}
                onClick={() => setSelectedTag(selectedTagId === tag.id ? null : tag.id)}
              >
                <div
                  className="tag-dot"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="tag-name">{tag.name}</span>
                <span className="tag-count">{tag.cardCount}</span>
              </button>
              
              <button
                className="tag-expand"
                onClick={() => toggleTagExpand(tag.id)}
                aria-label={expandedTags.has(tag.id) ? '收起' : '展开'}
              >
                {expandedTags.has(tag.id) ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
              
              {expandedTags.has(tag.id) && (
                <div className="tag-actions">
                  <button
                    className="tag-action delete"
                    onClick={() => deleteTag(tag.id)}
                  >
                    <X size={12} />
                    删除标签
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {isAdding ? (
          <div ref={inputRef} className="add-tag-form">
            <input
              type="text"
              className="add-tag-input"
              placeholder="输入标签名称"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              maxLength={20}
            />
            <div className="add-tag-actions">
              <button className="btn-primary btn-sm" onClick={handleAddTag}>
                添加
              </button>
              <button
                className="btn-secondary btn-sm"
                onClick={() => {
                  setIsAdding(false);
                  setNewTagName('');
                }}
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <button className="add-tag-btn" onClick={() => setIsAdding(true)}>
            <Plus size={16} />
            添加新标签
          </button>
        )}
      </div>
    </aside>
  );
}
