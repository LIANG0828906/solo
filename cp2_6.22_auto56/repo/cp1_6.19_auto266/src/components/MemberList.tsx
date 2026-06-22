import { useState, useEffect, useMemo, useCallback } from 'react';
import { useChessStore } from '../store';
import { getLevel, getAvatarColor, getInitial, Member } from '../types';

interface Props {
  onSelectMember?: (member: Member) => void;
}

function debounce<T extends (...args: never[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export default function MemberList({ onSelectMember }: Props) {
  const { members, addMember, updateMember, deleteMember, fetchMembers } =
    useChessStore();

  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({ id: '', name: '', elo: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const debouncedSetSearch = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearch(value);
      }, 300),
    []
  );

  useEffect(() => {
    debouncedSetSearch(searchTerm as never);
  }, [searchTerm, debouncedSetSearch]);

  const filteredMembers = useMemo(() => {
    const sorted = [...members].sort((a, b) => b.elo - a.elo);
    if (!debouncedSearch.trim()) return sorted;
    const q = debouncedSearch.toLowerCase();
    return sorted.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
    );
  }, [members, debouncedSearch]);

  const stats = useMemo(() => {
    return {
      total: members.length,
      avgElo:
        members.length > 0
          ? Math.round(members.reduce((s, m) => s + m.elo, 0) / members.length)
          : 0,
      master: members.filter((m) => m.elo >= 1800).length,
      advanced: members.filter((m) => m.elo >= 1400 && m.elo < 1800).length,
    };
  }, [members]);

  const openAddModal = useCallback(() => {
    setEditingMember(null);
    setFormData({ id: '', name: '', elo: '' });
    setError('');
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((member: Member) => {
    setEditingMember(member);
    setFormData({
      id: member.id,
      name: member.name,
      elo: String(member.elo),
    });
    setError('');
    setShowModal(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.id.trim() || !formData.name.trim() || !formData.elo) {
      setError('请填写所有字段');
      return;
    }
    const eloNum = Number(formData.elo);
    if (isNaN(eloNum) || eloNum < 0) {
      setError('等级分必须为有效数字');
      return;
    }

    let ok: boolean;
    if (editingMember) {
      ok = await updateMember(editingMember.id, {
        name: formData.name.trim(),
        elo: eloNum,
      });
    } else {
      ok = await addMember({
        id: formData.id.trim(),
        name: formData.name.trim(),
        elo: eloNum,
      });
    }
    if (!ok) {
      setError(editingMember ? '更新失败' : '添加失败（ID可能已存在）');
      return;
    }
    setShowModal(false);
  };

  const handleDelete = async (member: Member) => {
    if (!confirm(`确定要删除会员「${member.name}」吗？`)) return;
    await deleteMember(member.id);
  };

  const getRankClass = (index: number) => {
    if (index === 0) return 'rank-gold';
    if (index === 1) return 'rank-silver';
    if (index === 2) return 'rank-bronze';
    return 'rank-normal';
  };

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">会员总数</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">平均等级分</div>
          <div className="stat-value">{stats.avgElo}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">大师级</div>
          <div className="stat-value">{stats.master}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">高级</div>
          <div className="stat-value">{stats.advanced}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">会员排行榜</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              className="search-input"
              style={{ width: '220px', paddingLeft: '42px' }}
              placeholder="搜索会员ID或姓名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-primary" onClick={openAddModal}>
              + 添加会员
            </button>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">♟️</div>
            <div className="empty-text">暂无会员数据，点击「添加会员」开始</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>排名</th>
                  <th>会员信息</th>
                  <th>ID</th>
                  <th>等级</th>
                  <th style={{ width: '100px' }}>Elo</th>
                  <th style={{ width: '140px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member, index) => {
                  const realIndex = [...members]
                    .sort((a, b) => b.elo - a.elo)
                    .findIndex((m) => m.id === member.id);
                  return (
                    <tr
                      key={member.id}
                      onClick={() => onSelectMember?.(member)}
                      style={{
                        cursor: onSelectMember ? 'pointer' : 'default',
                      }}
                    >
                      <td>
                        <span className={`rank-badge ${getRankClass(realIndex)}`}>
                          {realIndex + 1}
                        </span>
                      </td>
                      <td>
                        <div className="member-row">
                          <div
                            className="avatar"
                            style={{ background: getAvatarColor(member.id) }}
                          >
                            {getInitial(member.name)}
                          </div>
                          <span
                            className="player-name"
                            style={{ fontWeight: 600 }}
                          >
                            {member.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: '#7f8c8d' }}>
                        {member.id}
                      </td>
                      <td>
                        <span className={`level-tag level-${getLevel(member.elo)}`}>
                          {getLevel(member.elo)}
                        </span>
                      </td>
                      <td>
                        <span className="elo-score">{member.elo}</span>
                        {member.elo !== member.initialElo && (
                          <span
                            className={`elo-change ${
                              member.elo > member.initialElo ? 'elo-up' : 'elo-down'
                            }`}
                          >
                            {member.elo > member.initialElo ? '+' : ''}
                            {member.elo - member.initialElo}
                          </span>
                        )}
                      </td>
                      <td>
                        <div
                          className="action-buttons"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => openEditModal(member)}
                          >
                            编辑
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(member)}
                          >
                            删除
                          </button>
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
              <h3 className="modal-title">
                {editingMember ? '编辑会员' : '添加会员'}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">会员ID</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.id}
                  onChange={(e) =>
                    setFormData({ ...formData, id: e.target.value })
                  }
                  disabled={!!editingMember}
                  placeholder="例如: M001"
                />
              </div>
              <div className="form-group">
                <label className="form-label">姓名</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="例如: 张三"
                />
              </div>
              <div className="form-group">
                <label className="form-label">初始等级分 (Elo)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.elo}
                  onChange={(e) =>
                    setFormData({ ...formData, elo: e.target.value })
                  }
                  placeholder="例如: 1200"
                  min="0"
                />
                <div
                  style={{
                    fontSize: '12px',
                    color: '#7f8c8d',
                    marginTop: '6px',
                  }}
                >
                  等级划分: 新手 {'<'}1000 | 业余 1000-1399 | 高级 1400-1799 | 大师
                  ≥1800
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
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMember ? '保存修改' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
