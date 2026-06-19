import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Folder, FileText, Link, File, StickyNote } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ICON_COLORS } from '@/types';

const SearchBar: React.FC = () => {
  const [isFocused, setIsFocused] = useState(false);
  const searchQuery = useStore((state) => state.searchQuery);
  const setSearchQuery = useStore((state) => state.setSearchQuery);
  const icons = useStore((state) => state.icons);
  const notes = useStore((state) => state.notes);
  const highlightIcon = useStore((state) => state.highlightIcon);
  const setContextMenu = useStore((state) => state.setContextMenu);

  const inputRef = useRef<HTMLInputElement>(null);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: Array<{
      id: string;
      type: 'icon' | 'note';
      label: string;
      subLabel: string;
      iconType: string;
      color: string;
    }> = [];

    icons.forEach((icon) => {
      if (
        icon.name.toLowerCase().includes(query) ||
        icon.label.toLowerCase().includes(query)
      ) {
        results.push({
          id: icon.id,
          type: 'icon',
          label: icon.label,
          subLabel: icon.name,
          iconType: icon.type,
          color: icon.color || ICON_COLORS[icon.type],
        });
      }
    });

    notes.forEach((note) => {
      const content = note.content.replace(/<[^>]*>/g, '').toLowerCase();
      if (
        note.title.toLowerCase().includes(query) ||
        content.includes(query)
      ) {
        results.push({
          id: note.id,
          type: 'note',
          label: note.title || '无标题便签',
          subLabel: content.substring(0, 50),
          iconType: 'note',
          color: '#f5e68c',
        });
      }
    });

    return results.slice(0, 10);
  }, [searchQuery, icons, notes]);

  const handleResultClick = (result: (typeof searchResults)[0]) => {
    if (result.type === 'icon') {
      highlightIcon(result.id);
    }
    setSearchQuery('');
    setIsFocused(false);
  };

  const getIconComponent = (type: string) => {
    switch (type) {
      case 'folder':
        return <Folder size={18} />;
      case 'document':
        return <FileText size={18} />;
      case 'link':
        return <Link size={18} />;
      case 'note':
        return <StickyNote size={18} />;
      default:
        return <File size={18} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'folder':
        return '文件夹';
      case 'document':
        return '文档';
      case 'link':
        return '链接';
      case 'note':
        return '便签';
      default:
        return '应用';
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };

    if (isFocused) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isFocused]);

  return (
    <div className="search-bar" style={{ position: 'relative' }}>
      <Search size={20} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
      <input
        ref={inputRef}
        type="text"
        placeholder="搜索图标、便签..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
      />
      {searchQuery && (
        <X
          size={18}
          style={{
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onClick={() => setSearchQuery('')}
        />
      )}

      {isFocused && searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map((result) => (
            <div
              key={`${result.type}-${result.id}`}
              className="search-result-item"
              onClick={() => handleResultClick(result)}
            >
              <div
                className="search-result-icon"
                style={{ backgroundColor: result.color }}
              >
                {getIconComponent(result.iconType)}
              </div>
              <div className="search-result-text">
                <div className="search-result-label">{result.label}</div>
                <div className="search-result-type">
                  {getTypeLabel(result.type)}
                  {result.subLabel && ` · ${result.subLabel}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
