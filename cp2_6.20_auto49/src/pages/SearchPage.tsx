import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, X, Calendar } from 'lucide-react';
import { useNoteStore } from '@/store/noteStore';
import TagCapsule from '@/components/TagCapsule';
import type { Tag, Note } from '@/types';

const tagCategories: { id: Tag['category']; label: string }[] = [
  { id: 'tech', label: '科技类' },
  { id: 'life', label: '生活类' },
  { id: 'study', label: '学习类' },
];

function fuzzyMatch(text: string, keyword: string): React.ReactNode {
  if (!keyword.trim()) return text;

  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-100">{part}</mark>
    ) : (
      part
    )
  );
}

function getSnippet(text: string, keyword: string, snippetLength: number = 150): React.ReactNode {
  if (!keyword.trim()) {
    return text.slice(0, snippetLength) + (text.length > snippetLength ? '...' : '');
  }

  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const index = lowerText.indexOf(lowerKeyword);

  if (index === -1) {
    return text.slice(0, snippetLength) + (text.length > snippetLength ? '...' : '');
  }

  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + keyword.length + 100);
  const snippet = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');

  return fuzzyMatch(snippet, keyword);
}

export default function SearchPage() {
  const navigate = useNavigate();
  const { notes, searchNotes, loading } = useNoteStore();
  const [keyword, setKeyword] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchNotes(keyword, selectedTags.length > 0 ? selectedTags : undefined, dateFrom || undefined, dateTo || undefined);
    }, 200);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [keyword, selectedTags, dateFrom, dateTo, searchNotes]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleNoteClick = (note: Note) => {
    navigate(`/editor/${note.id}`);
  };

  const clearFilters = () => {
    setKeyword('');
    setSelectedTags([]);
    setDateFrom('');
    setDateTo('');
  };

  const FilterPanel = () => (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-sans font-semibold text-lg">筛选条件</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-garden-teal"
        >
          清除全部
        </button>
      </div>

      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">标签分类</h4>
        <div className="space-y-2">
          {tagCategories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTags.includes(category.id)}
                onChange={() => handleTagToggle(category.id)}
                className="w-4 h-4 text-garden-teal rounded focus:ring-garden-teal"
              />
              <span className="text-sm">{category.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">
          <Calendar size={16} className="inline mr-2" />
          日期范围
        </h4>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">开始日期</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-garden-teal outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">结束日期</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-garden-teal outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-garden-warm">
      <div className="sticky top-0 z-30 bg-garden-warm/95 backdrop-blur border-b border-gray-200 p-4">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索笔记..."
              className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:border-garden-teal outline-none transition-colors bg-white"
            />
          </div>
          <button
            onClick={() => setShowMobileFilter(true)}
            className="lg:hidden px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-garden-teal transition-colors"
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="flex">
        <div className="flex-1 p-4 lg:pr-68">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="text-center text-gray-500 py-12">搜索中...</div>
            ) : notes.length === 0 ? (
              <div className="text-center py-16">
                <Search className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="font-sans font-medium text-gray-700 mb-2">没有找到相关笔记</h3>
                <p className="font-serif text-gray-500">尝试使用其他关键词或调整筛选条件</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => handleNoteClick(note)}
                    className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                  >
                    <h3 className="font-sans font-bold text-lg mb-2">
                      {fuzzyMatch(note.title, keyword)}
                    </h3>
                    <p className="font-serif text-gray-600 mb-3">
                      {getSnippet(note.summary || note.content, keyword)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {note.tags.map((tag) => (
                        <TagCapsule key={tag.id} tag={tag} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:block fixed right-0 top-0 h-full w-64 bg-white border-l border-gray-200 overflow-y-auto pt-20">
          <FilterPanel />
        </div>
      </div>

      {showMobileFilter && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileFilter(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-sans font-semibold text-lg">筛选</h3>
              <button
                onClick={() => setShowMobileFilter(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}
    </div>
  );
}
