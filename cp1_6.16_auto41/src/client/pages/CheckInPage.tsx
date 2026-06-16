import { useState, useCallback, useEffect, useMemo } from 'react';
import { ITEM_INFO } from '../types';
import type { ItemType, CheckInStatus } from '../types';
import './CheckInPage.css';

interface CheckInPageProps {
  status: CheckInStatus;
  onCheckIn: () => Promise<{ success: boolean; streak: number; reward: ItemType; rewardName: string } | null>;
}

const CheckInPage = function CheckInPage({ status, onCheckIn }: CheckInPageProps) {
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardItem, setRewardItem] = useState<ItemType | null>(null);

  const handleCheckIn = useCallback(async () => {
    if (status.todayChecked || isCheckingIn) return;
    
    setIsCheckingIn(true);
    try {
      const result = await onCheckIn();
      if (result && result.success) {
        setRewardItem(result.reward);
        setShowReward(true);
      }
    } catch (e) {
      console.error('签到失败:', e);
    } finally {
      setIsCheckingIn(false);
    }
  }, [status.todayChecked, isCheckingIn, onCheckIn]);

  const calendarDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: Array<{ day: number; isToday: boolean; isChecked: boolean; isStreak: boolean }> = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, isToday: false, isChecked: false, isStreak: false });
    }
    
    const todayDate = today.getDate();
    const streakDays = status.todayChecked ? status.streak : Math.min(status.streak, todayDate - 1);
    
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = i === todayDate;
      const isChecked = i <= todayDate && (i < todayDate || status.todayChecked);
      const isStreak = i > todayDate - streakDays && i <= todayDate && (i < todayDate || status.todayChecked);
      
      days.push({ day: i, isToday, isChecked, isStreak });
    }
    
    return days;
  }, [status]);

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  const closeReward = useCallback(() => {
    setShowReward(false);
    setRewardItem(null);
  }, []);

  return (
    <div className="checkin-page page-container">
      <h1 className="page-title">📅 每日签到</h1>
      
      <div className="streak-card">
        <div className="streak-info">
          <span className="streak-label">连续签到</span>
          <div className="streak-count">
            <span className="streak-number">{status.streak}</span>
            <span className="streak-unit">天</span>
          </div>
        </div>
        <div className="streak-icon">🔥</div>
      </div>
      
      <div className="calendar-card">
        <div className="calendar-header">
          <h2 className="calendar-title">
            {new Date().getFullYear()}年 {monthNames[new Date().getMonth()]}
          </h2>
        </div>
        
        <div className="calendar-weekdays">
          {weekDays.map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        
        <div className="calendar-days">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`calendar-day ${day.isToday ? 'today' : ''} ${day.isChecked ? 'checked' : ''} ${day.isStreak ? 'streak' : ''} ${day.day === 0 ? 'empty' : ''}`}
            >
              {day.day > 0 && <span>{day.day}</span>}
              {day.isChecked && day.day > 0 && <span className="check-mark">✓</span>}
            </div>
          ))}
        </div>
      </div>
      
      <div className="reward-preview">
        <h3 className="reward-title">今日奖励</h3>
        <p className="reward-tip">签到后随机获得以下道具之一</p>
        <div className="reward-items">
          {Object.entries(ITEM_INFO).map(([type, info]) => (
            <div key={type} className="reward-item">
              <span className="reward-icon">{info.emoji}</span>
              <span className="reward-name">{info.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      <button
        className={`checkin-btn ${status.todayChecked ? 'checked' : ''}`}
        onClick={handleCheckIn}
        disabled={status.todayChecked || isCheckingIn}
      >
        {status.todayChecked ? '✓ 今日已签到' : isCheckingIn ? '签到中...' : '立即签到'}
      </button>
      
      {showReward && rewardItem && (
        <div className="reward-modal" onClick={closeReward}>
          <div className="reward-modal-content animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="reward-stars">
              <span className="star s1">⭐</span>
              <span className="star s2">✨</span>
              <span className="star s3">⭐</span>
            </div>
            <h3 className="modal-title">签到成功！</h3>
            <div className="reward-item-large">
              <span className="large-icon">{ITEM_INFO[rewardItem].emoji}</span>
              <span className="large-name">{ITEM_INFO[rewardItem].name}</span>
              <span className="large-desc">+20 {rewardItem === 'energyJuice' ? '精力' : rewardItem === 'magicShampoo' ? '清洁度' : rewardItem === 'luxuryFood' ? '饥饿度' : '快乐度'}</span>
            </div>
            <button className="modal-close-btn" onClick={closeReward}>
              太棒了！
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInPage;
