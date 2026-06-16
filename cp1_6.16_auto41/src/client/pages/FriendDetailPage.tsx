import { useState, useCallback, useMemo } from 'react';
import type { FriendInfo, InteractionType, PetStats } from '../types';
import { STAT_NAMES, getWarningStats } from '../pet';
import PetAnimation from '../PetAnimation';
import StatBar from '../components/StatBar';
import { useCooldown } from '../hooks/useCooldown';
import './FriendDetailPage.css';

interface FriendDetailPageProps {
  friend: FriendInfo | null;
  onBack: () => void;
  onHelp: (type: InteractionType) => Promise<void>;
}

const helpButtons: Array<{ type: InteractionType; icon: string; label: string; color: string }> = [
  { type: 'feed', icon: '🍖', label: '喂食', color: '#FF6B6B' },
  { type: 'clean', icon: '💧', label: '清洁', color: '#74B9FF' },
  { type: 'play', icon: '⚽', label: '玩耍', color: '#55EFC4' },
];

const FriendDetailPage = function FriendDetailPage({
  friend,
  onBack,
  onHelp,
}: FriendDetailPageProps) {
  const [animationType, setAnimationType] = useState<'feed' | 'clean' | 'play' | null>(null);
  
  const feedCooldown = useCooldown(30);
  const cleanCooldown = useCooldown(30);
  const playCooldown = useCooldown(30);

  const getCooldown = (type: InteractionType) => {
    switch (type) {
      case 'feed': return feedCooldown;
      case 'clean': return cleanCooldown;
      case 'play': return playCooldown;
    }
  };

  const handleHelp = useCallback(async (type: InteractionType) => {
    const cooldown = getCooldown(type);
    if (cooldown.isCooldown || !friend || friend.isSick) return;
    
    setAnimationType(type);
    cooldown.startCooldown();
    
    try {
      await onHelp(type);
    } catch (e) {
      console.error('帮助失败:', e);
    }
    
    setTimeout(() => {
      setAnimationType(null);
    }, 1500);
  }, [onHelp, friend, feedCooldown, cleanCooldown, playCooldown]);

  const warnings = useMemo(() => {
    if (!friend) return [];
    return getWarningStats(friend.stats);
  }, [friend]);

  const statOrder: Array<keyof PetStats> = ['hunger', 'happiness', 'cleanliness', 'energy'];

  if (!friend) {
    return (
      <div className="friend-detail-page page-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="friend-detail-page page-container">
      <button className="back-btn" onClick={onBack}>
        ← 返回
      </button>
      
      <div className="detail-content">
        <div className="pet-section">
          <div className="pet-background">
            <PetAnimation
              name={friend.petName}
              color={friend.petColor}
              stats={friend.stats}
              isSick={friend.isSick}
              animationType={animationType}
            />
          </div>
        </div>
        
        <div className="stats-section">
          <h2 className="section-title">宠物状态</h2>
          <div className="stats-list">
            {statOrder.map(stat => (
              <StatBar key={stat} stat={stat} value={friend.stats[stat]} />
            ))}
          </div>
        </div>
        
        <div className="help-section">
          <h2 className="section-title">帮助好友</h2>
          <p className="help-tip">每次帮助可增加对应属性10点，冷却30秒</p>
          
          <div className="help-buttons">
            {helpButtons.map(btn => {
              const cooldown = getCooldown(btn.type);
              const isDisabled = cooldown.isCooldown || friend.isSick;
              
              return (
                <button
                  key={btn.type}
                  className={`help-btn ${isDisabled ? 'disabled' : ''}`}
                  style={{ ['--btn-color' as string]: btn.color }}
                  onClick={() => handleHelp(btn.type)}
                  disabled={isDisabled}
                >
                  <span className="help-icon">{btn.icon}</span>
                  <span className="help-label">{btn.label}</span>
                  <span className="help-value">+10</span>
                  
                  {cooldown.isCooldown && (
                    <div className="help-cooldown">
                      <div className="cooldown-slash" />
                      <span className="cooldown-text">{cooldown.timeLeft}s</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {friend.isSick && (
          <div className="sick-notice">
            <span>😷</span>
            <p>宠物生病了！帮助它恢复健康吧</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendDetailPage;
