import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HistoryCard from '@/components/HistoryCard';
import { useCoverStore } from '@/store/useCoverStore';
import { TEMPLATES, type TemplateId } from '@/types';
import {
  Clock,
  Search,
  Plus,
  ArrowUpDown,
  BookmarkX,
  Filter,
} from 'lucide-react';

type SortOrder = 'newest' | 'oldest';

export default function History() {
  const navigate = useNavigate();
  const history = useCoverStore((state) => state.history);
  const loadFromHistory = useCoverStore((state) => state.loadFromHistory);
  const deleteFromHistory = useCoverStore((state) => state.deleteFromHistory);

  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTemplate, setFilterTemplate] = useState<TemplateId | 'all'>('all');

  const filteredHistory = useMemo(() => {
    let result = [...history];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (record) =>
          record.title.toLowerCase().includes(query) ||
          record.summary.toLowerCase().includes(query)
      );
    }

    if (filterTemplate !== 'all') {
      result = result.filter((record) => record.template === filterTemplate);
    }

    result.sort((a, b) => {
      return sortOrder === 'newest'
        ? b.createdAt - a.createdAt
        : a.createdAt - b.createdAt;
    });

    return result;
  }, [history, searchQuery, sortOrder, filterTemplate]);

  const handleEdit = (id: string) => {
    loadFromHistory(id);
    navigate('/');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这条记录吗？此操作不可撤销。')) {
      deleteFromHistory(id);
    }
  };

  const handleGoCreate = () => {
    navigate('/');
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'));
  };

  return (
    <div className="paper-texture min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 tag-vintage mb-4 animate-fadeIn">
            <Clock className="w-4 h-4" />
            <span>共 {history.length} 条记录</span>
          </div>
          <h1 className="section-title animate-fadeIn">历史记录</h1>
          <p className="mt-3 text-ink/60 font-serif animate-fadeIn animation-delay-200">
            管理你的创作收藏，随时回溯编辑
          </p>
        </div>

        {history.length > 0 && (
          <div className="card-vintage p-4 mb-8 animate-slideUp animation-delay-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
                <input
                  type="text"
                  placeholder="搜索标题或摘要..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-vintage pl-10"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-ink/60" />
                  <select
                    value={filterTemplate}
                    onChange={(e) =>
                      setFilterTemplate(e.target.value as TemplateId | 'all')
                    }
                    className="input-vintage text-sm py-2.5"
                  >
                    <option value="all">全部模板</option>
                    {TEMPLATES.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={toggleSortOrder}
                  className="btn-secondary px-4 py-2.5 text-sm"
                  title={sortOrder === 'newest' ? '最新优先' : '最旧优先'}
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {sortOrder === 'newest' ? '最新' : '最旧'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredHistory.length === 0 ? (
          <div className="card-vintage p-12 text-center animate-slideUp animation-delay-300">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-vintage-red/10 flex items-center justify-center">
              <BookmarkX className="w-12 h-12 text-vintage-red/60" />
            </div>
            <h3 className="font-display text-2xl font-bold text-ink mb-3">
              {history.length === 0 ? '暂无历史记录' : '没有找到匹配的记录'}
            </h3>
            <p className="text-ink/60 font-serif mb-8 max-w-md mx-auto">
              {history.length === 0
                ? '快去创作你的第一张报纸封面吧！每一份创作都值得被珍藏。'
                : '试试调整搜索关键词或筛选条件'}
            </p>
            <button onClick={handleGoCreate} className="btn-primary">
              <Plus className="w-5 h-5" />
              去创作
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredHistory.map((record, index) => (
              <HistoryCard
                key={record.id}
                record={record}
                onEdit={handleEdit}
                onDelete={handleDelete}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
