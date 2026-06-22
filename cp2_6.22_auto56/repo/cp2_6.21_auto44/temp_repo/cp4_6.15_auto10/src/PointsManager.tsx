import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Trophy, Plus, Minus, Download, Upload, Clock, Gift,
  Award, Medal, Star, Search, ChevronRight, X
} from 'lucide-react';
import { Participant, PointsLog, EventItem } from './types';
import { exportAsJSON, importFromJSON, generateId } from './data';

interface PointsManagerProps {
  participants: Participant[];
  onParticipantsChange: (participants: Participant[]) => void;
  pointsLogs: PointsLog[];
  onPointsLogsChange: (logs: PointsLog[]) => void;
  events: EventItem[];
  onShowToast: (message: string, type: 'success' | 'error') => void;
  onRefreshData: () => void;
}

interface RankedParticipant {
  id: string;
  name: string;
  points: number;
  rank: number;
  checkInCode: string;
}

const RankItem = React.memo(({
  participant,
  isSelected,
  onClick,
  isAnimated,
}: {
  participant: RankedParticipant;
  isSelected: boolean;
  onClick: () => void;
  isAnimated?: boolean;
}) => {
  const getRankStyle = () => {
    switch (participant.rank) {
      case 1:
        return {
          background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #F59E0B 100%)',
          color: '#fff',
          icon: <Star size={18} fill="#fff" />,
          ring: '2px solid #F59E0B',
        };
      case 2:
        return {
          background: 'linear-gradient(135deg, #9CA3AF 0%, #D1D5DB 50%, #9CA3AF 100%)',
          color: '#fff',
          icon: <Medal size={18} />,
          ring: '2px solid #9CA3AF',
        };
      case 3:
        return {
          background: 'linear-gradient(135deg, #CD7F32 0%, #E8A862 50%, #CD7F32 100%)',
          color: '#fff',
          icon: <Award size={18} />,
          ring: '2px solid #CD7F32',
        };
      default:
        return {
          background: '#F3F4F6',
          color: '#6B7280',
          icon: null,
          ring: 'none',
        };
    }
  };

  const rankStyle = getRankStyle();

  return (
    <div
      onClick={onClick}
      className={isAnimated ? 'animate-slide-in-up' : ''}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: participant.rank <= 3 ? '14px 16px' : '12px 16px',
        borderRadius: 'var(--radius-md)',
        background: isSelected
          ? 'linear-gradient(90deg, var(--color-primary-light), #fff)'
          : participant.rank <= 3
          ? 'transparent'
          : 'var(--color-card)',
        border: isSelected
          ? '1px solid var(--color-primary)'
          : participant.rank > 3
          ? '1px solid var(--color-border)'
          : 'none',
        cursor: 'pointer',
        transition: 'all var(--transition)',
        ...(participant.rank > 3 ? { borderTop: participant.rank > 4 ? '1px solid var(--color-border)' : 'none' } : {}),
      }}
      onMouseEnter={(e) => {
        if (participant.rank > 3) {
          e.currentTarget.style.background = '#F9FAFB';
        }
      }}
      onMouseLeave={(e) => {
        if (participant.rank > 3 && !isSelected) {
          e.currentTarget.style.background = 'var(--color-card)';
        }
      }}
    >
      <div
        style={{
          width: participant.rank <= 3 ? '40px' : '32px',
          height: participant.rank <= 3 ? '40px' : '32px',
          borderRadius: '50%',
          background: rankStyle.background,
          color: rankStyle.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          fontSize: participant.rank <= 3 ? '14px' : '13px',
          flexShrink: 0,
          boxShadow: rankStyle.ring !== 'none' ? `0 2px 8px rgba(0,0,0,0.1)` : 'none',
        }}
      >
        {rankStyle.icon || participant.rank}
      </div>

      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: participant.rank <= 3
            ? `linear-gradient(135deg, var(--color-primary) 0%, #6366F1 100%)`
            : 'linear-gradient(135deg, #E5E7EB, #F3F4F6)',
          color: participant.rank <= 3 ? '#fff' : 'var(--color-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '600',
          fontSize: '14px',
          flexShrink: 0,
        }}
      >
        {participant.name.charAt(0)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: isSelected || participant.rank <= 3 ? '600' : '500',
            color: 'var(--color-text)',
            marginBottom: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {participant.name}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
          签到码: {participant.checkInCode}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 12px',
          borderRadius: '999px',
          background: participant.points > 0
            ? participant.rank <= 3
              ? rankStyle.background
              : 'var(--color-primary-light)'
            : 'var(--color-bg)',
          color: participant.points > 0
            ? participant.rank <= 3
              ? '#fff'
              : 'var(--color-primary)'
            : 'var(--color-text-muted)',
          fontSize: '13px',
          fontWeight: '700',
          flexShrink: 0,
        }}
      >
        <Trophy size={12} />
        {participant.points}
      </div>

      {participant.rank <= 3 && (
        <ChevronRight size={16} style={{ color: rankStyle.color, flexShrink: 0 }} />
      )}
    </div>
  );
});

