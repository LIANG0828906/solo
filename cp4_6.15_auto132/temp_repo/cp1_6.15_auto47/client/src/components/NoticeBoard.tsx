import { useState } from 'react';
import type { Notice, Comment } from '../types';

interface NoticeBoardProps {
  notices: Notice[];
  currentUser: string;
  onLike: (noticeId: string) => Promise<void>;
  onAddComment: (noticeId: string, content: string) => Promise<void>;
}

const priorityStyles: Record<Notice['priority'], React.CSSProperties> = {
  high: {
    border: '2px solid #E53935',
    animation: 'pulse 2s infinite',
  },
  medium: {
    border: '2px solid #FF9800',
  },
  low: {
    border: '1px solid #e0e0e0',
  },
};

const priorityLabels: Record<Notice['priority'], { text: string; color: string; bg: string }> = {
  high: { text: '紧急', color: '#fff', bg: '#E53935' },
  medium: { text: '一般', color: '#fff', bg: '#FF9800' },
  low: { text: '普通', color: '#666', bg: '#f0f0f0' },
};

export default function NoticeBoard({ notices, currentUser, onLike, onAddComment }: NoticeBoardProps) {
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);

  const toggleComments = (noticeId: string) => {
    setExpandedNoticeId((prev) => (prev === noticeId ? null : noticeId));
    setCommentInputs((prev) => ({ ...prev, [noticeId]: '' }));
  };

  const handleLike = async (noticeId: string) => {
    await onLike(noticeId);
  };

  const handleSubmitComment = async (noticeId: string) => {
    const content = commentInputs[noticeId]?.trim();
    if (!content) return;
    setSubmittingComment(noticeId);
    await onAddComment(noticeId, content);
    setCommentInputs((prev) => ({ ...prev, [noticeId]: '' }));
    setSubmittingComment(null);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📢 社区公告板</h2>
      </div>

      {notices.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
          <div style={{ color: '#999' }}>暂无公告</div>
        </div>
      ) : (
        <div style={styles.grid}>
          {notices.map((notice) => {
            const isExpanded = expandedNoticeId === notice.id;
            const liked = notice.likedBy.includes(currentUser);
            const pLabel = priorityLabels[notice.priority];

            return (
              <div
                key={notice.id}
                style={{
                  ...styles.card,
                  ...priorityStyles[notice.priority],
                }}
              >
                <div style={styles.cardHeader}>
                  <span
                    style={{
                      ...styles.priorityTag,
                      backgroundColor: pLabel.bg,
                      color: pLabel.color,
                    }}
                  >
                    {pLabel.text}
                  </span>
                  <span style={styles.date}>{notice.createdAt}</span>
                </div>

                <h3 style={styles.cardTitle}>{notice.title}</h3>

                <p style={styles.cardContent}>{notice.content}</p>

                <div style={styles.cardAuthor}>
                  <span style={styles.authorAvatar}>
                    {notice.author.charAt(0).toUpperCase()}
                  </span>
                  <span style={styles.authorName}>{notice.author}</span>
                </div>

                <div style={styles.cardActions}>
                  <button
                    onClick={() => handleLike(notice.id)}
                    style={{
                      ...styles.actionBtn,
                      color: liked ? '#E53935' : '#666',
                    }}
                  >
                    {liked ? '❤️' : '🤍'} {notice.likes}
                  </button>
                  <button
                    onClick={() => toggleComments(notice.id)}
                    style={{
                      ...styles.actionBtn,
                      color: isExpanded ? 'var(--primary-green)' : '#666',
                    }}
                  >
                    💬 {notice.comments.length}
                  </button>
                </div>

                {isExpanded && (
                  <div style={styles.commentsSection}>
                    <div style={styles.commentsList}>
                      {notice.comments.length === 0 ? (
                        <div style={styles.noComments}>暂无评论，快来抢沙发~</div>
                      ) : (
                        notice.comments.map((comment: Comment) => (
                          <div
                            key={comment.id}
                            style={{
                              ...styles.commentBubble,
                              animation: 'bubbleIn 0.3s ease',
                            }}
                          >
                            <div style={styles.commentHeader}>
                              <span style={styles.commentAuthor}>
                                {comment.author}
                              </span>
                              <span style={styles.commentDate}>
                                {comment.createdAt}
                              </span>
                            </div>
                            <div style={styles.commentContent}>{comment.content}</div>
                          </div>
                        ))
                      )}
                    </div>

                    <div style={styles.commentInputWrap}>
                      <input
                        type="text"
                        value={commentInputs[notice.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [notice.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !submittingComment) {
                            handleSubmitComment(notice.id);
                          }
                        }}
                        placeholder="发表评论..."
                        style={styles.commentInput}
                        disabled={submittingComment === notice.id}
                      />
                      <button
                        onClick={() => handleSubmitComment(notice.id)}
                        style={styles.sendBtn}
                        disabled={
                          submittingComment === notice.id ||
                          !commentInputs[notice.id]?.trim()
                        }
                      >
                        发送
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    backgroundColor: '#fff',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--shadow)',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '22px',
    color: '#333',
    margin: 0,
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    transition: 'var(--transition)',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  priorityTag: {
    fontSize: '12px',
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: '4px',
  },
  date: {
    fontSize: '12px',
    color: '#999',
  },
  cardTitle: {
    fontSize: '17px',
    fontWeight: 600,
    color: '#333',
    margin: '0 0 10px 0',
    lineHeight: 1.4,
  },
  cardContent: {
    fontSize: '14px',
    color: '#555',
    lineHeight: 1.7,
    margin: '0 0 16px 0',
    flex: 1,
  },
  cardAuthor: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '14px',
  },
  authorAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-green)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 600,
  },
  authorName: {
    fontSize: '13px',
    color: '#666',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0',
  },
  actionBtn: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#fafafa',
    borderRadius: '6px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'var(--transition)',
  },
  commentsSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #f0f0f0',
    animation: 'fadeIn 0.3s ease',
  },
  commentsList: {
    maxHeight: '240px',
    overflowY: 'auto',
    marginBottom: '12px',
    paddingRight: '4px',
  },
  noComments: {
    textAlign: 'center',
    padding: '16px',
    color: '#bbb',
    fontSize: '13px',
  },
  commentBubble: {
    backgroundColor: '#F8F6F1',
    borderRadius: '10px',
    padding: '10px 12px',
    marginBottom: '10px',
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  commentAuthor: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--primary-green-dark)',
  },
  commentDate: {
    fontSize: '11px',
    color: '#bbb',
  },
  commentContent: {
    fontSize: '13px',
    color: '#444',
    lineHeight: 1.5,
  },
  commentInputWrap: {
    display: 'flex',
    gap: '8px',
  },
  commentInput: {
    flex: 1,
    padding: '9px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '13px',
    backgroundColor: '#fafafa',
  },
  sendBtn: {
    padding: '0 16px',
    backgroundColor: 'var(--primary-green)',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
  },
};
