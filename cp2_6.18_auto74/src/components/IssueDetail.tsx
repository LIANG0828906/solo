import React, { useState, useEffect, useRef } from 'react';
import { useIssueStore, IssueTag, IssueStatus } from '@/store/issueStore';
import { relativeTime } from '@/utils/helpers';
import { calculateSimilarity, suggestTags, TagSuggestion, SimilarIssue } from '@/api/similarity';

const TAG_COLORS: Record<string, string> = {
  Bug: '#EF4444',
  增强: '#3B82F6',
  文档: '#8B5CF6',
  优化: '#10B981',
  其他: '#6B7280',
  已标记重复: '#F59E0B',
};

const TAG_BG_COLORS: Record<string, string> = {
  Bug: '#FEF2F2',
  增强: '#EFF6FF',
  文档: '#F5F3FF',
  优化: '#ECFDF5',
  其他: '#F3F4F6',
  已标记重复: '#FFFBEB',
};

const STATUS_STYLES: Record<IssueStatus, { bg: string; color: string }> = {
  待处理: { bg: '#FEF3C7', color: '#92400E' },
  进行中: { bg: '#DBEAFE', color: '#1E40AF' },
  已完成: { bg: '#D1FAE5', color: '#065F46' },
};

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="#9CA3AF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
      />
    </svg>
  );
}

interface SimilarPanelProps {
  similarIssues: SimilarIssue[];
  onJump: (id: string) => void;
  onMarkDuplicate: () => void;
  markingDuplicate: boolean;
}