RankItem.displayName = 'RankItem';

const TimelineItem = React.memo(({
  log,
  isNew,
}: {
  log: PointsLog;
  isNew: boolean;
}) => {
  const date = new Date(log.timestamp);
  const dateStr = date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
  const timeStr = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={isNew ? 'animate-slide-in-up' : ''}
      style={{
        display: 'flex',
        gap: '12px',
        position: 'relative',
        paddingBottom: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: log.change > 0
              ? 'linear-gradient(135deg, #10B981, #34D399)'
              : 'linear-gradient(135deg, #EF4444, #F87171)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1,
          }}
        >
          {log.change > 0 ? <Plus size={14} /> : <Minus size={14} />}
        </div>
        <div
          style={{
            width: '2px',
            flex: 1,
            background: 'var(--color-border)',
            marginTop: '4px',
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          padding: '12px 14px',
          background: 'var(--color-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          marginBottom: '4px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '6px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
              {log.participantName}
            </span>
            {log.eventName && (
              <span
                style={{
                  marginLeft: '8px',
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  background: 'var(--color-bg)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {log.eventName}
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: '15px',
              fontWeight: '700',
              color: log.change > 0 ? 'var(--color-success)' : 'var(--color-error)',
            }}
          >
            {log.change > 0 ? '+' : ''}{log.change}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {log.reason}
          </span>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Clock size={11} />
            {dateStr} {timeStr}
          </span>
        </div>
      </div>
    </div>
  );
});

TimelineItem.displayName = 'TimelineItem';

const PointsManager: React.FC<PointsManagerProps> = ({
  participants,
  onParticipantsChange,
  pointsLogs,
  onPointsLogsChange,
  events,
  onShowToast,
  onRefreshData,
}) => {
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [pointsChange, setPointsChange] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [rankPage, setRankPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [importInputKey, setImportInputKey] = useState(0);
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set());

  const RANK_PAGE_SIZE = 20;
  const LOG_PAGE_SIZE = 30;

  const rankedParticipants = useMemo<RankedParticipant[]>(() => {
    const sorted = [...participants].sort((a, b) => b.points - a.points);
    let currentRank = 0;
    let lastPoints = -Infinity;
    return sorted.map((p, idx) => {
      if (p.points !== lastPoints) {
        currentRank = idx + 1;
        lastPoints = p.points;
      }
      return {
        ...p,
        rank: currentRank,
      };
    });
  }, [participants]);

  const filteredRanked = useMemo(() => {
    if (!searchQuery.trim()) return rankedParticipants;
    const q = searchQuery.toLowerCase();
    return rankedParticipants.filter(
      p => p.name.includes(q) || p.checkInCode.includes(q)
    );
  }, [rankedParticipants, searchQuery]);

  const showRankPagination = filteredRanked.length > 100;
  const totalRankPages = Math.ceil(filteredRanked.length / RANK_PAGE_SIZE);
  const paginatedRanked = useMemo(() => {
    if (!showRankPagination) return filteredRanked;
    const start = (rankPage - 1) * RANK_PAGE_SIZE;
    return filteredRanked.slice(start, start + RANK_PAGE_SIZE);
  }, [filteredRanked, rankPage, showRankPagination]);

  const participantLogs = useMemo(() => {
    if (selectedParticipant) {
      return pointsLogs.filter(l => l.participantId === selectedParticipant.id);
    }
    if (!logSearchQuery.trim()) return pointsLogs;
    const q = logSearchQuery.toLowerCase();
    return pointsLogs.filter(
      l => l.participantName.includes(q) ||
           l.reason.includes(q) ||
           (l.eventName && l.eventName.includes(q))
    );
  }, [selectedParticipant, pointsLogs, logSearchQuery]);

  const showLogPagination = participantLogs.length > 100;
  const totalLogPages = Math.ceil(participantLogs.length / LOG_PAGE_SIZE);
  const paginatedLogs = useMemo(() => {
    if (!showLogPagination) return participantLogs;
    const start = (logPage - 1) * LOG_PAGE_SIZE;
    return participantLogs.slice(start, start + LOG_PAGE_SIZE);
  }, [participantLogs, logPage, showLogPagination]);

  const totalPoints = useMemo(
    () => participants.reduce((sum, p) => sum + p.points, 0),
    [participants]
  );

  useEffect(() => {
    setRankPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setLogPage(1);
  }, [selectedParticipant, logSearchQuery]);

  const handleExport = useCallback(() => {
    exportAsJSON();
    onShowToast('数据导出成功', 'success');
  }, [onShowToast]);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const success = await importFromJSON(file);
    if (success) {
      onRefreshData();
      onShowToast('数据导入成功', 'success');
    } else {
      onShowToast('导入失败：文件格式错误', 'error');
    }
    setImportInputKey(k => k + 1);
  }, [onRefreshData, onShowToast]);

  const handlePointsChange = useCallback(() => {
    if (!selectedParticipant) {
      onShowToast('请先选择参与者', 'error');
      return;
    }
    const change = parseInt(pointsChange);
    if (isNaN(change) || change === 0) {
      onShowToast('请输入有效的积分变动值', 'error');
      return;
    }

    const newParticipants = participants.map(p =>
      p.id === selectedParticipant.id
        ? { ...p, points: p.points + change }
        : p
    );
    onParticipantsChange(newParticipants);

    const newLog: PointsLog = {
      id: generateId(),
      participantId: selectedParticipant.id,
      participantName: selectedParticipant.name,
      change,
      reason: changeReason.trim() || (change > 0 ? '管理员增加积分' : '管理员扣减积分'),
      timestamp: Date.now(),
    };
    onPointsLogsChange([newLog, ...pointsLogs]);

    setNewLogIds(prev => new Set(prev).add(newLog.id));
    setTimeout(() => {
      setNewLogIds(prev => {
        const next = new Set(prev);
        next.delete(newLog.id);
        return next;
      });
    }, 1000);

    const updated = newParticipants.find(p => p.id === selectedParticipant.id);
    if (updated) {
      setSelectedParticipant(updated);
    }

    onShowToast(
      `${selectedParticipant.name} ${change > 0 ? '增加' : '扣减'} ${Math.abs(change)} 积分`,
      'success'
    );
    setPointsChange('');
    setChangeReason('');
  }, [
    selectedParticipant, pointsChange, changeReason,
    participants, pointsLogs, onParticipantsChange,
    onPointsLogsChange, onShowToast
  ]);

  const topThree = filteredRanked.slice(0, 3);
  const restRanked = paginatedRanked.filter(p => p.rank > 3);

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: 'var(--color-text)',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Trophy size={32} style={{ color: 'var(--color-gold)' }} />
            积分管理
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            共 {participants.length} 位参与者，总积分 <strong style={{ color: 'var(--color-primary)' }}>{totalPoints}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <label
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-card)',
              color: 'var(--color-text)',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              border: '1px solid var(--color-border)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-card)'; }}
          >
            <Upload size={16} />
            导入
            <input
              key={importInputKey}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </label>
          <button
            onClick={handleExport}
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-card)',
              color: 'var(--color-text)',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--color-border)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-card)'; }}
          >
            <Download size={16} />
            导出
          </button>
        </div>
      </div>

      {topThree.length >= 3 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {[topThree[1], topThree[0], topThree[2]].map((p, displayIdx) => {
            const config = [
              { label: '银牌', rank: 2 },
              { label: '金牌', rank: 1 },
              { label: '铜牌', rank: 3 },
            ];
            const cfg = config[displayIdx];
            const colors = {
              1: { bg: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)', shadow: '0 8px 24px rgba(245,158,11,0.3)' },
              2: { bg: 'linear-gradient(135deg, #9CA3AF 0%, #D1D5DB 100%)', shadow: '0 8px 24px rgba(156,163,175,0.3)' },
              3: { bg: 'linear-gradient(135deg, #CD7F32 0%, #E8A862 100%)', shadow: '0 8px 24px rgba(205,127,50,0.3)' },
            };
            const c = colors[cfg.rank as 1 | 2 | 3];

            return (
              <div
                key={p.id}
                onClick={() => {
                  const sp = participants.find(x => x.id === p.id);
                  if (sp) setSelectedParticipant(sp);
                }}
                style={{
                  background: cfg.rank === 1 ? '#FFFBEB' : '#fff',
                  borderRadius: 'var(--radius-xl)',
                  padding: '24px',
                  textAlign: 'center',
                  boxShadow: c.shadow,
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                  marginTop: cfg.rank === 1 ? '-12px' : '12px',
                  border: `2px solid ${cfg.rank === 1 ? '#F59E0B' : 'transparent'}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    background: c.bg,
                    color: '#fff',
                    display: 'inline-block',
                    marginBottom: '12px',
                  }}
                >
                  {cfg.rank === 1 ? <Star size={12} fill="#fff" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} /> : null}
                  {cfg.label}
                </div>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: c.bg,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: '700',
                    margin: '0 auto 12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  {p.name.charAt(0)}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                  {p.name}
                </h3>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: '800',
                    background: c.bg,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {p.points} 分
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '24px',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            background: 'var(--color-card)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '700px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <h2
              style={{
                fontSize: '18px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Award size={22} style={{ color: 'var(--color-primary)' }} />
              排行榜
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '400',
                  color: 'var(--color-text-secondary)',
                }}
              >
                ({filteredRanked.length})
              </span>
            </h2>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索参与者"
                style={{
                  padding: '8px 12px 8px 36px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                  width: '180px',
                  background: 'var(--color-bg)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.background = '#fff';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.background = 'var(--color-bg)';
                }}
              />
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              paddingRight: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {paginatedRanked.slice(0, 3).map((p) => {
              const fullP = participants.find(x => x.id === p.id);
              return (
                <RankItem
                  key={p.id}
                  participant={p}
                  isSelected={selectedParticipant?.id === p.id}
                  onClick={() => fullP && setSelectedParticipant(fullP)}
                />
              );
            })}
            {restRanked.length > 0 && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {restRanked.map((p) => {
                  const fullP = participants.find(x => x.id === p.id);
                  return (
                    <RankItem
                      key={p.id}
                      participant={p}
                      isSelected={selectedParticipant?.id === p.id}
                      onClick={() => fullP && setSelectedParticipant(fullP)}
                    />
                  );
                })}
              </div>
            )}
            {paginatedRanked.length === 0 && (
              <div
                style={{
                  padding: '48px 16px',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: '14px',
                }}
              >
                暂无匹配的参与者
              </div>
            )}
          </div>

          {showRankPagination && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <button
                onClick={() => setRankPage(p => Math.max(1, p - 1))}
                disabled={rankPage === 1}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: rankPage === 1 ? 'var(--color-bg)' : 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                  cursor: rankPage === 1 ? 'not-allowed' : 'pointer',
                  color: rankPage === 1 ? 'var(--color-text-muted)' : 'var(--color-text)',
                }}
              >
                上一页
              </button>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                第 {rankPage} / {totalRankPages} 页
              </span>
              <button
                onClick={() => setRankPage(p => Math.min(totalRankPages, p + 1))}
                disabled={rankPage === totalRankPages}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: rankPage === totalRankPages ? 'var(--color-bg)' : 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                  cursor: rankPage === totalRankPages ? 'not-allowed' : 'pointer',
                  color: rankPage === totalRankPages ? 'var(--color-text-muted)' : 'var(--color-text)',
                }}
              >
                下一页
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              background: 'var(--color-card)',
              borderRadius: 'var(--radius-xl)',
              padding: '20px',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <h2
              style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Gift size={22} style={{ color: 'var(--color-secondary)' }} />
              积分调整
            </h2>

            {selectedParticipant ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg)',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-primary), #6366F1)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600',
                      fontSize: '18px',
                      flexShrink: 0,
                    }}
                  >
                    {selectedParticipant.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '600' }}>
                      {selectedParticipant.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      当前积分: <strong style={{ color: 'var(--color-primary)' }}>{selectedParticipant.points}</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedParticipant(null)}
                    style={{
                      padding: '4px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-text-muted)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-error)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                    积分变动值（正数增加，负数扣减）
                  </label>
                  <input
                    type="number"
                    value={pointsChange}
                    onChange={(e) => setPointsChange(e.target.value)}
                    placeholder="如：+10 或 -5"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: '14px',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                    变动原因（可选）
                  </label>
                  <input
                    type="text"
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder="请输入变动原因"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: '14px',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <button
                  onClick={handlePointsChange}
                  disabled={!pointsChange}
                  style={{
                    padding: '12px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: pointsChange
                      ? 'linear-gradient(135deg, var(--color-secondary) 0%, #FB923C 100%)'
                      : 'var(--color-border)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: pointsChange ? 'pointer' : 'not-allowed',
                    boxShadow: pointsChange ? 'var(--shadow-md)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (pointsChange) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pointsChange) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }
                  }}
                >
                  <Plus size={16} />
                  确认调整
                </button>
              </div>
            ) : (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: '14px',
                }}
              >
                <Trophy size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                请从左侧排行榜选择一位参与者
              </div>
            )}
          </div>

          <div
            style={{
              background: 'var(--color-card)',
              borderRadius: 'var(--radius-xl)',
              padding: '20px',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '400px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Clock size={22} style={{ color: 'var(--color-primary)' }} />
                {selectedParticipant ? `${selectedParticipant.name}的变动记录` : '全部变动记录'}
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: '400',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  ({participantLogs.length})
                </span>
              </h2>
              {!selectedParticipant && (
                <div style={{ position: 'relative' }}>
                  <Search
                    size={14}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-muted)',
                    }}
                  />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    placeholder="搜索记录"
                    style={{
                      padding: '6px 10px 6px 30px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: '12px',
                      width: '140px',
                      background: 'var(--color-bg)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.background = '#fff';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.background = 'var(--color-bg)';
                    }}
                  />
                </div>
              )}
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: '4px',
              }}
            >
              {paginatedLogs.length === 0 ? (
                <div
                  style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                    color: 'var(--color-text-muted)',
                    fontSize: '14px',
                  }}
                >
                  暂无积分变动记录
                </div>
              ) : (
                paginatedLogs.map((log) => (
                  <TimelineItem
                    key={log.id}
                    log={log}
                    isNew={newLogIds.has(log.id)}
                  />
                ))
              )}
            </div>

            {showLogPagination && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                <button
                  onClick={() => setLogPage(p => Math.max(1, p - 1))}
                  disabled={logPage === 1}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: logPage === 1 ? 'var(--color-bg)' : 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    fontSize: '12px',
                    cursor: logPage === 1 ? 'not-allowed' : 'pointer',
                    color: logPage === 1 ? 'var(--color-text-muted)' : 'var(--color-text)',
                  }}
                >
                  上一页
                </button>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {logPage}/{totalLogPages}
                </span>
                <button
                  onClick={() => setLogPage(p => Math.min(totalLogPages, p + 1))}
                  disabled={logPage === totalLogPages}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: logPage === totalLogPages ? 'var(--color-bg)' : 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    fontSize: '12px',
                    cursor: logPage === totalLogPages ? 'not-allowed' : 'pointer',
                    color: logPage === totalLogPages ? 'var(--color-text-muted)' : 'var(--color-text)',
                  }}
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 1.2fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PointsManager;
