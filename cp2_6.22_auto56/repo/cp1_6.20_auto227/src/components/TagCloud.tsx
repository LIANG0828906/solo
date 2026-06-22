import React, { useMemo, memo } from 'react';
import type { Tag } from '../types';

interface TagCloudProps {
  tags: Tag[];
  minSize?: number;
  maxSize?: number;
}

const TagCloud: React.FC<TagCloudProps> = memo(
  ({ tags, minSize = 12, maxSize = 32 }) => {
    const tagStyles = useMemo(() => {
      if (tags.length === 0) return [];

      const counts = tags.map((t) => t.count);
      const minCount = Math.min(...counts);
      const maxCount = Math.max(...counts);
      const range = maxCount - minCount || 1;

      return tags.map((tag, index) => {
        const normalized = (tag.count - minCount) / range;
        const fontSize = minSize + normalized * (maxSize - minSize);
        const delay = index * 0.05;

        return {
          ...tag,
          fontSize: `${Math.round(fontSize)}px`,
          animationDelay: `${delay}s`,
        };
      });
    }, [tags, minSize, maxSize]);

    return (
      <div className="tag-cloud-section">
        <h4 className="section-title">用户口碑标签</h4>
        <div className="tag-cloud">
          {tagStyles.map((tag) => (
            <span
              key={tag.name}
              className="tag-item"
              style={{
                fontSize: tag.fontSize,
                animationDelay: tag.animationDelay,
              }}
              title={`${tag.name} (${tag.count}人提到)`}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>
    );
  }
);

TagCloud.displayName = 'TagCloud';

export default TagCloud;
