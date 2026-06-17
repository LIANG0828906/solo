import { useCallback, useMemo } from 'react';
import Icon from '@mdi/react';
import { mdiMagnify } from '@mdi/js';
import { useStore } from '@/store/useStore';
import { CATEGORIES } from '@/types';

export function SearchPanel() {
  const { searchQuery, setSearchQuery, selectedTags, setSelectedTags, skills } = useStore();

  const popularTags = useMemo(() => {
    const tagCount = new Map<string, number>();
    skills.forEach((skill) => {
      skill.tags.forEach((tag) => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([tag]) => tag);
  }, [skills]);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery]
  );

  const toggleTag = useCallback(
    (tag: string) => {
      if (selectedTags.includes(tag)) {
        setSelectedTags(selectedTags.filter((t) => t !== tag));
      } else {
        setSelectedTags([...selectedTags, tag]);
      }
    },
    [selectedTags, setSelectedTags]
  );

  const clearAll = useCallback(() => {
    setSearchQuery('');
    setSelectedTags([]);
  }, [setSearchQuery, setSelectedTags]);

  const hasFilters = searchQuery || selectedTags.length > 0;

  return (
    <div className="search-panel">
      <div className="search-box">
        <Icon path={mdiMagnify} size={0.8} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="搜索技能、标签或用户..."
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      <div className="tag-cloud-title">
        技能分类
        {hasFilters && (
          <button
            style={{
              fontSize: 12,
              color: 'var(--color-primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginLeft: 8,
            }}
            onClick={clearAll}
          >
            清除筛选
          </button>
        )}
      </div>
      <div className="tag-cloud">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            className={`tag ${selectedTags.includes(category) ? 'active' : ''}`}
            onClick={() => toggleTag(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="tag-cloud-title" style={{ marginTop: 24 }}>
        热门标签
      </div>
      <div className="tag-cloud">
        {popularTags.map((tag) => (
          <button
            key={tag}
            className={`tag ${selectedTags.includes(tag) ? 'active' : ''}`}
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
