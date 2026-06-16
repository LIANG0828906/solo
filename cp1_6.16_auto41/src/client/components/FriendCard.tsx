import { memo } from 'react';
import type { FriendInfo } from '../types';
import './FriendCard.css';

interface FriendCardProps {
  friend: FriendInfo;
  onClick: () => void;
}

const FriendCard = memo(function FriendCard({ friend, onClick }: FriendCardProps) {
  const avgStats = (friend.stats.hunger + friend.stats.happiness + friend.stats.cleanliness + friend.stats.energy) / 4;

  return (
    <div className="friend-card" onClick={onClick}>
      <div className="friend-pet-preview">
        <div 
          className={`mini-pet ${friend.isSick ? 'sick' : ''}`}
          style={{ ['--pet-color' as string]: friend.petColor }}
        >
          <div className="mini-body" />
          <div className="mini-ears">
            <div className="mini-ear left" />
            <div className="mini-ear right" />
          </div>
        </div>
      </div>
      
      <div className="friend-info">
        <div className="friend-pet-name">{friend.petName}</div>
        <div className="friend-id">ID: {friend.id}</div>
      </div>
      
      <div className="friend-stats">
        <span className="stat-icon" title="饥饿度">🍖</span>
        <span className="stat-icon" title="快乐度">😊</span>
        <span className="stat-icon" title="清洁度">💧</span>
        <span className="stat-icon" title="精力">⚡</span>
      </div>
      
      <div className="friend-status-bar">
        <div 
          className="status-fill"
          style={{ 
            width: `${avgStats}%`,
            background: avgStats < 30 
              ? 'linear-gradient(90deg, #ff6b6b, #ff8787)' 
              : 'linear-gradient(90deg, #98D8AA, #6BCB77)'
          }}
        />
      </div>
      
      {friend.isSick && (
        <div className="sick-badge">😷 生病</div>
      )}
    </div>
  );
});

export default FriendCard;
