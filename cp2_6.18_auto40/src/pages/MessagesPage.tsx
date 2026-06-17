import { useCallback } from 'react';
import { MessageList } from '@/components/MessageList';
import { useStore } from '@/store/useStore';

export function MessagesPage() {
  const {
    currentUser,
    messages,
    acceptInvite,
    rejectInvite,
    markAllMessagesRead,
  } = useStore();

  const userMessages = messages.filter((m) => m.toUserId === currentUser.id);

  const handleAccept = useCallback(
    (inviteId: string) => {
      acceptInvite(inviteId);
    },
    [acceptInvite]
  );

  const handleReject = useCallback(
    (inviteId: string) => {
      rejectInvite(inviteId);
    },
    [rejectInvite]
  );

  return (
    <div className="page">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h1 className="page-title" style={{ margin: 0 }}>
          消息中心
        </h1>
        <button
          className="btn btn-secondary"
          onClick={markAllMessagesRead}
          style={{ fontSize: 13, padding: '8px 16px' }}
        >
          全部标为已读
        </button>
      </div>

      <MessageList
        messages={userMessages}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    </div>
  );
}
