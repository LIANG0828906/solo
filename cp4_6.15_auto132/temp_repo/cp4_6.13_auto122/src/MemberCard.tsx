import React, { useMemo, useState } from 'react';

export type MemberStatus = 'working' | 'resting' | 'away';

export interface Member {
  userId: string;
  nickname: string;
  status: MemberStatus;
}

interface MemberCardProps {
  member: Member;
  isSelf: boolean;
  onStatusChange?: (status: MemberStatus) => void;
}

const STATUS_LABELS: Record<MemberStatus, string> = {
  working: '工作中',
  resting: '休息中',
  away: '离开中',
};

function hashNicknameToColor(nickname: string): string {
  const palette = [
    '#48bb78', '#38b2ac', '#4299e1', '#667eea',
    '#9f7aea', '#b794f4', '#ed64a6', '#f56565',
    '#ed8936', '#ecc94b', '#68d391', '#4fd1c5',
    '#63b3ed', '#7f9cf5', '#b794f4', '#f687b3',
  ];
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = (hash * 31 + nickname.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
}

const MemberCard: React.FC<MemberCardProps> = ({ member, isSelf, onStatusChange }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const avatarColor = useMemo(() => hashNicknameToColor(member.nickname), [member.nickname]);
  const initial = useMemo(() => {
    const name = member.nickname.trim();
    return name ? name.charAt(0).toUpperCase() : '?';
  }, [member.nickname]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as MemberStatus;
    onStatusChange?.(value);
    setDropdownOpen(false);
  };

  return (
    <div
      className={`member-card status-${member.status} ${isSelf ? 'is-self' : ''}`}
      onClick={() => isSelf && setDropdownOpen((prev) => !prev)}
    >
      <div className="avatar-circle" style={{ background: avatarColor }}>
        {initial}
      </div>
      <div className="member-name">{member.nickname}</div>
      <div className="status-row">
        <span className={`status-dot ${member.status}`} />
        <span className="status-label">{STATUS_LABELS[member.status]}</span>
      </div>
      {isSelf && onStatusChange && (
        <select
          className="status-select"
          value={member.status}
          onChange={handleSelectChange}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="working">切换到：工作中</option>
          <option value="resting">切换到：休息中</option>
          <option value="away">切换到：离开中</option>
        </select>
      )}
    </div>
  );
};

export default MemberCard;
