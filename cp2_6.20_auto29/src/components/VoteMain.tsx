import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import {
  VoteData,
  VoteOption,
  RankingItem,
  RankingUpdateData,
  WeightSubmission,
} from '../types';
import RankingBarChart from './RankingBarChart';
import BoxPlotChart from './BoxPlotChart';

interface VoteResponse extends VoteData {
  rankings: RankingItem[];
}

const VoteMain: React.FC = () => {
  const { voteId } = useParams<{ voteId: string }>();
  const [vote, setVote] = useState<VoteResponse | null>(null);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeOptionId, setActiveOptionId] = useState<string | null>(null);
  const [previousRanks, setPreviousRanks] = useState<Record<string, number>>({});
  const [rankChangeAnimation, setRankChangeAnimation] = useState<Record<string, 'up' | 'down' | null>>({});

  const socketRef = useRef<Socket | null>(null);
  const voterIdRef = useRef<string>(
    (() => {
      const stored = localStorage.getItem('voterId');
      if (stored) return stored;
      const newId = uuidv4();
      localStorage.setItem('voterId', newId);
      return newId;
    })()
  );

  useEffect(() => {
    if (!voteId) return;

    const socket = io('ws://localhost:8000', {
      transports: ['websocket'],
      path: '/socket.io/',
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      socket.emit('join_vote', { voteId });
    });

    socket.on('vote_state', (data: VoteResponse) => {
      setVote(data);
      setIsLoading(false);
      const initialWeights: Record<string, number> = {};
      data.options.forEach((opt) => {
        initialWeights[opt.id] = 5;
      });
      setWeights(initialWeights);

      const ranks: Record<string, number> = {};
      data.rankings.forEach((r) => {
        ranks[r.optionId] = r.rank;
      });
      setPreviousRanks(ranks);
    });

    socket.on('ranking_update', (data: RankingUpdateData) => {
      setVote((prev) => {
        if (!prev) return prev;

        const newRanks: Record<string, number> = {};
        data.rankings.forEach((r) => {
          newRanks[r.optionId] = r.rank;
        });

        const animations: Record<string, 'up' | 'down' | null> = {};
        data.rankings.forEach((r) => {
          const prevRank = previousRanks[r.optionId];
          if (prevRank !== undefined) {
            if (r.rank < prevRank) animations[r.optionId] = 'up';
            else if (r.rank > prevRank) animations[r.optionId] = 'down';
          }
        });
        setRankChangeAnimation(animations);

        setTimeout(() => {
          setRankChangeAnimation({});
        }, 1500);

        setPreviousRanks(newRanks);

        return {
          ...prev,
          rankings: data.rankings,
        };
      });
    });

    socket.on('error', (err: { message: string }) => {
      setError(err.message);
      setIsLoading(false);
    });

    socket.on('connect_error', () => {
      setError('无法连接到服务器，请检查后端是否启动');
      setIsLoading(false);
    });

    const fetchVote = async () => {
      try {
        const res = await axios.get(`/api/votes/${voteId}`);
        setVote(res.data);
        const initialWeights: Record<string, number> = {};
        res.data.options.forEach((opt: VoteOption) => {
          initialWeights[opt.id] = 5;
        });
        setWeights(initialWeights);

        const ranks: Record<string, number> = {};
        res.data.rankings.forEach((r: RankingItem) => {
          ranks[r.optionId] = r.rank;
        });
        setPreviousRanks(ranks);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || '加载投票失败');
        setIsLoading(false);
      }
    };

    fetchVote();

    return () => {
      socket.disconnect();
    };
  }, [voteId]);

  const handleWeightChange = useCallback((optionId: string, value: number) => {
    const clamped = Math.max(1, Math.min(10, value));
    setWeights((prev) => ({
      ...prev,
      [optionId]: clamped,
    }));
  }, []);

  const handleSliderChange = useCallback((optionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    handleWeightChange(optionId, parseInt(e.target.value, 10));
  }, [handleWeightChange]);

  const handleInputChange = useCallback((optionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      handleWeightChange(optionId, value);
    }
  }, [handleWeightChange]);

  const handleSubmit = useCallback(async () => {
    if (!vote || !voteId || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const submission: WeightSubmission = {
      voteId,
      voterId: voterIdRef.current,
      weights,
    };

    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('submit_weights', submission);
      } else {
        setError('WebSocket未连接，请刷新页面重试');
      }
    } catch (err: any) {
      setError(err.message || '提交失败');
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  }, [vote, voteId, weights, isSubmitting]);

  const sortedRankings = useMemo(() => {
    if (!vote) return [];
    return [...vote.rankings].sort((a, b) => a.rank - b.rank);
  }, [vote]);

  const getSliderBackground = (value: number) => {
    const percentage = ((value - 1) / 9) * 100;
    return `linear-gradient(to right, #63b3ed 0%, #3182ce ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`;
  };

  const getRankBorderColor = (optionId: string) => {
    const anim = rankChangeAnimation[optionId];
    if (anim === 'up') return '#38a169';
    if (anim === 'down') return '#e53e3e';
    return 'transparent';
  };

  const getRankTransform = (optionId: string) => {
    const anim = rankChangeAnimation[optionId];
    if (anim === 'up') return 'translateY(-4px)';
    if (anim === 'down') return 'translateY(4px)';
    return 'translateY(0)';
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return { bg: '#FFD700', color: '#744210' };
    if (rank === 2) return { bg: '#C0C0C0', color: '#2d3748' };
    if (rank === 3) return { bg: '#CD7F32', color: '#fff' };
    return { bg: '#e2e8f0', color: '#4a5568' };
  };

  if (isLoading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <p style={{ color: '#4a5568', marginTop: 16 }}>加载投票中...</p>
      </div>
    );
  }

  if (error && !vote) {
    return (
      <div style={loadingContainerStyle}>
        <div style={{ color: '#e53e3e', fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: '#1a365d', marginBottom: 8 }}>加载失败</h2>
        <p style={{ color: '#4a5568' }}>{error}</p>
      </div>
    );
  }

  if (!vote) {
    return (
      <div style={loadingContainerStyle}>
        <p style={{ color: '#4a5568' }}>投票不存在</p>
      </div>
    );
  }

  const sortedOptions = [...vote.options].sort((a, b) => a.order - b.order);

  return (
    <div style={containerStyle} className="vote-main-container">
      <style>{mobileStyles}</style>

      <div style={headerStyle}>
        <h1 style={titleStyle}>{vote.title}</h1>
        {vote.description && (
          <p style={descriptionStyle}>{vote.description}</p>
        )}
        <p style={voteIdStyle}>投票ID: {voteId}</p>
      </div>

      {error && (
        <div style={errorBannerStyle}>
          {error}
        </div>
      )}

      <div style={sectionTitleStyle}>为每个选项分配权重分数（1-10分）</div>

      <div style={optionsGridStyle}>
        {sortedOptions.map((option, idx) => (
          <div
            key={option.id}
            style={{
              ...optionCardStyle,
              transform: activeOptionId === option.id ? 'scale(1.02)' : 'scale(1)',
              borderColor: getRankBorderColor(option.id),
              transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
              boxShadow: activeOptionId === option.id
                ? '0 4px 16px rgba(49, 130, 206, 0.15)'
                : '0 2px 8px rgba(0,0,0,0.08)',
            }}
            onMouseEnter={() => setActiveOptionId(option.id)}
            onMouseLeave={() => setActiveOptionId(null)}
          >
            <div style={optionHeaderStyle}>
              <span style={optionIndexStyle}>#{idx + 1}</span>
              <span style={optionNameStyle}>{option.name}</span>
            </div>
            {option.description && (
              <p style={optionDescStyle}>{option.description}</p>
            )}

            <div style={sliderContainerStyle}>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={weights[option.id] ?? 5}
                onChange={(e) => handleSliderChange(option.id, e)}
                style={{
                  ...sliderStyle,
                  background: getSliderBackground(weights[option.id] ?? 5),
                }}
              />
              <div style={scoreDisplayStyle}>
                <input
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  value={weights[option.id] ?? 5}
                  onChange={(e) => handleInputChange(option.id, e)}
                  style={scoreInputStyle}
                />
                <span style={scoreLabelStyle}>分</span>
              </div>
            </div>

            <div style={sliderMarksStyle}>
              <span style={markStyle}>1</span>
              <span style={markStyle}>5</span>
              <span style={markStyle}>10</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        style={{
          ...submitBtnStyle,
          transform: isSubmitting ? 'scale(0.95)' : 'scale(1)',
          opacity: isSubmitting ? 0.8 : 1,
        }}
      >
        {isSubmitting ? (
          <>
            <span style={spinnerInlineStyle}></span>
            提交中...
          </>
        ) : (
          '提交权重'
        )}
      </button>

      <div style={{ height: 40 }} />

      <div style={sectionTitleStyle}>实时排名结果</div>

      <div style={rankingListStyle}>
        {sortedRankings.map((item) => {
          const badgeColors = getRankBadgeColor(item.rank);
          return (
            <div
              key={item.optionId}
              style={{
                ...rankingItemStyle,
                borderLeftColor: badgeColors.bg,
                transform: getRankTransform(item.optionId),
                borderColor: getRankBorderColor(item.optionId),
                transition: 'transform 0.5s ease, border-color 0.3s ease',
              }}
            >
              <div
                style={{
                  ...rankBadgeStyle,
                  backgroundColor: badgeColors.bg,
                  color: badgeColors.color,
                }}
              >
                {item.rank}
              </div>
              <div style={rankingInfoStyle}>
                <div style={rankingNameStyle}>{item.name}</div>
                <div style={rankingStatsStyle}>
                  <span style={statStyle}>总分: <strong>{item.totalScore.toFixed(1)}</strong></span>
                  <span style={statDividerStyle}>|</span>
                  <span style={statStyle}>平均: <strong>{item.averageScore.toFixed(2)}</strong></span>
                  <span style={statDividerStyle}>|</span>
                  <span style={statStyle}>参与: <strong>{item.count}</strong>人</span>
                </div>
              </div>
              {rankChangeAnimation[item.optionId] === 'up' && (
                <span style={trendUpStyle}>↑</span>
              )}
              {rankChangeAnimation[item.optionId] === 'down' && (
                <span style={trendDownStyle}>↓</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ height: 24 }} />
      <RankingBarChart rankings={sortedRankings} />

      <div style={{ height: 24 }} />
      <BoxPlotChart rankings={sortedRankings} />

      <div style={{ height: 60 }} />
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: '40px 20px',
};

const loadingContainerStyle: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '80px 20px',
  textAlign: 'center',
};

const spinnerStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  border: '4px solid #e2e8f0',
  borderTop: '4px solid #3182ce',
  borderRadius: '50%',
  margin: '0 auto',
  animation: 'spin 1s linear infinite',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: 32,
};

const titleStyle: React.CSSProperties = {
  color: '#1a365d',
  fontSize: 32,
  fontWeight: 'bold',
  marginBottom: 8,
};

const descriptionStyle: React.CSSProperties = {
  color: '#4a5568',
  fontSize: 16,
  marginBottom: 8,
};

const voteIdStyle: React.CSSProperties = {
  color: '#a0aec0',
  fontSize: 13,
  fontFamily: 'monospace',
};

const errorBannerStyle: React.CSSProperties = {
  background: '#fff5f5',
  color: '#c53030',
  padding: '12px 16px',
  borderRadius: 8,
  marginBottom: 24,
  border: '1px solid #fed7d7',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  color: '#1a365d',
  marginBottom: 16,
  marginTop: 8,
};

const optionsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: 16,
  marginBottom: 24,
};

const optionCardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: 12,
  padding: 20,
  border: '2px solid transparent',
  cursor: 'pointer',
};

const optionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 8,
};

const optionIndexStyle: React.CSSProperties = {
  background: '#ebf8ff',
  color: '#2b6cb0',
  padding: '4px 10px',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
};

const optionNameStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: '#2d3748',
};

const optionDescStyle: React.CSSProperties = {
  color: '#718096',
  fontSize: 14,
  marginBottom: 16,
  marginTop: 0,
};

const sliderContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 8,
};

