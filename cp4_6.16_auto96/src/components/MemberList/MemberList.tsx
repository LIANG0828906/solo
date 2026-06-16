import { Users, Crown, User } from 'lucide-react';
import type { Member } from '@/types';
import './MemberList.css';

interface MemberListProps {
  members: Member[];
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const AVATAR_COLORS = [
  ['#fef3c7', '#f59e0b'],
  ['#dcfce7', '#22c55e'],
  ['#dbeafe', '#3b82f6'],
  ['#fce7f3', '#ec4899'],
  ['#ede9fe', '#8b5cf6'],
  ['#fed7aa', '#f97316'],
  ['#cffafe', '#06b6d4'],
  ['#fecaca', '#ef4444'],
];

const MemberList = ({ members }: MemberListProps) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}月${date.getDate()}日加入`;
  };

  const renderAvatar = (member: Member) => {
    const random = seededRandom(member.avatarSeed);
    const colorPair = AVATAR_COLORS[Math.floor(random() * AVATAR_COLORS.length)];
    const shapeX = 20 + random() * 60;
    const shapeY = 20 + random() * 60;
    const shapeSize = 25 + random() * 25;

    return (
      <div className="member-avatar">
        <svg
          className="member-avatar-svg"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`avatar-bg-${member.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorPair[0]} />
              <stop offset="100%" stopColor={colorPair[1]} />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill={`url(#avatar-bg-${member.id})`} />
          <circle
            cx={shapeX}
            cy={shapeY}
            r={shapeSize}
            fill="white"
            opacity="0.3"
          />
          <circle
            cx={50}
            cy={42}
            r={16}
            fill="white"
            opacity="0.7"
          />
          <ellipse
            cx={50}
            cy={80}
            rx={24}
            ry={16}
            fill="white"
            opacity="0.7"
          />
        </svg>
        {member.isHost && (
          <div className="member-host-badge">
            <Crown size={10} />
          </div>
        )}
      </div>
    );
  };

  const sortedMembers = [...members].sort((a, b) => {
    if (a.isHost && !b.isHost) return -1;
    if (!a.isHost && b.isHost) return 1;
    return a.joinedAt - b.joinedAt;
  });

  return (
    <div className="member-list">
      <div className="member-list-header">
        <span className="member-list-title">
          <Users size={18} style={{ marginRight: 6 }} />
          俱乐部成员
        </span>
        <span className="member-count">{members.length} 人</span>
      </div>

      <div className="member-items">
        {sortedMembers.map((member) => (
          <div key={member.id} className="member-item">
            {renderAvatar(member)}
            <div className="member-info">
              <div className="member-name">
                {member.name}
                {member.isHost && (
                  <span className="member-host-label">发起人</span>
                )}
              </div>
              <div className="member-joined">
                {formatDate(member.joinedAt)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberList;