function SimilarPanel({ similarIssues, onJump, onMarkDuplicate, markingDuplicate }: SimilarPanelProps) {
  if (similarIssues.length === 0) return null;

  return (
    <div
      style={{
        background: '#FEF2F2',
        borderRadius: '8px',
        border: '1px solid #FECACA',
        padding: '16px',
        marginTop: '24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#991B1B' }}>
          可能重复的 Issue（{similarIssues.length}）
        </div>
        <button
          onClick={onMarkDuplicate}
          disabled={markingDuplicate}
          style={{
            padding: '6px 14px',
            background: markingDuplicate ? '#A5B4FC' : '#EF4444',
            color: '#fff',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            transition: 'background 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: markingDuplicate ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!markingDuplicate) (e.currentTarget as HTMLButtonElement).style.background = '#DC2626';
          }}
          onMouseLeave={(e) => {
            if (!markingDuplicate) (e.currentTarget as HTMLButtonElement).style.background = '#EF4444';
          }}
        >
          {markingDuplicate && <Spinner size={14} />}
          标记为重复
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {similarIssues.map(item => {
          const simPercent = Math.round(item.similarity * 100);
          const simColor = item.similarity > 0.8 ? '#EF4444' : '#F97316';
          return (
            <div
              key={item.id}
              onClick={() => onJump(item.id)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#FEF2F2'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
            >
              <span style={{
                fontSize: '13px',
                color: '#1E293B',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                marginRight: '12px',
              }}>
                {item.title}
              </span>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: simColor,
                flexShrink: 0,
              }}>
                {simPercent}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TagSuggestionPanelProps {
  suggestions: TagSuggestion[];
  onAccept: (tag: string) => void;
  onReject: (tag: string) => void;
}

function TagSuggestionPanel({ suggestions, onAccept, onReject }: TagSuggestionPanelProps) {
  if (suggestions.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        padding: '12px',
        minWidth: '280px',
        zIndex: 10,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '10px', fontWeight: 500 }}>
        智能标签建议
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {suggestions.map(s => {
          const percent = Math.round(s.confidence * 100);
          return (
            <div key={s.tag}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E293B' }}>{s.tag}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => onAccept(s.tag)}
                    style={{
                      padding: '3px 10px',
                      background: '#10B981',
                      color: '#fff',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 500,
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#059669'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#10B981'; }}
                  >
                    采纳
                  </button>
                  <button
                    onClick={() => onReject(s.tag)}
                    style={{
                      padding: '3px 10px',
                      background: '#E2E8F0',
                      color: '#64748B',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 500,
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#CBD5E1'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#E2E8F0'; }}
                  >
                    拒绝
                  </button>
                </div>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                background: '#E2E8F0',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${percent}%`,
                  height: '100%',
                  background: '#10B981',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', textAlign: 'right' }}>
                确信度 {percent}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface IssueDetailProps {}

const IssueDetail: React.FC<IssueDetailProps> = () => {
  const {
    issues,
    selectedIssueId,
    similarIssues,
    suggestedTags,
    selectIssue,
    updateIssue,
    setSimilarIssues,
    setSuggestedTags,
    addComment,
  } = useIssueStore();

  const [commentInput, setCommentInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [calculatingSimilar, setCalculatingSimilar] = useState(false);
  const [calculatingTags, setCalculatingTags] = useState(false);
  const [markingDuplicate, setMarkingDuplicate] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const suggestBtnRef = useRef<HTMLDivElement>(null);

  const issue = issues.find(i => i.id === selectedIssueId) || null;

  useEffect(() => {
    if (!issue) return;

    setCalculatingSimilar(true);
    const timer = setTimeout(() => {
      const results = calculateSimilarity(issue, issues, 0.25);
      setSimilarIssues(results);
      setCalculatingSimilar(false);
    }, 10);

    return () => clearTimeout(timer);
  }, [issue?.id, issues, setSimilarIssues]);

  useEffect(() => {
    setShowTagSuggestions(false);
    setCommentInput('');
  }, [issue?.id]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestBtnRef.current && !suggestBtnRef.current.contains(e.target as Node)) {
        setShowTagSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!issue) {
    return (
      <div style={{
        padding: '60px 20px',
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: '14px',
      }}>
        请从左侧选择一个 Issue 查看详情
      </div>
    );
  }

  const handleSuggestTags = () => {
    if (showTagSuggestions) {
      setShowTagSuggestions(false);
      return;
    }
    setCalculatingTags(true);
    setTimeout(() => {
      const suggestions = suggestTags(issue);
      setSuggestedTags(suggestions.filter(s => s.confidence > 0));
      setCalculatingTags(false);
      setShowTagSuggestions(true);
    }, 10);
  };

  const handleAcceptTag = (tag: string) => {
    if (!issue.tags.includes(tag as IssueTag)) {
      const newTags = [...issue.tags, tag as IssueTag];
      setStatusLoading(true);
      setTimeout(() => {
        updateIssue(issue.id, { tags: newTags });
        setStatusLoading(false);
      }, 300);
    }
    setSuggestedTags(suggestedTags.filter(s => s.tag !== tag));
    if (suggestedTags.filter(s => s.tag !== tag).length === 0) {
      setShowTagSuggestions(false);
    }
  };

  const handleRejectTag = (tag: string) => {
    setSuggestedTags(suggestedTags.filter(s => s.tag !== tag));
    if (suggestedTags.filter(s => s.tag !== tag).length === 0) {
      setShowTagSuggestions(false);
    }
  };

  const handleMarkDuplicate = () => {
    setMarkingDuplicate(true);
    setTimeout(() => {
      const newTags = issue.tags.includes('已标记重复') ? issue.tags : [...issue.tags, '已标记重复'];
      updateIssue(issue.id, { status: '已完成', tags: newTags });
      setMarkingDuplicate(false);
      setSimilarIssues([]);
    }, 300);
  };

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    setAddingComment(true);
    setTimeout(() => {
      addComment(issue.id, commentInput.trim());
      setCommentInput('');
      setAddingComment(false);
    }, 300);
  };

  const handleStatusChange = (status: IssueStatus) => {
    setStatusLoading(true);
    setTimeout(() => {
      updateIssue(issue.id, { status });
      setStatusLoading(false);
    }, 300);
  };

  const handleRemoveTag = (tag: IssueTag) => {
    setStatusLoading(true);
    setTimeout(() => {
      updateIssue(issue.id, { tags: issue.tags.filter(t => t !== tag) });
      setStatusLoading(false);
    }, 300);
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      animation: 'fadeIn 0.3s ease',
      height: '100%',
      overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          onClick={() => selectIssue(null)}
          style={{
            fontSize: '13px',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#1E293B'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#64748B'; }}
        >
          ← 返回列表
        </button>
        <div style={{ fontSize: '12px', color: '#94A3B8' }}>
          创建于 {relativeTime(issue.createdAt)}
        </div>
      </div>

      <h1 style={{
        fontSize: '22px',
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: '16px',
        lineHeight: '1.4',
      }}>
        {issue.title}
      </h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#64748B', marginRight: '4px' }}>标签：</span>
          {issue.tags.length === 0 && <span style={{ fontSize: '13px', color: '#94A3B8' }}>暂无</span>}
          {issue.tags.map(tag => (
            <span
              key={tag}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                background: TAG_BG_COLORS[tag] || '#F3F4F6',
                color: TAG_COLORS[tag] || '#6B7280',
                fontWeight: 500,
              }}
            >
              {tag}
              {tag !== '已标记重复' && (
                <button
                  onClick={() => handleRemoveTag(tag)}
                  style={{
                    color: TAG_COLORS[tag] || '#6B7280',
                    opacity: 0.6,
                    fontSize: '14px',
                    lineHeight: 1,
                    padding: 0,
                    transition: 'opacity 0.2s ease',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.6'; }}
                >
                  ×
                </button>
              )}
            </span>
          ))}
          <div ref={suggestBtnRef} style={{ position: 'relative' }}>
            <button
              onClick={handleSuggestTags}
              disabled={calculatingTags || statusLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                background: statusLoading || calculatingTags ? '#A5B4FC' : '#6366F1',
                color: '#fff',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'background 0.2s ease',
                cursor: statusLoading || calculatingTags ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!calculatingTags && !statusLoading) (e.currentTarget as HTMLButtonElement).style.background = '#4F46E5';
              }}
              onMouseLeave={(e) => {
                if (!calculatingTags && !statusLoading) (e.currentTarget as HTMLButtonElement).style.background = '#6366F1';
              }}
            >
              {calculatingTags ? <Spinner size={14} /> : '✨'}
              {calculatingTags ? '分析中' : '智能建议'}
            </button>
            {showTagSuggestions && (
              <TagSuggestionPanel
                suggestions={suggestedTags}
                onAccept={handleAcceptTag}
                onReject={handleRejectTag}
              />
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: '#64748B', marginRight: '4px' }}>状态：</span>
        {(['待处理', '进行中', '已完成'] as IssueStatus[]).map(s => (
          <button
            key={s}
            onClick={() => handleStatusChange(s)}
            disabled={statusLoading}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              background: issue.status === s ? STATUS_STYLES[s].bg : '#F1F5F9',
              color: issue.status === s ? STATUS_STYLES[s].color : '#64748B',
              border: issue.status === s ? `1px solid ${STATUS_STYLES[s].color}40` : '1px solid transparent',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: statusLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {statusLoading && issue.status === s && <Spinner size={12} />}
            {s}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '10px' }}>
          问题描述
        </div>
        <div style={{
          fontSize: '14px',
          color: '#475569',
          lineHeight: '1.7',
          padding: '16px',
          background: '#F8FAFC',
          borderRadius: '8px',
          whiteSpace: 'pre-wrap',
        }}>
          {issue.description}
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>
            评论（{issue.comments.length}）
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          {issue.comments.length === 0 && (
            <div style={{ fontSize: '13px', color: '#94A3B8', padding: '16px', textAlign: 'center' }}>
              暂无评论
            </div>
          )}
          {issue.comments.map(c => (
            <div key={c.id} style={{
              padding: '12px 14px',
              background: '#F8FAFC',
              borderRadius: '8px',
              animation: 'fadeIn 0.3s ease',
            }}>
              <div style={{ fontSize: '14px', color: '#1E293B', marginBottom: '6px', whiteSpace: 'pre-wrap' }}>
                {c.content}
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                {relativeTime(c.createdAt)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
            placeholder="添加评论..."
            disabled={addingComment}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '2px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '14px',
              transition: 'border-color 0.2s ease',
              color: '#1E293B',
            }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#6366F1'; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#E2E8F0'; }}
          />
          <button
            onClick={handleAddComment}
            disabled={addingComment || !commentInput.trim()}
            style={{
              padding: '10px 20px',
              background: addingComment || !commentInput.trim() ? '#A5B4FC' : '#6366F1',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'background 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: addingComment || !commentInput.trim() ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!addingComment && commentInput.trim()) (e.currentTarget as HTMLButtonElement).style.background = '#4F46E5';
            }}
            onMouseLeave={(e) => {
              if (!addingComment && commentInput.trim()) (e.currentTarget as HTMLButtonElement).style.background = '#6366F1';
            }}
          >
            {addingComment && <Spinner size={14} />}
            发送
          </button>
        </div>
      </div>

      {calculatingSimilar ? (
        <div style={{
          marginTop: '24px',
          padding: '20px',
          background: '#FEF2F2',
          borderRadius: '8px',
          border: '1px solid #FECACA',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          color: '#991B1B',
        }}>
          <Spinner />
          正在检测相似 Issue...
        </div>
      ) : (
        <SimilarPanel
          similarIssues={similarIssues}
          onJump={selectIssue}
          onMarkDuplicate={handleMarkDuplicate}
          markingDuplicate={markingDuplicate}
        />
      )}
    </div>
  );
};

export { IssueDetail };
export default IssueDetail;
