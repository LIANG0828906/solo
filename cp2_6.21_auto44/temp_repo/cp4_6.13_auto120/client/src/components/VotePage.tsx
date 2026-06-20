import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import ResultsChart from './ResultsChart';
import Modal from './Modal';
import type { Vote, VoteOption, WebSocketMessage } from '../types';
import '../styles/VotePage.css';

const SESSION_KEY = 'livevote_session_id';

function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

function VotePage() {
  const { voteId } = useParams<{ voteId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReadonly = searchParams.get('readonly') === '1';

  const [vote, setVote] = useState<Vote | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showVotedModal, setShowVotedModal] = useState(false);
  const [ripples, setRipples] = useState<{ id: string; x: number; y: number; optionId: string }[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const sessionId = useRef(getSessionId());

  const connectWebSocket = useCallback(() => {
    if (!voteId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(
        JSON.stringify({
          type: 'join',
          voteId,
          sessionId: sessionId.current,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);

        switch (data.type) {
          case 'vote_state': {
            const stateData = data as any;
            if (stateData.vote) {
              setVote(stateData.vote);
              setHasVoted(stateData.hasVoted || false);
              if (stateData.votedOptionId) {
                setVotedOptionId(stateData.votedOptionId);
              }
            }
            setIsLoading(false);
            setError('');
            break;
          }
          case 'vote_update': {
            const updateData = data as any;
            setVote((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                options: updateData.options || prev.options,
                totalVotes: updateData.totalVotes ?? prev.totalVotes,
              };
            });
            break;
          }
          case 'error': {
            const errorData = data as any;
            if (errorData.code === 'ALREADY_VOTED') {
              setShowVotedModal(true);
              setHasVoted(true);
            } else {
              setError(errorData.message || '发生错误');
            }
            break;
          }
          default:
            break;
        }
      } catch (err) {
        console.error('Parse message error:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          connectWebSocket();
        }
      }, 2000);
    };

    ws.onerror = () => {
      setError('连接服务器失败');
    };
  }, [voteId]);

  useEffect(() => {
    if (voteId) {
      setIsLoading(true);
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [voteId, connectWebSocket]);

  const handleVote = async (optionId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (hasVoted || isReadonly || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      if (hasVoted) {
        setShowVotedModal(true);
      }
      return;
    }

    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rippleId = `${Date.now()}-${Math.random()}`;

    setRipples((prev) => [...prev, { id: rippleId, x, y, optionId }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== rippleId));
    }, 600);

    wsRef.current.send(
      JSON.stringify({
        type: 'vote',
        voteId,
        optionId,
        sessionId: sessionId.current,
      })
    );

    setHasVoted(true);
    setVotedOptionId(optionId);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPercent = (votes: number) => {
    if (!vote || vote.totalVotes === 0) return 0;
    return ((votes / vote.totalVotes) * 100).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="vote-page-container">
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <p style={{ color: '#8892a0' }}>加载中...</p>
        </div>
      </div>
    );
  }

  if (!vote) {
    return (
      <div className="vote-page-container">
        <Link to="/" className="back-btn">
          ← 返回首页
        </Link>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <h2 style={{ color: '#fff', marginBottom: '12px' }}>投票不存在</h2>
          <p style={{ color: '#8892a0' }}>该投票可能已被删除或链接无效</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition">
      <div className="vote-page-container">
        <Link to="/" className="back-btn">
          ← 返回首页
        </Link>

        <div className="vote-page-header">
          <h1 className="vote-page-title">
            {vote.title}
            {isReadonly && <span className="readonly-badge">只读结果</span>}
          </h1>
          <div className="vote-page-info">
            <span>
              创建时间：<strong>{formatDate(vote.createdAt)}</strong>
            </span>
            <span>
              总票数：<strong>{vote.totalVotes}</strong>
            </span>
            <span style={{ color: isConnected ? '#00d4aa' : '#ff6b6b' }}>
              {isConnected ? '● 实时连接中' : '○ 连接断开'}
            </span>
          </div>
        </div>

        <div className="vote-page-content">
          <div className="options-section">
            <h2 className="section-title">
              {isReadonly ? '投票选项' : hasVoted ? '已投票' : '请选择您的选项'}
            </h2>
            {vote.options.map((option: VoteOption) => (
              <button
                key={option.id}
                className={`vote-option-btn ${votedOptionId === option.id ? 'voted' : ''}`}
                onClick={(e) => handleVote(option.id, e)}
                disabled={hasVoted || isReadonly}
              >
                {ripples
                  .filter((r) => r.optionId === option.id)
                  .map((ripple) => (
                    <span
                      key={ripple.id}
                      className="ripple"
                      style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: 20,
                        height: 20,
                        marginLeft: -10,
                        marginTop: -10,
                      }}
                    />
                  ))}
                <span className="option-label">{option.text}</span>
                <span className="option-stats">
                  <span className="option-votes">{option.votes}</span>
                  <span className="option-percent">{getPercent(option.votes)}%</span>
                </span>
              </button>
            ))}

            {hasVoted && !isReadonly && (
              <p style={{ color: '#00d4aa', fontSize: '14px', marginTop: '8px' }}>
                ✓ 您已投票，感谢参与！
              </p>
            )}

            {error && <p style={{ color: '#ff6b6b', fontSize: '14px' }}>{error}</p>}
          </div>

          <div className="chart-section">
            <h2 className="section-title">实时结果</h2>
            <div className="chart-container">
              <ResultsChart options={vote.options} totalVotes={vote.totalVotes} />
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showVotedModal}
        title="提示"
        message="您已投过票，每个设备只能参与一次投票。"
        onClose={() => setShowVotedModal(false)}
      />
    </div>
  );
}

export default VotePage;
