import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Sparkles, AlertTriangle, Loader2, X, Check, Trash2 } from 'lucide-react';
import { useIssueStore } from '@/store/issueStore';
import type { IssueTag, IssueStatus, SimilarIssueResult, SuggestedTagResult } from '@/store/issueStore';
import { calculateSimilarity, suggestTags } from '@/api/similarity';
import { relativeTime } from '@/utils/helpers';

const TAG_COLORS: Record<IssueTag, { bg: string; text: string }> = {
  'Bug': { bg: '#FEF2F2', text: '#EF4444' },
  '增强': { bg: '#EFF6FF', text: '#3B82F6' },
  '文档': { bg: '#F5F3FF', text: '#8B5CF6' },
  '优化': { bg: '#ECFDF5', text: '#10B981' },
  '其他': { bg: '#F8FAFC', text: '#64748B' },
};

const STATUS_LABELS: Record<string, string> = {
  'pending': '待处理',
  'in-progress': '进行中',
  'completed': '已完成',
};

function SimilarPanel({ similarIssues }: { similarIssues: SimilarIssueResult[] }) {
  const navigate = useNavigate();
  const store = useIssueStore();

  if (similarIssues.length === 0) return null;

  const handleMarkDuplicate = (id: string) => {
    store.updateIssue(id, { status: 'completed', isDuplicate: true, tags: [...store.issues.find(i => i.id === id)?.tags.filter(t => t !== '其他') || [], '其他'] });
    store.showToast('已标记为重复Issue');
  };

  return (
    <div
      className="mt-6 rounded-lg border p-4"
      style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderRadius: '8px', padding: '16px' }}
    >
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle size={16} className="text-red-500" />
        <h3 className="text-sm font-semibold text-red-700">可能重复的Issue</h3>
      </div>
      <div className="space-y-2">
        {similarIssues.map((sim) => (
          <div
            key={sim.issue.id}
            className="flex items-center justify-between rounded-lg bg-white px-3 py-2"
          >
            <button
              onClick={() => navigate(`/issue/${sim.issue.id}`)}
              className="truncate text-sm text-text-primary hover:underline"
            >
              {sim.issue.title}
            </button>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold"
                style={{ color: sim.similarity > 0.8 ? '#EF4444' : '#F97316' }}
              >
                {Math.round(sim.similarity * 100)}%
              </span>
              <button
                onClick={() => handleMarkDuplicate(sim.issue.id)}
                className="rounded px-2 py-0.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                标记为重复
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TagSuggestBubble({
  suggestions,
  onAdopt,
  onReject,
  onClose,
}: {
  suggestions: SuggestedTagResult[];
  onAdopt: (tag: IssueTag) => void;
  onReject: (tag: IssueTag) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl bg-white p-4"
      style={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">标签建议</span>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
          <X size={14} />
        </button>
      </div>
      <div className="space-y-3">
        {suggestions.map((s) => {
          const colors = TAG_COLORS[s.tag] || TAG_COLORS['其他'];
          return (
            <div key={s.tag}>
              <div className="mb-1 flex items-center justify-between">
                <span
                  className="rounded px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {s.tag}
                </span>
                <span className="text-xs text-text-secondary">{s.confidence}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${s.confidence}%`, backgroundColor: '#10B981' }}
                />
              </div>
              <div className="mt-1 flex gap-1">
                <button
                  onClick={() => onAdopt(s.tag)}
                  className="flex items-center gap-0.5 rounded px-2 py-0.5 text-xs text-green-600 hover:bg-green-50"
                >
                  <Check size={10} /> 采纳
                </button>
                <button
                  onClick={() => onReject(s.tag)}
                  className="flex items-center gap-0.5 rounded px-2 py-0.5 text-xs text-text-secondary hover:bg-gray-50"
                >
                  <X size={10} /> 拒绝
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function IssueDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useIssueStore();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [computedSimilar, setComputedSimilar] = useState<SimilarIssueResult[]>([]);
  const [computedTags, setComputedTags] = useState<SuggestedTagResult[]>([]);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const issue = store.issues.find((i) => i.id === id);

  useEffect(() => {
    if (!issue) return;
    const cached = store.similarIssuesMap[issue.id];
    if (cached) {
      setComputedSimilar(cached);
    } else {
      const result = calculateSimilarity(issue, store.issues);
      setComputedSimilar(result);
      store.setSimilarIssues(issue.id, result);
    }
  }, [issue?.id]);

  const handleSuggest = useCallback(() => {
    if (!issue) return;
    if (showSuggest) {
      setShowSuggest(false);
      return;
    }
    const cached = store.suggestedTagsMap[issue.id];
    if (cached) {
      setComputedTags(cached);
    } else {
      const result = suggestTags(issue);
      setComputedTags(result);
      store.setSuggestedTags(issue.id, result);
    }
    setShowSuggest(true);
  }, [issue?.id, showSuggest]);

  const handleAdoptTag = useCallback((tag: IssueTag) => {
    if (!issue) return;
    if (!issue.tags.includes(tag)) {
      store.updateIssue(issue.id, { tags: [...issue.tags, tag] });
    }
    setComputedTags((prev) => prev.filter((t) => t.tag !== tag));
    if (computedTags.length <= 1) setShowSuggest(false);
  }, [issue?.id, issue?.tags, computedTags.length]);

  const handleRejectTag = useCallback((tag: IssueTag) => {
    setComputedTags((prev) => prev.filter((t) => t.tag !== tag));
    if (computedTags.length <= 1) setShowSuggest(false);
  }, [computedTags.length]);

  const handleAddComment = useCallback(async () => {
    if (!commentText.trim() || !issue) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 300));
    store.addComment(issue.id, commentText.trim());
    setCommentText('');
    setIsSubmitting(false);
  }, [commentText, issue?.id]);

  const handleStatusChange = useCallback(async (status: string) => {
    if (!issue) return;
    setStatusUpdating(true);
    await new Promise((r) => setTimeout(r, 300));
    store.updateIssue(issue.id, { status: status as IssueStatus });
    setStatusUpdating(false);
  }, [issue?.id]);

  const handleDelete = useCallback(async () => {
    if (!issue) return;
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
      return;
    }
    store.deleteIssue(issue.id);
    navigate('/');
  }, [issue?.id, deleteConfirm]);

  if (!issue) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <p className="text-lg text-text-secondary">Issue不存在</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} /> 返回列表
        </button>

        <div className="rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-text-primary">{issue.title}</h1>
              <p className="mt-1 text-sm text-text-secondary">{relativeTime(issue.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={issue.status}
                disabled={statusUpdating}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none transition-all duration-200 focus:border-[#6366F1] disabled:opacity-50"
              >
                <option value="pending">待处理</option>
                <option value="in-progress">进行中</option>
                <option value="completed">已完成</option>
              </select>
              {statusUpdating && <Loader2 size={14} className="animate-spin text-[#9CA3AF]" />}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {issue.tags.map((tag) => {
              const colors = TAG_COLORS[tag] || TAG_COLORS['其他'];
              return (
                <span
                  key={tag}
                  className="rounded px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {tag}
                </span>
              );
            })}
            {issue.isDuplicate && (
              <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-500">
                已标记重复
              </span>
            )}
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
            <div className="relative ml-2">
              <button
                onClick={handleSuggest}
                className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
              >
                <Sparkles size={12} /> 智能建议
              </button>
              {showSuggest && computedTags.length > 0 && (
                <TagSuggestBubble
                  suggestions={computedTags}
                  onAdopt={handleAdoptTag}
                  onReject={handleRejectTag}
                  onClose={() => setShowSuggest(false)}
                />
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
              {issue.description}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleDelete}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                deleteConfirm
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              <Trash2 size={12} /> {deleteConfirm ? '确认删除' : '删除'}
            </button>
          </div>

          <SimilarPanel similarIssues={computedSimilar} />

          <div className="mt-6 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={16} className="text-text-secondary" />
              <h3 className="text-sm font-semibold text-text-primary">
                评论 ({issue.comments.length})
              </h3>
            </div>
            <div className="space-y-3">
              {issue.comments.map((comment) => (
                <div key={comment.id} className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-primary">{comment.author}</span>
                    <span className="text-xs text-text-secondary">{relativeTime(comment.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-text-primary">{comment.content}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="添加评论..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none transition-all duration-200 focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
              />
              <button
                onClick={handleAddComment}
                disabled={isSubmitting || !commentText.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover active:bg-primary-active disabled:bg-primary-disabled disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : '发送'}
              </button>
            </div>
          </div>
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
