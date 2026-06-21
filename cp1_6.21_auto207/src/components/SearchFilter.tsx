import React, { useState, useRef, useEffect } from 'react';
import { Search, Tag, ChevronDown, ArrowUpDown } from 'lucide-react';
import { useCollection } from '../contexts/CollectionContext';
import TagChip from './TagChip';

const sortOptions: { value: 'createdAt_desc' | 'createdAt_asc' | 'title_asc'; label: string }[] = [
  { value: 'createdAt_desc', label: '最新创建' },
  { value: 'createdAt_asc', label: '最早创建' },
  { value: 'title_asc', label: '标题 A-Z' },
];

const SearchFilter: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    allTags,
    selectedTags,
    toggleTag,
    sortBy,
    setSortBy,
  } = useCollection();

  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sortedTags = [...allTags].sort((a, b) => a.localeCompare(b));

  const currentSortLabel = sortOptions.find((o) => o.value === sortBy)?.label || '排序';

  return (
    <div
      className="prevent-selection"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: '24px 0 8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#111827',
            letterSpacing: -0.5,
          }}
        >
          片段捕捉器
        </h1>
        <p style={{ color: '#6B7280', fontSize: 14 }}>
          在下方内容区域拖拽鼠标选择区域，快速捕捉文字、图片或混合内容作为笔记收藏
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 240,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            backgroundColor: '#F3F4F6',
            borderRadius: 8,
            transition: 'all 0.2s ease',
          }}
        >
          <Search size={18} color="#6B7280" style={{ flexShrink: 0 }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索片段标题或内容..."
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: 14,
              color: '#111827',
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                color: '#9CA3AF',
                fontSize: 18,
                lineHeight: 1,
                padding: '0 4px',
              }}
            >
              ×
            </button>
          )}
        </div>

        <div ref={tagDropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setTagDropdownOpen((v) => !v);
              setSortDropdownOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              backgroundColor: selectedTags.length > 0 ? '#E0E7FF' : '#F3F4F6',
              color: selectedTags.length > 0 ? '#4338CA' : '#374151',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            <Tag size={16} />
            <span>标签筛选</span>
            {selectedTags.length > 0 && (
              <span
                style={{
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 6px',
                }}
              >
                {selectedTags.length}
              </span>
            )}
            <ChevronDown
              size={16}
              style={{
                transform: tagDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>

          {tagDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                minWidth: 240,
                maxWidth: 320,
                maxHeight: 320,
                overflowY: 'auto',
                padding: 8,
                backgroundColor: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                zIndex: 90,
              }}
            >
              {sortedTags.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                  暂无标签
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {sortedTags.map((tag) => {
                    const checked = selectedTags.includes(tag);
                    return (
                      <label
                        key={tag}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                          fontSize: 13,
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLLabelElement).style.backgroundColor = '#F3F4F6')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLLabelElement).style.backgroundColor = 'transparent')}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTag(tag)}
                          style={{
                            width: 16,
                            height: 16,
                            accentColor: '#3B82F6',
                            cursor: 'pointer',
                          }}
                        />
                        <span
                          style={{
                            flex: 1,
                            color: checked ? '#1D4ED8' : '#374151',
                            fontWeight: checked ? 600 : 400,
                          }}
                        >
                          {tag}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => selectedTags.forEach((t) => toggleTag(t))}
                  style={{
                    width: '100%',
                    marginTop: 8,
                    padding: '8px 10px',
                    fontSize: 12,
                    color: '#6B7280',
                    textAlign: 'center',
                    borderTop: '1px solid #F3F4F6',
                  }}
                >
                  清除所有筛选
                </button>
              )}
            </div>
          )}
        </div>

        <div ref={sortDropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setSortDropdownOpen((v) => !v);
              setTagDropdownOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowUpDown size={16} />
            <span>{currentSortLabel}</span>
          </button>

          {sortDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                minWidth: 160,
                padding: 6,
                backgroundColor: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                zIndex: 90,
              }}
            >
              {sortOptions.map((opt) => {
                const active = opt.value === sortBy;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setSortDropdownOpen(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontSize: 13,
                      color: active ? '#1D4ED8' : '#374151',
                      fontWeight: active ? 600 : 400,
                      backgroundColor: active ? '#E0E7FF' : 'transparent',
                      borderRadius: 8,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F3F4F6';
                    }}
                    onMouseLeave={(e) => {
                      if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {selectedTags.map((t) => (
            <TagChip
              key={t}
              label={t}
              size="sm"
              active
              onRemove={() => toggleTag(t)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchFilter;
