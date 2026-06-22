import { useState, useEffect, useCallback } from 'react';
import { api } from '@/utils/api';
import { playCelebrationSound } from '@/utils/audio';
import LotteryWheel from '@/components/LotteryWheel';
import LotteryBox from '@/components/LotteryBox';
import Confetti from '@/components/Confetti';
import type { ActivityDetail, LotteryResult, Prize } from '@/types';

interface LotteryPageProps {
  activityId: string;
  onExport: () => void;
}

type LotteryMode = 'wheel' | 'box';

export default function LotteryPage({ activityId, onExport }: LotteryPageProps) {
  const [activityDetail, setActivityDetail] = useState<ActivityDetail | null>(null);
  const [mode, setMode] = useState<LotteryMode>('wheel');
  const [isDrawing, setIsDrawing] = useState(false);
  const [targetPrizeId, setTargetPrizeId] = useState<string | null>(null);
  const [currentWinner, setCurrentWinner] = useState<LotteryResult | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [fadingResultId, setFadingResultId] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const loadActivity = useCallback(async () => {
    try {
      const detail = await api.getActivityDetail(activityId);
      setActivityDetail(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载活动失败');
    }
  }, [activityId]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const handleStartDraw = async () => {
    if (!activityDetail || isDrawing) return;
    setError(null);
    setIsDrawing(true);
    setTargetPrizeId(null);
    setCurrentWinner(null);
  };

  const handleStopDraw = async () => {
    if (!activityDetail || !isDrawing) return;

    try {
      const result = await api.drawLottery(activityId);
      setTargetPrizeId(result.prizeId);
      setCurrentWinner(result);

      if (mode === 'box') {
        setTimeout(() => {
          finishDraw(result);
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '抽奖失败');
      setIsDrawing(false);
    }
  };

  const finishDraw = (_result: LotteryResult) => {
    setIsDrawing(false);
    setShowConfetti(true);
    playCelebrationSound();
    loadActivity();

    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleWheelStop = useCallback(() => {
    if (currentWinner) {
      finishDraw(currentWinner);
    }
  }, [currentWinner]);

  const handleRedraw = async (resultId: string) => {
    setFadingResultId(resultId);

    setTimeout(async () => {
      try {
        const result = await api.redrawLottery(resultId);
        setCurrentWinner(result);
        setTargetPrizeId(result.prizeId);
        setIsDrawing(true);
        setFadingResultId(null);
        loadActivity();
      } catch (err) {
        setError(err instanceof Error ? err.message : '重抽失败');
        setFadingResultId(null);
      }
    }, 300);
  };

  const toggleHistoryExpand = (id: string) => {
    const newExpanded = new Set(expandedHistory);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedHistory(newExpanded);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  if (!activityDetail) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <p>加载中...</p>
      </div>
    );
  }

  const { activity, prizes, participants, results, stats } = activityDetail;
  const recentHistory = results.slice(0, 10);

  return (
    <div>
      <Confetti active={showConfetti} />

      <div className="dashboard-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 8 }}>{activity.name}</h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            创建时间：{formatTime(activity.createdAt)}
          </div>
        </div>
        <button className="btn btn-outline" onClick={onExport}>
          📥 导出中奖名单
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, background: '#FFE8E8', color: '#DC3545', borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalParticipants}</div>
          <div className="stat-label">参与人数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalPrizes - stats.drawnPrizes}</div>
          <div className="stat-label">剩余奖品</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.drawnPrizes}</div>
          <div className="stat-label">已抽出</div>
        </div>
      </div>

      <div className="dashboard">
        <div>
          <div className="card">
            <div className="prizes-progress">
              <h3 className="section-title">奖品进度</h3>
              {prizes.map((prize: Prize, idx: number) => {
                const progress = prize.quantity > 0 ? (prize.drawnCount / prize.quantity) * 100 : 0;
                return (
                  <div key={prize.id} className="prize-progress-item">
                    <div className="prize-progress-header">
                      <span>
                        <span style={{ fontSize: 20, marginRight: 8 }}>{prize.icon}</span>
                        <strong>{prize.name}</strong>
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {prize.drawnCount} / {prize.quantity}
                      </span>
                    </div>
                    <div className="prize-progress-bar">
                      <div
                        className="prize-progress-fill"
                        style={{
                          width: `${progress}%`,
                          animationDelay: `${idx * 0.1}s`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <h3 className="section-title">最近开奖历史</h3>
            {recentHistory.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">暂无开奖记录</div>
              </div>
            ) : (
              <div className="recent-history">
                {recentHistory.map((result: LotteryResult) => (
                  <div
                    key={result.id}
                    className={`history-item ${expandedHistory.has(result.id) ? 'history-item-expanded' : ''}`}
                    onClick={() => toggleHistoryExpand(result.id)}
                  >
                    <div className="history-summary">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="history-icon">{result.prizeIcon}</span>
                        <div>
                          <div className="history-prize">{result.prizeName}</div>
                          <div className="history-winner">中奖人：{result.participantName}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {formatTime(result.drawnAt)}
                      </div>
                    </div>
                    {expandedHistory.has(result.id) && (
                      <div className="history-detail">
                        <p>🎯 奖品详情：{result.prizeIcon} {result.prizeName}</p>
                        <p>👤 中奖人：{result.participantName}</p>
                        <p>⏰ 开奖时间：{formatTime(result.drawnAt)}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <h3 className="section-title" style={{ textAlign: 'center' }}>开始抽奖</h3>

            <div className="mode-toggle" style={{ marginBottom: 24, justifyContent: 'center' }}>
              <button
                className={`mode-toggle-btn ${mode === 'wheel' ? 'active' : ''}`}
                onClick={() => setMode('wheel')}
              >
                🎡 转盘
              </button>
              <button
                className={`mode-toggle-btn ${mode === 'box' ? 'active' : ''}`}
                onClick={() => setMode('box')}
              >
                📦 抽奖箱
              </button>
            </div>

            {mode === 'wheel' ? (
              <div className="wheel-section">
                <LotteryWheel
                  prizes={prizes}
                  spinning={isDrawing}
                  onStop={handleWheelStop}
                  targetPrizeId={targetPrizeId}
                />
              </div>
            ) : (
              <div className="box-section">
                <LotteryBox
                  prizes={prizes.map((p: Prize) => ({ icon: p.icon, name: p.name }))}
                  drawing={isDrawing}
                  winner={currentWinner}
                />
              </div>
            )}

            <div className="lottery-controls" style={{ marginTop: 24 }}>
              {!isDrawing ? (
                <button
                  className="btn btn-primary"
                  onClick={handleStartDraw}
                  disabled={stats.drawnPrizes >= stats.totalPrizes || participants.length === 0}
                  style={{ fontSize: 16, padding: '14px 48px' }}
                >
                  🎲 开始抽奖
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleStopDraw}
                  disabled={!isDrawing || (mode === 'wheel' && targetPrizeId === null)}
                  style={{ fontSize: 16, padding: '14px 48px', background: 'linear-gradient(135deg, #DC3545 0%, #FF6B35 100%)' }}
                >
                  ⏹ 停止
                </button>
              )}
            </div>
          </div>

          <div className="results-panel" style={{ marginTop: 24 }}>
            <h3 className="results-panel-title">🎊 中奖记录</h3>
            {results.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎉</div>
                <div className="empty-state-text">点击开始抽奖</div>
              </div>
            ) : (
              results.map((result: LotteryResult) => (
                <div
                  key={result.id}
                  className={`result-card ${fadingResultId === result.id ? 'fading' : ''}`}
                >
                  <div className="result-header">
                    <div className="result-prize">
                      <span style={{ fontSize: 24 }}>{result.prizeIcon}</span>
                      {result.prizeName}
                    </div>
                    {result.prizeId && (
                      <button
                        className="redraw-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRedraw(result.id);
                        }}
                      >
                        🔄 重抽
                      </button>
                    )}
                  </div>
                  <div className="result-winner">🏆 {result.participantName}</div>
                  <div className="result-time">{formatTime(result.drawnAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