const sliderStyle: React.CSSProperties = {
  width: 300,
  height: 8,
  borderRadius: 4,
  outline: 'none',
  WebkitAppearance: 'none',
  appearance: 'none',
  cursor: 'pointer',
  touchAction: 'none',
};

const scoreDisplayStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  flexShrink: 0,
};

const scoreInputStyle: React.CSSProperties = {
  width: 50,
  padding: '6px 8px',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  textAlign: 'center',
  fontSize: 14,
  fontWeight: 600,
  color: '#2d3748',
};

const scoreLabelStyle: React.CSSProperties = {
  color: '#718096',
  fontSize: 14,
};

const sliderMarksStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  width: 300,
  padding: '0 4px',
};

const markStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#a0aec0',
};

const submitBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: 16,
  background: 'linear-gradient(135deg, #3182ce, #2b6cb0)',
  color: 'white',
  border: 'none',
  borderRadius: 12,
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'transform 0.2s ease, opacity 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
};

const spinnerInlineStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  border: '2px solid rgba(255,255,255,0.3)',
  borderTop: '2px solid white',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

const rankingListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const rankingItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  background: 'white',
  padding: '16px 20px',
  borderRadius: 12,
  borderLeft: '4px solid',
  border: '2px solid transparent',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const rankBadgeStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: 16,
  flexShrink: 0,
};

const rankingInfoStyle: React.CSSProperties = {
  flex: 1,
};

const rankingNameStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: '#2d3748',
  marginBottom: 4,
};

const rankingStatsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const statStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#718096',
};

const statDividerStyle: React.CSSProperties = {
  color: '#e2e8f0',
};

const trendUpStyle: React.CSSProperties = {
  color: '#38a169',
  fontSize: 20,
  fontWeight: 'bold',
  animation: 'pulse 0.5s ease',
};

const trendDownStyle: React.CSSProperties = {
  color: '#e53e3e',
  fontSize: 20,
  fontWeight: 'bold',
  animation: 'pulse 0.5s ease',
};

const mobileStyles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @media (max-width: 768px) {
    .vote-main-container {
      padding: 20px 12px !important;
    }
    input[type="range"] {
      width: 90% !important;
    }
    div[data-slider-marks] {
      width: 90% !important;
    }
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    border: 2px solid #3182ce;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: transform 0.15s ease;
  }
  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }
  input[type="range"]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    border: 2px solid #3182ce;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    opacity: 1;
  }
`;

export default VoteMain;
