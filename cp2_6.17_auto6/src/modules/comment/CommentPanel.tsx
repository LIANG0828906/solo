import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import Comment from './Comment';

interface CommentPanelProps {
  socket: Socket;
  isOpen: boolean;
  onToggle: () => void;
}

const CommentPanel: React.FC<CommentPanelProps> = ({ socket, isOpen, onToggle }) => {
  const comments = useStore((s) => s.comments);
  const addComment = useStore((s) => s.addComment);
  const addReply = useStore((s) => s.addReply);
  const selectedLine = useStore((s) => s.selectedLine);
  const setSelectedLine = useStore((s) => s.setSelectedLine);
  const setHighlightedLine = useStore((s) => s.setHighlightedLine);
  const currentUser = useStore((s) => s.currentUser);
  const document = useStore((s) => s.document);

  const [showModal, setShowModal] = useState(false);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (selectedLine !== null) {
      setShowModal(true);
    }
  }, [selectedLine]);

  useEffect(() => {
    if (!socket) return;

    const handleCommentBroadcast = (data: any) => {
      addComment(data);
    };

    const handleCommentReplyBroadcast = (data: { commentId: string; reply: any }) => {
      addReply(data.commentId, data.reply);
    };

    socket.on('comment-broadcast', handleCommentBroadcast);
    socket.on('comment-reply-broadcast', handleCommentReplyBroadcast);

    return () => {
      socket.off('comment-broadcast', handleCommentBroadcast);
      socket.off('comment-reply-broadcast', handleCommentReplyBroadcast);
    };
  }, [socket, addComment, addReply]);

  const handleSubmitComment = () => {
    if (!commentText.trim() || selectedLine === null || !currentUser) return;

    const newComment = {
      id: uuidv4(),
      userId: currentUser.id,
      userName: currentUser.name,
      userColor: currentUser.color,
      lineNumber: selectedLine,
      content: commentText.trim(),
      timestamp: Date.now(),
      replies: [],
    };

    socket.emit('comment-add', newComment);
    setCommentText('');
    setShowModal(false);
    setSelectedLine(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLine(null);
    setCommentText('');
  };

  const handleJumpToLine = (lineNumber: number) => {
    setHighlightedLine(lineNumber);
  };

  const sortedComments = [...comments].sort((a, b) => b.timestamp - a.timestamp);

  const lineText = selectedLine !== null
    ? document.split('\n')[selectedLine]?.trim() || ''
    : '';

  if (!isOpen) {
    return (
      <div className="comment-panel collapsed">
        <div className="collapsed-panel">
          <div className="collapsed-icon" onClick={onToggle} title="Comments">
            💬
            {comments.length > 0 && (
              <span className="comment-badge">{comments.length}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="comment-panel">
      <div className="comment-panel-header">
        <span className="comment-panel-title">
          Comments ({comments.length})
        </span>
        <button className="panel-toggle-btn" onClick={onToggle} title="Collapse">
          ×
        </button>
      </div>

      <div className="comment-list">
        {sortedComments.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 40,
              color: '#858585',
              fontSize: 13,
            }}
          >
            No comments yet. Click the + button on a line number to add one.
          </div>
          ) : (
            sortedComments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                socket={socket}
                onJumpToLine={handleJumpToLine}
              />
            ))
          )}
      </div>

      {showModal && (
        <>
          <div className="modal-overlay" onClick={handleCloseModal} />
          <div className="add-comment-modal">
            <h3 className="modal-title">
              Add comment to Line {selectedLine !== null ? selectedLine + 1 : ''}
            </h3>
            {selectedLine !== null && (
              <div
                style={{
                  background: '#1E1E1E',
                  padding: '8px 12px',
                  borderRadius: 4,
                  marginBottom: 12,
                  fontFamily: 'Fira Code, monospace',
                  fontSize: 12,
                  color: '#CE9178',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {lineText || '(empty line)'}
              </div>
            )}
            <textarea
              className="comment-textarea"
              placeholder="Add your comment... Use @ to mention someone"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handleCloseModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmitComment}>
                Add Comment
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CommentPanel;
