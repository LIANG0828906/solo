import { useFootprintStore } from '../store/footprintStore';

export default function ChallengeBoard() {
  const { challenges, currentUser, userChallenges, joinChallenge, leaderboard } = useFootprintStore();

  const isJoined = (challengeId: string) =>
    userChallenges.some((uc) => uc.challengeId === challengeId && !uc.completed);

  const getProgress = (challengeId: string) => {
    const uc = userChallenges.find((uc2) => uc2.challengeId === challengeId && !uc2.completed);
    if (!uc) return 0;
    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) return 0;
    return Math.min(100, Math.round((uc.progress / challenge.targetDays) * 100));
  };

  const isCompleted = (challengeId: string) =>
    userChallenges.some((uc) => uc.challengeId === challengeId && uc.completed);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const categoryEmoji: Record<string, string> = {
    food: '🥗',
    transport: '🚲',
    electricity: '💡',
    all: '🌍',
  };

  return (
    <div>
      <h2 className="section-title" style={{ marginBottom: 20 }}>
        🏆 挑战广场
      </h2>

      <div className="challenge-grid">
        {challenges.map((ch) => {
          const joined = isJoined(ch.id);
          const completed = isCompleted(ch.id);
          const progress = getProgress(ch.id);

          return (
            <div key={ch.id} className="challenge-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 className="challenge-title">{ch.name}</h3>
                <span style={{ fontSize: '1.5rem' }}>{categoryEmoji[ch.category] ?? '🎯'}</span>
              </div>
              <p className="challenge-desc">{ch.description}</p>

              {joined && !completed && (
                <div className="challenge-progress-bar">
                  <div className="challenge-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              )}

              {completed && (
                <div style={{
                  background: '#C8E6C9',
                  padding: '6px 12px',
                  borderRadius: 6,
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  marginBottom: 12,
                }}>
                  ✅ 已完成！获得 {ch.points} 积分
                </div>
              )}

              <div className="challenge-meta">
                <span>👥 {ch.participants} 人参与</span>
                <span>📅 截止 {formatDate(ch.deadline)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="challenge-points">+{ch.points} 积分</span>
                {completed ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>已达成</span>
                ) : joined ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>
                    进行中 {progress}%
                  </span>
                ) : (
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                    onClick={() => joinChallenge(ch.id)}
                  >
                    加入挑战
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 32 }}>
        <h3 className="section-title">🏅 实时排行榜</h3>
        <ul className="leaderboard-list">
          {leaderboard.map((entry, idx) => (
            <li
              key={entry.userId}
              className={`leaderboard-item ${currentUser?.id === entry.userId ? 'current-user' : ''}`}
            >
              <span className="leaderboard-rank">
                {idx === 0 && <span className="crown-icon">👑</span>}
                {idx !== 0 && idx + 1}
              </span>
              <span className="leaderboard-avatar">{entry.avatar}</span>
              <span className="leaderboard-name">{entry.name}</span>
              <span className="leaderboard-points">{entry.points} 分</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
