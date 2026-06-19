import { useState, useEffect, useMemo } from 'react';
import MemberList from './components/MemberList';
import MatchLog from './components/MatchLog';
import LeagueRanking from './components/LeagueRanking';
import { useChessStore } from './store';
import { Member, getLevel, getAvatarColor, getInitial } from './types';

type TabKey = 'members' | 'matches' | 'league';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'members', label: '会员管理', icon: '👥' },
  { key: 'matches', label: '对局记录', icon: '⚔️' },
  { key: 'league', label: '联赛排名', icon: '🏆' },
];

function debounce<T extends (...args: never[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('members');
  const { members, fetchMembers } = useChessStore();

  const [sidebarSearch, setSidebarSearch] = useState('');
  const [debouncedSidebarSearch, setDebouncedSidebarSearch] = useState('');
  const [selectedSidebarMember, setSelectedSidebarMember] = useState<Member | null>(
    null
  );

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const debouncedSidebarSet = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSidebarSearch(value);
      }, 300),
    []
  );

  useEffect(() => {
    debouncedSidebarSet(sidebarSearch as never);
  }, [sidebarSearch, debouncedSidebarSet]);

  const sidebarMembers = useMemo(() => {
    const sorted = [...members].sort((a, b) => b.elo - a.elo);
    if (!debouncedSidebarSearch.trim()) return sorted.slice(0, 50);
    const q = debouncedSidebarSearch.toLowerCase();
    return sorted
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [members, debouncedSidebarSearch]);

  const renderContent = () => {
    switch (activeTab) {
      case 'members':
        return (
          <MemberList
            onSelectMember={(m) => setSelectedSidebarMember(m)}
          />
        );
      case 'matches':
        return <MatchLog />;
      case 'league':
        return <LeagueRanking />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">♚</span>
          <span>格致国际象棋俱乐部</span>
        </div>
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span style={{ marginRight: '6px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="main-container">
        <div className="content-area">{renderContent()}</div>

        <aside className="sidebar">
          <div className="glass-panel">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#2c3e50',
                }}
              >
                🔍 会员快速搜索
              </h3>
              <span
                style={{
                  fontSize: '12px',
                  color: '#7f8c8d',
                  background: '#ecf0f1',
                  padding: '3px 10px',
                  borderRadius: '12px',
                }}
              >
                共 {members.length} 人
              </span>
            </div>

            <input
              type="text"
              className="search-input"
              placeholder="输入ID或姓名搜索..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
            />

            {selectedSidebarMember && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '14px',
                  background:
                    'linear-gradient(135deg, #ebf5fb, #d6eaf8)',
                  borderRadius: '12px',
                  border: '1px solid #aed6f1',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <div
                    className="avatar"
                    style={{
                      background: getAvatarColor(selectedSidebarMember.id),
                      width: '48px',
                      height: '48px',
                      fontSize: '20px',
                    }}
                  >
                    {getInitial(selectedSidebarMember.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#2c3e50' }}>
                      {selectedSidebarMember.name}
                    </div>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: '#5d6d7e',
                      }}
                    >
                      ID: {selectedSidebarMember.id}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span
                    className={`level-tag level-${getLevel(selectedSidebarMember.elo)}`}
                  >
                    {getLevel(selectedSidebarMember.elo)}
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: '#3498db',
                      fontSize: '18px',
                    }}
                  >
                    Elo: {selectedSidebarMember.elo}
                  </span>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
                  onClick={() => setSelectedSidebarMember(null)}
                >
                  清除选择
                </button>
              </div>
            )}

            <div className="quick-member-list">
              {sidebarMembers.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 10px',
                    color: '#95a5a6',
                    fontSize: '13px',
                  }}
                >
                  {members.length === 0 ? '暂无会员' : '未找到匹配会员'}
                </div>
              ) : (
                sidebarMembers.map((member) => {
                  const rankIndex = [...members]
                    .sort((a, b) => b.elo - a.elo)
                    .findIndex((m) => m.id === member.id);
                  const isSelected = selectedSidebarMember?.id === member.id;
                  return (
                    <div
                      key={member.id}
                      className="quick-member-item"
                      style={{
                        background: isSelected
                          ? 'rgba(52, 152, 219, 0.15)'
                          : undefined,
                      }}
                      onClick={() => setSelectedSidebarMember(member)}
                    >
                      <div
                        className="avatar"
                        style={{
                          background: getAvatarColor(member.id),
                          width: '36px',
                          height: '36px',
                          fontSize: '14px',
                        }}
                      >
                        {getInitial(member.name)}
                      </div>
                      <div className="quick-member-info">
                        <div className="quick-member-name">{member.name}</div>
                        <div className="quick-member-meta">
                          <span
                            className={`level-tag level-${getLevel(member.elo)}`}
                            style={{ fontSize: '10px', padding: '2px 7px' }}
                          >
                            {getLevel(member.elo)}
                          </span>
                          <span style={{ marginLeft: '6px' }}>
                            #{rankIndex + 1}
                          </span>
                        </div>
                      </div>
                      <div className="quick-member-elo">{member.elo}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
