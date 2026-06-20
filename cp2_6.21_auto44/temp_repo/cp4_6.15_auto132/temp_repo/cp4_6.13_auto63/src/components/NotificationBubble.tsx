import React, { useEffect, useState } from 'react';

export interface BorrowRequest {
  id: string;
  requesterName: string;
  requesterAvatar?: string;
  duration: number;
  reason: string;
  bookTitle: string;
  requestedAt: string;
}

interface NotificationBubbleProps {
  request: BorrowRequest;
  onApprove: (request: BorrowRequest) => void;
  onReject: (request: BorrowRequest) => void;
}

const NotificationBubble: React.FC<NotificationBubbleProps> = ({ request, onApprove, onReject }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const bubbleStyle: React.CSSProperties = {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    width: 320,
    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.2)',
    border: '1px solid #BFDBFE',
    transform: mounted ? 'scale(1)' : 'scale(0.8)',
    opacity: mounted ? 1 : 0,
    transition: 'transform 0.2s cubic-bezier(0.68,-0.55,0.27,1.55), opacity 0.2s cubic-bezier(0.68,-0.55,0.27,1.55)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  };

  const avatarStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: '#93C5FD',
    color: '#1E40AF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 600,
    flexShrink: 0,
    overflow: 'hidden',
  };

  const avatarImgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const headerInfoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const requesterNameStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: '#1E3A8A',
    margin: 0,
  };

  const bookTitleStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#3B82F6',
    margin: 0,
    marginTop: 2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const bodyStyle: React.CSSProperties = {
    marginBottom: 14,
  };

  const infoRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    fontSize: 13,
  };

  const labelStyle: React.CSSProperties = {
    color: '#64748B',
  };

  const valueStyle: React.CSSProperties = {
    color: '#1E3A8A',
    fontWeight: 500,
  };

  const reasonBoxStyle: React.CSSProperties = {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#334155',
    lineHeight: 1.5,
    border: '1px solid #BFDBFE',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: 10,
  };

  const baseBtnStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px 0',
    borderRadius: 8,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.15s ease, background-color 0.15s ease',
  };

  const approveBtnStyle: React.CSSProperties = {
    ...baseBtnStyle,
    backgroundColor: '#22C55E',
    color: '#FFFFFF',
  };

  const rejectBtnStyle: React.CSSProperties = {
    ...baseBtnStyle,
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    border: '1px solid #FECACA',
  };

  return (
    <div style={bubbleStyle}>
      <div style={headerStyle}>
        <div style={avatarStyle}>
          {request.requesterAvatar ? (
            <img src={request.requesterAvatar} alt={request.requesterName} style={avatarImgStyle} />
          ) : (
            request.requesterName.charAt(0)
          )}
        </div>
        <div style={headerInfoStyle}>
          <p style={requesterNameStyle}>{request.requesterName}</p>
          <p style={bookTitleStyle} title={request.bookTitle}>《{request.bookTitle}》</p>
        </div>
      </div>

      <div style={bodyStyle}>
        <div style={infoRowStyle}>
          <span style={labelStyle}>借阅时长</span>
          <span style={valueStyle}>{request.duration} 天</span>
        </div>
        <div style={reasonBoxStyle}>
          <div style={{ ...labelStyle, fontSize: 12, marginBottom: 4 }}>借阅理由</div>
          <div>{request.reason || '（未填写理由）'}</div>
        </div>
      </div>

      <div style={actionsStyle}>
        <button
          style={rejectBtnStyle}
          onClick={() => onReject(request)}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          拒绝
        </button>
        <button
          style={approveBtnStyle}
          onClick={() => onApprove(request)}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          同意
        </button>
      </div>
    </div>
  );
};

export default NotificationBubble;
