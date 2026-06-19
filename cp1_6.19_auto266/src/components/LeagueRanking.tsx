import { useState, useEffect } from 'react';
import { useChessStore } from '../store';
import { getLevel, getAvatarColor, getInitial } from '../types';

export default function LeagueRanking() {
  const {
    seasons,
    currentRanking,
    fetchSeasons,
    createSeason,
    fetchSeasonRanking,
  } = useChessStore();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
  });
  const [error, setError] = useState('');
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  useEffect(() => {
    if (seasons.length > 0 && !selectedSeasonId) {
      setSelectedSeasonId(seasons[0].id);
      fetchSeasonRanking(seasons[0].id);
    }
  }, [seasons, selectedSeasonId, fetchSeasonRanking]);

  const handleSelectSeason = (id: string) => {
    setSelectedSeasonId(id);
    fetchSeasonRanking(id);
  };

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim() || !formData.startDate || !formData.endDate) {
      setError('请填写所有字段');
      return;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError('结束日期必须晚于开始日期');
      return;
    }
    const start = performance.now();
    const ok = await createSeason({
      name: formData.name.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
    });
    const elapsed = performance.now() - start;
    console.log(`创建联赛周期耗时: ${elapsed.toFixed(1)}ms`);
    if (!ok) {
      setError('创建失败');
      return;
    }
    setShowModal(false);
  };

  const getRankClass = (index: number) => {
    if (index === 0) return 'rank-gold';
    if (index === 1) return 'rank-silver';
    if (index === 2) return 'rank-bronze';
    return 'rank-normal';
  };

  const ranking = currentRanking?.ranking || [];
  const maxWinRate = ranking.length > 0 ? Math.max(...ranking.map((r) => r.winRate), 1) : 1;
  const maxBarHeight = 180;

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">联赛排名</h2>
          <button
            className="btn btn-primary"
            onClick={() => {
              setError('');
              const now = new Date();
              const year = now.getFullYear();
              const month = now.getMonth() + 1;
              setFormData({
                name: `${year}年${month}月联赛`,
                startDate: `${year}-${String(month).padStart(2, '0')}-01`,
                endDate: new Date(year, month, 0).toISOString().split('T')[0],
              });
              setShowModal(true);
            }}
          >
            + 创建联赛周期
          </button>
        </div>

        {seasons.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <div className="empty-text">暂无联赛周期，点击上方按钮创建</div>
          </div>
        ) : (
          <>
            <div className="season-selector">
              {seasons.map((s) => (
                <button
                  key={s.id}
                  className={`season-chip ${
                    selectedSeasonId === s.id ? 'active' : ''
                  }`}
                  onClick={() => handleSelectSeason(s.id)}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {currentRanking && (
              <div style={{ marginBottom: '18px', fontSize: '13px', color: '#7f8c8d' }}>
                <span>📆 周期: </span>
                <strong style={{ color: '#2c3e50' }}>
                  {currentRanking.season.startDate} ~ {currentRanking.season.endDate}
                </strong>
                <span style={{ marginLeft: '16px' }}>
                  参与会员: <strong style={{ color: '#2c3e50' }}>{ranking.length}</strong> 人
                </span>
              </div>
            )}

            {ranking.length === 0 ? (
              <div
                className="empty-state"
                style={{ padding: '40px 20px' }}
              >
                <div className="empty-icon" style={{ fontSize: '38px' }}>
                  ⚔️
                </div>
                <div className="empty-text">
                  该周期内暂无对局数据
                </div>
              </div>
            ) : (
              <>
                {currentRanking?.mostActive && (
                  <div
                    style={{
                      marginBottom: '20px',
                      padding: '14px 18px',
                      background:
                        'linear-gradient(135deg, #fef9e7, #fdebd0)',
                      borderRadius: '12px',
                      border: '1px solid #f9e79f',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        className="award-badge"
                        style={{ fontSize: '13px' }}
                      >
                        🏆 活跃奖
                      </span>
                      <span style={{ fontWeight: 600 }}>
                        {currentRanking.mostActive.name}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                      周期内对局数:{' '}
                      <strong style={{ color: '#e67e22', fontSize: '16px' }}>
                        {currentRanking.mostActive.matches}
                      </strong>{' '}
                      场
                    </div>
                  </div>
                )}

                <div className="card" style={{ background: '#fafbfc' }}>
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#2c3e50',
                      marginBottom: '10px',
                    }}
                  >
                    📊 胜率条形图
                  </h3>
                  <div className="bar-chart">
                    {ranking.map((r) => {
                      const height = (r.winRate / maxWinRate) * maxBarHeight;
                      return (
                        <div key={r.memberId} className="bar-item">
                          <div
                            className="bar-column"
                            style={{ height: `${Math.max(height, 4)}px` }}
                            title={`${r.name}: ${r.winRate}%`}
                          >
                            <span className="bar-value">{r.winRate}%</span>
                          </div>
                          <div className="bar-label" title={r.name}>
                            {r.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>排名</th>
                        <th>会员</th>
                        <th>胜</th>
                        <th>负</th>
                        <th>平</th>
                        <th>对局数</th>
                        <th>胜率</th>
                        <th>当前Elo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((r, index) => (
                        <tr
                          key={r.memberId}
                          className={
                            currentRanking?.mostActive?.memberId === r.memberId
                              ? 'highlight-row'
                              : ''
                          }
                        >
                          <td>
                            <span
                              className={`rank-badge ${getRankClass(index)}`}
                            >
                              {index + 1}
                            </span>
                          </td>
                          <td>
                            <div className="member-row">
                              <div
                                className="avatar"
                                style={{
                                  background: getAvatarColor(r.memberId),
                                  width: '34px',
                                  height: '34px',
                                  fontSize: '14px',
                                }}
                              >
                                {getInitial(r.name)}
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    fontSize: '14px',
                                  }}
                                >
                                  {r.name}
                                </div>
                                <span
                                  className={`level-tag level-${getLevel(r.elo)}`}
                                  style={{ fontSize: '11px' }}
                                >
                                  {getLevel(r.elo)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td style={{ color: '#27ae60', fontWeight: 600 }}>
                            {r.wins}
                          </td>
                          <td style={{ color: '#e74c3c', fontWeight: 600 }}>
                            {r.losses}
                          </td>
                          <td style={{ color: '#7f8c8d', fontWeight: 600 }}>
                            {r.draws}
                          </td>
                          <td style={{ fontWeight: 600 }}>{r.matches}</td>
                          <td>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <div
                                style={{
                                  width: '70px',
                                  height: '8px',
                                  background: '#ecf0f1',
                                  borderRadius: '4px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${r.winRate}%`,
                                    height: '100%',
                                    background:
                                      'linear-gradient(90deg, #f39c12, #e67e22)',
                                    borderRadius: '4px',
                                    transition: 'width 0.3s ease',
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: '#e67e22',
                                  fontSize: '13px',
                                }}
                              >
                                {r.winRate}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="elo-score" style={{ fontSize: '14px' }}>
                              {r.elo}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">创建联赛周期</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSeason}>
              <div className="form-group">
                <label className="form-label">联赛名称</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="例如: 2024年6月联赛"
                />
              </div>
              <div className="form-group">
                <label className="form-label">开始日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">结束日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#7f8c8d',
                  padding: '12px 14px',
                  background: '#f0f3f5',
                  borderRadius: '8px',
                }}
              >
                💡 系统将自动将该周期内的所有对局纳入排名统计，生成胜率排行榜与活跃奖
              </div>

              {error && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#fdedec',
                    color: '#c0392b',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginTop: '12px',
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
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  创建周期
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
