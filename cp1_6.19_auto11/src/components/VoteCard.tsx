import { useNavigate } from 'react-router-dom';
import { VoteData } from '@/types';

interface VoteCardProps {
  vote: VoteData;
}

export function VoteCard({ vote }: VoteCardProps) {
  const navigate = useNavigate();
  const isActive = vote.status === 'active';
  const createdDate = new Date(vote.createdAt);
  const timeStr = `${createdDate.getMonth() + 1}/${createdDate.getDate()} ${String(createdDate.getHours()).padStart(2, '0')}:${String(createdDate.getMinutes()).padStart(2, '0')}`;

  return (
    <div
      className="vote-card-item"
      onClick={() => navigate(`/vote/${vote.roomId}`)}
      style={{
        ...cardStyle,
        animation: `fadeIn 0.4s ease-out ${Math.random() * 0.1}s both`,
      }}
    >
      <div style={headerRowStyle}>
        <span style={{ ...statusBadgeStyle, ...(isActive ? activeBadge : endedBadge) }}>
          {isActive ? '● 进行中' : '● 已结束'}
        </span>
        <span style={timeStyle}>{timeStr}</span>
      </div>

      <h3 style={titleStyle}>{vote.title}</h3>

      <div style={metaRowStyle}>
        <div style={metaItemStyle}>
          <span style={metaLabelStyle}>房间ID</span>
          <span style={roomIdStyle}>{vote.roomId}</span>
        </div>
      </div>

      <div style={statsRowStyle}>
        <div style={statStyle}>
          <span style={statValueStyle}>{vote.options.length}</span>
          <span style={statLabelStyle}>选项</span>
        </div>
        <div style={statDividerStyle} />
        <div style={statStyle}>
          <span style={statValueStyle}>{vote.totalVotes}</span>
          <span style={statLabelStyle}>参与</span>
        </div>
        <div style={statDividerStyle} />
        <div style={statStyle}>
          <span style={{ ...statValueStyle, color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}>
            {isActive ? `${vote.remainingTime}s` : '0s'}
          </span>
          <span style={statLabelStyle}>剩余</span>
        </div>
      </div>

      {isActive && (
        <div style={progressContainerStyle}>
          <div
            style={{
              ...progressBarStyle,
              width: `${Math.max(0, (vote.remainingTime / vote.duration) * 100)}%`,
              transition: 'width 1s linear',
            }}
          />
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius)',
  padding: '20px',
  boxShadow: 'var(--shadow)',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  transition: 'all 0.2s ease',
  border: '1px solid transparent',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const statusBadgeStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '20px',
  fontSize: '11px',
  fontWeight: 600,
};

const activeBadge: React.CSSProperties = {
  background: 'rgba(74, 222, 128, 0.15)',
  color: '#4ade80',
  animation: 'pulse 2s ease-in-out infinite',
};

const endedBadge: React.CSSProperties = {
  background: 'rgba(156, 163, 175, 0.15)',
  color: '#9ca3af',
};

const timeStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-muted)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: 'var(--text-primary)',
  lineHeight: 1.4,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const metaItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const metaLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const roomIdStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: 'var(--accent)',
  fontFamily: 'monospace',
  letterSpacing: '1px',
};

const statsRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: '8px',
  padding: '10px',
};

const statStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
};

const statValueStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const statDividerStyle: React.CSSProperties = {
  width: '1px',
  height: '24px',
  background: 'var(--border-color)',
};

const progressContainerStyle: React.CSSProperties = {
  height: '4px',
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '2px',
  overflow: 'hidden',
};

const progressBarStyle: React.CSSProperties = {
  height: '100%',
  background: 'var(--accent-gradient)',
  borderRadius: '2px',
};
