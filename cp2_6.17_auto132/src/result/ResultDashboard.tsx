import { useEffect, useState } from 'react';
import useAppStore from '../store/useAppStore';
import type { AssessmentResult } from '../types';

interface ResultDashboardProps {
  onRestart: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 700) return '#52C41A';
  if (score >= 400) return '#FFA940';
  return '#FF4D4F';
}

function getRiskLabel(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'low':
      return '低风险';
    case 'medium':
      return '中风险';
    case 'high':
      return '高风险';
  }
}

function getRiskBgColor(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'low':
      return '#F6FFED';
    case 'medium':
      return '#FFF7E6';
    case 'high':
      return '#FFF1F0';
  }
}

function HalfGauge({ score }: { score: number }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [animatedAngle, setAnimatedAngle] = useState(0);
  const color = getScoreColor(score);

  useEffect(() => {
    const duration = 800;
    const startTime = performance.now();
    let frame: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setDisplayScore(Math.round(score * easeOut));
      setAnimatedAngle(180 * easeOut);

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const radius = 120;
  const strokeWidth = 16;
  const size = (radius + strokeWidth) * 2;
  const center = size / 2;
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - animatedAngle / 180);

  return (
    <div className="gauge-container">
      <svg
        width={size}
        height={size / 2 + 20}
        viewBox={`0 0 ${size} ${size / 2 + 20}`}
        className="gauge-svg"
      >
        <defs>
          <filter id="gaugeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={`M ${center - radius} ${center + 10} A ${radius} ${radius} 0 0 1 ${center + radius} ${center + 10}`}
          fill="none"
          stroke="#E8E8E8"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        <path
          d={`M ${center - radius} ${center + 10} A ${radius} ${radius} 0 0 1 ${center + radius} ${center + 10}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          filter="url(#gaugeGlow)"
          style={{ transition: 'stroke 0.8s ease-out' }}
        />

        <text
          x={center}
          y={center - 10}
          textAnchor="middle"
          className="gauge-score"
          fill="#333"
        >
          {displayScore}
        </text>
        <text
          x={center}
          y={center + 20}
          textAnchor="middle"
          className="gauge-label"
          fill="#999"
        >
          信用评分
        </text>
      </svg>
    </div>
  );
}

export default function ResultDashboard({ onRestart }: ResultDashboardProps) {
  const { assessmentResult } = useAppStore();
  const [result, setResult] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    if (assessmentResult) {
      setResult(assessmentResult);
    }
  }, [assessmentResult]);

  if (!result) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="result-page">
      <div className="result-header">
        <h1 className="result-title">信用评估结果</h1>
        <p className="result-subtitle">以下是根据您的申请信息生成的评估报告</p>
      </div>

      <div className="gauge-card card">
        <HalfGauge score={result.score} />
      </div>

      <div className="metrics-row">
        <div className="metric-card card">
          <p className="metric-label">预估额度</p>
          <p className="metric-value amount">
            ¥{result.estimatedAmount.toFixed(2)}
            <span className="metric-unit">万元</span>
          </p>
        </div>
        <div className="metric-card card">
          <p className="metric-label">风险等级</p>
          <div className="metric-value">
            <span
              className="risk-badge"
              style={{
                color: getScoreColor(result.score),
                backgroundColor: getRiskBgColor(result.riskLevel)
              }}
            >
              {getRiskLabel(result.riskLevel)}
            </span>
          </div>
        </div>
      </div>

      <p className="disclaimer-text">本评估仅供参考，实际额度以最终审批为准</p>

      <div className="result-actions">
        <button className="btn btn-primary" onClick={onRestart}>
          重新评估
        </button>
      </div>
    </div>
  );
}
