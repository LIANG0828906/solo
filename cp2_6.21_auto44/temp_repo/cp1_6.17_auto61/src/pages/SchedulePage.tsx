import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePollStore } from '../store/usePollStore';
import { formatTimeRange, generateSummary } from '../utils/scheduler';

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ fontSize: 'clamp(18px, 2vw, 24px)', letterSpacing: '2px' }}>
      {'★'.repeat(rating)}
      <span style={{ opacity: 0.3 }}>{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

function BarChart({
  data,
  maxScore,
}: {
  data: Array<{ option: { id: string; date: string; startTime: string; endTime: string }; score: number; availableCount: number; preferredCount: number }>;
  maxScore: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {data.map((item, index) => {
        const heightPercent = maxScore > 0 ? (item.score / maxScore) * 100 : 0;
        return (
          <div key={item.option.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                flex: 1,
                minWidth: '140px',
                fontSize: 'clamp(12px, 1.2vw, 14px)',
                color: '#e5e7eb',
              }}
            >
              {formatTimeRange(item.option)}
            </div>
            <div
              style={{
                flex: 2,
                height: '36px',
                background: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.max(heightPercent, 2)}%`,
                  background: `linear-gradient(90deg, #6366f1, #8b5cf6)`,
                  borderRadius: '8px',
                  transition: 'width 0.3s ease',
                  opacity: index === 0 ? 1 : 0.75,
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 'clamp(12px, 1.2vw, 14px)',
                  fontWeight: 600,
                  color: '#fff',
                }}
              >
                {item.score.toFixed(1)}
              </span>
            </div>
            <div
              style={{
                fontSize: 'clamp(11px, 1.1vw, 13px)',
                color: '#9ca3af',
                minWidth: '80px',
                textAlign: 'right',
              }}
            >
              {item.availableCount}人可参加
              {item.preferredCount > 0 && (
                <span style={{ color: '#2563eb' }}> ({item.preferredCount}优先)</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SchedulePage() {
  const { pollId } = useParams();
  const { polls, currentPoll, scheduleResult, fetchPolls, fetchPoll, fetchSchedule, loading } =
    usePollStore();
  const [selectedPollId, setSelectedPollId] = useState<string | null>(pollId || null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (pollId) {
      fetchPoll(pollId);
      fetchSchedule(pollId);
    } else {
      fetchPolls();
    }
  }, [pollId, fetchPoll, fetchPolls, fetchSchedule]);

  useEffect(() => {
    if (selectedPollId && !pollId) {
      fetchSchedule(selectedPollId);
    }
  }, [selectedPollId, pollId, fetchSchedule]);

  const handleCopy = async () => {
    if (!scheduleResult) return;
    await navigator.clipboard.writeText(generateSummary(scheduleResult));
    setCopied(true);
    setTimeout(() => setCopied(false), 500);
  };

  const displayResult = pollId ? scheduleResult : selectedPollId ? scheduleResult : null;
  const displayPoll = pollId ? currentPoll : selectedPollId ? polls.find((p) => p.shortId === selectedPollId || p.id === selectedPollId) : null;

  const maxScore = displayResult
    ? Math.max(...displayResult.optionScores.map((s) => s.score), 1)
    : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2
        style={{
          fontSize: 'clamp(20px, 2.5vw, 28px)',
          fontWeight: 700,
          color: '#f3f4f6',
        }}
      >
        智能排期结果
      </h2>

      {!pollId && (
        <div
          style={{
            background: '#2a2a40',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <p
            style={{
              fontSize: 'clamp(13px, 1.3vw, 15px)',
              color: '#9ca3af',
              marginBottom: '12px',
            }}
          >
            选择投票查看排期结果：
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {polls.map((poll) => (
              <button
                key={poll.id}
                onClick={() => setSelectedPollId(poll.shortId)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background:
                    selectedPollId === poll.shortId
                      ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                      : 'rgba(139, 92, 246, 0.15)',
                  border:
                    selectedPollId === poll.shortId
                      ? 'none'
                      : '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#f3f4f6',
                  fontSize: 'clamp(12px, 1.2vw, 14px)',
                  transition: 'all 0.3s ease',
                }}
              >
                {poll.title}
              </button>
            ))}
            {polls.length === 0 && (
              <Link
                to="/"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'rgba(139, 92, 246, 0.15)',
                  color: '#8b5cf6',
                  textDecoration: 'none',
                  fontSize: 'clamp(12px, 1.2vw, 14px)',
                }}
              >
                去创建投票 →
              </Link>
            )}
          </div>
        </div>
      )}

      {loading && !displayResult && (
        <p style={{ color: '#9ca3af' }}>加载排期结果中...</p>
      )}

      {displayResult && displayPoll && (
        <>
          <div
            style={{
              background: '#3b3b5c',
              borderRadius: '12px',
              padding: '28px',
              borderLeft: '4px solid #8b5cf6',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 'clamp(12px, 1.2vw, 14px)',
                    color: '#9ca3af',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  {displayPoll.title}
                </p>
                <h3
                  style={{
                    fontSize: 'clamp(22px, 2.8vw, 32px)',
                    fontWeight: 700,
                    color: '#f3f4f6',
                    marginBottom: '12px',
                  }}
                >
                  {displayResult.bestOption ? formatTimeRange(displayResult.bestOption) : '暂无可用时间'}
                </h3>
                <div>
                  <StarRating rating={displayResult.satisfactionRating} />
                  <span
                    style={{
                      marginLeft: '12px',
                      fontSize: 'clamp(13px, 1.3vw, 15px)',
                      color: '#9ca3af',
                    }}
                  >
                    满意度评分
                  </span>
                </div>
              </div>
              <button
                onClick={handleCopy}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  background: copied ? '#16a34a' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 'clamp(13px, 1.3vw, 15px)',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {copied ? '已复制!' : '📋 复制日程'}
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '24px',
                flexWrap: 'wrap',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div>
                <p style={{ fontSize: 'clamp(12px, 1.2vw, 14px)', color: '#9ca3af', marginBottom: '4px' }}>
                  最优得分
                </p>
                <p style={{ fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 700, color: '#8b5cf6' }}>
                  {displayResult.bestScore.toFixed(1)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 'clamp(12px, 1.2vw, 14px)', color: '#9ca3af', marginBottom: '4px' }}>
                  参与人数
                </p>
                <p style={{ fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 700, color: '#6366f1' }}>
                  {displayResult.totalMembers} 人
                </p>
              </div>
              <div>
                <p style={{ fontSize: 'clamp(12px, 1.2vw, 14px)', color: '#9ca3af', marginBottom: '4px' }}>
                  时间选项
                </p>
                <p style={{ fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 700, color: '#22c55e' }}>
                  {displayResult.optionScores.length} 个
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#2a2a40',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h4
              style={{
                fontSize: 'clamp(16px, 2vw, 20px)',
                fontWeight: 600,
                color: '#f3f4f6',
                marginBottom: '20px',
              }}
            >
              各选项满意度得分
            </h4>
            <BarChart data={displayResult.optionScores} maxScore={maxScore} />
          </div>
        </>
      )}

      {!selectedPollId && !pollId && polls.length === 0 && !loading && (
        <div
          style={{
            background: '#2a2a40',
            borderRadius: '12px',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>📊</p>
          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: '#9ca3af',
            }}
          >
            暂无投票数据，<Link to="/" style={{ color: '#8b5cf6' }}>创建一个投票</Link> 开始智能排期
          </p>
        </div>
      )}
    </div>
  );
}

export default SchedulePage;
