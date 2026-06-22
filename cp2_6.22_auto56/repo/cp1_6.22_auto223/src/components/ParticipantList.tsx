import { QrCode } from 'lucide-react';
import type { Participant } from '@/types';

interface ParticipantListProps {
  participants: Participant[];
  onCheckIn?: (participantId: string) => void;
  showActions?: boolean;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  onCheckIn,
  showActions = false,
}) => {
  const getInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  if (participants.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">👥</div>
        <h3 className="empty-state-title">暂无参与者</h3>
        <p className="empty-state-text">还没有人报名此活动</p>
      </div>
    );
  }

  const registeredCount = participants.filter(p => p.checkInStatus === 'registered').length;
  const checkedInCount = participants.filter(p => p.checkInStatus === 'checked-in').length;

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span className="tag tag-registered">已报名 {registeredCount} 人</span>
        <span className="tag tag-checked">已签到 {checkedInCount} 人</span>
      </div>
      <div className="participant-list">
        {participants.map(participant => (
          <div key={participant.id} className="participant-item">
            <div className="participant-info">
              <div className="avatar">{getInitial(participant.name)}</div>
              <div>
                <div className="participant-name">{participant.name}</div>
                <div className="participant-email">{participant.email}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={`tag tag-${participant.checkInStatus}`}>
                {participant.checkInStatus === 'checked-in' ? '已签到' : '未签到'}
              </span>
              {showActions && participant.checkInStatus === 'registered' && (
                <button
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: 12 }}
                  onClick={() => onCheckIn?.(participant.id)}
                >
                  <QrCode size={14} />
                  扫码签到
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
