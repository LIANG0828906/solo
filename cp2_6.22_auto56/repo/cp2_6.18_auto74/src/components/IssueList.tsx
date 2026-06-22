import React, { useState, useEffect, useMemo } from 'react';
import { useIssueStore, Issue, IssueTag, IssueStatus } from '@/store/issueStore';
import { relativeTime } from '@/utils/helpers';

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

function SkeletonCard() {
  return (
    <div
      style={{
        width: '100%',
        background: '#fff',
        borderRadius: '12px',
        padding: '16px',
        borderLeft: '4px solid #E5E7EB',
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
      }}
    >
      <div style={{ height: '20px', background: '#E5E7EB', borderRadius: '4px', marginBottom: '12px', width: '70%' }} />
      <div style={{ height: '16px', background: '#E5E7EB', borderRadius: '4px', marginBottom: '8px', width: '100%' }} />
      <div style={{ height: '16px', background: '#E5E7EB', borderRadius: '4px', marginBottom: '12px', width: '90%' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ height: '20px', background: '#E5E7EB', borderRadius: '4px', width: '50px' }} />
        <div style={{ height: '20px', background: '#E5E7EB', borderRadius: '4px', width: '60px' }} />
      </div>
    </div>
  );
}

interface IssueCardProps {
  issue: Issue;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onClick: (id: string) => void;
}

