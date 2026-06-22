import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Tag, Loader2, CheckSquare, Square, X, ChevronDown } from 'lucide-react';
import { useIssueStore } from '@/store/issueStore';
import type { Issue, IssueTag, IssueStatus } from '@/store/issueStore';
import { relativeTime } from '@/utils/helpers';

const TAG_COLORS: Record<IssueTag, { border: string; bg: string; text: string }> = {
  'Bug': { border: '#EF4444', bg: '#FEF2F2', text: '#EF4444' },
  '增强': { border: '#3B82F6', bg: '#EFF6FF', text: '#3B82F6' },
  '文档': { border: '#8B5CF6', bg: '#F5F3FF', text: '#8B5CF6' },
  '优化': { border: '#10B981', bg: '#ECFDF5', text: '#10B981' },
  '其他': { border: '#64748B', bg: '#F8FAFC', text: '#64748B' },
};

const STATUS_LABELS: Record<IssueStatus | 'all', string> = {
  'all': '全部',
  'pending': '待处理',
  'in-progress': '进行中',
  'completed': '已完成',
};

const TAG_LABELS: Record<IssueTag | 'all', string> = {
  'all': '全部标签',
  'Bug': 'Bug',
  '增强': '增强',
  '文档': '文档',
  '优化': '优化',
  '其他': '其他',
};

