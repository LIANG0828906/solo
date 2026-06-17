import { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { calculateStreak } from '../modules/progressTracker';
import ProgressChart from './ProgressChart';

export default function BuddyPage() {
  const { currentUser, users, buddies, skills } = useAppStore();
  const [selectedBuddyId, setSelectedBuddyId] = useState<string | null>(null);

  const myBuddies = useMemo(() => {
    return buddies
      .filter(b => b.userId === currentUser.id || b.buddyId === currentUser.id)
      .map(b => {
        const buddyUserId = b.userId === currentUser.id ? b.buddyId : b.userId;
        const user = users.find(u => u.id === buddyUserId);
        const skill = skills.find(s => s.id === b.skillId);
        const streak = calculateStreak(
          useAppStore.getState().checkins,
          buddyUserId
        );
        return { buddyPair: b, user, skill, streak, userId: buddyUserId };
      })
      .filter(b => b.user && b.skill);
  }, [buddies, currentUser.id, users, skills]);

  const selectedBuddy = myBuddies.find(b => b.userId === selectedBuddyId);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">学习伙伴</h1>
      </div>

      {myBuddies.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>还没有学习伙伴，去"发现"页面寻找吧</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 24, flexDirection: 'column' }}>
          <div className="grid-3">
            {myBuddies.map(b => {
              const isSelected = selectedBuddyId === b.userId;
              return (
                <div
                  key={b.buddyPair.id}
                  className="card buddy-card"
                  style={{
                    cursor: 'pointer',
                    border: isSelected ? '2px solid #3B82F6' : undefined,
                  }}
                  onClick={() => setSelectedBuddyId(b.userId)}
                >
                  <div className="buddy-header">
                    <div className="avatar">
                      {b.user!.nickname.charAt(0)}
                    </div>
                    <div className="buddy-info">
                      <div className="buddy-name">{b.user!.nickname}</div>
                      <div className="buddy-meta">
                        <span className="badge badge-primary">{b.skill!.name}</span>
                        <span className="badge badge-warning">{b.skill!.level}</span>
                      </div>
                    </div>
                    {b.streak > 0 && (
                      <div style={{ fontWeight: 700, color: '#22C55E' }}>
                        🔥 {b.streak}天
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedBuddy && (
            <div className="card">
              <h3 className="section-title" style={{ marginBottom: 20 }}>
                学习进度对比 - {selectedBuddy.user!.nickname}
              </h3>
              <ProgressChart
                userId1={currentUser.id}
                userId2={selectedBuddy.userId}
                userName1="我"
                userName2={selectedBuddy.user!.nickname}
                days={7}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
