import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as Diff from 'diff';
import {
  getContract,
  addComment as apiAddComment,
  approveContract as apiApproveContract,
  ContractData,
  Comment,
  HistoryRecord,
  ApprovalStatus,
  createWebSocketConnection,
} from '../api/contractApi';

interface DiffLine {
  type: 'equal' | 'added' | 'removed';
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
  lineIndex: number;
}

interface DiffBlock {
  start: number;
  end: number;
  isDiff: boolean;
  blockType: 'added' | 'removed' | 'mixed' | 'equal';
  addedCount: number;
  removedCount: number;
  equalCount: number;
}

const statusConfig: Record<ApprovalStatus, { label: string; className: string; icon: string }> = {
  pending: { label: '待审', className: 'status-pending', icon: '⏳' },
  reviewing: { label: '审批中', className: 'status-reviewing', icon: '🔍' },
  approved: { label: '已通过', className: 'status-approved', icon: '✅' },
  rejected: { label: '驳回', className: 'status-rejected', icon: '❌' },
};

const historyIconConfig: Record<string, { icon: string; className: string }> = {
  version: { icon: '📄', className: 'history-icon-version' },
  comment: { icon: '💬', className: 'history-icon-comment' },
  approve: { icon: '✅', className: 'history-icon-approve' },
  reject: { icon: '❌', className: 'history-icon-reject' },
};

const CURRENT_USER = '张三';

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitial(name: string): string {
  return name.charAt(0);
}

function getAvatarColor(name: string): string {
  const colors = [
    'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
    'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
    'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
    'linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)',
    'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
    'linear-gradient(135deg, #38b2ac 0%, #319795 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const CommentBubble: React.FC<{
  comment: Comment;
  onReply: (commentId: string, content: string) => void;
  depth?: number;
}> = ({ comment, onReply, depth = 0 }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setShowReplyInput(false);
    }
  };

  return (
    <div className="comment-bubble">
      <div className="comment-header">
        <div className="comment-avatar" style={{ background: getAvatarColor(comment.author) }}>
          {getInitial(comment.author)}
        </div>
        <div className="comment-user-info">
          <div className="comment-user-name">{comment.author}</div>
          <div className="comment-time">{formatTime(comment.timestamp)}</div>
        </div>
      </div>
      <div className="comment-text">{comment.content}</div>
      {depth < 3 && (
        <div className="comment-actions">
          <button
            className="btn btn-secondary btn-small"
            onClick={() => setShowReplyInput(!showReplyInput)}
          >
            {showReplyInput ? '取消' : '回复'}
          </button>
        </div>
      )}
      {showReplyInput && (
        <div className="reply-input-wrapper">
          <textarea
            className="reply-input"
            placeholder={`回复 ${comment.author}...`}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={2}
            autoFocus
          />
          <button
            className="btn btn-primary btn-small"
            onClick={handleSubmitReply}
            disabled={!replyContent.trim()}
          >
            发送
          </button>
        </div>
      )}
      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <CommentBubble
              key={reply.id}
              comment={reply}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentModal: React.FC<{
  onClose: () => void;
  onSubmit: (content: string) => void;
  lineInfo: string;
}> = ({ onClose, onSubmit, lineInfo }) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content.trim());
    }
  };

  return (
    <div className="comment-modal-overlay" onClick={onClose}>
      <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
        <h3>添加批注 - {lineInfo}</h3>
        <textarea
          ref={textareaRef}
          placeholder="请输入批注内容，可以提出修改建议或疑问..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              handleSubmit();
            }
          }}
        />
        <div style={{ fontSize: 12, color: '#a0aec0', marginBottom: 16 }}>
          💡 提示：Ctrl + Enter 快速提交
        </div>
        <div className="comment-modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!content.trim()}
          >
            提交批注
          </button>
        </div>
      </div>
    </div>
  );
};

