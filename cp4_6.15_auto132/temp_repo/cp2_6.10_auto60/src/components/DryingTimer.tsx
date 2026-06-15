import { useState, useEffect } from 'react';
import { useGameStore, GAMEDAY_MS, DRY_DAYS, MOLD_PATTERNS } from '../store/gameStore';
import type { InkBatch } from '../types';

function DryingTimer() {
  const { inventory, checkDrying } = useGameStore();
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      checkDrying();
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [checkDrying]);

  const dryingItems = inventory.filter(b => !b.isDried);
  const nextDrying = dryingItems[0];

  const getRemainingDays = (batch: InkBatch) => {
    const now = Date.now();
    const remaining = Math.max(0, batch.dryCompleteAt - now);
    return Math.ceil(remaining / GAMEDAY_MS);
  };

  const getProgress = (batch: InkBatch) => {
    const now = Date.now();
    const total = DRY_DAYS * GAMEDAY_MS;
    const elapsed = total - Math.max(0, batch.dryCompleteAt - now);
    return Math.min(100, (elapsed / total) * 100);
  };

  return (
    <div>
      {dryingItems.length > 0 ? (
        <>
          <div className="drying-timer">
            <div className="drying-timer-title">下一批晾干完成</div>
            <div className="drying-timer-value">
              {getRemainingDays(nextDrying)} 天
            </div>
            <div style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.85rem', 
              color: '#6b4e3a' 
            }}>
              {MOLD_PATTERNS[nextDrying.pattern]}墨 · 硬度{nextDrying.hardness}级
            </div>
            <div className="press-progress" style={{ marginTop: '0.75rem' }}>
              <div 
                className="press-progress-bar" 
                style={{ width: `${getProgress(nextDrying)}%` }}
              />
            </div>
          </div>

          {dryingItems.length > 1 && (
            <div style={{ fontSize: '0.8rem', color: '#6b4e3a', textAlign: 'center' }}>
              还有 {dryingItems.length - 1} 批正在晾干中...
            </div>
          )}
        </>
      ) : (
        <div className="drying-timer">
          <div className="drying-timer-title">晾干区</div>
          <div style={{ color: '#6b4e3a', fontSize: '0.9rem' }}>
            暂无晾干中的墨锭
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: '1rem', 
        padding: '0.75rem', 
        background: 'rgba(0,0,0,0.05)', 
        borderRadius: '4px',
        fontSize: '0.8rem',
        color: '#6b4e3a'
      }}>
        <strong>提示：</strong>游戏内1天 = 真实时间30秒，墨锭需要晾干14天后才能进行描金。
      </div>
    </div>
  );
}

export default DryingTimer;
