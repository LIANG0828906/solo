import { useState, useMemo, useCallback } from 'react';
import Icon from '@mdi/react';
import { mdiCheck, mdiClose, mdiInbox } from '@mdi/js';
import type { Message } from '@/types';
import { useStore, useUnreadCount } from '@/store/useStore';
import { formatRelativeTime } from '@/utils/time';

interface MessageListProps {
  messages: Message[];
  onAccept?: (inviteId: string) => void;
  onReject?: (inviteId: string) => void;
}

const PAGE_SIZE = 10;
const MAX_MESSAGES = 30;

const TYPE_LABELS: Record<Message['type'], string> = {
  invite: '交换邀请',
  accept: '已接受',
  reject: '已拒绝',
  system: '系统通知',
};

export function MessageList({ messages, onAccept, onReject }: MessageListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const markMessageRead = useStore((state) => state.markMessageRead);
  const unreadCount = useUnreadCount();

  const sortedMessages = useMemo(
    () =>
      [...messages]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, MAX_MESSAGES),
    [messages]
  );

  const totalPages = Math.ceil(sortedMessages.length / PAGE_SIZE);
  const paginatedMessages = useMemo(
    () =>
      sortedMessages.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [sortedMessages, currentPage]
  );

  const handleMessageClick = useCallback(
    (message: Message) => {
      if (!message.isRead) {
        markMessageRead(message.id);
      }
    },
    [markMessageRead]
  );

  const handleAccept = useCallback(
    (e: React.MouseEvent, message: Message) => {
      e.stopPropagation();
      if (message.relatedInviteId) {
        onAccept?.(message.relatedInviteId);
      }
      markMessageRead(message.id);
    },
    [onAccept, markMessageRead]
  );

  const handleReject = useCallback(
    (e: React.MouseEvent, message: Message) => {
      e.stopPropagation();
      if (message.relatedInviteId) {
        onReject?.(message.relatedInviteId);
      }
      markMessageRead(message.id);
    },
    [onReject, markMessageRead]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  if (sortedMessages.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <Icon path={mdiInbox} size={2} />
        </div>
        <div className="empty-state-text">暂无消息</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
          共 {sortedMessages.length} 条消息，{unreadCount} 条未读
        </span>
      </div>

      <div className="message-list">
        {paginatedMessages.map((message) => (
          <div
            key={message.id}
            className={`message-card ${message.type} ${message.isRead ? '' : 'unread'}`}
            onClick={() => handleMessageClick(message)}
          >
            <div className="message-content">
              <div className="message-title">
                {message.title}
                <span className={`message-type-badge ${message.type}`}>
                  {TYPE_LABELS[message.type]}
                </span>
                {!message.isRead && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--color-primary)',
                      marginLeft: 'auto',
                    }}
                  />
                )}
              </div>
              <div className="message-body">{message.content}</div>
              <div className="message-meta">
                <span>{formatRelativeTime(message.createdAt)}</span>
              </div>
            </div>

            {message.type === 'invite' && message.relatedInviteId && (
              <div className="message-actions">
                <button
                  className="icon-btn"
                  style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)' }}
                  onClick={(e) => handleAccept(e, message)}
                  title="接受"
                >
                  <Icon path={mdiCheck} size={0.8} />
                </button>
                <button
                  className="icon-btn danger"
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)' }}
                  onClick={(e) => handleReject(e, message)}
                  title="拒绝"
                >
                  <Icon path={mdiClose} size={0.8} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            上一页
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`page-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
          <button
            className="page-btn"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
