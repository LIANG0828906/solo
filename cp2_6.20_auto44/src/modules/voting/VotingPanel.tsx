import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { useIdeasStore } from '../../store/ideasStore';
import { VoteStats } from './VoteStats';
import { Idea, VoteType, PRESET_TAGS } from '../../types';

type SortKey = 'total' | 'agree' | 'disagree' | 'time';

export const VotingPanel: React.FC<{ onGenerateReport?: () => void }> = ({ onGenerateReport }) => {
  const { ideas, voteIdea } = useIdeasStore();
  const [sortKey, setSortKey] = useState<SortKey>('total');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'charts' | 'stats'>('list');
  const [bouncingVotes, setBouncingVotes] = useState<Record<string, VoteType>>({});
  const [pressingVotes, setPressingVotes] = useState<Record<string, VoteType>>({});

  const allTags = useMemo(() => {
    const set = new Set<string>();
    ideas.forEach((i) => i.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [ideas]);

  const sortedIdeas = useMemo(() => {
    let filtered = ideas;
    if (filterTag) {
      filtered = filtered.filter((i) => i.tags.includes(filterTag));
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'total':
          return b.votes.agree + b.votes.disagree + b.votes.neutral - (a.votes.agree + a.votes.disagree + a.votes.neutral);
        case 'agree':
          return b.votes.agree - a.votes.agree;
        case 'disagree':
          return b.votes.disagree - a.votes.disagree;
        case 'time':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return sorted;
  }, [ideas, sortKey, filterTag]);

  const top10BarData = useMemo(() => {
    return [...ideas]
      .sort((a, b) => b.votes.agree + b.votes.neutral - (a.votes.agree + a.votes.neutral))
      .slice(0, 10)
      .map((i) => ({
        name: i.title.length > 6 ? i.title.slice(0, 6) + '...' : i.title,
        赞成: i.votes.agree,
        反对: i.votes.disagree,
        吃瓜: i.votes.neutral,
      }));
  }, [ideas]);

  const radarData = useMemo(() => {
    const data: Record<string, number> = {};
    PRESET_TAGS.forEach((tag) => (data[tag] = 0));
    ideas.forEach((idea) => {
      idea.tags.forEach((t) => {
        data[t] = (data[t] || 0) + idea.votes.agree + idea.votes.neutral;
      });
    });
    return PRESET_TAGS.filter((t) => data[t] > 0).map((t) => ({
      subject: t,
      value: data[t],
      fullMark: Math.max(...Object.values(data), 10),
    }));
  }, [ideas]);

  const handleVote = useCallback(
    (ideaId: string, voteType: VoteType) => {
      setBouncingVotes((prev) => ({ ...prev, [ideaId]: voteType }));
      setPressingVotes((prev) => ({ ...prev, [ideaId]: voteType }));
      voteIdea(ideaId, voteType);
      setTimeout(() => {
        setBouncingVotes((prev) => {
          const next = { ...prev };
          delete next[ideaId];
          return next;
        });
      }, 300);
      setTimeout(() => {
        setPressingVotes((prev) => {
          const next = { ...prev };
          delete next[ideaId];
          return next;
        });
      }, 150);
    },
    [voteIdea]
  );

  const voteBtnConfig: Record<VoteType, { label: string; emoji: string; color: string }> = {
    agree: { label: '赞成', emoji: '👍', color: 'rgba(34, 197, 94, 0.6)' },
    disagree: { label: '反对', emoji: '👎', color: 'rgba(239, 68, 68, 0.6)' },
    neutral: { label: '吃瓜', emoji: '🍉', color: 'rgba(251, 191, 36, 0.6)' },
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'rgba(17, 24, 39, 0.4)',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(17, 24, 39, 0.6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '20px' }}>📊</div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>投票中心</h2>
          </div>
          {onGenerateReport && (
            <button
              onClick={onGenerateReport}
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(249, 115, 22, 0.4)',
                background: 'rgba(249, 115, 22, 0.15)',
                color: '#fdba74',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📄 生成报告
            </button>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '4px',
            padding: '3px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '10px',
            marginBottom: '14px',
          }}
        >
          {(['list', 'charts', 'stats'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab ? 'rgba(249, 115, 22, 0.25)' : 'transparent',
                color: activeTab === tab ? '#fdba74' : '#94a3b8',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab === 'list' ? '📋 列表' : tab === 'charts' ? '📈 图表' : '📊 统计'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {([
              { k: 'total', label: '总票数' },
              { k: 'agree', label: '赞成' },
              { k: 'disagree', label: '反对' },
              { k: 'time', label: '最新' },
            ] as { k: SortKey; label: string }[]).map(({ k, label }) => (
              <button
                key={k}
                onClick={() => setSortKey(k)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: sortKey === k ? '1px solid rgba(249, 115, 22, 0.5)' : '1px solid rgba(255,255,255,0.08)',
                  background: sortKey === k ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.04)',
                  color: sortKey === k ? '#fdba74' : '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {allTags.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setFilterTag(null)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: filterTag === null ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255,255,255,0.08)',
                  background: filterTag === null ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.04)',
                  color: filterTag === null ? '#d8b4fe' : '#94a3b8',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                全部
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag === filterTag ? null : tag)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: filterTag === tag ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255,255,255,0.08)',
                    background: filterTag === tag ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.04)',
                    color: filterTag === tag ? '#d8b4fe' : '#94a3b8',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
        {activeTab === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedIdeas.map((idea: Idea, idx: number) => {
              const total = idea.votes.agree + idea.votes.disagree + idea.votes.neutral;
              const isBouncing = bouncingVotes[idea.id];
              const isPressing = pressingVotes[idea.id];
              return (
                <div
                  key={idea.id}
                  className="fade-in"
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '8px',
                        background: idx < 3
                          ? 'linear-gradient(135deg, #f97316, #ea580c)'
                          : 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: idx < 3 ? '#fff' : '#94a3b8',
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <h4
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#e2e8f0',
                            lineHeight: 1.4,
                          }}
                        >
                          {idea.title}
                        </h4>
                        <span style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {total} 票
                        </span>
                      </div>
                      {idea.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {idea.tags.map((t) => (
                            <span
                              key={t}
                              style={{
                                fontSize: '10px',
                                color: '#a78bfa',
                                background: 'rgba(168, 85, 247, 0.15)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(Object.keys(voteBtnConfig) as VoteType[]).map((type) => {
                      const cfg = voteBtnConfig[type];
                      const bouncing = isBouncing === type;
                      const pressing = isPressing === type;
                      return (
                        <button
                          key={type}
                          onClick={() => handleVote(idea.id, type)}
                          className={`vote-btn ${bouncing ? 'scale-bounce' : ''}`}
                          style={{
                            flex: 1,
                            padding: '6px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(255,255,255,0.04)',
                            color: '#cbd5e1',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                            transition: 'transform 0.15s ease, background 0.2s ease',
                            transform: pressing ? 'scale(0.85)' : 'scale(1)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = cfg.color;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                          }}
                        >
                          <span>{cfg.emoji}</span>
                          <span style={{ fontWeight: 600 }}>{idea.votes[type]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {sortedIdeas.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: '13px' }}>
                暂无符合条件的点子
              </div>
            )}
          </div>
        )}

        {activeTab === 'charts' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '12px' }}>
                TOP 10 点子票数排行
              </div>
              <div style={{ height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10BarData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="赞成" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
                    <Bar dataKey="吃瓜" stackId="a" fill="#fbbf24" isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
                    <Bar dataKey="反对" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {radarData.length >= 3 && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '12px' }}>
                  分类标签人气雷达
                </div>
                <div style={{ height: '260px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="70%">
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} />
                      <Radar
                        name="人气值"
                        dataKey="value"
                        stroke="#f97316"
                        fill="#f97316"
                        fillOpacity={0.4}
                        isAnimationActive={true}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#1e293b',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && <VoteStats />}
      </div>
    </div>
  );
};