function SkeletonCard() {
  return (
    <div className="w-full rounded-xl bg-white p-4" style={{ animation: 'skeleton-pulse 1.5s ease-in-out infinite' }}>
      <div className="flex items-start gap-3">
        <div className="h-5 w-5 rounded bg-gray-200" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-3/4 rounded bg-gray-200" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-gray-200" />
            <div className="h-3 w-5/6 rounded bg-gray-200" />
          </div>
          <div className="flex gap-2">
            <div className="h-5 w-12 rounded bg-gray-200" />
            <div className="h-5 w-16 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

function IssueCard({ issue, isSelected, onToggle }: { issue: Issue; isSelected: boolean; onToggle: () => void }) {
  const navigate = useNavigate();
  const primaryTag = issue.tags[0] || '其他' as IssueTag;
  const colors = TAG_COLORS[primaryTag] || TAG_COLORS['其他'];

  return (
    <div
      className={`group w-full cursor-pointer rounded-xl border-l-4 bg-white p-4 transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]`}
      style={{
        borderLeftColor: colors.border,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        backgroundColor: isSelected ? '#EEF2FF' : '#FFFFFF',
      }}
      onClick={() => navigate(`/issue/${issue.id}`)}
    >
      <div className="flex items-start gap-3">
        <div
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className="mt-0.5 flex-shrink-0 cursor-pointer"
        >
          {isSelected ? (
            <CheckSquare size={18} className="text-primary" />
          ) : (
            <Square size={18} className="text-text-secondary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-text-primary">{issue.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{issue.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {issue.tags.map((tag) => {
              const tc = TAG_COLORS[tag] || TAG_COLORS['其他'];
              return (
                <span
                  key={tag}
                  className="rounded px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: tc.bg, color: tc.text }}
                >
                  {tag}
                </span>
              );
            })}
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                issue.status === 'pending'
                  ? 'bg-amber-50 text-amber-600'
                  : issue.status === 'in-progress'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-green-50 text-green-600'
              }`}
            >
              {STATUS_LABELS[issue.status]}
            </span>
            {issue.isDuplicate && (
              <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-500">
                已标记重复
              </span>
            )}
            <span className="ml-auto text-xs text-text-secondary">
              {relativeTime(issue.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BatchActionBar() {
  const store = useIssueStore();
  const selectedCount = store.selectedIssueIds.size;
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [isOperating, setIsOperating] = useState(false);

  const handleBatchStatus = useCallback(async (status: IssueStatus) => {
    setIsOperating(true);
    for (const id of store.selectedIssueIds) {
      store.updateIssue(id, { status });
    }
    setIsOperating(false);
    store.showToast(`已将 ${selectedCount} 个Issue标记为${STATUS_LABELS[status]}`);
    store.clearSelection();
  }, [store, selectedCount]);

  const handleBatchTag = useCallback(async (tag: IssueTag) => {
    setIsOperating(true);
    for (const id of store.selectedIssueIds) {
      const issue = store.issues.find((i) => i.id === id);
      if (issue && !issue.tags.includes(tag)) {
        store.updateIssue(id, { tags: [...issue.tags, tag] });
      }
    }
    setIsOperating(false);
    store.showToast(`已为 ${selectedCount} 个Issue添加标签${tag}`);
    store.clearSelection();
    setShowTagDropdown(false);
  }, [store, selectedCount]);

  const handleBatchClose = useCallback(async () => {
    setIsOperating(true);
    for (const id of store.selectedIssueIds) {
      store.updateIssue(id, { status: 'completed' });
    }
    setIsOperating(false);
    store.showToast(`已关闭 ${selectedCount} 个Issue`);
    store.clearSelection();
  }, [store, selectedCount]);

  if (selectedCount < 2) return null;

  return (
    <div
      className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between bg-white px-6 py-3"
      style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-text-primary">已选中 {selectedCount} 个Issue</span>
        <button
          onClick={store.clearSelection}
          className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-gray-100"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={isOperating}
          onClick={() => handleBatchStatus('pending')}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover active:bg-primary-active disabled:bg-primary-disabled disabled:cursor-not-allowed"
        >
          {isOperating ? <Loader2 size={14} className="animate-spin" /> : '标记为待处理'}
        </button>
        <div className="relative">
          <button
            disabled={isOperating}
            onClick={() => setShowTagDropdown(!showTagDropdown)}
            className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover active:bg-primary-active disabled:bg-primary-disabled disabled:cursor-not-allowed"
          >
            批量添加标签 <ChevronDown size={14} />
          </button>
          {showTagDropdown && (
            <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-xl bg-white py-1 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
              {(['Bug', '增强', '文档', '优化', '其他'] as IssueTag[]).map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleBatchTag(tag)}
                  className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-gray-50"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          disabled={isOperating}
          onClick={handleBatchClose}
          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 active:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
        >
          批量关闭
        </button>
      </div>
    </div>
  );
}

export default function IssueList() {
  const store = useIssueStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    store.initFromStorage();
    const timer = setTimeout(() => setMounted(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const filtered = store.filteredIssues();

  return (
    <div className="min-h-screen bg-surface">
      <BatchActionBar />

      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Issue 管理中心</h1>
          <p className="mt-1 text-sm text-text-secondary">智能筛选、检测重复Issue，高效管理项目问题</p>
        </div>

        <div
          className="mb-6 rounded-xl p-4"
          style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px' }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="搜索Issue标题或内容"
                value={store.searchQuery}
                onChange={(e) => store.setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-text-primary outline-none transition-all duration-200 focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <select
                  value={store.statusFilter}
                  onChange={(e) => store.setStatusFilter(e.target.value as IssueStatus | 'all')}
                  className="appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-8 pr-8 text-sm text-text-primary outline-none transition-all duration-200 focus:border-[#6366F1]"
                  style={{ borderRadius: '8px' }}
                >
                  {Object.entries(STATUS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <select
                  value={store.tagFilter}
                  onChange={(e) => store.setTagFilter(e.target.value as IssueTag | 'all')}
                  className="appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-8 pr-8 text-sm text-text-primary outline-none transition-all duration-200 focus:border-[#6366F1]"
                  style={{ borderRadius: '8px' }}
                >
                  {Object.entries(TAG_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {store.isLoading || !mounted ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            filtered.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                isSelected={store.selectedIssueIds.has(issue.id)}
                onToggle={() => store.toggleSelect(issue.id)}
              />
            ))
          )}
          {!store.isLoading && mounted && filtered.length === 0 && (
            <div className="py-16 text-center text-text-secondary">
              <p className="text-lg">没有找到匹配的Issue</p>
              <p className="mt-1 text-sm">尝试调整筛选条件</p>
            </div>
          )}
        </div>
      </div>

      {store.toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-green-500 px-6 py-3 text-sm font-medium text-white shadow-lg">
          {store.toastMessage}
        </div>
      )}
    </div>
  );
}
