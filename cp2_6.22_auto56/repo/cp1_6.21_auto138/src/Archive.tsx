import React, { useState, useEffect } from 'react';
import { useWeeklyReport, ArchiveWeek, Entry, User } from './context';

const formatDate = (timestamp: number): string => {
  if (!timestamp) return '暂无';
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
};

const getUserById = (userId: string, contributors?: User[]): User => {
  if (contributors) {
    const found = contributors.find(u => u.id === userId);
    if (found) return found;
  }
  return { id: userId, name: '未知用户', color: '#94A3B8' };
};

const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

const ArchiveCard: React.FC<{
  weekData: ArchiveWeek;
  isExpanded: boolean;
  onToggle: () => void;
  entries?: Entry[];
}> = ({ weekData, isExpanded, onToggle, entries }) => {
  const [detailEntries, setDetailEntries] = useState<Entry[]>(entries || []);
  const { fetchArchives, showError } = useWeeklyReport();

  useEffect(() => {
    if (isExpanded && detailEntries.length === 0) {
      fetchArchives(weekData.week).then((data) => {
        if (data && 'entries' in data) {
          setDetailEntries(data.entries || []);
        }
      });
    }
  }, [isExpanded, weekData.week, detailEntries.length, fetchArchives]);

  return (
    <div style={{
      width: '280px',
      minHeight: isExpanded ? 'auto' : '200px',
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      transition: 'all 200ms ease-in-out',
      cursor: 'pointer',
    }}
      onMouseEnter={(e) => {
        if (!isExpanded) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
      onClick={onToggle}
    >
      <div style={{
        padding: '20px',
        background: `linear-gradient(135deg, ${weekData.contributors[0]?.color || '#3B82F6'}15 0%, #FFFFFF 100%)`,
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#1E293B',
          marginBottom: '16px',
        }}>
          {weekData.weekLabel}
        </h3>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {weekData.contributors.map((user) => (
            <div
              key={user.id}
              title={user.name}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: user.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '11px',
                fontWeight: 600,
                border: '2px solid white',
                marginLeft: weekData.contributors.indexOf(user) > 0 ? '-8px' : 0,
              }}
            >
              {user.name.charAt(0)}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>条目总数</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>
              {weekData.totalEntries}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>贡献人数</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>
              {weekData.contributorCount}
            </p>
          </div>
        </div>
      </div>

      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid #F1F5F9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '12px', color: '#64748B' }}>
          {weekData.lastEditTime ? `最近编辑: ${formatRelativeTime(weekData.lastEditTime)}` : '暂无编辑'}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748B"
          strokeWidth="2"
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease-in-out',
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isExpanded && detailEntries.length > 0 && (
        <div style={{
          padding: '16px 20px 20px',
          borderTop: '1px solid #F1F5F9',
          cursor: 'default',
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '16px' }}>
            本周编辑时间线
          </h4>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              left: '10px',
              top: '8px',
              bottom: '8px',
              width: '2px',
              backgroundColor: '#E2E8F0',
            }} />

            {detailEntries.map((entry, idx) => {
              const user = getUserById(entry.userId, weekData.contributors);
              const isLast = idx === detailEntries.length - 1;
              return (
                <div key={entry.id} style={{ display: 'flex', gap: '12px', paddingBottom: isLast ? 0 : '16px' }}>
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: user.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 700,
                      flexShrink: 0,
                      zIndex: 1,
                      border: '3px solid white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                        {user.name}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                        {formatRelativeTime(entry.timestamp)}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '12px',
                      color: '#64748B',
                      lineHeight: 1.6,
                      padding: '8px 12px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '6px',
                    }}>
                      {stripHtml(entry.content).substring(0, 100)}
                      {stripHtml(entry.content).length > 100 ? '...' : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isExpanded && detailEntries.length === 0 && (
        <div style={{
          padding: '24px 20px',
          borderTop: '1px solid #F1F5F9',
          textAlign: 'center',
          color: '#94A3B8',
          fontSize: '13px',
          cursor: 'default',
        }}>
          暂无条目数据
        </div>
      )}
    </div>
  );
};

const Archive: React.FC = () => {
  const { archives, fetchArchives } = useWeeklyReport();
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchArchives();
      setIsLoading(false);
    };
    load();
  }, [fetchArchives]);

  const displayArchives = archives.length > 0 ? archives : generatePlaceholderWeeks();

  function generatePlaceholderWeeks(): ArchiveWeek[] {
    const now = new Date();
    const placeholders: ArchiveWeek[] = [];
    for (let i = 0; i < 4; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i * 7);
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      const year = d.getUTCFullYear();
      placeholders.push({
        week: `${year}-${String(weekNo).padStart(2, '0')}`,
        weekLabel: `${year}年第${weekNo}周`,
        totalEntries: 0,
        contributorCount: 0,
        lastEditTime: 0,
        contributors: [],
        entries: [],
      });
    }
    return placeholders;
  }

  return (
    <div style={{ padding: '32px', flex: 1 }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>
          周报归档
        </h2>
        <p style={{ fontSize: '14px', color: '#64748B' }}>
          浏览过去4周的团队周报汇总
        </p>
      </div>

      {isLoading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          color: '#94A3B8',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ animation: 'spin 1s linear infinite', marginRight: '12px' }}>
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          </svg>
          加载中...
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
        }}>
          {displayArchives.map((weekData) => (
            <ArchiveCard
              key={weekData.week}
              weekData={weekData}
              isExpanded={expandedWeek === weekData.week}
              onToggle={() => setExpandedWeek(expandedWeek === weekData.week ? null : weekData.week)}
              entries={weekData.entries}
            />
          ))}
        </div>
      )}

      {displayArchives.length === 0 && !isLoading && (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: '#94A3B8',
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 16px', opacity: 0.5 }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>暂无归档数据</p>
          <p style={{ fontSize: '14px' }}>保存周报后将在这里显示归档</p>
        </div>
      )}
    </div>
  );
};

export default Archive;
