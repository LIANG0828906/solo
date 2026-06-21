import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ScorePanel from '../components/ScorePanel';
import { EvaluationTask, EvaluationDimension } from '../../shared/types';
import { submitScore } from '../services/apiService';

interface Props {
  task: EvaluationTask | null;
  onBack: () => void;
}

const ScoringPage: React.FC<Props> = ({ task, onBack }) => {
  const navigate = useNavigate();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingIds, setMissingIds] = useState<string[]>([]);

  useEffect(() => {
    setScores({});
    setError(null);
    setMissingIds([]);
  }, [task]);

  const handleScoreChange = (indicatorId: string, score: number) => {
    setScores((prev) => ({ ...prev, [indicatorId]: score }));
    setMissingIds((prev) => prev.filter((id) => id !== indicatorId));
  };

  const handleSubmit = async () => {
    if (!task) return;

    const allIndicatorIds = task.dimensions.flatMap((d: EvaluationDimension) =>
      d.indicators.map((i) => i.id)
    );
    const missing = allIndicatorIds.filter((id) => !scores[id]);

    if (missing.length > 0) {
      setMissingIds(missing);
      setError('请完成所有指标的评分');
      const firstMissing = document.getElementById(`indicator-${missing[0]}`);
      if (firstMissing) {
        firstMissing.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstMissing.classList.add('shake');
        setTimeout(() => firstMissing.classList.remove('shake'), 600);
      }
      return;
    }

    try {
      setSubmitting(true);
      await submitScore(task.id, scores);
      navigate('/history');
    } catch (err: any) {
      const errData = err?.response?.data;
      if (errData?.missingIndicatorIds) {
        setMissingIds(errData.missingIndicatorIds);
      }
      setError(errData?.error || '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (!task) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>未找到评估任务</p>
          <button className="btn-primary" onClick={onBack}>返回列表</button>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="page-container scoring-page">
      <div className="page-header">
        <button className="btn-back" onClick={onBack}>← 返回列表</button>
        <h1>评估打分</h1>
      </div>

      <div className="scoring-meta">
        <div className="meta-row">
          <span className="meta-label">被评人：</span>
          <span className="meta-value strong">{task.evaluateeName}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">邮箱：</span>
          <span className="meta-value">{task.evaluateeEmail}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">评估周期：</span>
          <span className="meta-value">{task.cycleName}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">截止日期：</span>
          <span className="meta-value">{formatDate(task.deadline)}</span>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <strong>提示：</strong> {error}
        </div>
      )}

      {task.dimensions.map((dim: EvaluationDimension, dimIdx) => (
        <section key={dim.id} className="dimension-section">
          <h2 className="dimension-title">维度 {dimIdx + 1}：{dim.name}</h2>
          <div className="indicators-list">
            {dim.indicators.map((ind) => (
              <div key={ind.id} className={missingIds.includes(ind.id) ? 'missing-indicator' : ''}>
                <ScorePanel
                  indicator={ind}
                  score={scores[ind.id] || null}
                  onScoreChange={handleScoreChange}
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="submit-section">
        <button
          className="btn-primary btn-large"
          onClick={handleSubmit}
          disabled={submitting || task.status === 'completed'}
        >
          {submitting ? '提交中...' : task.status === 'completed' ? '已完成' : '提交评估'}
        </button>
      </div>
    </div>
  );
};

export default ScoringPage;