function IssueCard({ issue, isSelected, onToggleSelect, onClick }: IssueCardProps) {
  const primaryTag = issue.tags[0] || '其他';
  const borderColor = TAG_COLORS[primaryTag] || '#6B7280';

  return (
    <div
      onClick={() => onClick(issue.id)}
      style={{
        width: '100%',
        background: isSelected ? '#EEF2FF' : '#fff',
        borderRadius: '12px',
        padding: '16px',
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s ease, background 0.2s ease',
        display: 'flex',
        gap: '12px',
        animation: 'fadeIn 0.3s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '2px' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(issue.id)}
          style={{
            width: '18px',
            height: '18px',
            cursor: 'pointer',
            accentColor: '#6366F1',
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#1E293B',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: '8px',
        }}>
          {issue.title}
        </div>
        <div style={{
          fontSize: '14px',
          color: '#64748B',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginBottom: '12px',
          lineHeight: '1.5',
        }}>
          {issue.description}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {issue.tags.map(tag => (
            <span
              key={tag}
              style={{
                display: 'inline-block',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                background: TAG_BG_COLORS[tag] || '#F3F4F6',
                color: TAG_COLORS[tag] || '#6B7280',
                fontWeight: 500,
              }}
            >
              {tag}
            </span>
          ))}
          <span
            style={{
              display: 'inline-block',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              background: STATUS_STYLES[issue.status].bg,
              color: STATUS_STYLES[issue.status].color,
              fontWeight: 500,
            }}
          >
            {issue.status}
          </span>
          <span style={{ fontSize: '12px', color: '#94A3B8', marginLeft: 'auto' }}>
            {relativeTime(issue.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ToastProps {
  message: string;
  onClose: () => void;
}

function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#10B981',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 100,
        animation: 'toastIn 0.3s ease',
        fontSize: '14px',
        fontWeight: 500,
      }}
    >
      {message}
    </div>
  );
}

interface BatchActionBarProps {
  selectedCount: number;
  onBatchStatus: (status: IssueStatus) => void;
  onBatchTag: (tag: IssueTag) => void;
  onBatchClose: () => void;
  onClear: () => void;
}

function BatchActionBar({ selectedCount, onBatchStatus, onBatchTag, onBatchClose, onClear }: BatchActionBarProps) {
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const tags: IssueTag[] = ['Bug', '增强', '文档', '优化', '其他'];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: '#fff',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 50,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'slideInDown 0.2s ease',
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E293B' }}>
        已选择 <span style={{ color: '#6366F1' }}>{selectedCount}</span> 个 Issue
      </div>
      <button
        onClick={() => onBatchStatus('待处理')}
        style={{
          padding: '8px 16px',
          background: '#6366F1',
          color: '#fff',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#4F46E5'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#6366F1'; }}
        onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#4338CA'; }}
        onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#4F46E5'; }}
      >
        批量标记为待处理
      </button>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowTagDropdown(!showTagDropdown)}
          style={{
            padding: '8px 16px',
            background: '#6366F1',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#4F46E5'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#6366F1'; }}
        >
          批量添加标签 ▾
        </button>
        {showTagDropdown && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              padding: '4px',
              minWidth: '140px',
              zIndex: 60,
            }}
          >
            {tags.map(tag => (
              <div
                key={tag}
                onClick={() => { onBatchTag(tag); setShowTagDropdown(false); }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: '#1E293B',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F1F5F9'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {tag}
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={onBatchClose}
        style={{
          padding: '8px 16px',
          background: '#EF4444',
          color: '#fff',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#DC2626'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#EF4444'; }}
      >
        批量关闭
      </button>
      <button
        onClick={onClear}
        style={{
          padding: '8px 16px',
          background: 'transparent',
          color: '#64748B',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          marginLeft: 'auto',
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#1E293B'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#64748B'; }}
      >
        取消选择
      </button>
    </div>
  );
}

const IssueList: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const {
    searchQuery,
    statusFilter,
    tagFilter,
    selectedIssueIds,
    setSearchQuery,
    setStatusFilter,
    setTagFilter,
    selectIssue,
    toggleIssueSelection,
    clearSelection,
    batchUpdateStatus,
    batchAddTag,
    batchClose,
    getFilteredIssues,
  } = useIssueStore();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const filteredIssues = useMemo(() => getFilteredIssues(), [getFilteredIssues, searchQuery, statusFilter, tagFilter]);

  const showBatchBar = selectedIssueIds.size >= 2;

  const handleBatchStatus = (status: IssueStatus) => {
    batchUpdateStatus(Array.from(selectedIssueIds), status);
    setToast(`已将 ${selectedIssueIds.size} 个 Issue 标记为${status}`);
  };

  const handleBatchTag = (tag: IssueTag) => {
    batchAddTag(Array.from(selectedIssueIds), tag);
    setToast(`已为 ${selectedIssueIds.size} 个 Issue 添加标签「${tag}」`);
  };

  const handleBatchClose = () => {
    batchClose(Array.from(selectedIssueIds));
    setToast(`已关闭 ${selectedIssueIds.size} 个 Issue`);
  };

  return (
    <div style={{ width: '100%' }}>
      {showBatchBar && (
        <BatchActionBar
          selectedCount={selectedIssueIds.size}
          onBatchStatus={handleBatchStatus}
          onBatchTag={handleBatchTag}
          onBatchClose={handleBatchClose}
          onClear={clearSelection}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div
        style={{
          background: '#F8FAFC',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '200px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="搜索Issue标题或内容"
            style={{
              width: '100%',
              padding: '10px 40px 10px 14px',
              border: `2px solid ${searchFocused ? '#6366F1' : '#E2E8F0'}`,
              borderRadius: '8px',
              fontSize: '14px',
              background: '#fff',
              transition: 'border-color 0.2s ease',
              color: '#1E293B',
            }}
          />
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={searchFocused ? '#6366F1' : '#94A3B8'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              transition: 'stroke 0.2s ease',
            }}
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{
            padding: '10px 14px',
            border: '2px solid #E2E8F0',
            borderRadius: '8px',
            fontSize: '14px',
            background: '#fff',
            color: '#1E293B',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease',
          }}
        >
          <option value="全部">全部状态</option>
          <option value="待处理">待处理</option>
          <option value="进行中">进行中</option>
          <option value="已完成">已完成</option>
        </select>

        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value as any)}
          style={{
            padding: '10px 14px',
            border: '2px solid #E2E8F0',
            borderRadius: '8px',
            fontSize: '14px',
            background: '#fff',
            color: '#1E293B',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease',
          }}
        >
          <option value="全部">全部标签</option>
          <option value="Bug">Bug</option>
          <option value="增强">增强</option>
          <option value="文档">文档</option>
          <option value="优化">优化</option>
          <option value="其他">其他</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isLoading ? (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </>
        ) : filteredIssues.length === 0 ? (
          <div
            style={{
              padding: '48px 16px',
              textAlign: 'center',
              color: '#94A3B8',
              fontSize: '14px',
            }}
          >
            没有找到匹配的 Issue
          </div>
        ) : (
          filteredIssues.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              isSelected={selectedIssueIds.has(issue.id)}
              onToggleSelect={toggleIssueSelection}
              onClick={selectIssue}
            />
          ))
        )}
      </div>
    </div>
  );
};

export { IssueList };
export default IssueList;
