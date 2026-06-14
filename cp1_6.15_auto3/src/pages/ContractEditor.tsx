import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as Diff from 'diff';
import {
  getContract,
  addComment as apiAddComment,
  approveContract as apiApproveContract,
  ContractData,
  Comment,
  HistoryRecord,
  ApprovalStatus,
} from '../api/contractApi';

interface DiffLine {
  type: 'equal' | 'added' | 'removed';
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
  lineIndex: number;
}

const statusConfig: Record<ApprovalStatus, { label: string; className: string }> = {
  pending: { label: '待审', className: 'status-pending' },
  reviewing: { label: '审批中', className: 'status-reviewing' },
  approved: { label: '已通过', className: 'status-approved' },
  rejected: { label: '驳回', className: 'status-rejected' },
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
        <div className="comment-avatar">{getInitial(comment.author)}</div>
        <div className="comment-user-info">
          <div className="comment-user-name">{comment.author}</div>
          <div className="comment-time">{formatTime(comment.timestamp)}</div>
        </div>
      </div>
      <div className="comment-text">{comment.content}</div>
      {depth < 2 && (
        <div className="comment-actions">
          <button
            className="btn btn-secondary btn-small"
            onClick={() => setShowReplyInput(!showReplyInput)}
          >
            回复
          </button>
        </div>
      )}
      {showReplyInput && (
        <div className="reply-input-wrapper">
          <textarea
            className="reply-input"
            placeholder="输入回复内容..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={2}
          />
          <button className="btn btn-primary btn-small" onClick={handleSubmitReply}>
            发送
          </button>
        </div>
      )}
      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <CommentBubble key={reply.id} comment={reply} onReply={onReply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentModal: React.FC<{
  onClose: () => void;
  onSubmit: (content: string) => void;
  lineIndex: number;
}> = ({ onClose, onSubmit }) => {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content.trim());
      onClose();
    }
  };

  return (
    <div className="comment-modal-overlay" onClick={onClose}>
      <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
        <h3>添加批注</h3>
        <textarea
          placeholder="请输入批注内容..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus
        />
        <div className="comment-modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            提交
          </button>
        </div>
      </div>
    </div>
  );
};

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

  useEffect(() => {
    loadContract();
  }, []);

  const loadContract = async () => {
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

  const diffBlocks = useMemo(() => {
    const blocks: { start: number; end: number; isDiff: boolean }[] = [];
    if (diffLines.length === 0) return blocks;

    let currentStart = 0;
    let currentIsDiff = diffLines[0].type !== 'equal';

    for (let i = 1; i < diffLines.length; i++) {
      const isDiff = diffLines[i].type !== 'equal';
      if (isDiff !== currentIsDiff) {
        blocks.push({ start: currentStart, end: i - 1, isDiff: currentIsDiff });
        currentStart = i;
        currentIsDiff = isDiff;
      }
    }
    blocks.push({ start: currentStart, end: diffLines.length - 1, isDiff: currentIsDiff });

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
      setComments((prev) => [...prev, comment]);
      const record: HistoryRecord = {
        id: `hist-${Date.now()}`,
        type: 'comment',
        description: `添加了批注：${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`,
        user: CURRENT_USER,
        timestamp: Date.now(),
      };
      setHistory((prev) => [record, ...prev]);
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
        replyToId: commentId,
      });

      const addReplyToTree = (list: Comment[]): Comment[] => {
        return list.map((c) => {
          if (c.id === commentId) {
            return { ...c, replies: [...(c.replies || []), reply] };
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: addReplyToTree(c.replies) };
          }
          return c;
        });
      };

      setComments((prev) => addReplyToTree(prev));
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
      setApprovalStatus(response.status);
      setHistory(response.history);
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
        action: approvalStatus === 'approved' ? 'approve' : 'reject',
        user: CURRENT_USER,
        oldContent,
        newContent,
      });
      setApprovalStatus('reviewing');
      setHistory(response.history);
      const record: HistoryRecord = {
        id: `hist-${Date.now()}`,
        type: 'version',
        description: '上传了新的合同版本并进行对比',
        user: CURRENT_USER,
        timestamp: Date.now(),
      };
      setHistory((prev) => [record, ...prev]);
    } catch (error) {
      console.error('Failed to upload version:', error);
    } finally {
      setActionLoading(false);
    }
  };

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
        <h1>合同条款协作审批系统</h1>
      </div>

      <div className="main-content">
        <div className="left-panel">
          <div className="panel-card">
            <div className="panel-header">
              <h2>合同版本对比</h2>
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
                <div className="upload-row" style={{ justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleUploadVersion}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <span className="loading-spinner" /> : null}
                    生成对比
                  </button>
                </div>
              </div>

              {diffLines.length > 0 ? (
                <div className="diff-container">
                  <div className="diff-header">
                    <div className="diff-header-cell" style={{ width: 100, flex: 'none' }}>
                      行号
                    </div>
                    <div className="diff-header-cell">旧版本</div>
                    <div className="diff-header-cell" style={{ width: 100, flex: 'none' }}>
                      行号
                    </div>
                    <div className="diff-header-cell">新版本</div>
                  </div>
                  <div className="diff-content">
                    {diffBlocks.map((block, blockIndex) => (
                      <div key={blockIndex} className="diff-block-wrapper">
                        {block.isDiff && (
                          <div style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', background: '#edf2f7', borderBottom: '1px solid #e2e8f0' }}>
                            <button
                              className="collapse-toggle"
                              onClick={() => toggleBlockCollapse(blockIndex)}
                              title={collapsedBlocks.has(blockIndex) ? '展开' : '折叠'}
                            >
                              <span className={`collapse-arrow ${collapsedBlocks.has(blockIndex) ? 'collapsed' : ''}`}>
                                ▼
                              </span>
                            </button>
                            <span style={{ fontSize: 12, color: '#4a5568', fontWeight: 500, marginLeft: 8 }}>
                              {block.isDiff ? '差异块' : '相同内容'}（第 {block.start + 1} - {block.end + 1} 行）
                            </span>
                          </div>
                        )}
                        {!collapsedBlocks.has(blockIndex) &&
                          diffLines.slice(block.start, block.end + 1).map((line) => {
                            const lineComments = getCommentsForLine(line.lineIndex);
                            return (
                              <div
                                key={line.lineIndex}
                                className={`diff-row ${line.type === 'added' ? 'diff-line-add' : line.type === 'removed' ? 'diff-line-delete' : ''}`}
                              >
                                <div className="diff-line-number">
                                  {line.oldLineNumber ?? ''}
                                </div>
                                <div className="diff-line-content">
                                  {line.type === 'removed' ? line.content : ''}
                                </div>
                                <div className="diff-line-number">
                                  {line.newLineNumber ?? ''}
                                </div>
                                <div className="diff-line-content">
                                  {line.type === 'added' ? line.content : line.type === 'equal' ? line.content : ''}
                                </div>
                                <button
                                  className="add-comment-btn"
                                  onClick={() => setModalLineIndex(line.lineIndex)}
                                  title="添加批注"
                                >
                                  +
                                </button>
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
              <h2>审批状态</h2>
            </div>
            <div className="panel-body">
              <div className="status-section">
                <div className="status-display">
                  <span className="status-label">当前状态：</span>
                  <span className={`status-badge ${statusConfig[approvalStatus].className}`}>
                    {statusConfig[approvalStatus].label}
                  </span>
                </div>
                <div className="action-buttons">
                  <button
                    className="btn btn-success"
                    onClick={() => handleApproveAction('approve')}
                    disabled={actionLoading || approvalStatus === 'approved'}
                  >
                    {actionLoading ? <span className="loading-spinner" /> : '✓ 通过'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleApproveAction('reject')}
                    disabled={actionLoading || approvalStatus === 'rejected'}
                  >
                    {actionLoading ? <span className="loading-spinner" /> : '✕ 驳回'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-card">
            <div className="panel-header">
              <h2>历史记录</h2>
            </div>
            <div className="panel-body">
              {history.length > 0 ? (
                <div className="history-list">
                  {history.map((record) => (
                    <div className="history-item" key={record.id}>
                      <div className={`history-icon ${historyIconConfig[record.type].className}`}>
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
          lineIndex={modalLineIndex}
          onClose={() => setModalLineIndex(null)}
          onSubmit={(content) => handleAddComment(modalLineIndex, content)}
        />
      )}
    </div>
  );
};

export default ContractEditor;
