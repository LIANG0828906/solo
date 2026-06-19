import { useState, useEffect, useMemo } from 'react';
import { useChessStore } from '../store';
import { MatchResult, Match, Member } from '../types';

export default function MatchLog() {
  const { members, matches, addMatch, fetchMembers, fetchMatches } =
    useChessStore();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    player1Id: '',
    player2Id: '',
    result: 'win' as MatchResult,
    date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMembers();
    fetchMatches();
  }, [fetchMembers, fetchMatches]);

  const memberMap = useMemo(() => {
    const m = new Map<string, Member>();
    members.forEach((mem) => m.set(mem.id, mem));
    return m;
  }, [members]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.player1Id || !formData.player2Id || !formData.date) {
      setError('请填写所有字段');
      return;
    }
    if (formData.player1Id === formData.player2Id) {
      setError('对局双方不能为同一人');
      return;
    }

    setSubmitting(true);
    const start = performance.now();
    const ok = await addMatch({
      player1Id: formData.player1Id,
      player2Id: formData.player2Id,
      result: formData.result,
      date: formData.date,
    });
    const elapsed = performance.now() - start;
    console.log(`对局录入耗时: ${elapsed.toFixed(1)}ms`);
    setSubmitting(false);

    if (!ok) {
      setError('录入失败，请检查会员ID');
      return;
    }
    setShowModal(false);
  };

  const getPlayerDisplay = (
    match: Match,
    playerId: string,
    isPlayer1: boolean
  ) => {
    const member = memberMap.get(playerId);
    if (!member) return { name: '未知', class: '', eloChange: 0, newElo: 0 };
    let isWinner = false;
    let isLoser = false;
    if (match.result === 'draw') {
      isWinner = false;
      isLoser = false;
    } else if (match.result === 'win') {
      isWinner = isPlayer1;
      isLoser = !isPlayer1;
    } else {
      isWinner = !isPlayer1;
      isLoser = isPlayer1;
    }
    const oldElo = isPlayer1 ? match.player1OldElo : match.player2OldElo;
    const newElo = isPlayer1 ? match.player1NewElo : match.player2NewElo;
    return {
      name: member.name,
      class: isWinner ? 'player-win' : isLoser ? 'player-lose' : 'player-name',
      eloChange: newElo - oldElo,
      newElo,
    };
  };

  const getResultText = (r: MatchResult) => {
    if (r === 'win') return '玩家1胜';
    if (r === 'loss') return '玩家2胜';
    return '平局';
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">对局记录</h2>
          <button
            className="btn btn-primary"
            onClick={() => {
              setError('');
              setFormData({
                player1Id: '',
                player2Id: '',
                result: 'win',
                date: new Date().toISOString().split('T')[0],
              });
              setShowModal(true);
            }}
          >
            + 录入对局
          </button>
        </div>

        {matches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <div className="empty-text">暂无对局记录，点击「录入对局」开始</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '110px' }}>日期</th>
                  <th>对局双方</th>
                  <th>结果</th>
                  <th style={{ width: '160px' }}>赛后Elo变化</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => {
                  const p1 = getPlayerDisplay(match, match.player1Id, true);
                  const p2 = getPlayerDisplay(match, match.player2Id, false);
                  return (
                    <tr key={match.id}>
                      <td>
                        <span className="match-date">{match.date}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                          <span className={p1.class}>{p1.name}</span>
                          <span className="match-vs">VS</span>
                          <span className={p2.class}>{p2.name}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background:
                              match.result === 'draw'
                                ? '#f0f3f5'
                                : '#e8f8f5',
                            color:
                              match.result === 'draw'
                                ? '#7f8c8d'
                                : '#27ae60',
                          }}
                        >
                          {getResultText(match.result)}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          }}
                        >
                          <div>
                            <span style={{ color: '#7f8c8d', fontSize: '13px' }}>
                              {p1.name}:
                            </span>{' '}
                            <span className="elo-score" style={{ fontSize: '14px' }}>
                              {p1.newElo}
                            </span>
                            <span
                              className={`elo-change ${
                                p1.eloChange >= 0 ? 'elo-up' : 'elo-down'
                              }`}
                            >
                              {p1.eloChange > 0 ? '+' : ''}
                              {p1.eloChange}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: '#7f8c8d', fontSize: '13px' }}>
                              {p2.name}:
                            </span>{' '}
                            <span className="elo-score" style={{ fontSize: '14px' }}>
                              {p2.newElo}
                            </span>
                            <span
                              className={`elo-change ${
                                p2.eloChange >= 0 ? 'elo-up' : 'elo-down'
                              }`}
                            >
                              {p2.eloChange > 0 ? '+' : ''}
                              {p2.eloChange}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">录入对局</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">对局日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">玩家 1 (白色方)</label>
                <select
                  className="form-select"
                  value={formData.player1Id}
                  onChange={(e) =>
                    setFormData({ ...formData, player1Id: e.target.value })
                  }
                >
                  <option value="">选择会员...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (ID: {m.id}, Elo: {m.elo})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">玩家 2 (黑色方)</label>
                <select
                  className="form-select"
                  value={formData.player2Id}
                  onChange={(e) =>
                    setFormData({ ...formData, player2Id: e.target.value })
                  }
                >
                  <option value="">选择会员...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (ID: {m.id}, Elo: {m.elo})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">对局结果</label>
                <select
                  className="form-select"
                  value={formData.result}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      result: e.target.value as MatchResult,
                    })
                  }
                >
                  <option value="win">玩家1 胜</option>
                  <option value="loss">玩家2 胜</option>
                  <option value="draw">平局</option>
                </select>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#7f8c8d',
                    marginTop: '6px',
                  }}
                >
                  系统将使用 K=32 自动计算 Elo 等级分变动
                </div>
              </div>

              {error && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#fdedec',
                    color: '#c0392b',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginTop: '8px',
                  }}
                >
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? '录入中...' : '确认录入'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
