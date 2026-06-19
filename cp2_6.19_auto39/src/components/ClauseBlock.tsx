import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useContractStore } from '../store/useContractStore';
import type { Clause, Revision } from '../types';
import './ClauseBlock.css';

interface ClauseBlockProps {
  clause: Clause;
}

const ClauseBlock = memo(function ClauseBlock({ clause }: ClauseBlockProps) {
  const {
    comments,
    revisions,
    currentRole,
    highlightedClauseId,
    addComment,
    addRevision,
    acceptRevision,
    rejectRevision,
    setHighlightedClause,
  } = useContractStore();

  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(clause.content);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLDivElement>(null);

  const clauseComments = comments.filter((c) => c.clauseId === clause.id);
  const unresolvedCount = clauseComments.filter(
    (c) => c.status === 'unresolved'
  ).length;
  const resolvedCount = clauseComments.filter(
    (c) => c.status === 'resolved'
  ).length;

  const pendingRevisions = revisions.filter(
    (r) => r.clauseId === clause.id && r.status === 'pending'
  );
  const acceptedRevisions = revisions.filter(
    (r) => r.clauseId === clause.id && r.status === 'accepted'
  );

  useEffect(() => {
    if (highlightedClauseId === clause.id && blockRef.current) {
      blockRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsHighlighted(true);
      const timer = setTimeout(() => {
        setIsHighlighted(false);
        setHighlightedClause(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedClauseId, clause.id, setHighlightedClause]);

  useEffect(() => {
    if (showCommentInput && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [showCommentInput]);

  const handleCommentIconClick = () => {
    setShowCommentInput(!showCommentInput);
  };

  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      addComment(clause.id, commentText.trim());
      setCommentText('');
      setShowCommentInput(false);
    }
  };

  const handleTextClick = () => {
    if (currentRole === 'receiver' && !isEditing) {
      setIsEditing(true);
      setEditContent(clause.content);
      setTimeout(() => {
        if (editRef.current) {
          editRef.current.focus();
        }
      }, 0);
    }
  };

  const handleSaveEdit = useCallback(() => {
    if (editContent.trim() && editContent !== clause.content) {
      addRevision(clause.id, clause.content, editContent.trim());
    }
    setIsEditing(false);
  }, [clause.id, clause.content, editContent, addRevision]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing && e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSaveEdit();
      }
      if (isEditing && e.key === 'Escape') {
        setIsEditing(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, handleSaveEdit]);

  const statusDot =
    unresolvedCount > 0
      ? 'dot-unresolved'
      : resolvedCount > 0
      ? 'dot-resolved'
      : '';

  return (
    <div
      ref={blockRef}
      className={`clause-block ${isHighlighted ? 'highlighted' : ''}`}
    >
      <div className={`status-dot ${statusDot}`} />

      <div className="clause-header">
        <div className="clause-title">
          <span className="clause-number">第{clause.clauseNumber}条</span>
          <span className="clause-name">{clause.title}</span>
        </div>
        <button
          className="comment-icon-btn"
          onClick={handleCommentIconClick}
          title="添加批注"
        >
          <svg viewBox="0 0 24 24" fill="none" className="comment-icon">
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {clauseComments.length > 0 && (
            <span className="comment-count">{clauseComments.length}</span>
          )}
        </button>
      </div>

      {showCommentInput && (
        <div className="comment-input-wrapper">
          <textarea
            ref={commentInputRef}
            className="comment-input"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="请输入您的批注或修改建议..."
            rows={3}
          />
          <div className="comment-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleCommentSubmit}
              disabled={!commentText.trim()}
            >
              提交批注
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowCommentInput(false)}
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div
        className={`clause-content ${isEditing ? 'editing' : ''} ${
          currentRole === 'receiver' ? 'clickable' : ''
        }`}
        onClick={handleTextClick}
      >
        {isEditing ? (
          <div
            ref={editRef}
            className="editable-content"
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setEditContent(e.currentTarget.textContent || '')}
            onBlur={handleSaveEdit}
          >
            {editContent}
          </div>
        ) : (
          <p>{clause.content}</p>
        )}
      </div>

      {isEditing && (
        <div className="edit-actions">
          <button className="btn btn-primary btn-sm" onClick={handleSaveEdit}>
            保存 (Ctrl+S)
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsEditing(false)}
          >
            取消 (Esc)
          </button>
        </div>
      )}

      {pendingRevisions.length > 0 && (
        <div className="revisions-section">
          <h4 className="revisions-title">待处理修订</h4>
          {pendingRevisions.map((revision) => (
            <RevisionCard
              key={revision.id}
              revision={revision}
              canAccept={currentRole === 'initiator'}
              onAccept={() => acceptRevision(revision.id)}
              onReject={() => rejectRevision(revision.id)}
            />
          ))}
        </div>
      )}

      {acceptedRevisions.length > 0 && (
        <div className="revisions-section">
          <h4 className="revisions-title">已接受修订</h4>
          {acceptedRevisions.map((revision) => (
            <RevisionCard
              key={revision.id}
              revision={revision}
              canAccept={false}
            />
          ))}
        </div>
      )}
    </div>
  );
});

interface RevisionCardProps {
  revision: Revision;
  canAccept: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

function RevisionCard({
  revision,
  canAccept,
  onAccept,
  onReject,
}: RevisionCardProps) {
  return (
    <div className={`revision-card status-${revision.status}`}>
      <div className="revision-header">
        <span className="revision-status">
          {revision.status === 'pending'
            ? '待审核'
            : revision.status === 'accepted'
            ? '已接受'
            : '已拒绝'}
        </span>
        <span className="revision-time">
          {new Date(revision.createdAt).toLocaleString('zh-CN')}
        </span>
      </div>
      <div className="revision-compare">
        <div className="revision-before">
          <span className="revision-label">修改前</span>
          <p>{revision.beforeContent}</p>
        </div>
        <div className="revision-after">
          <span className="revision-label">修改后</span>
          <p>{revision.afterContent}</p>
        </div>
      </div>
      {canAccept && revision.status === 'pending' && (
        <div className="revision-actions">
          <button className="btn btn-success btn-sm" onClick={onAccept}>
            接受
          </button>
          <button className="btn btn-danger btn-sm" onClick={onReject}>
            拒绝
          </button>
        </div>
      )}
    </div>
  );
}

export default ClauseBlock;
