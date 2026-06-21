import { useState, useEffect, useCallback } from 'react';
import { Menu, X, Code2, Plus, Minimize2 } from 'lucide-react';
import SnippetForm from './components/SnippetForm';
import SnippetList from './components/SnippetList';
import StatsPanel from './components/StatsPanel';
import Toast from './components/Toast';
import { useSnippetStore } from './store';
import * as api from './api';
import type { Snippet, SnippetCreate, TagCount } from './types';
import { cn } from './lib/utils';

const TAG_COLORS = [
  '#e74c3c',
  '#3498db',
  '#2ecc71',
  '#f39c12',
  '#9b59b6',
  '#1abc9c',
];

function getTagColor(index: number) {
  return TAG_COLORS[index % TAG_COLORS.length];
}

function getFontSize(count: number, maxCount: number) {
  const minSize = 12;
  const maxSize = 20;
  if (maxCount === 0) return minSize;
  const ratio = count / maxCount;
  return Math.round(minSize + (maxSize - minSize) * ratio);
}

export default function App() {
  const {
    snippets,
    loading,
    selectedTag,
    sortBy,
    sortOrder,
    languageFilter,
    fetchSnippets,
    addSnippet,
    removeSnippet,
    updateSnippet,
    setSelectedTag,
    setSortBy,
    setSortOrder,
    setLanguageFilter,
  } = useSnippetStore();

  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [tags, setTags] = useState<TagCount[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    fetchSnippets();
    loadTags();
  }, [fetchSnippets]);

  const loadTags = async () => {
    try {
      const tagData = await api.fetchTags();
      setTags(tagData);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const handleSubmit = useCallback(
    async (data: SnippetCreate) => {
      try {
        if (editingSnippet) {
          const updated = await api.updateSnippet(editingSnippet.id, data);
          updateSnippet(updated.id, updated);
          setEditingSnippet(null);
        } else {
          const newSnippet = await api.addSnippet(data);
          addSnippet(newSnippet);
        }
        loadTags();
        setToastVisible(true);
      } catch (error) {
        console.error('Failed to save snippet:', error);
      }
    },
    [editingSnippet, addSnippet, updateSnippet]
  );

  const handleEdit = useCallback((snippet: Snippet) => {
    setEditingSnippet(snippet);
    setShowForm(true);
    setSidebarOpen(false);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await api.deleteSnippet(id);
        removeSnippet(id);
        loadTags();
      } catch (error) {
        console.error('Failed to delete snippet:', error);
      }
    },
    [removeSnippet]
  );

  const handleTagClick = useCallback(
    (tag: string | null) => {
      setSelectedTag(tag);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    },
    [setSelectedTag]
  );

  const maxTagCount = tags.length > 0 ? Math.max(...tags.map((t) => t.count)) : 0;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fadeIn"
        style={{
          opacity: sidebarOpen ? 1 : 0,
          pointerEvents: sidebarOpen ? 'auto' : 'none',
          transition: 'opacity var(--transition-base)',
        }}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={cn(
          'fixed md:sticky top-0 left-0 h-screen w-[320px] z-50 flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-card)] transition-transform duration-300 ease-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Code2 size={24} style={{ color: 'var(--accent-purple)' }} />
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              开发者速记
            </h1>
          </div>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-[var(--border-color)] transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} className="text-[var(--text-primary)]" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <h2 className="text-sm font-semibold text-[var(--border-color)] mb-4 uppercase tracking-wider">
            标签云
          </h2>
          {tags.length === 0 ? (
            <p className="text-sm text-[var(--border-color)]">
              暂无标签，添加片段时可创建标签
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tagData, index) => (
                <span
                  key={tagData.tag}
                  className={cn(
                    'cursor-pointer px-3 py-1 rounded-full text-white font-medium transition-all duration-250 hover:scale-105',
                    selectedTag === tagData.tag &&
                      'ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-card)]'
                  )}
                  style={{
                    backgroundColor: getTagColor(index),
                    fontSize: `${getFontSize(tagData.count, maxTagCount)}px`,
                    lineHeight: '20px',
                    height: '20px',
                  }}
                  onClick={() => handleTagClick(tagData.tag)}
                >
                  {tagData.tag}
                  <span className="ml-1 opacity-75 text-xs">
                    ({tagData.count})
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[var(--border-color)]">
          <p className="text-xs text-[var(--border-color)]">
            共 {snippets.length} 个片段 · {tags.length} 个标签
          </p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} className="text-[var(--text-primary)]" />
            </button>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] hidden md:block">
              代码片段管理
            </h2>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: showForm
                ? 'rgba(255, 85, 85, 0.15)'
                : 'rgba(189, 147, 249, 0.15)',
              color: showForm ? '#ff5555' : 'var(--accent-purple)',
            }}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? (
              <>
                <Minimize2 size={16} />
                收起编辑
              </>
            ) : (
              <>
                <Plus size={16} />
                新建片段
              </>
            )}
          </button>
        </header>

        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          <StatsPanel snippets={snippets} />

          {showForm && (
            <div
              className="mb-6 animate-fadeIn"
              style={{
                height: '500px',
              }}
            >
              <SnippetForm
                onSubmit={handleSubmit}
                editingSnippet={editingSnippet}
                onCancel={() => setEditingSnippet(null)}
              />
            </div>
          )}

          <SnippetList
            snippets={snippets}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
            selectedTag={selectedTag}
            onTagSelect={handleTagClick}
            sortBy={sortBy}
            sortOrder={sortOrder}
            languageFilter={languageFilter}
            onSortByChange={setSortBy}
            onSortOrderChange={setSortOrder}
            onLanguageFilterChange={setLanguageFilter}
          />
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
        
        @media (max-width: 768px) {
          .md\\:flex-row {
            flex-direction: column;
          }
        }
      `}</style>

      <Toast
        message="保存成功"
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </div>
  );
}
