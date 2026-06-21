import React, { useState, useEffect, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Search, X, Edit2, Trash2, Code2, Clock, Tag as TagIcon } from 'lucide-react';
import type { Snippet, SearchResult } from '@/types';
import { searchSnippets } from '@/api';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface SnippetListProps {
  snippets: (Snippet | SearchResult)[];
  onEdit: (snippet: Snippet) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
}

const tagColors = [
  { bg: 'rgba(189, 147, 249, 0.15)', border: 'rgba(189, 147, 249, 0.3)', color: '#bd93f9' },
  { bg: 'rgba(255, 121, 198, 0.15)', border: 'rgba(255, 121, 198, 0.3)', color: '#ff79c6' },
  { bg: 'rgba(139, 233, 253, 0.15)', border: 'rgba(139, 233, 253, 0.3)', color: '#8be9fd' },
  { bg: 'rgba(80, 250, 123, 0.15)', border: 'rgba(80, 250, 123, 0.3)', color: '#50fa7b' },
  { bg: 'rgba(241, 250, 140, 0.15)', border: 'rgba(241, 250, 140, 0.3)', color: '#f1fa8c' },
  { bg: 'rgba(255, 184, 108, 0.15)', border: 'rgba(255, 184, 108, 0.3)', color: '#ffb86c' },
];

const languageLabels: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  html: 'HTML',
  css: 'CSS',
};

function getTagColor(index: number) {
  return tagColors[index % tagColors.length];
}

function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString('zh-CN');
}

function isSearchResult(snippet: Snippet | SearchResult): snippet is SearchResult {
  return 'matched_lines' in snippet;
}

const SnippetCard: React.FC<{
  snippet: Snippet | SearchResult;
  onClick: () => void;
  onTagClick: (tag: string) => void;
  selectedTag: string | null;
}> = ({ snippet, onClick, onTagClick, selectedTag }) => {
  return (
    <div
      className="card animate-fadeIn"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-white truncate flex-1 mr-2">
          {snippet.title}
        </h3>
        <span
          className="shrink-0 px-2 py-1 text-xs rounded-md font-mono"
          style={{
            backgroundColor: 'rgba(139, 233, 253, 0.15)',
            border: '1px solid rgba(139, 233, 253, 0.3)',
            color: '#8be9fd',
          }}
        >
          {languageLabels[snippet.language] || snippet.language}
        </span>
      </div>

      <p className="text-sm text-gray-400 mb-3 font-mono line-clamp-2 min-h-[2.5rem]">
        {truncateText(snippet.code.replace(/\s+/g, ' '))}
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {snippet.tags.map((tag, index) => {
          const color = getTagColor(index);
          const isActive = selectedTag === tag;
          return (
            <span
              key={tag}
              className={cn('tag text-xs', isActive && 'active')}
              style={isActive ? undefined : {
                backgroundColor: color.bg,
                borderColor: color.border,
                color: color.color,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onTagClick(tag);
              }}
            >
              {tag}
            </span>
          );
        })}
      </div>

      <div className="flex items-center text-xs text-gray-500 gap-4">
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {formatDate(snippet.created_at)}
        </span>
      </div>

      {isSearchResult(snippet) && snippet.matched_lines && snippet.matched_lines.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-cyan-400">
          匹配于第{snippet.matched_lines.join(', ')}行
        </div>
      )}
    </div>
  );
};

const SnippetModal: React.FC<{
  snippet: Snippet;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ snippet, onClose, onEdit, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose, showDeleteConfirm]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-2xl overflow-hidden animate-scaleIn"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <Code2 size={20} style={{ color: 'var(--accent-purple)' }} />
            <h2 className="text-xl font-bold text-white">{snippet.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: 'rgba(139, 233, 253, 0.15)',
                color: '#8be9fd',
              }}
              onClick={onEdit}
            >
              <Edit2 size={16} />
              编辑
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: 'rgba(255, 85, 85, 0.15)',
                color: '#ff5555',
              }}
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={16} />
              删除
            </button>
            <button
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              onClick={onClose}
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {snippet.tags.map((tag, index) => {
              const color = getTagColor(index);
              return (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor: color.bg,
                    border: `1px solid ${color.border}`,
                    color: color.color,
                  }}
                >
                  <TagIcon size={12} />
                  {tag}
                </span>
              );
            })}
          </div>

          <div className="flex gap-6 text-sm text-gray-400 mb-4">
            <span className="flex items-center gap-2">
              <Clock size={14} />
              创建于 {formatDate(snippet.created_at)}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={14} />
              编辑于 {formatDate(snippet.updated_at)}
            </span>
          </div>

          <div className="rounded-lg overflow-hidden">
            <SyntaxHighlighter
              language={snippet.language}
              style={oneDark}
              showLineNumbers
              customStyle={{
                margin: 0,
                borderRadius: '8px',
                fontSize: '14px',
              }}
              lineNumberStyle={{
                minWidth: '3em',
                paddingRight: '1em',
                color: '#6272a4',
                textAlign: 'right',
                userSelect: 'none',
              }}
            >
              {snippet.code}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-md p-6 rounded-2xl animate-scaleIn"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-2">确认删除</h3>
            <p className="text-gray-400 mb-6">
              确定要删除代码片段 "{snippet.title}" 吗？此操作无法撤销。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                onClick={() => setShowDeleteConfirm(false)}
              >
                取消
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: '#ff5555',
                  color: '#1e1e2e',
                }}
                onClick={onDelete}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyState: React.FC = () => {
  return (
    <div className="empty-state animate-fadeIn">
      <div className="empty-cloud">
        <div className="cloud-inner"></div>
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            width: '2px',
            height: '40px',
            background: 'repeating-linear-gradient(to bottom, var(--border-color) 0, var(--border-color) 4px, transparent 4px, transparent 8px)',
            transform: 'translateX(-50%)',
          }}
        ></div>
        <div
          style={{
            position: 'absolute',
            bottom: '-30px',
            left: '50%',
            width: '60px',
            height: '2px',
            background: 'repeating-linear-gradient(to right, var(--border-color) 0, var(--border-color) 4px, transparent 4px, transparent 8px)',
            transform: 'translateX(-50%)',
          }}
        ></div>
      </div>
      <h3>还没有代码片段</h3>
      <p>快来添加第一个吧！</p>
    </div>
  );
};

