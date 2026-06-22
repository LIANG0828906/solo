import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { useAppStore } from '../store/appStore';
import type { EvaluationResult, VoiceComment, EvaluationDimensions } from '../types';

const dimensionLabels: { key: keyof EvaluationResult['dimensions']; label: string }[] = [
  { key: 'expression', label: '表达能力' },
  { key: 'logic', label: '逻辑性' },
  { key: 'technicalDepth', label: '技术深度' },
  { key: 'adaptability', label: '应变能力' },
  { key: 'timeManagement', label: '时间管理' },
];

const ResultsPage: React.FC = () => {
  const { id: interviewId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentInterview = useAppStore((state) => state.currentInterview);
  const setCurrentInterview = useAppStore((state) => state.setCurrentInterview);

  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvalId, setSelectedEvalId] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    if (!currentInterview && interviewId) {
      apiClient.getInterview(interviewId).then((data) => {
        setCurrentInterview(data);
      });
    }

    if (interviewId) {
      loadEvaluations();
    }
  }, [interviewId, currentInterview, setCurrentInterview]);

  const loadEvaluations = async () => {
    if (!interviewId) return;
    setIsLoading(true);
    try {
      const data = await apiClient.getEvaluations(interviewId);
      setEvaluations(data);
      if (data.length > 0) {
        setSelectedEvalId(data[0].id);
      }
    } catch (error) {
      console.error('加载评估结果失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedEval = evaluations.find((e) => e.id === selectedEvalId);

  const getAverageDimensions = (): EvaluationDimensions | null => {
    if (evaluations.length === 0) return null;

    const keys = dimensionLabels.map((d) => d.key);
    const avg: Partial<EvaluationDimensions> = {};

    keys.forEach((key) => {
      avg[key] = evaluations.reduce((sum, e) => sum + e.dimensions[key], 0) / evaluations.length;
    });

    return avg as EvaluationDimensions;
  };

  const playVoiceComment = (comment: VoiceComment) => {
    const audio = audioRefs.current[comment.id];
    if (!audio) return;

    if (playingVoiceId === comment.id) {
      audio.pause();
      setPlayingVoiceId(null);
    } else {
      if (playingVoiceId && audioRefs.current[playingVoiceId]) {
        audioRefs.current[playingVoiceId].pause();
      }
      audio.currentTime = 0;
      audio.play();
      setPlayingVoiceId(comment.id);

      audio.onended = () => {
        setPlayingVoiceId(null);
      };
    }
  };

  const RadarChart: React.FC<{ data: EvaluationResult['dimensions']; animate?: boolean }> = ({
    data,
    animate = true,
  }) => {
    const size = 280;
    const center = size / 2;
    const maxRadius = size / 2 - 40;
    const levels = 5;

    const angleStep = (2 * Math.PI) / dimensionLabels.length;
    const startAngle = -Math.PI / 2;

    const points = dimensionLabels.map((dim, index) => {
      const value = data[dim.key] / 10;
      const angle = startAngle + index * angleStep;
      const radius = value * maxRadius;
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
        angle,
        label: dim.label,
      };
    });

    const gridPoints = (level: number) => {
      const r = (maxRadius * level) / levels;
      return dimensionLabels
        .map((_, index) => {
          const angle = startAngle + index * angleStep;
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        })
        .join(' ');
    };

    const axisPoints = dimensionLabels.map((_, index) => {
      const angle = startAngle + index * angleStep;
      return {
        x1: center,
        y1: center,
        x2: center + maxRadius * Math.cos(angle),
        y2: center + maxRadius * Math.sin(angle),
      };
    });

    const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(' ');

    const labelPositions = dimensionLabels.map((dim, index) => {
      const angle = startAngle + index * angleStep;
      const labelRadius = maxRadius + 20;
      return {
        x: center + labelRadius * Math.cos(angle),
        y: center + labelRadius * Math.sin(angle),
        text: dim.label,
        value: data[dim.key].toFixed(1),
      };
    });

    return (
      <svg viewBox={`0 0 ${size} ${size}`} className="radar-chart">
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.7">
              {animate && <animate attributeName="stopOpacity" from="0" to="0.7" dur="1s" fill="freeze" />}
            </stop>
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6">
              {animate && <animate attributeName="stopOpacity" from="0" to="0.6" dur="1s" begin="0.2s" fill="freeze" />}
            </stop>
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.7">
              {animate && <animate attributeName="stopOpacity" from="0" to="0.7" dur="1s" begin="0.4s" fill="freeze" />}
            </stop>
          </linearGradient>
          <radialGradient id="radarRadialGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.1" />
          </radialGradient>
          <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <filter id="radarGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {Array.from({ length: levels }).map((_, i) => (
          <polygon
            key={`grid-${i}`}
            points={gridPoints(i + 1)}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray={i === levels - 1 ? '0' : '4,4'}
            opacity={0.5}
            style={animate ? {
              transformOrigin: 'center',
              animation: `gridFadeIn 0.6s ease ${i * 0.1}s both`,
            } : {}}
          />
        ))}

        {axisPoints.map((axis, i) => (
          <line
            key={`axis-${i}`}
            x1={axis.x1}
            y1={axis.y1}
            x2={axis.x2}
            y2={axis.y2}
            stroke="#334155"
            strokeWidth="1"
            style={animate ? {
              animation: `axisDraw 0.5s ease ${0.3 + i * 0.08}s both`,
              strokeDasharray: 100,
            } : {}}
          />
        ))}

        <polygon
          points={polygonPoints}
          fill="url(#radarGradient)"
          stroke="url(#strokeGradient)"
          strokeWidth="2.5"
          filter="url(#radarGlow)"
          style={{
            transformOrigin: 'center',
            animation: animate ? 'radarGrow 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
          }}
        />

        {points.map((point, i) => (
          <circle
            key={`point-${i}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#f59e0b"
            stroke="white"
            strokeWidth="2"
            style={{
              animation: animate
                ? `pointFade 0.5s ease ${0.8 + i * 0.1}s both`
                : 'none',
            }}
          />
        ))}

        {labelPositions.map((label, i) => (
          <g key={`label-${i}`}>
            <text
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#94a3b8"
              fontSize="11"
            >
              {label.text}
            </text>
            <text
              x={label.x}
              y={label.y + 14}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#f1f5f9"
              fontSize="12"
              fontWeight="600"
            >
              {label.value}
            </text>
          </g>
        ))}

        <style>{`
          @keyframes radarGrow {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            50% {
              opacity: 0.8;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          @keyframes gridFadeIn {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 0.5;
              transform: scale(1);
            }
          }
          @keyframes axisDraw {
            from {
              stroke-dashoffset: 100;
              opacity: 0;
            }
            to {
              stroke-dashoffset: 0;
              opacity: 1;
            }
          }
          @keyframes pointFade {
            from {
              opacity: 0;
              transform: scale(0);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </svg>
    );
  };

  const BarChart: React.FC<{ evaluations: EvaluationResult[] }> = ({ evaluations }) => {
    const maxScore = 10;
    const barWidth = 60;
    const chartHeight = 200;
    const chartWidth = evaluations.length * (barWidth + 30) + 40;

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} className="bar-chart">
        <line
          x1="20"
          y1={chartHeight}
          x2={chartWidth - 20}
          y2={chartHeight}
          stroke="#334155"
          strokeWidth="1"
        />

        {evaluations.map((evalItem, index) => {
          const x = 20 + index * (barWidth + 30);
          const height = (evalItem.averageScore / maxScore) * chartHeight;
          const y = chartHeight - height;
          const isSelected = selectedEvalId === evalItem.id;

          return (
            <g
              key={evalItem.id}
              onClick={() => {
                setSelectedEvalId(evalItem.id);
                setShowDetail(true);
              }}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={height}
                rx="4"
                fill={isSelected ? '#3b82f6' : 'url(#barGradient)'}
                opacity={isSelected ? 1 : 0.7}
                style={{
                  transition: 'all 0.3s ease',
                }}
                className="bar-rect"
              />
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize="12"
                fontWeight="600"
              >
                {evalItem.averageScore.toFixed(1)}
              </text>
              <text
                x={x + barWidth / 2}
                y={chartHeight + 20}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="11"
              >
                {evalItem.evaluatorName}
              </text>
            </g>
          );
        })}

        <defs>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const avgDimensions = getAverageDimensions();

  if (isLoading) {
    return (
      <div className="results-loading">
        <div className="spinner" />
        <p>加载中...</p>
        <style>{`
          .results-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(59, 130, 246, 0.3);
            border-top-color: var(--color-accent-blue);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .results-loading p {
            color: var(--color-text-secondary);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="results-page animate-fade-in">
      <header className="results-header">
        <button className="btn-back" onClick={() => navigate('/evaluation')}>
          ← 返回
        </button>
        <div className="results-title">
          <h1>评估结果</h1>
          <p>{currentInterview?.title}</p>
        </div>
      </header>

      <main className="results-content">
        <div className="results-grid">
          <div className="card result-section radar-section">
            <h2 className="section-title">综合能力分析</h2>
            {avgDimensions && (
              <div className="radar-wrapper">
                <RadarChart data={avgDimensions} />
              </div>
            )}
            <div className="score-summary">
              <div className="summary-item">
                <span className="summary-label">平均分</span>
                <span className="summary-value">
                  {evaluations.length > 0
                    ? (
                        evaluations.reduce((s, e) => s + e.averageScore, 0) / evaluations.length
                      ).toFixed(1)
                    : '0.0'}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">评估人数</span>
                <span className="summary-value">{evaluations.length}</span>
              </div>
            </div>
          </div>

          <div className="card result-section chart-section">
            <h2 className="section-title">各评估者评分对比</h2>
            <p className="section-desc">点击柱子查看详细评分</p>
            <div className="bar-chart-wrapper">
              <BarChart evaluations={evaluations} />
            </div>
          </div>
        </div>

        <div className="card result-section">
          <h2 className="section-title">语音评论</h2>
          <div className="voice-comments-list">
            {evaluations.flatMap((e) =>
              e.voiceComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`voice-comment-item ${playingVoiceId === comment.id ? 'playing' : ''}`}
                  onClick={() => playVoiceComment(comment)}
                >
                  <button className="play-btn">
                    {playingVoiceId === comment.id ? '⏸' : '▶'}
                  </button>
                  <div className="comment-info">
                    <div className="comment-evaluator">{comment.evaluatorName}</div>
                    <div className="waveform-mini">
                      {comment.waveformData.slice(0, 20).map((h, i) => (
                        <div
                          key={i}
                          className={`mini-bar ${playingVoiceId === comment.id ? 'animate' : ''}`}
                          style={{
                            height: `${Math.max(h * 100, 20)}%`,
                            animationDelay: `${i * 0.05}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="comment-duration">{formatTime(comment.duration)}</span>
                  <audio
                    ref={(el) => {
                      if (el) audioRefs.current[comment.id] = el;
                    }}
                    src={comment.audioUrl}
                  />
                </div>
              ))
            )}
            {evaluations.every((e) => e.voiceComments.length === 0) && (
              <div className="empty-comments">暂无语音评论</div>
            )}
          </div>
        </div>

        {selectedEval && showDetail && (
          <div className="detail-modal-overlay" onClick={() => setShowDetail(false)}>
            <div className="detail-modal card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{selectedEval.evaluatorName} 的评分详情</h3>
                <button className="close-btn" onClick={() => setShowDetail(false)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                {selectedEval.scores.map((score, index) => {
                  const question = currentInterview?.questions.find(
                    (q) => q.id === score.questionId
                  );
                  return (
                    <div key={score.questionId} className="score-detail-item">
                      <div className="score-detail-header">
                        <span className="score-detail-question">第 {index + 1} 题</span>
                        <span className="score-detail-value">{score.score} 分</span>
                      </div>
                      {question && <p className="score-detail-text">{question.text}</p>}
                      {score.comment && (
                        <div className="score-detail-comment">
                          <span className="comment-label">评语：</span>
                          {score.comment}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .results-page {
          min-height: 100vh;
          padding-bottom: 40px;
        }
        .results-header {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 16px 24px;
          background: var(--color-bg-card);
          border-bottom: 1px solid var(--color-border);
        }
        .btn-back {
          background: none;
          color: var(--color-text-secondary);
          font-size: 14px;
          padding: 8px 12px;
          border-radius: 6px;
        }
        .btn-back:hover {
          background: var(--color-primary-light);
          color: var(--color-text-primary);
        }
        .results-title h1 {
          font-size: 20px;
          color: var(--color-text-primary);
          margin-bottom: 2px;
        }
        .results-title p {
          font-size: 14px;
          color: var(--color-text-secondary);
        }
        .results-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .results-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .result-section {
          padding: 24px;
        }
        .section-title {
          font-size: 18px;
          color: var(--color-text-primary);
          margin-bottom: 4px;
        }
        .section-desc {
          font-size: 13px;
          color: var(--color-text-muted);
          margin-bottom: 20px;
        }
        .radar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .radar-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .radar-chart {
          width: 100%;
          max-width: 320px;
          height: auto;
        }
        .score-summary {
          display: flex;
          gap: 32px;
          justify-content: center;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--color-border);
          width: 100%;
        }
        .summary-item {
          text-align: center;
        }
        .summary-label {
          display: block;
          font-size: 13px;
          color: var(--color-text-muted);
          margin-bottom: 4px;
        }
        .summary-value {
          font-size: 28px;
          font-weight: bold;
          color: var(--color-accent-blue);
        }
        .chart-section {
          overflow-x: auto;
        }
        .bar-chart-wrapper {
          display: flex;
          justify-content: center;
          min-height: 240px;
        }
        .bar-chart {
          width: 100%;
          max-width: 400px;
          height: auto;
        }
        .bar-rect:hover {
          filter: brightness(1.2);
        }
        .voice-comments-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .voice-comment-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: var(--color-bg-input);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .voice-comment-item:hover {
          background: var(--color-primary-light);
        }
        .voice-comment-item.playing {
          border: 1px solid var(--color-accent-blue);
        }
        .play-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--color-accent-blue);
          color: white;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .comment-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .comment-evaluator {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-primary);
        }
        .waveform-mini {
          display: flex;
          align-items: center;
          gap: 2px;
          height: 24px;
        }
        .mini-bar {
          flex: 1;
          background: linear-gradient(to top, var(--color-accent-blue), var(--color-accent-orange));
          border-radius: 2px;
          min-height: 4px;
          transition: height 0.1s ease;
        }
        .mini-bar.animate {
          animation: miniWave 0.6s ease-in-out infinite alternate;
        }
        @keyframes miniWave {
          from { opacity: 0.5; }
          to { opacity: 1; }
        }
        .comment-duration {
          font-size: 13px;
          color: var(--color-text-muted);
          flex-shrink: 0;
        }
        .empty-comments {
          text-align: center;
          padding: 32px;
          color: var(--color-text-muted);
          font-size: 14px;
        }
        .detail-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .detail-modal {
          width: 100%;
          max-width: 560px;
          max-height: 80vh;
          overflow-y: auto;
          padding: 0;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--color-border);
          position: sticky;
          top: 0;
          background: var(--color-bg-card);
          z-index: 1;
        }
        .modal-header h3 {
          font-size: 18px;
          color: var(--color-text-primary);
        }
        .close-btn {
          background: none;
          color: var(--color-text-secondary);
          font-size: 24px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
        }
        .close-btn:hover {
          background: var(--color-primary-light);
          color: var(--color-text-primary);
        }
        .modal-body {
          padding: 24px;
        }
        .score-detail-item {
          padding: 16px;
          background: var(--color-bg-input);
          border-radius: 8px;
          margin-bottom: 12px;
        }
        .score-detail-item:last-child {
          margin-bottom: 0;
        }
        .score-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .score-detail-question {
          font-weight: 600;
          color: var(--color-accent-blue);
        }
        .score-detail-value {
          font-size: 18px;
          font-weight: bold;
          color: var(--color-accent-orange);
        }
        .score-detail-text {
          color: var(--color-text-secondary);
          font-size: 14px;
          margin-bottom: 8px;
          line-height: 1.5;
        }
        .score-detail-comment {
          padding: 10px 12px;
          background: var(--color-primary-light);
          border-radius: 6px;
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.5;
        }
        .comment-label {
          color: var(--color-accent-blue);
          font-weight: 500;
        }
        @media (max-width: 900px) {
          .results-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .results-header {
            padding: 12px 16px;
          }
          .results-title h1 {
            font-size: 18px;
          }
          .results-content {
            padding: 16px;
          }
          .result-section {
            padding: 16px;
          }
          .score-summary {
            gap: 24px;
          }
          .summary-value {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default ResultsPage;
