import { useEffect, useState } from 'react';
import { useAppStore } from './store';
import { socketClient } from './socketClient';
import { COLOR_MAP, GROUP_COLORS } from './types';

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);

  if (diff < 10) return '刚刚';
  if (diff < 60) return `${diff}秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

function calculateFatigueIndex(history: { lat: number; lng: number; time: number }[]): number {
  if (!history || history.length < 2) return 0;

  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const recentHistory = history.filter((h) => h.time >= oneMinuteAgo);

  if (recentHistory.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < recentHistory.length; i++) {
    const d = haversineDistance(
      recentHistory[i - 1].lat,
      recentHistory[i - 1].lng,
      recentHistory[i].lat,
      recentHistory[i].lng
    );
    totalDistance += d;
  }

  const maxExpectedDistance = 120;
  return Math.min(100, Math.round((totalDistance / maxExpectedDistance) * 100));
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getFatigueLevel(fatigue: number): 'low' | 'medium' | 'high' {
  if (fatigue >= 80) return 'high';
  if (fatigue >= 50) return 'medium';
  return 'low';
}

export default function Sidebar() {
  const {
    tourGroup,
    sidebarCollapsed,
    selectedMemberId,
    toggleSidebar,
    setSelectedMemberId,
    rollCallActive,
    rollCallEndTime,
    missingMembers,
  } = useAppStore();

  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStartRollCall = () => {
    if (tourGroup) {
      socketClient.startRollCall(tourGroup.id);
    }
  };

  const handleClearWarnings = () => {
    if (tourGroup) {
      socketClient.clearMissingWarnings(tourGroup.id);
    }
  };

  const members = tourGroup?.members || [];
  const sortedMembers = [...members].sort((a, b) => {
    if (a.missing && !b.missing) return -1;
    if (!a.missing && b.missing) return 1;
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    return b.lastUpdate - a.lastUpdate;
  });

  const remainingSeconds = rollCallEndTime
    ? Math.max(0, Math.ceil((rollCallEndTime - Date.now()) / 1000))
    : 0;

  return (
    <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div className="sidebar-title">团员状态</div>
          <div className="sidebar-subtitle">
            共 {members.length} 人 · 在线 {members.filter((m) => m.isOnline).length} 人
          </div>
        </div>
        <button
          className={`toggle-btn ${sidebarCollapsed ? 'rotated' : ''}`}
          onClick={toggleSidebar}
          title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          ◀▶
        </button>
      </div>

      <div className="sidebar-content">
        <div className="member-list">
          {sortedMembers.map((member) => {
            const color = COLOR_MAP[GROUP_COLORS[member.groupIndex]] || '#3B82F6';
            const fatigue = calculateFatigueIndex(member.history || []);
            const fatigueLevel = getFatigueLevel(fatigue);

            return (
              <div
                key={member.id}
                className={`member-item ${selectedMemberId === member.id ? 'selected' : ''}`}
                onClick={() => setSelectedMemberId(member.id)}
              >
                <div className="member-item-header">
                  <div
                    className="status-dot"
                    style={{
                      backgroundColor: member.isOnline ? '#10B981' : '#6B7280',
                      boxShadow: member.missing ? '0 0 6px #EF4444' : 'none',
                    }}
                  />
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      flexShrink: 0,
                    }}
                  />
                  <span className="member-name">{member.name}</span>
                  {member.missing && <span className="missing-indicator">失联</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="member-item-time">
                    {getRelativeTime(member.lastUpdate)}
                  </div>
                  <span className="join-code-text">{member.joinCode}</span>
                </div>
                <div className="fatigue-bar-container">
                  <span className="fatigue-label">疲劳</span>
                  <div className="fatigue-bar">
                    <div
                      className={`fatigue-bar-fill ${fatigueLevel}`}
                      style={{ width: `${fatigue}%` }}
                    />
                  </div>
                  <span className="fatigue-label">{fatigue}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sidebar-actions">
        {rollCallActive && (
          <div className="rollcall-timer">⏱️ 点名中... 剩余 {remainingSeconds}秒</div>
        )}
        <button
          className="rollcall-btn"
          onClick={handleStartRollCall}
          disabled={rollCallActive}
        >
          {rollCallActive ? '点名进行中...' : '🔔 一键点名'}
        </button>
        {missingMembers.length > 0 && (
          <button className="clear-warning-btn" onClick={handleClearWarnings}>
            清除失联警告 ({missingMembers.length})
          </button>
        )}
      </div>
    </div>
  );
}
