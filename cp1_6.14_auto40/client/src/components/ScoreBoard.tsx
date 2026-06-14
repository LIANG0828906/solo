import React, { useEffect, useState, useRef } from 'react';
import { TeamInfo } from '../roomManager';

interface Props {
  teams: TeamInfo[];
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  currentTeamIndex?: number;
  recentScore?: { teamId: number; score: number } | null;
  showFinalRankings?: {
    rank: number;
    teamId: number;
    teamName: string;
    totalScore: number;
    roundScores: number[];
    players: { nickname: string; avatar: string }[];
  }[] | null;
}

const TEAM_COLORS = ['#e94560', '#0f3460', '#f59e0b', '#10b981'];
const TROPHY_EMOJI = ['🏆', '🥈', '🥉', '4️⃣'];

const ScoreBoard: React.FC<Props> = ({
  teams,
  currentRound,
  totalRounds,
  timeRemaining,
  currentTeamIndex = -1,
  recentScore,
  showFinalRankings
}) => {
  const [bounceTeams, setBounceTeams] = useState<Set<number>>(new Set());
  const timePct = totalRounds > 0 ? (timeRemaining / 90) * 100 : 0;
  const prevScores = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    if (!recentScore) return;
    setBounceTeams(new Set([recentScore.teamId]));
    const t = setTimeout(() => setBounceTeams(new Set()), 600);
    return () => clearTimeout(t);
  }, [recentScore]);

  const maxScore = Math.max(1, ...teams.map((t) => t.score));
  const sortedForLeader = [...teams].sort((a, b) => b.score - a.score);
  const leaderId = sortedForLeader[0]?.id ?? -1;

  if (showFinalRankings && showFinalRankings.length > 0) {
    return (
      <div className="card fade-in" style={{ height: '100%' }}>
        <h3
          style={{
            textAlign: 'center',
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 24,
            background: 'linear-gradient(90deg, #fbbf24, #e94560)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          🏅 最终排名
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {showFinalRankings.map((r, idx) => (
            <div
              key={r.teamId}
              className="fade-in"
              style={{
                animationDelay: `${idx * 0.15}s`,
                opacity: 0,
                padding: 16,
                borderRadius: 14,
                background:
                  r.rank === 1
                    ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.05))'
                    : 'rgba(255,255,255,0.03)',
                border:
                  r.rank === 1
                    ? '2px solid rgba(251, 191, 36, 0.5)'
                    : '1px solid var(--border-color)',
                animationFillMode: 'forwards'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 36 }}>{TROPHY_EMOJI[r.rank - 1] || r.rank}</div>
                <div style={{ flex: 1 }}>
                  <div
                    className={r.rank === 1 ? 'gold-shine' : ''}
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: r.rank === 1 ? undefined : '#fff'
                    }}
                  >
                    {r.teamName}
                  </div>
                  <div style={{ fontSize: 12, color: '#a0aec0', marginTop: 2 }}>
                    {r.players.map((p) => `${p.avatar} ${p.nickname}`).join(' & ')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: r.rank === 1 ? '#fbbf24' : r.rank === 2 ? '#c0c0c0' : '#cd7f32'
                    }}
                  >
                    {r.totalScore}
                  </div>
                  <div style={{ fontSize: 11, color: '#a0aec0' }}>总分</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {r.roundScores.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.3)',
                      textAlign: 'center',
                      fontSize: 12
                    }}
                  >
                    <div style={{ color: '#a0aec0', fontSize: 10 }}>R{i + 1}</div>
                    <div style={{ fontWeight: 700, color: s > 0 ? '#10b981' : '#e94560' }}>
                      +{s}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#f59e0b' }}>⏱️</span> 回合进度
          </h3>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: 20,
              background: 'rgba(233, 69, 96, 0.15)',
              color: '#ff8098',
              fontSize: 12,
              fontWeight: 700
            }}
          >
            {currentRound}/{totalRounds}
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              height: 14,
              borderRadius: 10,
              background: 'rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${timePct}%`,
                background:
                  timePct > 30
                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                    : timePct > 10
                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                    : 'linear-gradient(90deg, #e94560, #ff6b85)',
                borderRadius: 10,
                transition: 'width 0.3s linear'
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: -22,
              fontSize: 13,
              fontWeight: 700,
              color:
                timePct > 30 ? '#10b981' : timePct > 10 ? '#f59e0b' : '#e94560'
            }}
          >
            {timeRemaining}s
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {teams.map((team) => {
          const pct = (team.score / maxScore) * 100;
          const isLeader = team.id === leaderId && team.score > 0;
          const isCurrent = team.id === currentTeamIndex;
          const isBouncing = bounceTeams.has(team.id);
          const prevScore = prevScores.current.get(team.id) ?? 0;

          return (
            <div
              key={team.id}
              className={isBouncing ? 'bounce-scale' : ''}
              style={{
                padding: 12,
                borderRadius: 12,
                background: isCurrent
                  ? `linear-gradient(135deg, ${TEAM_COLORS[team.id % TEAM_COLORS.length]}22, transparent)`
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${
                  isCurrent
                    ? TEAM_COLORS[team.id % TEAM_COLORS.length] + '88'
                    : 'var(--border-color)'
                }`,
                transition: 'all 0.3s ease'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: TEAM_COLORS[team.id % TEAM_COLORS.length]
                    }}
                  />
                  <span
                    className={isLeader ? 'gold-shine' : ''}
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: isLeader ? undefined : '#fff'
                    }}
                  >
                    {team.name}
                    {isLeader && <span style={{ marginLeft: 4 }}>👑</span>}
                    {isCurrent && <span style={{ marginLeft: 4 }}>🎨</span>}
                  </span>
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 24,
                    color: TEAM_COLORS[team.id % TEAM_COLORS.length]
                  }}
                >
                  {team.score}
                  {prevScore !== team.score && team.score > 0 && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 12,
                        color: '#10b981',
                        animation: 'bounceScale 0.5s ease'
                      }}
                    >
                      +{team.score - prevScore}
                    </span>
                  )}
                </div>
              </div>

              <div
                style={{
                  height: 6,
                  borderRadius: 4,
                  background: 'rgba(0,0,0,0.3)',
                  overflow: 'hidden',
                  marginBottom: 8
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: TEAM_COLORS[team.id % TEAM_COLORS.length],
                    borderRadius: 4,
                    transition: 'all 0.5s ease'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {team.players.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 12,
                      background: 'rgba(0,0,0,0.3)',
                      fontSize: 12
                    }}
                  >
                    <span>{p.avatar}</span>
                    <span style={{ color: '#d1d5db' }}>{p.nickname}</span>
                    {p.isDrawer && <span>✏️</span>}
                  </div>
                ))}
              </div>

              {team.roundScores.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                  {team.roundScores.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: 10,
                        padding: '2px 4px',
                        borderRadius: 4,
                        background: 'rgba(0,0,0,0.2)',
                        color: s > 0 ? '#10b981' : '#e94560',
                        fontWeight: 600
                      }}
                    >
                      R{i + 1} +{s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScoreBoard;
