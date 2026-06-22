import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Team, Meeting, NotificationItem, WSNotification } from './utils/types';
import { api } from './utils/api';
import {
  formatCountdown,
  getMinutesUntil,
  formatHour,
  getBrowserTimezone,
} from './utils/timezoneUtils';
import { TeamPanel } from './components/TeamPanel';
import { MeetingScheduler } from './components/MeetingScheduler';
import { NotificationBadge } from './components/NotificationBadge';
import { VirtualList } from './components/VirtualList';

const AVATAR_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
  '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E',
];

type View = 'home' | 'teams' | 'meetings' | 'team-detail';
type TeamTab = 'members' | 'scheduler' | 'meetings';

function getAvatarInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function pickAvatarColor(name: string) {
  const idx = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function App() {
  const [view, setView] = useState<View>('home');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamTab, setTeamTab] = useState<TeamTab>('members');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [, forceTick] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const addNotification = useCallback((notif: Omit<NotificationItem, 'id' | 'read' | 'timestamp'> & { timestamp?: number }) => {
    const item: NotificationItem = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      read: false,
      timestamp: notif.timestamp ?? Date.now(),
    };
    setNotifications(prev => [item, ...prev].slice(0, 100));
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      const tryRequest = () => Notification.requestPermission().catch(() => {});
      const timer = setTimeout(tryRequest, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let closed = false;

    const connect = () => {
      try {
        const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${proto}//${location.host}/ws`);
        wsRef.current = ws;

        ws.onmessage = (ev) => {
          try {
            const data: WSNotification = JSON.parse(ev.data);
            if (data.type === 'connected') return;

            const nType =
              data.type === 'meeting_reminder_15' ? 'reminder_15' :
              data.type === 'meeting_reminder_5' ? 'reminder_5' : 'created';

            const baseNotif = {
              type: nType as any,
              meetingId: data.meetingId!,
              title: data.title!,
              startTimeUTC: data.startTimeUTC!,
              endTimeUTC: data.endTimeUTC!,
              teamName: data.teamName!,
              minutesUntil: data.minutesUntil ?? 0,
              timestamp: data.timestamp,
            };
            addNotification(baseNotif);

            if ((nType === 'reminder_15' || nType === 'reminder_5') && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(`⏰ ${data.minutesUntil}分钟后开始：${data.title}`, {
                  body: `团队：${data.teamName}\n时间：${data.startTimeUTC} UTC`,
                  icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y=".9em" font-size="90"%3E⏰%3C/text%3E%3C/svg%3E',
                  tag: `mtg-${data.meetingId}-${nType}`,
                });
              } catch {}
            }
          } catch (e) {
            console.warn('WS消息解析失败:', e);
          }
        };

        ws.onclose = () => {
          if (!closed) {
            reconnectTimer = setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          try { ws?.close(); } catch {}
        };
      } catch {
        reconnectTimer = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      closed = true;
      clearTimeout(reconnectTimer);
      try { ws?.close(); } catch {}
    };
  }, [addNotification]);

  const loadTeams = useCallback(async () => {
    try {
      const res = await api.getTeams();
      setTeams(res.teams);
    } catch (e: any) {
      showToast(e.message || '加载团队列表失败', 'error');
    }
  }, [showToast]);

  const loadMeetings = useCallback(async (teamId?: string) => {
    try {
      const res = teamId ? await api.getMeetings(teamId) : await api.getUpcomingMeetings();
      setMeetings(res.meetings);
    } catch (e: any) {
      showToast(e.message || '加载会议列表失败', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadTeams();
    loadMeetings();
    const interval = setInterval(() => {
      loadMeetings();
      forceTick(t => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadTeams, loadMeetings]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      showToast('请输入团队名称', 'error');
      return;
    }
    try {
      const res = await api.createTeam(teamName.trim(), teamDesc.trim());
      setTeams(prev => [...prev, res.team]);
      setShowCreateTeamModal(false);
      setTeamName('');
      setTeamDesc('');
      showToast('团队创建成功！', 'success');
      openTeamDetail(res.team);
    } catch (e: any) {
      showToast(e.message || '创建团队失败', 'error');
    }
  };

  const openTeamDetail = (team: Team) => {
    setSelectedTeam(team);
    setView('team-detail');
    setTeamTab('members');
    loadMeetings(team.id);
    setMobileMenuOpen(false);
  };

  const handleTeamUpdated = (team: Team) => {
    setSelectedTeam(team);
    setTeams(prev => prev.map(t => t.id === team.id ? team : t));
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('确定删除该团队及其所有会议？')) return;
    try {
      await api.deleteTeam(teamId);
      setTeams(prev => prev.filter(t => t.id !== teamId));
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
        setView('home');
      }
      showToast('团队已删除', 'success');
    } catch (e: any) {
      showToast(e.message || '删除失败', 'error');
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm('确定删除此会议？')) return;
    try {
      await api.deleteMeeting(meetingId);
      setMeetings(prev => prev.filter(m => m.id !== meetingId));
      showToast('会议已删除', 'success');
    } catch (e: any) {
      showToast(e.message || '删除失败', 'error');
    }
  };

  const handleMeetingCreated = () => {
    loadMeetings(selectedTeam?.id);
    if (selectedTeam) loadTeams();
  };

  const teamById = useMemo(() => {
    const m: { [id: string]: Team } = {};
    teams.forEach(t => { m[t.id] = t; });
    return m;
  }, [teams]);

  const renderMeetingCard = (m: Meeting, showDelete = true) => {
    const [h] = m.startTimeUTC.split(':').map(Number);
    const minsUntil = getMinutesUntil(m.date, m.startTimeUTC);
    const team = teamById[m.teamId];
    const participants = m.participantIds
      .map(id => team?.members.find(x => x.id === id))
      .filter(Boolean) as any[];

    return (
      <div className="meeting-card" style={{ margin: '6px 8px' }}>
        <div className="meeting-time-badge">
          <div className="meeting-time-hour">{formatHour(h).slice(0, 5)}</div>
          <div className="meeting-time-min">
            {m.date.slice(5)} · {m.durationMinutes}分钟
          </div>
        </div>
        <div className="meeting-body">
          <div className="meeting-title">{m.title}</div>
          <div className="meeting-meta">
            <span>👥 {team?.name || '未知团队'}</span>
            <span>· {participants.length}人</span>
            {minsUntil >= 0 && (
              <span className={`meeting-countdown ${minsUntil < 30 ? 'countdown-soon' : 'countdown-normal'}`}>
                {formatCountdown(minsUntil)}
              </span>
            )}
            {minsUntil < 0 && (
              <span className="meeting-countdown countdown-normal">
                进行中/已结束
              </span>
            )}
          </div>
          {m.notes && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
              📝 {m.notes}
            </div>
          )}
        </div>
        {showDelete && (
          <div style={{ flexShrink: 0 }}>
            <button
              className="icon-btn delete"
              title="删除"
              onClick={() => handleDeleteMeeting(m.id)}
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    );
  };

  const browserTz = getBrowserTimezone();

  const renderHome = () => (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 24, marginBottom: 4 }}>👋 欢迎使用跨时区会议助手</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            自动计算时区交集，智能推荐最佳会议时段，让远程协作更高效
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateTeamModal(true)}>
          ➕ 创建团队
        </button>
      </div>

      {meetings.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="section-title">
            <span>🔔 即将开始的会议</span>
            <span className="chip chip-blue">{meetings.length} 个</span>
          </h3>
          {meetings.length > 50 ? (
            <VirtualList
              items={meetings.slice(0, 20)}
              itemHeight={92}
              height={Math.min(500, meetings.length * 92)}
              renderItem={(m) => renderMeetingCard(m)}
            />
          ) : (
            <div className="meeting-list">
              {meetings.slice(0, 20).map(m => (
                <React.Fragment key={m.id}>{renderMeetingCard(m)}</React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="section-title">
          <span>🏢 我的团队 ({teams.length})</span>
        </div>

        {teams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🌐</div>
            <div className="empty-state-text">
              您的浏览器时区检测为 <b style={{ color: 'var(--accent-blue)' }}>{browserTz}</b><br />
              创建第一个团队，开始跨时区协作吧！
            </div>
            <button className="btn btn-primary" onClick={() => setShowCreateTeamModal(true)}>
              创建团队
            </button>
          </div>
        ) : (
          <div className="team-list">
            {teams.map(team => (
              <div
                key={team.id}
                className="team-card"
                onClick={() => openTeamDetail(team)}
              >
                <div className="team-card-name">
                  <div
                    className="avatar"
                    style={{
                      display: 'inline-flex',
                      marginRight: 10,
                      backgroundColor: pickAvatarColor(team.name),
                      width: 40, height: 40, fontSize: 16,
                      verticalAlign: 'middle',
                    }}
                  >
                    {getAvatarInitials(team.name)}
                  </div>
                  {team.name}
                </div>
                <div className="team-card-desc">
                  {team.description || '暂无描述'}
                </div>
                <div className="team-card-meta">
                  <span className="member-count">👥 {team.members.length} 人</span>
                  <span>
                    📅 {meetings.filter(m => m.teamId === team.id).length} 会议
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderAllTeams = () => (
    <div>
      <div className="page-header">
        <h2>🏢 全部团队</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateTeamModal(true)}>
          ➕ 创建团队
        </button>
      </div>
      <div className="card">
        {teams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <div className="empty-state-text">暂无团队</div>
            <button className="btn btn-primary" onClick={() => setShowCreateTeamModal(true)}>
              创建团队
            </button>
          </div>
        ) : (
          <div className="team-list">
            {teams.map(team => (
              <div key={team.id} className="team-card" onClick={() => openTeamDetail(team)}>
                <div className="team-card-name">
                  <div
                    className="avatar"
                    style={{
                      display: 'inline-flex',
                      marginRight: 10,
                      backgroundColor: pickAvatarColor(team.name),
                      width: 40, height: 40, fontSize: 16,
                      verticalAlign: 'middle',
                    }}
                  >
                    {getAvatarInitials(team.name)}
                  </div>
                  {team.name}
                </div>
                <div className="team-card-desc">{team.description || '暂无描述'}</div>
                <div className="team-card-meta">
                  <span className="member-count">👥 {team.members.length} 人</span>
                  <button
                    className="icon-btn delete"
                    onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.id); }}
                  >
                    🗑️ 删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderAllMeetings = () => (
    <div>
      <div className="page-header">
        <h2>📅 全部会议</h2>
      </div>
      <div className="card">
        {meetings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-text">暂无会议</div>
          </div>
        ) : meetings.length > 100 ? (
          <VirtualList
            items={meetings}
            itemHeight={92}
            height={Math.min(700, meetings.length * 92)}
            renderItem={(m) => renderMeetingCard(m)}
          />
        ) : (
          <div className="meeting-list">
            {meetings.map(m => (
              <React.Fragment key={m.id}>{renderMeetingCard(m)}</React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderTeamDetail = () => {
    if (!selectedTeam) return null;
    const team = teams.find(t => t.id === selectedTeam.id) || selectedTeam;

    return (
      <div>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="team-detail-header">
            <div className="team-detail-info" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div
                className="avatar avatar-lg"
                style={{ backgroundColor: pickAvatarColor(team.name) }}
              >
                {getAvatarInitials(team.name)}
              </div>
              <div>
                <h2>{team.name}</h2>
                <p>{team.description || '暂无描述'}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary"
                onClick={() => { setView('home'); setSelectedTeam(null); }}
              >
                ← 返回首页
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteTeam(team.id)}
              >
                🗑️ 删除团队
              </button>
            </div>
          </div>

          <div className="tabs">
            <div
              className={`tab ${teamTab === 'members' ? 'active' : ''}`}
              onClick={() => setTeamTab('members')}
            >
              👥 成员管理 ({team.members.length})
            </div>
            <div
              className={`tab ${teamTab === 'scheduler' ? 'active' : ''}`}
              onClick={() => {
                setTeamTab('scheduler');
              }}
            >
              📊 会议排期
            </div>
            <div
              className={`tab ${teamTab === 'meetings' ? 'active' : ''}`}
              onClick={() => {
                setTeamTab('meetings');
                loadMeetings(team.id);
              }}
            >
              📅 团队会议 ({meetings.filter(m => m.teamId === team.id).length})
            </div>
          </div>
        </div>

        {teamTab === 'members' && (
          <TeamPanel
            team={team}
            onTeamUpdated={handleTeamUpdated}
            showToast={showToast}
          />
        )}

        {teamTab === 'scheduler' && (
          <MeetingScheduler
            team={team}
            onMeetingCreated={handleMeetingCreated}
            showToast={showToast}
          />
        )}

        {teamTab === 'meetings' && (
          <div className="card">
            <h3 className="section-title">
              <span>📅 团队会议</span>
            </h3>
            {(() => {
              const teamMeetings = meetings.filter(m => m.teamId === team.id);
              if (teamMeetings.length === 0) {
                return (
                  <div className="empty-state">
                    <div className="empty-state-icon">📅</div>
                    <div className="empty-state-text">暂无会议，去「会议排期」中创建吧</div>
                  </div>
                );
              }
              if (teamMeetings.length > 100) {
                return (
                  <VirtualList
                    items={teamMeetings}
                    itemHeight={92}
                    height={Math.min(600, teamMeetings.length * 92)}
                    renderItem={(m) => renderMeetingCard(m)}
                  />
                );
              }
              return (
                <div className="meeting-list">
                  {teamMeetings.map(m => (
                    <React.Fragment key={m.id}>{renderMeetingCard(m)}</React.Fragment>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  const currentTitle =
    view === 'home' ? '🏠 首页' :
    view === 'teams' ? '🏢 全部团队' :
    view === 'meetings' ? '📅 全部会议' :
    view === 'team-detail' && selectedTeam ? `👥 ${selectedTeam.name}` : '';

  return (
    <div className="app-root">
      <aside className={`sidebar ${isMobile ? (mobileMenuOpen ? 'open' : '') : (sidebarCollapsed ? 'collapsed' : '')}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">🕐</span>
          <span className="sidebar-title">跨时区会议助手</span>
        </div>
        <nav className="sidebar-nav">
          <div
            className={`nav-item ${view === 'home' ? 'active' : ''}`}
            onClick={() => { setView('home'); setSelectedTeam(null); setMobileMenuOpen(false); }}
          >
            <span>🏠</span><span>首页</span>
          </div>
          <div
            className={`nav-item ${view === 'teams' ? 'active' : ''}`}
            onClick={() => { setView('teams'); setSelectedTeam(null); setMobileMenuOpen(false); }}
          >
            <span>🏢</span><span>全部团队</span>
          </div>
          <div
            className={`nav-item ${view === 'meetings' ? 'active' : ''}`}
            onClick={() => { setView('meetings'); setSelectedTeam(null); setMobileMenuOpen(false); }}
          >
            <span>📅</span><span>全部会议</span>
          </div>

          {teams.length > 0 && (
            <>
              <div style={{ padding: '12px 10px 6px', fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                最近团队
              </div>
              {teams.slice(0, 8).map(team => (
                <div
                  key={team.id}
                  className={`nav-item ${view === 'team-detail' && selectedTeam?.id === team.id ? 'active' : ''}`}
                  onClick={() => openTeamDetail(team)}
                >
                  <div
                    className="avatar"
                    style={{
                      width: 24, height: 24, fontSize: 10,
                      backgroundColor: pickAvatarColor(team.name),
                    }}
                  >
                    {getAvatarInitials(team.name)}
                  </div>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.name}</span>
                </div>
              ))}
            </>
          )}
        </nav>
      </aside>

      {isMobile && mobileMenuOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 40,
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="main-content">
        <header className="topbar">
          <button
            className="menu-toggle"
            onClick={() => {
              if (isMobile) setMobileMenuOpen(o => !o);
              else setSidebarCollapsed(c => !c);
            }}
          >
            ☰
          </button>
          <h1 className="page-title">{currentTitle}</h1>
          <NotificationBadge
            notifications={notifications}
            onClear={markAllRead}
            onMarkRead={handleMarkRead}
          />
        </header>

        <main className="content-area">
          {view === 'home' && renderHome()}
          {view === 'teams' && renderAllTeams()}
          {view === 'meetings' && renderAllMeetings()}
          {view === 'team-detail' && renderTeamDetail()}
        </main>
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✓ ' : '⚠️ '}
          {toast.msg}
        </div>
      )}

      {showCreateTeamModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateTeamModal(false)}
        >
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">🏢 创建新团队</div>
              <button
                className="modal-close"
                onClick={() => setShowCreateTeamModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label className="label">团队名称 *</label>
                <input
                  className="input"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  placeholder="例如：产品研发组、国际市场团队..."
                  autoFocus
                />
              </div>
              <div className="form-row">
                <label className="label">团队描述</label>
                <textarea
                  className="textarea"
                  value={teamDesc}
                  onChange={e => setTeamDesc(e.target.value)}
                  placeholder="简要描述团队职责或成员构成"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateTeamModal(false)}
              >
                取消
              </button>
              <button className="btn btn-primary" onClick={handleCreateTeam}>
                ✓ 创建团队
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
