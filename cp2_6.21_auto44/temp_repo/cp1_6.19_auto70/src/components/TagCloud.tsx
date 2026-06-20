import React from 'react';
import type { TagFrequency } from '../types';
import { CATEGORY_COLORS } from '../utils/textSimilarity';

interface TagCloudProps {
  tags: TagFrequency[];
  maxCount: number;
  selectedTag: string | null;
  onSelect: (tag: string | null) => void;
}

function getCategoryForTag(tag: string): keyof typeof CATEGORY_COLORS {
  const categories = Object.keys(CATEGORY_COLORS) as Array<keyof typeof CATEGORY_COLORS>;
  const hash = tag.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return categories[hash % categories.length];
}

export function TagCloud({ tags, maxCount, selectedTag, onSelect }: TagCloudProps) {
  if (tags.length === 0) {
    return (
      <div className="tag-cloud tag-cloud--empty">
        <span>暂无标签，添加书摘后将自动生成</span>
      </div>
    );
  }

  return (
    <div className="tag-cloud">
      {tags.map(({ tag, count }) => {
        const fontSize = 14 + Math.min(14, (count / maxCount) * 14);
        const category = getCategoryForTag(tag);
        const colors = CATEGORY_COLORS[category];
        const colorIndex = tag.charCodeAt(0) % colors.length;
        const tagColor = colors[colorIndex];
        const isSelected = selectedTag === tag;

        return (
          <button
            key={tag}
            className={`tag-cloud__tag ${isSelected ? 'tag-cloud__tag--selected' : ''}`}
            style={{
              fontSize: `${isSelected ? fontSize * 1.2 : fontSize}px`,
              backgroundColor: isSelected ? tagColor : 'transparent',
              color: isSelected ? '#fff' : '#555',
              borderColor: tagColor,
            }}
            onClick={() => onSelect(isSelected ? null : tag)}
          >
            #{tag}
            <span className="tag-cloud__count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