const CollapseToggle: React.FC<{
  collapsed: boolean;
  onClick: () => void;
  block: DiffBlock;
}> = ({ collapsed, onClick, block }) => {
  const getBlockLabel = () => {
    if (block.blockType === 'added') {
      return `新增 ${block.addedCount} 行`;
    }
    if (block.blockType === 'removed') {
      return `删除 ${block.removedCount} 行`;
    }
    if (block.blockType === 'mixed') {
      return `修改：+${block.addedCount} -${block.removedCount}`;
    }
    return `${block.equalCount} 行相同内容`;
  };

  const getBlockColor = () => {
    if (block.blockType === 'added') return '#276749';
    if (block.blockType === 'removed') return '#c53030';
    if (block.blockType === 'mixed') return '#975a16';
    return '#4a5568';
  };

  return (
    <div
      className="diff-block-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 8px 6px 12px',
        background: block.isDiff
          ? 'linear-gradient(90deg, #faf5ff 0%, #f7fafc 100%)'
          : '#f7fafc',
        borderBottom: '1px solid #e2e8f0',
        borderLeft: block.isDiff ? `3px solid ${getBlockColor()}` : '3px solid #cbd5e0',
      }}
    >
      <button
        className="collapse-toggle"
        onClick={onClick}
        title={collapsed ? '展开' : '折叠'}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: 'transform 300ms ease',
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <span
        style={{
          fontSize: 12,
          color: getBlockColor(),
          fontWeight: 600,
          marginLeft: 8,
          letterSpacing: 0.2,
        }}
      >
        {getBlockLabel()}
      </span>
      <span style={{ fontSize: 12, color: '#a0aec0', marginLeft: 12 }}>
        第 {block.start + 1} - {block.end + 1} 行
      </span>
      <div style={{ flex: 1 }} />
      <span
        style={{
          fontSize: 11,
          color: '#a0aec0',
          background: '#edf2f7',
          padding: '2px 8px',
          borderRadius: 10,
        }}
      >
        {collapsed ? '点击展开' : '点击折叠'}
      </span>
    </div>
  );
};

const ConnectionStatus: React.FC<{ connected: boolean }> = ({ connected }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12,
      padding: '4px 12px',
      borderRadius: 12,
      background: connected ? 'rgba(72, 187, 120, 0.15)' : 'rgba(245, 101, 101, 0.15)',
      color: connected ? '#276749' : '#c53030',
    }}
  >
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: connected ? '#48bb78' : '#f56565',
        animation: connected ? 'pulse 2s infinite' : 'none',
      }}
    />
    {connected ? '实时同步已连接' : '连接断开'}
  </div>
);

