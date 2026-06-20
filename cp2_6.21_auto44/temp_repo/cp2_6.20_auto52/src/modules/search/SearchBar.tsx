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
  const bringNoteToFront = useStore((state) => state.bringNoteToFront);
  const setContextMenu = useStore((state) => state.setContextMenu);

  const inputRef = useRef<HTMLInputElement>(null);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const typeAliases: Record<string, string[]> = {
      app: ['应用', '程序', '软件', 'app', 'application'],
      folder: ['文件夹', '目录', 'folder', 'dir'],
      document: ['文档', '文件', 'document', 'doc', 'pdf', '资料'],
      link: ['链接', '网址', '网站', 'link', 'url', 'web'],
      note: ['便签', '笔记', 'note', 'sticky'],
    };
    const colorAliases: Record<string, string[]> = {
      '6b9ac4': ['蓝色', '蓝', 'blue', '浅蓝'],
      '8fb98f': ['绿色', '绿', 'green', '浅绿'],
      'e6b87d': ['橙色', '橙', '橘色', 'orange', '浅橙'],
      'c48fb1': ['紫色', '紫', 'purple', '粉紫'],
      'f5e68c': ['黄色', '黄', 'yellow', '淡黄'],
    };

    const matchesType = (type: string, q: string) => {
      const aliases = typeAliases[type] || [];
      return aliases.some(a => a.toLowerCase().includes(q)) ||
             type.toLowerCase().includes(q);
    };

    const matchesColor = (color: string, q: string) => {
      const colorKey = color.replace('#', '').toLowerCase();
      const aliases = colorAliases[colorKey] || [];
      return aliases.some(a => a.toLowerCase().includes(q)) ||
             color.toLowerCase().includes(q);
    };

    const results: Array<{
      id: string;
      type: 'icon' | 'note';
      label: string;
      subLabel: string;
      iconType: string;
      color: string;
      position?: { x: number; y: number };
    }> = [];

    icons.forEach((icon) => {
      const metadataStr = icon.metadata ? JSON.stringify(icon.metadata).toLowerCase() : '';
      const matches = 
        icon.name.toLowerCase().includes(query) ||
        icon.label.toLowerCase().includes(query) ||
        matchesType(icon.type, query) ||
        metadataStr.includes(query) ||
        (icon.color && matchesColor(icon.color, query));
      
      if (matches) {
        results.push({
          id: icon.id,
          type: 'icon',
          label: icon.label,
          subLabel: `${icon.name} · ${icon.type}`,
          iconType: icon.type,
          color: icon.color || ICON_COLORS[icon.type],
          position: { x: icon.x, y: icon.y },
        });
      }
    });

    notes.forEach((note) => {
      const content = note.content.replace(/<[^>]*>/g, '').toLowerCase();
      const colorHex = { yellow: '#f5e68c', blue: '#8fb9d6', pink: '#e6a5b8', green: '#a5d6a5' }[note.color] || '#f5e68c';
      const noteColorAliases = { yellow: '黄色', blue: '蓝色', pink: '粉色', green: '绿色' };
      const colorMatch = 
        note.color.includes(query) ||
        noteColorAliases[note.color].toLowerCase().includes(query) ||
        matchesColor(colorHex, query);
      
      if (
        note.title.toLowerCase().includes(query) ||
        content.includes(query) ||
        colorMatch
      ) {
        results.push({
          id: note.id,
          type: 'note',
          label: note.title || '无标题便签',
          subLabel: content.substring(0, 50) || '空白便签',
          iconType: 'note',
          color: colorHex,
          position: { x: note.x, y: note.y },
        });
      }
    });

    return results.slice(0, 15);
  }, [searchQuery, icons, notes]);

  const handleResultClick = (result: (typeof searchResults)[0]) => {
    setSearchQuery('');
    setIsFocused(false);
    inputRef.current?.blur();

    if (result.position) {
      const targetElement = document.querySelector(`[data-id="${result.id}"]`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    }

    setTimeout(() => {
      if (result.type === 'icon') {
        highlightIcon(result.id);
        
        const iconEl = document.querySelector(`[data-icon-id="${result.id}"]`) as HTMLElement;
        if (iconEl) {
          iconEl.style.animation = 'none';
          iconEl.offsetHeight;
          iconEl.style.animation = 'search-highlight-flash 0.4s ease-in-out 3';
          setTimeout(() => {
            iconEl.style.animation = '';
          }, 1200);
        }
      } else if (result.type === 'note') {
        bringNoteToFront(result.id);
        const noteEl = document.querySelector(`[data-note-id="${result.id}"]`) as HTMLElement;
        if (noteEl) {
          noteEl.style.animation = 'none';
          noteEl.offsetHeight;
          noteEl.style.animation = 'search-highlight-flash 0.4s ease-in-out 3';
          setTimeout(() => {
            noteEl.style.animation = '';
          }, 1200);
        }
      }
    }, 100);
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
    <>
      <div className="search-bar" style={{ position: 'relative' }}>
        <Search size={20} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          placeholder="搜索图标、便签、类型、颜色..."
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

        {searchQuery.trim() && searchResults.length > 0 && (
        <div className="search-results" style={{ zIndex: 500 }}>
          {searchResults.map((result) => (
            <div
              key={`${result.type}-${result.id}`}
              className="search-result-item"
              onMouseDown={(e) => {
                e.preventDefault();
                handleResultClick(result);
              }}
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

      <style>{`
        @keyframes search-highlight-flash {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(107, 154, 196, 0), transform: scale(1);
          }
          25% {
            box-shadow: 0 0 0 6px rgba(107, 154, 196, 0.4), transform: scale(1.08);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(107, 154, 196, 0.1), transform: scale(1.04);
          }
          75% {
            box-shadow: 0 0 0 6px rgba(107, 154, 196, 0.3), transform: scale(1.06);
          }
        }
      `}</style>
    </>
  );
};

export default SearchBar;
