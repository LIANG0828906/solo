import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VoteData } from '@/types';
import { useWebSocket } from '@/hooks/useWebSocket';
import { BarChart } from './BarChart';
import { DonutChart } from './DonutChart';

interface VoteRoomProps {
  ws: ReturnType<typeof useWebSocket>;
}

export function VoteRoom({ ws }: VoteRoomProps) {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [localVoted, setLocalVoted] = useState(false);
  const [vote, setVote] = useState<VoteData | null>(null);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (roomId && ws.connected && !hasJoined) {
      ws.sendJoinVote(roomId);
      setHasJoined(true);
    }
  }, [roomId, ws.connected, hasJoined, ws]);

  useEffect(() => {
    if (ws.currentVote && ws.currentVote.roomId === roomId?.toUpperCase()) {
      setVote(ws.currentVote);
    }
  }, [ws.currentVote, roomId]);

  useEffect(() => {
    if (roomId) {
      const votedKey = `voted_${roomId.toUpperCase()}`;
      const stored = sessionStorage.getItem(votedKey);
      if (stored !== null) {
        setLocalVoted(true);
        setSelectedOption(Number(stored));
      }
    }
  }, [roomId]);

  const isActive = vote?.status === 'active';
  const isEnded = vote?.status === 'ended';
  const voted = ws.voted || localVoted;

  const handleSubmitVote = () => {
    if (roomId && selectedOption !== null && isActive && !voted) {
      ws.sendSubmitVote(roomId, selectedOption);
      setLocalVoted(true);
    }
  };

  const handleEndVote = () => {
    if (roomId && isActive) {
      ws.sendEndVote(roomId);
    }
  };

  const handleCopyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId.toUpperCase()).catch(() => {});
    }
  };

  if (!vote) {
    return (
      <div style={loadingContainerStyle}>
        <div style={loadingCardStyle}>
          <div style={spinnerStyle} />
          <p style={loadingTextStyle}>加载投票信息中...</p>
          <button onClick={() => navigate('/')} style={backBtnStyle}>
            ← 返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageContainerStyle}>
      <div style={headerBarStyle}>
        <button onClick={() => navigate('/')} style={backBtnStyle}>
          ← 返回首页
        </button>
        <div style={connectionStatusStyle}>
          <span
            style={{
              ...statusDotStyle,
              background: ws.connected ? '#4ade80' : '#ef4444',
            }}
          />
          <span style={statusTextStyle}>
            {ws.connected ? '已连接' : '连接中...'}
          </span>
        </div>
      </div>

      <div style={mainCardStyle}>
        <div style={voteHeaderStyle}>
          <div style={voteHeaderTopStyle}>
            <span
              style={{
                ...statusBadgeStyle,
                ...(isActive ? activeBadge : endedBadge),
              }}
            >
              {isActive ? '● 进行中' : '● 已结束'}
            </span>

            <div style={roomIdContainerStyle} onClick={handleCopyRoomId}>
              <span style={roomIdLabelStyle}>房间ID:</span>
              <span style={roomIdValueStyle}>{vote.roomId}</span>
              <span style={copyIconStyle}>📋</span>
            </div>
          </div>

          <h1 style={voteTitleStyle}>{vote.title}</h1>

          <div style={statsBarStyle}>
            <div style={statItemStyle}>
              <span style={statIconStyle}>👥</span>
              <div>
                <span style={statValueBigStyle}>{vote.totalVotes}</span>
                <span style={statLabelSmallStyle}>人参与</span>
              </div>
            </div>
            <div style={statDividerStyle} />
            <div style={statItemStyle}>
              <span style={statIconStyle}>⏱️</span>
              <div>
                <span
                  style={{
                    ...statValueBigStyle,
                    color: isActive && vote.remainingTime <= 10 ? '#ef4444' : 'var(--accent)',
                    animation: isActive && vote.remainingTime <= 10 ? 'pulse 1s ease-in-out infinite' : 'none',
                  }}
                >
                  {vote.remainingTime}s
                </span>
                <span style={statLabelSmallStyle}>剩余</span>
              </div>
            </div>
            <div style={statDividerStyle} />
            <div style={statItemStyle}>
              <span style={statIconStyle}>📊</span>
              <div>
                <span style={statValueBigStyle}>{vote.options.length}</span>
                <span style={statLabelSmallStyle}>选项</span>
              </div>
            </div>
          </div>

          {isActive && (
            <div style={progressContainerStyle}>
              <div
                style={{
                  ...progressFillStyle,
                  width: `${(vote.remainingTime / vote.duration) * 100}%`,
                  background:
                    vote.remainingTime / vote.duration <= 0.2
                      ? 'linear-gradient(135deg, #ef4444, #f87171)'
                      : 'var(--accent-gradient)',
                  transition: 'width 1s linear',
                }}
              />
            </div>
          )}
        </div>

        <div className="vote-room-content" style={contentGridStyle}>
          <div className="vote-room-left" style={leftPanelStyle}>
            <h2 style={sectionTitleStyle}>
              {isEnded ? '🏆 最终结果' : '🗳️ 投票选项'}
            </h2>

            <div style={optionsContainerStyle}>
              {vote.options.map((option, index) => {
                const isWinner = isEnded && vote.winnerIndex === index;
                const isSelected = selectedOption === index;
                const percentage =
                  vote.totalVotes > 0 ? (option.votes / vote.totalVotes) * 100 : 0;

                return (
                  <div
                    key={option.index}
                    onClick={() => !voted && isActive && setSelectedOption(index)}
                    style={{
                      ...optionCardStyle,
                      ...(isSelected && !voted ? selectedOptionStyle : {}),
                      ...(voted && isSelected ? votedOptionStyle : {}),
                      ...(isWinner ? winnerOptionStyle : {}),
                      cursor: voted || !isActive ? 'default' : 'pointer',
                    }}
                  >
                    <div style={optionTopRowStyle}>
                      <div style={optionLabelRowStyle}>
                        <span
                          style={{
                            ...optionLetterStyle,
                            ...(isSelected ? selectedLetterStyle : {}),
                            ...(isWinner ? winnerLetterStyle : {}),
                          }}
                        >
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span style={optionTextStyle}>{option.text}</span>
                      </div>

                      {isWinner && <span style={winnerCrownStyle}>👑</span>}
                    </div>

                    <div style={optionBottomRowStyle}>
                      <div style={optionProgressContainerStyle}>
                        <div
                          style={{
                            ...optionProgressFillStyle,
                            width: `${percentage}%`,
                            background: isWinner
                              ? 'linear-gradient(135deg, #ffd700, #ffec8b)'
                              : 'var(--accent-gradient)',
                            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        />
                      </div>
                      <div style={voteCountsStyle}>
                        <span style={optionVoteCountStyle}>{option.votes}票</span>
                        <span style={optionPercentStyle}>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {isActive && (
              <div style={actionAreaStyle}>
                {!voted ? (
                  <button
                    onClick={handleSubmitVote}
                    disabled={selectedOption === null}
                    style={{
                      ...submitVoteBtnStyle,
                      ...(selectedOption === null ? disabledBtnStyle : {}),
                    }}
                  >
                    {selectedOption === null
                      ? '请选择一个选项'
                      : '✅ 提交投票'}
                  </button>
                ) : (
                  <div style={votedMsgStyle}>
                    <span style={votedIconStyle}>✓</span>
                    <span>您已完成投票，等待结果揭晓...</span>
                  </div>
                )}

                <button
                  onClick={handleEndVote}
                  style={endVoteBtnStyle}
                >
                  ⏹ 手动结束投票
                </button>
              </div>
            )}
          </div>

          <div className="vote-room-right" style={rightPanelStyle}>
            <h2 style={sectionTitleStyle}>
              {isEnded ? '📈 最终统计' : '📊 实时结果'}
            </h2>

            <div style={chartSectionStyle}>
              <h3 style={chartSubtitleStyle}>柱状图 - 得票分布</h3>
              <BarChart
                options={vote.options}
                totalVotes={vote.totalVotes}
                winnerIndex={vote.winnerIndex}
                showWinner={isEnded}
              />
            </div>

            {isEnded && (
              <div style={chartSectionStyle}>
                <h3 style={chartSubtitleStyle}>圆环图 - 占比分析</h3>
                <DonutChart options={vote.options} totalVotes={vote.totalVotes} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const loadingContainerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
};

const loadingCardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius)',
  padding: '48px 36px',
  boxShadow: 'var(--shadow)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '20px',
};

const spinnerStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  border: '4px solid rgba(233, 69, 96, 0.2)',
  borderTopColor: 'var(--accent)',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

const loadingTextStyle: React.CSSProperties = {
  fontSize: '16px',
  color: 'var(--text-secondary)',
};

const pageContainerStyle: React.CSSProperties = {
  minHeight: '100vh',
  padding: '20px',
  maxWidth: '1400px',
  margin: '0 auto',
  animation: 'fadeIn 0.3s ease-out',
};

const headerBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
};

const backBtnStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  color: 'var(--text-secondary)',
  fontSize: '13px',
  fontWeight: 500,
  padding: '8px 16px',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
};

const connectionStatusStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: 'rgba(255, 255, 255, 0.05)',
  padding: '8px 14px',
  borderRadius: '20px',
};

const statusDotStyle: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
};

const statusTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-secondary)',
};

const mainCardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow)',
  overflow: 'hidden',
};

const voteHeaderStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(233, 69, 96, 0.1) 0%, rgba(22, 33, 62, 0) 100%)',
  padding: '28px 32px',
  borderBottom: '1px solid var(--border-color)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const voteHeaderTopStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '12px',
};

const statusBadgeStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 600,
};

const activeBadge: React.CSSProperties = {
  background: 'rgba(74, 222, 128, 0.15)',
  color: '#4ade80',
  animation: 'pulse 2s ease-in-out infinite',
};

const endedBadge: React.CSSProperties = {
  background: 'rgba(156, 163, 175, 0.15)',
  color: '#9ca3af',
};

const roomIdContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: 'rgba(233, 69, 96, 0.1)',
  padding: '6px 12px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const roomIdLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-muted)',
};

const roomIdValueStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: 'var(--accent)',
  fontFamily: 'monospace',
  letterSpacing: '1px',
};

const copyIconStyle: React.CSSProperties = {
  fontSize: '12px',
  opacity: 0.6,
};

const voteTitleStyle: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 800,
  color: 'var(--text-primary)',
  lineHeight: 1.3,
};

const statsBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '24px',
  flexWrap: 'wrap',
};

const statItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const statIconStyle: React.CSSProperties = {
  fontSize: '24px',
};

const statValueBigStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: 'var(--text-primary)',
  display: 'block',
};

const statLabelSmallStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-muted)',
  marginLeft: '4px',
};

const statDividerStyle: React.CSSProperties = {
  width: '1px',
  height: '36px',
  background: 'var(--border-color)',
};

const progressContainerStyle: React.CSSProperties = {
  height: '6px',
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '3px',
  overflow: 'hidden',
};

const progressFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '3px',
};

const contentGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '0',
};

const leftPanelStyle: React.CSSProperties = {
  padding: '28px 32px',
  borderRight: '1px solid var(--border-color)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const rightPanelStyle: React.CSSProperties = {
  padding: '28px 32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: '4px',
};

const optionsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const optionCardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: '10px',
  padding: '14px 18px',
  border: '2px solid transparent',
  transition: 'all 0.25s ease',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const selectedOptionStyle: React.CSSProperties = {
  background: 'rgba(233, 69, 96, 0.1)',
  borderColor: 'var(--accent)',
  transform: 'scale(1.01)',
};

const votedOptionStyle: React.CSSProperties = {
  background: 'rgba(233, 69, 96, 0.08)',
  borderColor: 'rgba(233, 69, 96, 0.5)',
};

const winnerOptionStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 236, 139, 0.05) 100%)',
  borderColor: '#ffd700',
  animation: 'glow 2s ease-in-out infinite, scaleIn 0.5s ease-out',
  transform: 'scale(1.02)',
};

const optionTopRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};

const optionLabelRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flex: 1,
};

const optionLetterStyle: React.CSSProperties = {
  width: '30px',
  height: '30px',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.08)',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '13px',
  fontWeight: 700,
  flexShrink: 0,
  transition: 'all 0.2s ease',
};

const selectedLetterStyle: React.CSSProperties = {
  background: 'var(--accent-gradient)',
  color: '#ffffff',
};

const winnerLetterStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #ffd700, #ffec8b)',
  color: '#1a1a2e',
};

const optionTextStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 500,
  color: 'var(--text-primary)',
  lineHeight: 1.4,
};

const winnerCrownStyle: React.CSSProperties = {
  fontSize: '20px',
  animation: 'pulse 1.5s ease-in-out infinite',
};

const optionBottomRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const optionProgressContainerStyle: React.CSSProperties = {
  flex: 1,
  height: '6px',
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '3px',
  overflow: 'hidden',
};

const optionProgressFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '3px',
};

const voteCountsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  minWidth: '90px',
  justifyContent: 'flex-end',
};

const optionVoteCountStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-secondary)',
  fontWeight: 500,
};

const optionPercentStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--accent)',
};

const actionAreaStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginTop: '8px',
  paddingTop: '16px',
  borderTop: '1px solid var(--border-color)',
};

const submitVoteBtnStyle: React.CSSProperties = {
  background: 'var(--accent-gradient)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  padding: '14px 24px',
  borderRadius: '10px',
  transition: 'all 0.2s ease',
};

const disabledBtnStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.1)',
  color: 'var(--text-muted)',
  cursor: 'not-allowed',
};

const votedMsgStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  background: 'rgba(74, 222, 128, 0.1)',
  color: '#4ade80',
  padding: '14px 20px',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: 500,
  animation: 'fadeIn 0.3s ease-out',
};

const votedIconStyle: React.CSSProperties = {
  width: '22px',
  height: '22px',
  borderRadius: '50%',
  background: '#4ade80',
  color: '#1a1a2e',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  fontWeight: 700,
};

const endVoteBtnStyle: React.CSSProperties = {
  background: 'rgba(239, 68, 68, 0.1)',
  color: '#ef4444',
  fontSize: '13px',
  fontWeight: 500,
  padding: '10px 18px',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
};

const chartSectionStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.02)',
  borderRadius: '10px',
  padding: '16px 20px',
};

const chartSubtitleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '8px',
};
