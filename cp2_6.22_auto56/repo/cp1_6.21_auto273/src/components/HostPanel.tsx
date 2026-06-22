import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
  Legend,
} from 'recharts';
import { useSocket, Poll, VoteOption } from '../hooks/useSocket';
import { v4 as uuidv4 } from 'uuid';

const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#6366F1'];

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hour}:${minute}`;
}

function truncateText(text: string, maxLen: number = 20): string {
  return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
}

function HostPanel() {
  const socket = useSocket();

  const [question, setQuestion] = useState('');
  const [pollType, setPollType] = useState<'single' | 'multiple'>('single');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [currentPollId, setCurrentPollId] = useState<string | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/polls')
      .then(res => res.json())
      .then((data: Poll[]) => {
        setPolls(data);
        if (data.length > 0) {
          const active = data.find(p => p.status === 'active');
          if (active) {
            setCurrentPollId(active.id);
            setSelectedHistoryId(active.id);
          } else {
            setSelectedHistoryId(data[0].id);
          }
        }
      })
      .catch(err => console.error('获取投票列表失败:', err));
  }, []);

  useEffect(() => {
    if (!currentPollId) return;
    socket.joinPoll(currentPollId, 'host');
  }, [currentPollId, socket]);

  useEffect(() => {
    const cleanup = socket.onVoteUpdate((payload) => {
      setPolls(prev => prev.map(p =>
        p.id === payload.pollId
          ? { ...p, options: payload.options, totalVoters: payload.totalVoters }
          : p
      ));
    });
    return () => cleanup?.();
  }, [socket]);

  useEffect(() => {
    const cleanup = socket.onVoteStarted((poll) => {
      setPolls(prev => prev.map(p => p.id === poll.id ? { ...poll, status: 'active' } : p));
    });
    return () => cleanup?.();
  }, [socket]);

  useEffect(() => {
    const cleanup = socket.onVoteEnded((payload) => {
      setPolls(prev => prev.map(p =>
        p.id === payload.pollId
          ? { ...p, status: 'ended', endedAt: payload.endedAt }
          : p
      ));
    });
    return () => cleanup?.();
  }, [socket]);

  useEffect(() => {
    const cleanup = socket.onVoteCreated((poll) => {
      setPolls(prev => [poll, ...prev]);
    });
    return () => cleanup?.();
  }, [socket]);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const createPoll = async () => {
    if (!question.trim()) {
      alert('请输入投票问题');
      return;
    }
    const validOptions = options.filter(o => o.trim());
    if (validOptions.length < 2) {
      alert('请至少填写两个有效选项');
      return;
    }

    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          type: pollType,
          options: validOptions,
        }),
      });
      const newPoll: Poll = await res.json();
      setPolls(prev => [newPoll, ...prev]);
      setCurrentPollId(newPoll.id);
      setSelectedHistoryId(newPoll.id);
      setQuestion('');
      setOptions(['', '']);
    } catch (err) {
      console.error('创建投票失败:', err);
    }
  };

  const startCurrentPoll = () => {
    if (!currentPollId) return;
    socket.startVote(currentPollId);
    fetch(`/api/polls/${currentPollId}/start`, { method: 'PATCH' })
      .then(res => res.json())
      .then((poll: Poll) => {
        setPolls(prev => prev.map(p => p.id === poll.id ? poll : p));
      });
  };

  const endCurrentPoll = () => {
    if (!currentPollId) return;
    socket.endVote(currentPollId);
    fetch(`/api/polls/${currentPollId}/end`, { method: 'PATCH' })
      .then(res => res.json())
      .then((poll: Poll) => {
        setPolls(prev => prev.map(p => p.id === poll.id ? poll : p));
      });
  };

  const currentPoll = useMemo(() => {
    return polls.find(p => p.id === (selectedHistoryId || currentPollId)) || null;
  }, [polls, selectedHistoryId, currentPollId]);

  const sortedPolls = useMemo(() => {
    return [...polls].sort((a, b) => b.createdAt - a.createdAt);
  }, [polls]);

  const barChartData = useMemo(() => {
    if (!currentPoll) return [];
    const max = Math.max(...currentPoll.options.map(o => o.count), 1);
    return currentPoll.options.map((opt, idx) => {
      const ratio = idx / Math.max(currentPoll.options.length - 1, 1);
      const r = Math.round(0x3B + (0x8B - 0x3B) * ratio);
      const g = Math.round(0x82 + (0x5C - 0x82) * ratio);
      const b = Math.round(0xF6 + (0xF6 - 0xF6) * ratio);
      const r2 = Math.round(0x3B + (0x8B - 0x3B) * ratio);
      const g2 = Math.round(0x82 + (0x5C - 0x82) * ratio);
      const b2 = Math.round(0xF6 + (0xF6 - 0xF6) * ratio);
      const r3 = Math.round(r2 * 0.55 + 0x3F);
      const g3 = Math.round(g2 * 0.74 + 0x10);
      const b3 = Math.round(b2 * 0.96 + 0x01);
      return {
        name: truncateText(opt.text, 10),
        value: opt.count,
        fill: `rgb(${r},${g},${b})`,
        fillEnd: `rgb(${r3},${g3},${b3})`,
        fullName: opt.text,
        pct: max > 0 ? ((opt.count / max) * 100).toFixed(0) : '0',
      };
    });
  }, [currentPoll]);

  const pieChartData = useMemo(() => {
    if (!currentPoll) return [];
    const total = currentPoll.options.reduce((sum, o) => sum + o.count, 0);
    return currentPoll.options.map((opt, idx) => ({
      name: truncateText(opt.text, 8),
      value: opt.count,
      fullName: opt.text,
      percentage: total > 0 ? ((opt.count / total) * 100).toFixed(1) : '0.0',
      fill: PIE_COLORS[idx % PIE_COLORS.length],
    }));
  }, [currentPoll]);

  const voterLink = currentPollId ? `${window.location.origin}/voter/${currentPollId}` : '';

  const copyLink = () => {
    if (voterLink) {
      navigator.clipboard.writeText(voterLink).catch(() => {});
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0F172A' }}>
      {/* 左侧导航栏 */}
      <div style={{
        width: 240,
        background: '#1E293B',
        padding: '20px 0',
        borderRight: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <div style={{
          padding: '0 20px 20px',
          borderBottom: '1px solid #334155',
          marginBottom: 16,
        }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
            }}>📊</span>
            投票历史
          </h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
          {sortedPolls.length === 0 ? (
            <div style={{
              padding: 20,
              textAlign: 'center',
              color: '#64748B',
              fontSize: 13,
            }}>
              暂无投票记录
            </div>
          ) : (
            sortedPolls.map(poll => (
              <div
                key={poll.id}
                onClick={() => setSelectedHistoryId(poll.id)}
                style={{
                  padding: '12px 12px',
                  marginBottom: 4,
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: selectedHistoryId === poll.id || (!selectedHistoryId && poll.id === currentPollId)
                    ? 'rgba(59, 130, 246, 0.15)'
                    : 'transparent',
                  border: selectedHistoryId === poll.id || (!selectedHistoryId && poll.id === currentPollId)
                    ? '1px solid rgba(59, 130, 246, 0.3)'
                    : '1px solid transparent',
                  transition: 'all 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  if (!(selectedHistoryId === poll.id || (!selectedHistoryId && poll.id === currentPollId))) {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(selectedHistoryId === poll.id || (!selectedHistoryId && poll.id === currentPollId))) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#F8FAFC',
                  marginBottom: 6,
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {poll.question}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    background: poll.status === 'active'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : poll.status === 'ended'
                        ? 'rgba(100, 116, 139, 0.3)'
                        : 'rgba(245, 158, 11, 0.2)',
                    color: poll.status === 'active'
                      ? '#10B981'
                      : poll.status === 'ended'
                        ? '#94A3B8'
                        : '#F59E0B',
                  }}>
                    {poll.status === 'active' ? '进行中' : poll.status === 'ended' ? '已结束' : '待发起'}
                  </span>
                </div>
                <div style={{
                  fontSize: 12,
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <span>👥 {poll.totalVoters}人</span>
                  {poll.endedAt && <span>⏱ {formatTime(poll.endedAt)}</span>}
                  {!poll.endedAt && <span>⏱ {formatTime(poll.createdAt)}</span>}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #334155',
          marginTop: 12,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: socket.isConnected ? '#10B981' : '#EF4444',
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: socket.isConnected ? '#10B981' : '#EF4444',
              animation: socket.isConnected ? 'none' : 'pulse 1.5s infinite',
            }} />
            {socket.isConnected ? 'WebSocket已连接' : '连接中...'}
          </div>
        </div>
      </div>

      {/* 右侧主内容区 */}
      <div style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
        <h1 style={{
          fontSize: 26,
          fontWeight: 700,
          marginBottom: 24,
          color: '#F8FAFC',
        }}>🎤 主持人控制面板</h1>

        {/* 创建投票区域 */}
        <div style={{
          background: '#1E293B',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          border: '1px solid #334155',
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 20,
            color: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            ✏️ 创建新投票
          </h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: '#CBD5E1',
              marginBottom: 8,
            }}>投票问题</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="请输入投票问题，例如：您对本次会议的整体满意度如何？"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid #334155',
                background: '#0F172A',
                color: '#F8FAFC',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#334155'; }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: '#CBD5E1',
              marginBottom: 8,
            }}>投票类型</label>
            <div style={{ display: 'flex', gap: 12 }}>
              {(['single', 'multiple'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setPollType(type)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: pollType === type
                      ? '2px solid #3B82F6'
                      : '1px solid #334155',
                    background: pollType === type
                      ? 'rgba(59, 130, 246, 0.15)'
                      : '#0F172A',
                    color: pollType === type ? '#3B82F6' : '#CBD5E1',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {type === 'single' ? '🔘 单选' : '☑️ 多选'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: '#CBD5E1',
              marginBottom: 12,
            }}>投票选项（至少2个，最多10个）</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {options.map((opt, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                  }}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`选项 ${String.fromCharCode(65 + idx)}`}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid #334155',
                      background: '#0F172A',
                      color: '#F8FAFC',
                      fontSize: 14,
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#334155'; }}
                  />
                  <button
                    onClick={() => removeOption(idx)}
                    disabled={options.length <= 2}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      border: 'none',
                      background: options.length <= 2
                        ? 'rgba(239, 68, 68, 0.1)'
                        : 'rgba(239, 68, 68, 0.15)',
                      color: options.length <= 2 ? '#64748B' : '#EF4444',
                      fontSize: 18,
                      cursor: options.length <= 2 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addOption}
              disabled={options.length >= 10}
              style={{
                marginTop: 12,
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px dashed #475569',
                background: 'transparent',
                color: '#94A3B8',
                fontSize: 13,
                fontWeight: 600,
                cursor: options.length >= 10 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                if (options.length < 10) {
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.color = '#3B82F6';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#475569';
                e.currentTarget.style.color = '#94A3B8';
              }}
            >
              + 添加选项 {options.length}/10
            </button>
          </div>

          <button
            onClick={createPoll}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.3)';
            }}
          >
            🚀 创建投票
          </button>
        </div>

        {/* 当前投票控制区 */}
        {currentPoll && (
          <div style={{
            background: '#1E293B',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            border: '1px solid #334155',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 20,
              gap: 20,
              flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 8,
                }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    background: currentPoll.status === 'active'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : currentPoll.status === 'ended'
                        ? 'rgba(100, 116, 139, 0.3)'
                        : 'rgba(245, 158, 11, 0.2)',
                    color: currentPoll.status === 'active'
                      ? '#10B981'
                      : currentPoll.status === 'ended'
                        ? '#94A3B8'
                        : '#F59E0B',
                  }}>
                    {currentPoll.status === 'active' ? '● 进行中' : currentPoll.status === 'ended' ? '● 已结束' : '○ 待发起'}
                  </span>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    background: 'rgba(148, 163, 184, 0.15)',
                    color: '#94A3B8',
                  }}>
                    {currentPoll.type === 'single' ? '单选' : '多选'}
                  </span>
                  {currentPoll.status === 'ended' && (
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(139, 92, 246, 0.2))',
                      color: '#E879F9',
                      border: '1px solid rgba(232, 121, 249, 0.3)',
                    }}>
                      🏁 已结束
                    </span>
                  )}
                </div>
                <h2 style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#F8FAFC',
                  lineHeight: 1.4,
                }}>
                  {currentPoll.question}
                </h2>
                <div style={{
                  marginTop: 12,
                  fontSize: 13,
                  color: '#94A3B8',
                  display: 'flex',
                  gap: 20,
                  flexWrap: 'wrap',
                }}>
                  <span>👥 参与人数：<strong style={{ color: '#3B82F6', fontSize: 15 }}>{currentPoll.totalVoters}</strong> 人</span>
                  <span>📊 总票数：<strong style={{ color: '#8B5CF6', fontSize: 15 }}>
                    {currentPoll.options.reduce((s, o) => s + o.count, 0)}
                  </strong> 票</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {currentPoll.status === 'pending' && currentPoll.id === currentPollId && (
                  <button
                    onClick={startCurrentPoll}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    ▶️ 发起投票
                  </button>
                )}
                {currentPoll.status === 'active' && currentPoll.id === currentPollId && (
                  <button
                    onClick={endCurrentPoll}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    ⏹️ 结束投票
                  </button>
                )}
                {currentPoll.status !== 'pending' && (
                  <button
                    onClick={copyLink}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 10,
                      border: '1px solid #334155',
                      background: '#0F172A',
                      color: '#CBD5E1',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3B82F6';
                      e.currentTarget.style.color = '#3B82F6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#334155';
                      e.currentTarget.style.color = '#CBD5E1';
                    }}
                  >
                    🔗 复制投票链接
                  </button>
                )}
              </div>
            </div>

            {/* 图表区域 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 20,
              animation: 'chartEnter 0.5s ease-out',
            }}>
              {/* 柱状图 */}
              <div style={{
                background: '#0F172A',
                borderRadius: 12,
                padding: 20,
                border: '1px solid #334155',
                minHeight: 320,
              }}>
                <h4 style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#F8FAFC',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  📊 投票分布（柱状图）
                </h4>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barChartData}
                      margin={{ top: 30, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#94A3B8', fontSize: 12 }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#94A3B8', fontSize: 12 }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: 8,
                          color: '#F8FAFC',
                          fontSize: 13,
                        }}
                        labelStyle={{ color: '#CBD5E1', marginBottom: 4, fontWeight: 600 }}
                        formatter={(value: number, _name: string, props: any) => [
                          `${value} 票 (${props.payload.pct}%)`,
                          props.payload.fullName,
                        ]}
                        cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                      />
                      <Bar
                        dataKey="value"
                        radius={[6, 6, 0, 0]}
                        animationDuration={500}
                        label={{
                          position: 'top',
                          fill: '#F8FAFC',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {barChartData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={entry.fill}
                            style={{
                              background: `linear-gradient(180deg, ${entry.fill} 0%, ${entry.fillEnd} 100%)`,
                            }}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 饼图 */}
              <div style={{
                background: '#0F172A',
                borderRadius: 12,
                padding: 20,
                border: '1px solid #334155',
                minHeight: 320,
              }}>
                <h4 style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#F8FAFC',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  🥧 占比分析（饼图）
                </h4>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="42%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        animationDuration={500}
                        label={({ percentage }) => `${percentage}%`}
                        labelLine={{ stroke: '#475569', strokeWidth: 1 }}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={entry.fill}
                            stroke="#0F172A"
                            strokeWidth={2}
                          />
                        ))}
                        <LabelList
                          dataKey="percentage"
                          position="outside"
                          formatter={(value: string) => [`${value}%`, '#CBD5E1']}
                          style={{ fontSize: 12, fontWeight: 600 }}
                        />
                      </Pie>
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        iconSize={10}
                        wrapperStyle={{
                          paddingTop: 20,
                          background: 'rgba(30, 41, 59, 0.6)',
                          borderRadius: 12,
                          padding: '12px 16px',
                          marginTop: 10,
                        }}
                        formatter={(value: string, entry: any) => (
                          <span style={{
                            color: '#CBD5E1',
                            fontSize: 12,
                            fontWeight: 500,
                          }}>
                            {entry.payload.fullName} ({entry.payload.value}票)
                          </span>
                        )}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: 8,
                          color: '#F8FAFC',
                          fontSize: 13,
                        }}
                        formatter={(value: number, _name: string, props: any) => [
                          `${value} 票 (${props.payload.percentage}%)`,
                          props.payload.fullName,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {!currentPoll && (
          <div style={{
            background: '#1E293B',
            borderRadius: 16,
            padding: 60,
            border: '1px solid #334155',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 64,
              marginBottom: 20,
              opacity: 0.5,
            }}>📊</div>
            <h3 style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#F8FAFC',
              marginBottom: 8,
            }}>还没有投票</h3>
            <p style={{
              color: '#94A3B8',
              fontSize: 14,
            }}>
              请在上方创建您的第一个投票，开始实时互动吧！
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HostPanel;