export default function SnippetList({
  snippets,
  onEdit,
  onDelete,
  loading = false,
  selectedTag,
  onTagSelect,
}: SnippetListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [displaySnippets, setDisplaySnippets] = useState<(Snippet | SearchResult)[]>(snippets);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    setDisplaySnippets(snippets);
  }, [snippets]);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setDisplaySnippets(snippets);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchSnippets(debouncedQuery);
        let filtered = results;
        
        if (selectedTag) {
          filtered = results.filter(s => s.tags.includes(selectedTag));
        }
        
        setDisplaySnippets(filtered);
      } catch (error) {
        console.error('Search failed:', error);
        setDisplaySnippets([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery, snippets, selectedTag]);

  useEffect(() => {
    if (selectedTag && !debouncedQuery) {
      const filtered = snippets.filter(s => s.tags.includes(selectedTag));
      setDisplaySnippets(filtered);
    } else if (!debouncedQuery) {
      setDisplaySnippets(snippets);
    }
  }, [selectedTag, snippets, debouncedQuery]);

  const handleTagClick = useCallback((tag: string) => {
    if (selectedTag === tag) {
      onTagSelect(null);
    } else {
      onTagSelect(tag);
    }
  }, [selectedTag, onTagSelect]);

  const handleCardClick = useCallback((snippet: Snippet | SearchResult) => {
    setSelectedSnippet(snippet as Snippet);
  }, []);

  const handleEdit = useCallback(() => {
    if (selectedSnippet) {
      onEdit(selectedSnippet);
      setSelectedSnippet(null);
    }
  }, [selectedSnippet, onEdit]);

  const handleDelete = useCallback(() => {
    if (selectedSnippet) {
      onDelete(selectedSnippet.id);
      setSelectedSnippet(null);
    }
  }, [selectedSnippet, onDelete]);

  const getSearchPlaceholder = () => {
    if (selectedTag) {
      return `在标签 "${selectedTag}" 中搜索...`;
    }
    return '搜索标题、标签或代码内容...';
  };

  const showEmpty = !loading && !isSearching && displaySnippets.length === 0;

  return (
    <div className="w-full">
      <div className="relative mb-6">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder={getSearchPlaceholder()}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 pr-12 w-full"
        />
        {(searchQuery || selectedTag) && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-700 transition-colors"
            onClick={() => {
              setSearchQuery('');
              if (selectedTag) {
                onTagSelect(null);
              }
            }}
          >
            <X size={18} className="text-gray-400" />
          </button>
        )}
        {isSearching && (
          <div
            className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent-purple)', borderTopColor: 'transparent' }}
          ></div>
        )}
      </div>

      {selectedTag && !searchQuery && (
        <div className="flex items-center gap-2 mb-4 animate-fadeIn">
          <span className="text-sm text-gray-400">当前筛选标签：</span>
          <span
            className="tag active text-xs"
            onClick={() => onTagSelect(null)}
          >
            {selectedTag}
            <X size={12} className="ml-1" />
          </span>
        </div>
      )}

      {showEmpty ? (
        <EmptyState />
      ) : (
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          }}
        >
          {displaySnippets.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onClick={() => handleCardClick(snippet)}
              onTagClick={handleTagClick}
              selectedTag={selectedTag}
            />
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div
            className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent-purple)', borderTopColor: 'transparent', borderWidth: '3px' }}
          ></div>
        </div>
      )}

      {selectedSnippet && (
        <SnippetModal
          snippet={selectedSnippet}
          onClose={() => setSelectedSnippet(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.25s ease-out forwards;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .shrink-0 {
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
