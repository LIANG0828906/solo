import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket, Poll } from '../hooks/useSocket';

function VoterView() {
  const { voteId } = useParams<{ voteId: string }>();
  const socket = useSocket();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [voterId] = useState(() => `voter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animatingOptions, setAnimatingOptions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!voteId) {
      setError('无效的投票链接');
      setLoading(false);
      return;
    }

    fetch(`/api/polls/${voteId}`)
      .then(res => {
        if (!res.ok) throw new Error('投票不存在');
        return res.json();
      })
      .then((data: Poll) => {
        setPoll(data);
        setLoading(false);
        socket.joinPoll(voteId, 'voter');
      })
      .catch(err => {
        setError(err.message || '加载失败');
        setLoading(false);
      });
  }, [voteId, socket]);

  useEffect(() => {
    if (!voteId) return;

    const cleanup1 = socket.onVoteStarted((startedPoll) => {
      if (startedPoll.id === voteId) {
        setPoll(startedPoll);
      }
    });

    const cleanup2 = socket.onVoteEnded((payload) => {
      if (payload.pollId === voteId) {
        setPoll(prev => prev ? { ...prev, status: 'ended', endedAt: payload.endedAt } : null);
      }
    });

    const cleanup3 = socket.onVoteUpdate((payload) => {
      if (payload.pollId === voteId) {
        setPoll(prev => prev ? { ...prev, options: payload.options, totalVoters: payload.totalVoters } : null);
      }
    });

    return () => {
      cleanup1?.();
      cleanup2?.();
      cleanup3?.();
    };
  }, [voteId, socket]);

  const handleOptionClick = (optionId: string) => {
    if (submitted || !poll || poll.status !== 'active') return;

    if (poll.type === 'single') {
      setSelectedOptions(new Set([optionId]));
      setAnimatingOptions(new Set([optionId]));
      setTimeout(() => setAnimatingOptions(new Set()), 200);
    } else {
      setSelectedOptions(prev => {
        const next = new Set(prev);
        if (next.has(optionId)) {
          next.delete(optionId);
        } else {
          next.add(optionId);
          setAnimatingOptions(a => new Set([...a, optionId]));
          setTimeout(() => {
            setAnimatingOptions(a => {
              const n = new Set(a);
              n.delete(optionId);
              return n;
            });
          }, 200);
        }
        return next;
      });
    }
  };

  const handleSubmit = () => {
    if (!voteId || selectedOptions.size === 0 || submitted || !poll) return;

    socket.submitVote({
      pollId: voteId,
      optionIds: Array.from(selectedOptions),
      voterId,
    });

    setSubmitted(true);
  };

  const totalVotes = useMemo(() => {
    return poll?.options.reduce((sum, o) => sum + o.count, 0) || 0;
  }, [poll]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0F172A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}>
        <div style={{
          color: '#94A3B8',
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 24,
            height: 24,
            border: '3px solid #334155',
            borderTopColor: '#3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          加载投票中...
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0F172A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}>
        <div style={{
          background: '#1E293B',
          padding: 40,
          borderRadius: 16,
          textAlign: 'center',
          maxWidth: 400,
          width: '100%',
          border: '1px solid #334155',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>😕</div>
          <h2 style={{ color: '#F8FAFC', fontSize: 20, marginBottom: 8 }}>出错了</h2>
          <p style={{ color: '#94A3B8', fontSize: 14 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)',
      padding: '20px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        maxWidth: 520,
        width: '100%',
        animation: 'slideUp 0.3s ease-out',
      }}>
        {/* 投票卡片 */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 12,
          padding: '32px 28px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}>
          {/* 状态标签 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                background: poll.status === 'active'
                  ? 'rgba(16, 185, 129, 0.12)'
                  : poll.status === 'ended'
                    ? 'rgba(100, 116, 139, 0.15)'
                    : 'rgba(245, 158, 11, 0.12)',
                color: poll.status === 'active'
                  ? '#059669'
                  : poll.status === 'ended'
                    ? '#64748B'
                    : '#D97706',
              }}>
                {poll.status === 'active' ? '● 投票进行中' : poll.status === 'ended' ? '● 已结束' : '○ 等待开始'}
              </span>
              <span style={{
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                background: poll.type === 'single'
                  ? 'rgba(59, 130, 246, 0.12)'
                  : 'rgba(139, 92, 246, 0.12)',
                color: poll.type === 'single' ? '#2563EB' : '#7C3AED',
              }}>
                {poll.type === 'single' ? '单选' : '多选'}
              </span>
            </div>
            {poll.status === 'ended' && (
              <span style={{
                padding: '4px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(139, 92, 246, 0.15))',
                color: '#9333EA',
                border: '1px solid rgba(147, 51, 234, 0.25)',
              }}>
                🏁 已结束
              </span>
            )}
          </div>

          {/* 问题 */}
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#0F172A',
            lineHeight: 1.5,
            marginBottom: 24,
          }}>
            {poll.question}
          </h2>

          {/* 选项列表 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {poll.options.map((option, idx) => {
              const isSelected = selectedOptions.has(option.id);
              const isAnimating = animatingOptions.has(option.id);
              const showResult = submitted || poll.status === 'ended';
              const percentage = totalVotes > 0 ? ((option.count / totalVotes) * 100) : 0;

              return (
                <div
                  key={option.id}
                  onClick={() => handleOptionClick(option.id)}
                  style={{
                    position: 'relative',
                    padding: '14px 44px 14px 48px',
                    borderRadius: 12,
                    border: isSelected
                      ? '2px solid #3B82F6'
                      : '2px solid #E2E8F0',
                    background: isSelected
                      ? 'rgba(59, 130, 246, 0.06)'
                      : '#F8FAFC',
                    cursor: (!submitted && poll.status === 'active') ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    if (!submitted && poll.status === 'active' && !isSelected) {
                      e.currentTarget.style.background = '#E2E8F0';
                      e.currentTarget.style.borderColor = '#CBD5E1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = isSelected ? 'rgba(59, 130, 246, 0.06)' : '#F8FAFC';
                      e.currentTarget.style.borderColor = isSelected ? '#3B82F6' : '#E2E8F0';
                    }
                  }}
                >
                  {/* 进度条背景 (仅展示结果时显示) */}
                  {showResult && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${percentage}%`,
                      background: isSelected
                        ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.18), rgba(139, 92, 246, 0.12))'
                        : 'rgba(148, 163, 184, 0.15)',
                      borderRadius: 10,
                      transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    }} />
                  )}

                  {/* 选项序号 */}
                  <span style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: isSelected
                      ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
                      : showResult && percentage > 0
                        ? `linear-gradient(135deg, rgba(59, 130, 246, ${0.3 + percentage * 0.005}), rgba(139, 92, 246, ${0.2 + percentage * 0.005}))`
                        : '#E2E8F0',
                    color: isSelected ? '#FFFFFF' : showResult && percentage > 0 ? '#FFFFFF' : '#475569',
                    fontWeight: 700,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    zIndex: 1,
                  }}>
                    {String.fromCharCode(65 + idx)}
                  </span>

                  {/* 选项文本 */}
                  <span style={{
                    position: 'relative',
                    fontSize: 15,
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? '#1E40AF' : '#1E293B',
                    zIndex: 1,
                    display: 'block',
                    lineHeight: 1.4,
                  }}>
                    {option.text}
                  </span>

                  {/* 勾选标记 */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: `translateY(-50%) scale(${isAnimating ? 1.4 : 1})`,
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: isAnimating ? 'checkmarkScale 0.15s ease-out' : 'none',
                      zIndex: 1,
                      transition: 'transform 0.15s ease-out',
                    }}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}

                  {/* 票数和百分比 (提交后或结束时显示) */}
                  {showResult && !isSelected && (
                    <div style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      zIndex: 1,
                    }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#334155',
                      }}>
                        {percentage.toFixed(1)}%
                      </span>
                      <span style={{
                        fontSize: 12,
                        color: '#64748B',
                      }}>
                        ({option.count}票)
                      </span>
                    </div>
                  )}
                  {showResult && isSelected && (
                    <div style={{
                      position: 'absolute',
                      right: 48,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      zIndex: 1,
                    }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#2563EB',
                      }}>
                        {percentage.toFixed(1)}%
                      </span>
                      <span style={{
                        fontSize: 12,
                        color: '#3B82F6',
                      }}>
                        ({option.count}票)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 提交按钮或状态提示 */}
          {poll.status === 'pending' && (
            <div style={{
              padding: 16,
              borderRadius: 10,
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              textAlign: 'center',
              color: '#92400E',
              fontSize: 14,
              fontWeight: 600,
            }}>
              ⏳ 投票尚未开始，请等待主持人发起
            </div>
          )}

          {poll.status === 'active' && !submitted && (
            <button
              onClick={handleSubmit}
              disabled={selectedOptions.size === 0}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: 12,
                border: 'none',
                background: selectedOptions.size > 0
                  ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
                  : '#CBD5E1',
                color: selectedOptions.size > 0 ? '#FFFFFF' : '#94A3B8',
                fontSize: 15,
                fontWeight: 700,
                cursor: selectedOptions.size > 0 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                boxShadow: selectedOptions.size > 0 ? '0 4px 14px rgba(59, 130, 246, 0.3)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (selectedOptions.size > 0) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = selectedOptions.size > 0 ? '0 4px 14px rgba(59, 130, 246, 0.3)' : 'none';
              }}
            >
              {poll.type === 'multiple' && selectedOptions.size > 0
                ? `✅ 提交投票 (已选 ${selectedOptions.size} 项)`
                : selectedOptions.size > 0
                  ? '✅ 提交投票'
                  : poll.type === 'single'
                    ? '请选择一个选项'
                    : '请选择至少一个选项'}
            </button>
          )}

          {poll.status === 'active' && submitted && (
            <div style={{
              padding: 16,
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#059669',
                marginBottom: 4,
              }}>
                ✅ 投票已提交成功！
              </div>
              <div style={{
                fontSize: 13,
                color: '#10B981',
              }}>
                感谢您的参与，结果将实时更新
              </div>
            </div>
          )}

          {poll.status === 'ended' && !submitted && (
            <div style={{
              padding: 16,
              borderRadius: 10,
              background: 'rgba(100, 116, 139, 0.1)',
              border: '1px solid rgba(100, 116, 139, 0.3)',
              textAlign: 'center',
              color: '#475569',
              fontSize: 14,
              fontWeight: 600,
            }}>
              🏁 投票已结束，以下是最终结果
            </div>
          )}

          {poll.status === 'ended' && submitted && (
            <div style={{
              padding: 16,
              borderRadius: 10,
              background: 'rgba(100, 116, 139, 0.1)',
              border: '1px solid rgba(100, 116, 139, 0.3)',
              textAlign: 'center',
              color: '#475569',
              fontSize: 14,
              fontWeight: 600,
            }}>
              🏁 投票已结束，感谢您的参与！
            </div>
          )}
        </div>

        {/* 底部统计信息 */}
        <div style={{
          marginTop: 16,
          textAlign: 'center',
          color: '#94A3B8',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          flexWrap: 'wrap',
        }}>
          <span>👥 参与人数：<strong style={{ color: '#CBD5E1' }}>{poll.totalVoters}</strong> 人</span>
          <span>📊 总票数：<strong style={{ color: '#CBD5E1' }}>{totalVotes}</strong> 票</span>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: socket.isConnected ? '#10B981' : '#EF4444',
            }} />
            {socket.isConnected ? '实时连接' : '连接断开'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default VoterView;
