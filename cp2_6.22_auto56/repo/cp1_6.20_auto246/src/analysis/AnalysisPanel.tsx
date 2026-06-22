import React, { useState } from 'react';
import { AnalysisResult, Recommendation, SimulationStep } from '../game/types';
import DetailedSimView from './DetailedSimView';
import './AnalysisPanel.css';

interface AnalysisPanelProps {
  result: AnalysisResult | null;
  loading: boolean;
  onRequestAnalysis: () => void;
  onStepClick: (step: SimulationStep) => void;
  turn: number;
}

const WinRateChart: React.FC<{ winRate: number; rank: number }> = ({ winRate, rank }) => {
  const colors = ['#ffd700', '#c0c0c0', '#cd7f32'];
  const color = colors[rank - 1] || '#00e676';
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (winRate / 100) * circumference;

  return (
    <div className="win-rate-chart">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        <defs>
          <linearGradient id={`gradient-${rank}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="win-rate-text">
        <span className="rate" style={{ color }}>{winRate.toFixed(1)}%</span>
        <span className="label">胜率</span>
      </div>
    </div>
  );
};

const RecommendationCard: React.FC<{
  recommendation: Recommendation;
  isExpanded: boolean;
  onToggle: () => void;
  onStepClick: (step: SimulationStep) => void;
}> = ({ recommendation, isExpanded, onToggle, onStepClick }) => {
  const rankColors: Record<number, string> = {
    1: '#ffd700',
    2: '#c0c0c0',
    3: '#cd7f32'
  };
  const rankLabels: Record<number, string> = {
    1: '1st',
    2: '2nd',
    3: '3rd'
  };

  const bgColor = rankColors[recommendation.rank];

  return (
    <div
      className={`recommendation-card ${isExpanded ? 'expanded' : ''}`}
      style={{
        '--rank-color': bgColor,
        borderColor: bgColor
      } as React.CSSProperties}
      onClick={onToggle}
    >
      <div className="rank-badge" style={{ background: bgColor }}>
        {rankLabels[recommendation.rank]}
      </div>

      <div className="card-header">
        <WinRateChart winRate={recommendation.winRate} rank={recommendation.rank} />
        <div className="card-info">
          <h4 className="card-title">{recommendation.description}</h4>
          <div className="card-stats">
            <span className="stat">
              <span className="stat-icon">⚔️</span>
              <span>{recommendation.totalDamage} 伤害</span>
            </span>
            <span className="stat">
              <span className="stat-icon">📊</span>
              <span>{recommendation.steps.length} 步</span>
            </span>
          </div>
        </div>
      </div>

      <div className="expand-indicator">
        {isExpanded ? '▲ 收起' : '▼ 展开详情'}
      </div>

      {isExpanded && (
        <div className="card-detail">
          <DetailedSimView
            steps={recommendation.steps}
            onStepClick={(step) => {
              onStepClick(step);
            }}
          />
        </div>
      )}
    </div>
  );
};

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  result,
  loading,
  onRequestAnalysis,
  onStepClick,
  turn
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="analysis-panel">
      <div className="panel-header">
        <h2 className="panel-title pixel-font">AI决策助手</h2>
        <div className="turn-display">
          <span className="turn-label">回合</span>
          <span className="turn-number">{turn}</span>
        </div>
      </div>

      <button
        className={`analyze-button ${loading ? 'loading' : ''}`}
        onClick={onRequestAnalysis}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            分析中...
          </>
        ) : (
          '🔍 请求AI分析'
        )}
      </button>

      {result && (
        <div className="analysis-meta">
          <span>模拟次数: {result.totalSimulations.toLocaleString()}</span>
          <span>耗时: {result.analysisTime}ms</span>
        </div>
      )}

      <div className="recommendations-list">
        {loading && !result && (
          <div className="loading-placeholder">
            <div className="loading-spinner" />
            <p>正在深度搜索最优策略...</p>
          </div>
        )}

        {result && result.recommendations.length === 0 && (
          <div className="no-recommendations">
            <p>暂无推荐</p>
          </div>
        )}

        {result && result.recommendations.map((rec, index) => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            isExpanded={expandedId === rec.id}
            onToggle={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
            onStepClick={onStepClick}
          />
        ))}
      </div>

      {!result && !loading && (
        <div className="panel-tip">
          <p>💡 点击上方按钮获取AI推荐的出牌策略</p>
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;
