import { useEffect, useState, useMemo } from 'react';
import { AssessmentResult } from '../EventBridge';
import { useAppStore } from '../store';

function getArcColor(score: number): string {
  if (score < 400) return '#FF4D4F';
  if (score < 700) return '#FFA940';
  return '#52C41A';
}

function getRiskLabel(level: AssessmentResult['riskLevel']): string {
  switch (level) {
    case 'low':
      return '低';
    case 'medium':
      return '中';
    case 'high':
      return '高';
  }
}

function formatAmount(amount: number): string {
  return `¥${amount.toFixed(2)}万元`;
}

function Gauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const arcColor = getArcColor(score);
  const animatedArcColor = getArcColor(animatedScore);

  useEffect(() => {
    const duration = 800;
    const startTime = performance.now();
    const startScore = 0;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(startScore + (score - startScore) * eased));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [score]);

  const radius = 80;
  const arcLength = Math.PI * radius;
  const offset = arcLength * (1 - animatedScore / 1000);

  return (
    <div className="gauge-container" style={{ '--gauge-color': animatedArcColor } as React.CSSProperties}>
      <svg
        className="gauge-svg"
        width="200"
        height="110"
        viewBox="0 0 200 110"
      >
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#E8ECF3"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={animatedArcColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${arcLength}`}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.05s linear, stroke 0.05s linear' }}
        />
      </svg>
      <div className="gauge-score">
        <div className="gauge-score-value">{animatedScore}</div>
        <div className="gauge-score-label">信用评分</div>
      </div>
    </div>
  );
}

export function ResultDashboard() {
  const result = useAppStore((s) => s.assessmentResult);

  const riskLabel = useMemo(() => {
    if (!result) return '';
    return getRiskLabel(result.riskLevel);
  }, [result]);

  if (!result) return null;

  return (
    <div className="result-page">
      <div className="result-page-header">
        <h2>评估结果</h2>
        <p>基于您提交的信息，以下是信用评估报告</p>
      </div>
      <Gauge score={result.score} />
      <div className="indicator-cards">
        <div className="indicator-card">
          <div className="indicator-card-label">预估额度</div>
          <div className="indicator-card-value">{formatAmount(result.estimatedAmount)}</div>
        </div>
        <div className="indicator-card">
          <div className="indicator-card-label">风险等级</div>
          <div>
            <span className={`risk-tag ${result.riskLevel}`}>{riskLabel}</span>
          </div>
        </div>
      </div>
      <p className="disclaimer">本评估仅供参考，实际额度以最终审批为准</p>
    </div>
  );
}
