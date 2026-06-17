import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  Users,
  Check,
  BarChart3,
  PieChart as PieChartIcon,
  AlertCircle,
} from 'lucide-react';
import { useVoteApi } from '../hooks/useVoteApi';
import { BarChart } from './BarChart';
import { PieChart } from './PieChart';
import { formatRemainingTime, formatDateTime } from '../utils/time';

interface VoteDetailProps {
  topicId: string;
  onBack: () => void;
}

type ChartType = 'bar' | 'pie';

export function VoteDetail({ topicId, onBack }: VoteDetailProps) {
  const { getTopicWithMeta, submitVote, updateTopicStatuses } = useVoteApi();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [, setTick] = useState(0);

  const topicMeta = getTopicWithMeta(topicId);

  useEffect(() => {
    updateTopicStatuses();
    const interval = setInterval(() => {
      updateTopicStatuses();
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [updateTopicStatuses]);

  if (!topicMeta) {
    return (
      <div
        className="animate-fade-in"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            backgroundColor: 'var(--bg-card)',
            padding: '48px 32px',
            borderRadius: '16px',
            border: '1px solid var(--border-default)',
          }}
        >
          <AlertCircle
            size={48}
            style={{ color: 'var(--accent-danger)', marginBottom: '16px' }}
          />
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}
          >
            投票不存在
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              marginBottom: '24px',
            }}
          >
            该投票可能已被删除或链接无效
          </p>
          <button
            onClick={onBack}
            style={{
              padding: '10px 24px',
              backgroundColor: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                'var(--accent-primary-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
            }}
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const isOngoing = topicMeta.status === 'ongoing';
  const canVote = isOngoing && !topicMeta.userVoted;
  const showResults = topicMeta.userVoted || !isOngoing || topicMeta.totalVotes > 0;

  const handleSubmitVote = () => {
    if (!selectedOptionId || !canVote) return;
    submitVote(topicId, selectedOptionId);
    setSelectedOptionId(null);
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          padding: '20px 32px',
          borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'rgba(15, 15, 35, 0.85)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <button
            onClick={onBack}
            style={{
              padding: '10px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-hover)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.color = 'var(--accent-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-hover)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div
            style={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {topicMeta.title}
            </h1>
          </div>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          padding: '32px',
          maxWidth: '900px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '28px',
            border: '1px solid var(--border-default)',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '999px',
                backgroundColor: isOngoing
                  ? 'rgba(0, 212, 170, 0.12)'
                  : 'rgba(255, 107, 107, 0.12)',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isOngoing
                    ? 'var(--accent-success)'
                    : 'var(--accent-danger)',
                }}
                className={isOngoing ? 'animate-pulse-dot' : 'animate-blink-dot'}
              />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isOngoing
                    ? 'var(--accent-success)'
                    : 'var(--accent-danger)',
                }}
              >
                {isOngoing ? '进行中' : '已结束'}
              </span>
            </div>

            {topicMeta.userVoted && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(0, 212, 170, 0.12)',
                }}
              >
                <Check size={14} style={{ color: 'var(--accent-success)' }} />
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--accent-success)',
                  }}
                >
                  已投票
                </span>
              </div>
            )}
          </div>

          {topicMeta.description && (
            <p
              style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginBottom: '20px',
              }}
            >
              {topicMeta.description}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-default)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Clock
                size={16}
                style={{ color: 'var(--text-secondary)' }}
              />
              <span
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}
              >
                {isOngoing
                  ? `剩余 ${formatRemainingTime(topicMeta.deadline)}`
                  : `截止于 ${formatDateTime(topicMeta.deadline)}`}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Users
                size={16}
                style={{ color: 'var(--text-secondary)' }}
              />
              <span
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}
              >
                {topicMeta.totalVotes} 人参与 · {topicMeta.options.length} 个选项
              </span>
            </div>
          </div>
        </div>

        {canVote && (
          <div
            style={{
              marginBottom: '24px',
            }}
          >
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '16px',
              }}
            >
              请选择一个选项
            </h2>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              {topicMeta.options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                return (
                  <div
                    key={option.id}
                    onClick={() => setSelectedOptionId(option.id)}
                    style={{
                      width: '100%',
                      borderRadius: '12px',
                      padding: '20px',
                      backgroundColor: 'var(--bg-component)',
                      border: `1px solid ${
                        isSelected
                          ? 'var(--accent-success)'
                          : 'var(--border-hover)'
                      }`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor =
                          'var(--accent-primary)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor =
                          'var(--border-hover)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    {isSelected && (
                      <div
                        style={{
                          width: '4px',
                          alignSelf: 'stretch',
                          backgroundColor: 'var(--accent-success)',
                          borderRadius: '2px',
                          marginRight: '-12px',
                          marginLeft: '-16px',
                          marginTop: '-20px',
                          marginBottom: '-20px',
                        }}
                      />
                    )}
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: `2px solid ${
                          isSelected
                            ? 'var(--accent-success)'
                            : 'var(--border-hover)'
                        }`,
                        backgroundColor: isSelected
                          ? 'var(--accent-success)'
                          : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                      }}
                    >
                      {isSelected && (
                        <Check
                          size={14}
                          style={{ color: '#fff' }}
                          strokeWidth={3}
                        />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '15px',
                        color: 'var(--text-primary)',
                        fontWeight: isSelected ? 600 : 400,
                        flex: 1,
                      }}
                    >
                      {option.text}
                    </span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleSubmitVote}
              disabled={!selectedOptionId}
              style={{
                width: '160px',
                height: '44px',
                backgroundColor: selectedOptionId
                  ? 'var(--accent-success)'
                  : 'var(--border-hover)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: selectedOptionId ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (selectedOptionId) {
                  e.currentTarget.style.backgroundColor =
                    'var(--accent-success-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedOptionId) {
                  e.currentTarget.style.backgroundColor =
                    'var(--accent-success)';
                }
              }}
            >
              提交投票
            </button>
          </div>
        )}

        {showResults && (
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid var(--border-default)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                投票结果
              </h2>

              {topicMeta.totalVotes > 0 && (
                <div
                  style={{
                    display: 'flex',
                    backgroundColor: 'var(--bg-component)',
                    borderRadius: '8px',
                    padding: '4px',
                    gap: '4px',
                  }}
                >
                  <button
                    onClick={() => setChartType('bar')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor:
                        chartType === 'bar'
                          ? 'var(--accent-primary)'
                          : 'transparent',
                      color:
                        chartType === 'bar'
                          ? '#fff'
                          : 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <BarChart3 size={14} />
                    柱状图
                  </button>
                  <button
                    onClick={() => setChartType('pie')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor:
                        chartType === 'pie'
                          ? 'var(--accent-primary)'
                          : 'transparent',
                      color:
                        chartType === 'pie'
                          ? '#fff'
                          : 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <PieChartIcon size={14} />
                    饼图
                  </button>
                </div>
              )}
            </div>

            {topicMeta.totalVotes === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                }}
              >
                暂无投票数据
              </div>
            ) : chartType === 'bar' ? (
              <BarChart
                options={topicMeta.options}
                totalVotes={topicMeta.totalVotes}
                userOptionId={topicMeta.userOptionId}
              />
            ) : (
              <PieChart
                options={topicMeta.options}
                totalVotes={topicMeta.totalVotes}
                userOptionId={topicMeta.userOptionId}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