const ContractEditor: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [oldContent, setOldContent] = useState('');
  const [newContent, setNewContent] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('pending');
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [modalLineIndex, setModalLineIndex] = useState<number | null>(null);
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<number>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<ReturnType<typeof createWebSocketConnection> | null>(null);

  const addCommentToTree = useCallback(
    (list: Comment[], parentId: string, newComment: Comment): Comment[] => {
      return list.map((c) => {
        if (c.id === parentId) {
          return { ...c, replies: [...c.replies, newComment] };
        }
        if (c.replies.length > 0) {
          return { ...c, replies: addCommentToTree(c.replies, parentId, newComment) };
        }
        return c;
      });
    },
    []
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data: ContractData = await getContract();
        setOldContent(data.oldContent);
        setNewContent(data.newContent);
        setComments(data.comments);
        setApprovalStatus(data.approvalStatus);
        setHistory(data.history);
      } catch (error) {
        console.error('Failed to load contract:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    wsRef.current = createWebSocketConnection({
      onConnected: () => setWsConnected(true),
      onDisconnected: () => setWsConnected(false),
      onStatusUpdated: (status) => {
        console.log('[WS] Status updated:', status);
        setApprovalStatus(status);
      },
      onCommentAdded: (comment) => {
        console.log('[WS] Comment added:', comment);
        if (comment.parentId) {
          setComments((prev) => addCommentToTree(prev, comment.parentId, comment));
        } else {
          setComments((prev) => {
            if (prev.some((c) => c.id === comment.id)) return prev;
            return [...prev, comment];
          });
        }
      },
      onHistoryUpdated: (newHistory) => {
        console.log('[WS] History updated, records:', newHistory.length);
        setHistory(newHistory);
      },
      onVersionUploaded: (oldC, newC) => {
        console.log('[WS] Version uploaded');
        if (oldC !== undefined) setOldContent(oldC);
        if (newC !== undefined) setNewContent(newC);
      },
    });

    return () => {
      wsRef.current?.close();
    };
  }, [addCommentToTree]);

  const diffLines = useMemo((): DiffLine[] => {
    if (!oldContent && !newContent) return [];
    const changes = Diff.diffLines(oldContent, newContent);
    const lines: DiffLine[] = [];
    let oldLineNum = 1;
    let newLineNum = 1;
    let lineIndex = 0;

    changes.forEach((part) => {
      const partLines = part.value.split('\n');
      if (part.value.endsWith('\n')) {
        partLines.pop();
      }
      if (partLines.length === 0 && part.value === '') {
        partLines.push('');
      }

      partLines.forEach((line) => {
        let type: DiffLine['type'] = 'equal';
        let oldLineNumber: number | null = null;
        let newLineNumber: number | null = null;

        if (part.added) {
          type = 'added';
          newLineNumber = newLineNum++;
        } else if (part.removed) {
          type = 'removed';
          oldLineNumber = oldLineNum++;
        } else {
          type = 'equal';
          oldLineNumber = oldLineNum++;
          newLineNumber = newLineNum++;
        }

        lines.push({
          type,
          content: line,
          oldLineNumber,
          newLineNumber,
          lineIndex: lineIndex++,
        });
      });
    });

    return lines;
  }, [oldContent, newContent]);

  const diffBlocks = useMemo((): DiffBlock[] => {
    const blocks: DiffBlock[] = [];
    if (diffLines.length === 0) return blocks;

    let currentStart = 0;
    let currentIsDiff = diffLines[0].type !== 'equal';
    let addedCount = diffLines[0].type === 'added' ? 1 : 0;
    let removedCount = diffLines[0].type === 'removed' ? 1 : 0;
    let equalCount = diffLines[0].type === 'equal' ? 1 : 0;

    const getBlockType = (
      isDiff: boolean,
      added: number,
      removed: number
    ): DiffBlock['blockType'] => {
      if (!isDiff) return 'equal';
      if (added > 0 && removed === 0) return 'added';
      if (removed > 0 && added === 0) return 'removed';
      return 'mixed';
    };

    for (let i = 1; i < diffLines.length; i++) {
      const isDiff = diffLines[i].type !== 'equal';
      if (isDiff !== currentIsDiff) {
        blocks.push({
          start: currentStart,
          end: i - 1,
          isDiff: currentIsDiff,
          blockType: getBlockType(currentIsDiff, addedCount, removedCount),
          addedCount,
          removedCount,
          equalCount,
        });
        currentStart = i;
        currentIsDiff = isDiff;
        addedCount = diffLines[i].type === 'added' ? 1 : 0;
        removedCount = diffLines[i].type === 'removed' ? 1 : 0;
        equalCount = diffLines[i].type === 'equal' ? 1 : 0;
      } else {
        if (diffLines[i].type === 'added') addedCount++;
        else if (diffLines[i].type === 'removed') removedCount++;
        else equalCount++;
      }
    }
    blocks.push({
      start: currentStart,
      end: diffLines.length - 1,
      isDiff: currentIsDiff,
      blockType: getBlockType(currentIsDiff, addedCount, removedCount),
      addedCount,
      removedCount,
      equalCount,
    });

    return blocks;
  }, [diffLines]);

  const toggleBlockCollapse = useCallback((blockIndex: number) => {
    setCollapsedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockIndex)) {
        next.delete(blockIndex);
      } else {
        next.add(blockIndex);
      }
      return next;
    });
  }, []);

  const collapseAllDiff = useCallback(() => {
    const indices = diffBlocks
      .map((b, i) => (b.isDiff ? i : -1))
      .filter((i) => i >= 0);
    setCollapsedBlocks(new Set(indices));
  }, [diffBlocks]);

  const expandAll = useCallback(() => {
    setCollapsedBlocks(new Set());
  }, []);

  const getCommentsForLine = useCallback(
    (lineIndex: number): Comment[] => {
      return comments.filter((c) => c.lineIndex === lineIndex);
    },
    [comments]
  );

  const handleAddComment = async (lineIndex: number, content: string) => {
    try {
      const comment = await apiAddComment({
        lineIndex,
        content,
        author: CURRENT_USER,
      });
      if (!wsConnected) {
        setComments((prev) => [...prev, comment]);
        const record: HistoryRecord = {
          id: `hist-${Date.now()}`,
          type: 'comment',
          description: `添加了批注：${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`,
          user: CURRENT_USER,
          timestamp: Date.now(),
        };
        setHistory((prev) => [record, ...prev].sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleReplyToComment = async (commentId: string, content: string) => {
    try {
      const reply = await apiAddComment({
        lineIndex: -1,
        content,
        author: CURRENT_USER,
        parentId: commentId,
      });

      if (!wsConnected) {
        setComments((prev) => addCommentToTree(prev, commentId, reply));
      }
    } catch (error) {
      console.error('Failed to reply:', error);
    }
  };

  const handleApproveAction = async (action: 'approve' | 'reject') => {
    try {
      setActionLoading(true);
      const response = await apiApproveContract({
        action,
        user: CURRENT_USER,
      });
      if (!wsConnected) {
        setApprovalStatus(response.status);
        setHistory(response.history.sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch (error) {
      console.error('Failed to update approval:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadVersion = async () => {
    if (!oldContent.trim() && !newContent.trim()) return;
    try {
      setActionLoading(true);
      const response = await apiApproveContract({
        user: CURRENT_USER,
        oldContent,
        newContent,
      });
      if (!wsConnected) {
        setApprovalStatus(response.status);
        setHistory(response.history.sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch (error) {
      console.error('Failed to upload version:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => b.timestamp - a.timestamp);
  }, [history]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let unchanged = 0;
    diffLines.forEach((l) => {
      if (l.type === 'added') added++;
      else if (l.type === 'removed') removed++;
      else unchanged++;
    });
    return { added, removed, unchanged };
  }, [diffLines]);

  const lineInfoText = modalLineIndex !== null && diffLines[modalLineIndex]
    ? `第 ${diffLines[modalLineIndex].oldLineNumber ?? diffLines[modalLineIndex].newLineNumber ?? modalLineIndex + 1} 行`
    : '';

  if (loading) {
    return (
      <div className="app-container">
        <div className="app-header">
          <h1>合同条款协作审批系统</h1>
        </div>
        <div className="main-content">
          <div className="empty-state" style={{ width: '100%' }}>
            <div className="loading-spinner" />
            <div className="empty-state-text" style={{ marginTop: 16 }}>
              加载中...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1>📋 合同条款协作审批系统</h1>
          <ConnectionStatus connected={wsConnected} />
        </div>
      </div>

      <div className="main-content">
        <div className="left-panel">
          <div className="panel-card">
            <div className="panel-header">
              <h2>📝 合同版本对比</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={collapseAllDiff}
                  disabled={diffBlocks.length === 0}
                >
                  折叠全部差异
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={expandAll}
                  disabled={collapsedBlocks.size === 0}
                >
                  展开全部
                </button>
              </div>
            </div>
            <div className="panel-body">
              <div className="upload-section">
                <div className="upload-row">
                  <span className="upload-label">原版本：</span>
                  <textarea
                    className="textarea-input"
                    placeholder="粘贴原合同文本..."
                    value={oldContent}
                    onChange={(e) => setOldContent(e.target.value)}
                  />
                </div>
                <div className="upload-row">
                  <span className="upload-label">新版本：</span>
                  <textarea
                    className="textarea-input"
                    placeholder="粘贴新合同文本..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                  />
                </div>
                <div className="upload-row" style={{ justifyContent: 'space-between' }}>
                  {diffLines.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 16,
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      <span style={{ color: '#276749' }}>
                        +{stats.added} 行新增
                      </span>
                      <span style={{ color: '#c53030' }}>
                        -{stats.removed} 行删除
                      </span>
                      <span style={{ color: '#4a5568' }}>
                        {stats.unchanged} 行相同
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-primary"
                      onClick={handleUploadVersion}
                      disabled={actionLoading || (!oldContent.trim() && !newContent.trim())}
                    >
                      {actionLoading ? <span className="loading-spinner" /> : '🔄 生成对比'}
                    </button>
                  </div>
                </div>
              </div>

              {diffLines.length > 0 ? (
                <div className="diff-container">
                  <div className="diff-header">
                    <div
                      className="diff-header-cell"
                      style={{ width: 50, flex: 'none', textAlign: 'center' }}
                    >
                      #
                    </div>
                    <div
                      className="diff-header-cell"
                      style={{ width: 60, flex: 'none', textAlign: 'center' }}
                    >
                      旧行号
                    </div>
                    <div className="diff-header-cell">旧版本</div>
                    <div
                      className="diff-header-cell"
                      style={{ width: 60, flex: 'none', textAlign: 'center' }}
                    >
                      新行号
                    </div>
                    <div className="diff-header-cell">新版本</div>
                    <div
                      className="diff-header-cell"
                      style={{ width: 50, flex: 'none', textAlign: 'center' }}
                    >
                      批注
                    </div>
                  </div>
                  <div className="diff-content">
                    {diffBlocks.map((block, blockIndex) => (
                      <div key={blockIndex} className="diff-block-wrapper">
                        <CollapseToggle
                          collapsed={collapsedBlocks.has(blockIndex)}
                          onClick={() => toggleBlockCollapse(blockIndex)}
                          block={block}
                        />
                        {!collapsedBlocks.has(blockIndex) &&
                          diffLines.slice(block.start, block.end + 1).map((line) => {
                            const lineComments = getCommentsForLine(line.lineIndex);
                            return (
                              <div
                                key={line.lineIndex}
                                className={`diff-row ${
                                  line.type === 'added'
                                    ? 'diff-line-add'
                                    : line.type === 'removed'
                                    ? 'diff-line-delete'
                                    : ''
                                }`}
                              >
                                <div className="diff-line-number">
                                  {line.type === 'added'
                                    ? '+'
                                    : line.type === 'removed'
                                    ? '-'
                                    : ' '}
                                </div>
                                <div className="diff-line-number">
                                  {line.oldLineNumber ?? ''}
                                </div>
                                <div className="diff-line-content">
                                  {line.type === 'removed' || line.type === 'equal'
                                    ? line.content
                                    : ''}
                                </div>
                                <div className="diff-line-number">
                                  {line.newLineNumber ?? ''}
                                </div>
                                <div className="diff-line-content">
                                  {line.type === 'added' || line.type === 'equal'
                                    ? line.content
                                    : ''}
                                </div>
                                <div
                                  style={{
                                    width: 50,
                                    flexShrink: 0,
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <button
                                    className="add-comment-btn"
                                    onClick={() => setModalLineIndex(line.lineIndex)}
                                    title="添加批注"
                                    style={{ opacity: 1, position: 'static' }}
                                  >
                                    {lineComments.length > 0 ? (
                                      <span
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 600,
                                        }}
                                      >
                                        💬{lineComments.length}
                                      </span>
                                    ) : (
                                      '+'
                                    )}
                                  </button>
                                </div>
                                {lineComments.length > 0 && (
                                  <div className="comment-bubble-wrapper">
                                    {lineComments.map((comment) => (
                                      <CommentBubble
                                        key={comment.id}
                                        comment={comment}
                                        onReply={handleReplyToComment}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📝</div>
                  <div className="empty-state-text">请输入合同文本并点击"生成对比"</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="panel-card">
            <div className="panel-header">
              <h2>⚡ 审批状态</h2>
            </div>
            <div className="panel-body">
              <div className="status-section">
                <div className="status-display">
                  <span className="status-label">当前状态：</span>
                  <span className={`status-badge ${statusConfig[approvalStatus].className}`}>
                    <span style={{ marginRight: 6 }}>{statusConfig[approvalStatus].icon}</span>
                    {statusConfig[approvalStatus].label}
                  </span>
                </div>
                <div
                  style={{
                    padding: 12,
                    background: '#f7fafc',
                    borderRadius: 6,
                    fontSize: 12,
                    color: '#718096',
                    lineHeight: 1.6,
                  }}
                >
                  <div>审批流程说明：</div>
                  <div>1. 上传新版本后状态变为「审批中」</div>
                  <div>2. 审批人确认内容后可点击「通过」或「驳回」</div>
                  <div>3. 状态变更将实时同步给所有协作者</div>
                </div>
                <div className="action-buttons">
                  <button
                    className="btn btn-success"
                    onClick={() => handleApproveAction('approve')}
                    disabled={
                      actionLoading ||
                      approvalStatus === 'approved'
                    }
                  >
                    {actionLoading ? <span className="loading-spinner" /> : '✓ 通过'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleApproveAction('reject')}
                    disabled={
                      actionLoading ||
                      approvalStatus === 'rejected'
                    }
                  >
                    {actionLoading ? <span className="loading-spinner" /> : '✕ 驳回'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-card">
            <div className="panel-header">
              <h2>📊 操作统计</h2>
            </div>
            <div className="panel-body">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#2c5282' }}>
                    {comments.length}
                  </div>
                  <div style={{ fontSize: 12, color: '#2c5282', marginTop: 4 }}>批注总数</div>
                </div>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#276749' }}>
                    {sortedHistory.length}
                  </div>
                  <div style={{ fontSize: 12, color: '#276749', marginTop: 4 }}>操作记录</div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-card">
            <div className="panel-header">
              <h2>📜 历史记录</h2>
              <span
                style={{
                  fontSize: 12,
                  color: '#a0aec0',
                }}
              >
                按时间倒序
              </span>
            </div>
            <div className="panel-body">
              {sortedHistory.length > 0 ? (
                <div className="history-list">
                  {sortedHistory.map((record) => (
                    <div className="history-item" key={record.id}>
                      <div
                        className={`history-icon ${historyIconConfig[record.type].className}`}
                      >
                        {historyIconConfig[record.type].icon}
                      </div>
                      <div className="history-content">
                        <div className="history-text">{record.description}</div>
                        <div className="history-user">{record.user}</div>
                        <div className="history-time">{formatTime(record.timestamp)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-text">暂无操作记录</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalLineIndex !== null && (
        <CommentModal
          lineInfo={lineInfoText}
          onClose={() => setModalLineIndex(null)}
          onSubmit={(content) => {
            handleAddComment(modalLineIndex, content);
            setModalLineIndex(null);
          }}
        />
      )}
    </div>
  );
};

export default ContractEditor;
