import { useState, useEffect, useCallback } from 'react';
import type { Team, TeamMember } from '../utils/types';
import { api } from '../utils/api';
import { ALL_TIMEZONES, DAY_NAMES } from '../utils/timezoneUtils';
import { VirtualList } from './VirtualList';

interface Props {
  team: Team;
  onTeamUpdated: (team: Team) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const AVATAR_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
  '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E',
];

function getAvatarInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function pickAvatarColor(name: string) {
  const idx = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function defaultAvailability(): { [day: number]: number[] } {
  const avail: { [day: number]: number[] } = {};
  for (let d = 1; d <= 5; d++) {
    avail[d] = [9, 10, 11, 12, 13, 14, 15, 16, 17];
  }
  return avail;
}

export function TeamPanel({ team, onTeamUpdated, showToast }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formName, setFormName] = useState('');
  const [formTimezone, setFormTimezone] = useState('UTC+8');
  const [formEmail, setFormEmail] = useState('');
  const [formAvail, setFormAvail] = useState<{ [day: number]: number[] }>(defaultAvailability());
  const [timezones, setTimezones] = useState<string[]>(ALL_TIMEZONES);

  useEffect(() => {
    api.getTimezones().then(r => setTimezones(r.timezones)).catch(() => {});
  }, []);

  const openAddModal = () => {
    setEditingMember(null);
    setFormName('');
    setFormTimezone('UTC+8');
    setFormEmail('');
    setFormAvail(defaultAvailability());
    setShowAddModal(true);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setFormName(member.name);
    setFormTimezone(member.timezone);
    setFormEmail(member.email || '');
    setFormAvail(JSON.parse(JSON.stringify(member.availability)));
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      showToast('请输入成员姓名', 'error');
      return;
    }
    try {
      if (editingMember) {
        const res = await api.updateMember(team.id, editingMember.id, {
          name: formName.trim(),
          timezone: formTimezone,
          email: formEmail.trim() || undefined,
          availability: formAvail,
        });
        const updated: Team = {
          ...team,
          members: team.members.map(m => m.id === res.member.id ? res.member : m),
        };
        onTeamUpdated(updated);
        showToast('成员已更新', 'success');
      } else {
        const res = await api.addMember(team.id, {
          name: formName.trim(),
          timezone: formTimezone,
          email: formEmail.trim() || undefined,
          availability: formAvail,
        });
        const updated: Team = {
          ...team,
          members: [...team.members, res.member],
        };
        onTeamUpdated(updated);
        showToast('成员已添加', 'success');
      }
      setShowAddModal(false);
    } catch (e: any) {
      showToast(e.message || '操作失败', 'error');
    }
  };

  const handleDelete = async (memberId: string) => {
    if (!confirm('确定删除该成员？')) return;
    try {
      await api.deleteMember(team.id, memberId);
      const updated: Team = {
        ...team,
        members: team.members.filter(m => m.id !== memberId),
      };
      onTeamUpdated(updated);
      showToast('成员已删除', 'success');
    } catch (e: any) {
      showToast(e.message || '删除失败', 'error');
    }
  };

  const toggleHour = (day: number, hour: number) => {
    setFormAvail(prev => {
      const dayHours = new Set(prev[day] || []);
      if (dayHours.has(hour)) dayHours.delete(hour);
      else dayHours.add(hour);
      return { ...prev, [day]: Array.from(dayHours).sort((a, b) => a - b) };
    });
  };

  const renderMember = useCallback((member: TeamMember) => (
    <div className="member-item" style={{ margin: '4px 8px' }}>
      <div
        className="avatar"
        style={{ backgroundColor: member.avatarColor || pickAvatarColor(member.name) }}
      >
        {getAvatarInitials(member.name)}
      </div>
      <div className="member-info">
        <div className="member-name">{member.name}</div>
        <div className="member-sub">
          <span>🌐 {member.timezone}</span>
          {member.email && <span>✉️ {member.email}</span>}
          <span>
            📅 {Object.keys(member.availability).length}天可用 / 周
          </span>
        </div>
      </div>
      <div className="member-actions">
        <button
          className="icon-btn"
          title="编辑"
          onClick={() => openEditModal(member)}
        >
          ✏️
        </button>
        <button
          className="icon-btn delete"
          title="删除"
          onClick={() => handleDelete(member.id)}
        >
          🗑️
        </button>
      </div>
    </div>
  ), [team]);

  return (
    <div>
      <div className="section-title">
        <span>团队成员 ({team.members.length})</span>
        <button className="btn btn-primary" onClick={openAddModal}>
          ➕ 添加成员
        </button>
      </div>

      {team.members.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-text">还没有成员，添加第一位团队成员吧</div>
          <button className="btn btn-primary" onClick={openAddModal}>
            添加成员
          </button>
        </div>
      ) : team.members.length > 100 ? (
        <VirtualList
          items={team.members}
          itemHeight={76}
          height={Math.min(600, team.members.length * 76)}
          renderItem={(member) => renderMember(member)}
        />
      ) : (
        <div className="member-list">
          {team.members.map(m => renderMember(m))}
        </div>
      )}

      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {editingMember ? '编辑成员' : '添加成员'}
              </div>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-row">
                  <label className="label">姓名 *</label>
                  <input
                    className="input"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="请输入成员姓名"
                  />
                </div>
                <div className="form-row">
                  <label className="label">时区 *</label>
                  <select
                    className="select"
                    value={formTimezone}
                    onChange={e => setFormTimezone(e.target.value)}
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <label className="label">邮箱（可选，用于离线邮件提醒）</label>
                <input
                  className="input"
                  type="email"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="example@company.com"
                />
              </div>
              <div className="form-row">
                <label className="label">每周可用时间段（点击格子切换，每行代表当天0-23点）</label>
                <div className="availability-editor">
                  {Array.from({ length: 7 }, (_, day) => (
                    <div key={day} className="day-row">
                      <span className="day-label">{DAY_NAMES[day]}</span>
                      <div className="hour-grid">
                        {Array.from({ length: 24 }, (_, hour) => {
                          const isSelected = (formAvail[day] || []).includes(hour);
                          return (
                            <div
                              key={hour}
                              className={`hour-cell ${isSelected ? 'selected' : ''}`}
                              data-hour={`${hour}:00-${hour + 1}:00`}
                              onClick={() => toggleHour(day, hour)}
                              title={`${DAY_NAMES[day]} ${hour}:00-${hour + 1}:00`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingMember ? '保存修改' : '添加成员'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
