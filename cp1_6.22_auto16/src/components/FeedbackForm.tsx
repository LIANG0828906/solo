import React, { useState, useEffect } from 'react';
import type { Template } from '../types';
import StarRating from './StarRating';
import { dataService } from '../DataService';
import '../styles/FeedbackForm.css';

interface FeedbackFormProps {
  template: Template;
  onSubmit: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ template, onSubmit }) => {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    const initialScores: Record<string, number> = {};
    template.dimensions.forEach(dim => {
      initialScores[dim.id] = 0;
    });
    setScores(initialScores);
    setHasSubmitted(dataService.hasSubmitted(template.id));
  }, [template.id, template.dimensions]);

  const handleScoreChange = (dimensionId: string, value: number) => {
    setScores(prev => ({
      ...prev,
      [dimensionId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allFilled = template.dimensions.every(dim => scores[dim.id] > 0);
    if (!allFilled) {
      alert('请为所有维度打分');
      return;
    }

    if (dataService.hasSubmitted(template.id)) {
      alert('您已经提交过评分了');
      return;
    }

    setSubmitting(true);
    try {
      await dataService.submitFeedback(template.id, scores);
      dataService.markSubmitted(template.id);
      setHasSubmitted(true);
      setTimeout(() => {
        onSubmit();
      }, 500);
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (hasSubmitted) {
    return (
      <div className="feedback-form feedback-form--submitted">
        <div className="submitted-success">
          <div className="success-icon">✓</div>
          <h3>提交成功</h3>
          <p>感谢您的反馈！正在跳转到结果页...</p>
        </div>
      </div>
    );
  }

  return (
    <form className="feedback-form" onSubmit={handleSubmit}>
      <div className="feedback-form__header">
        <h2>{template.name}</h2>
        <p className="feedback-form__subtitle">
          请为以下维度打分（1-10分），您的评分将匿名提交
        </p>
      </div>

      <div className="feedback-cards">
        {template.dimensions.map((dim, index) => (
          <div
            key={dim.id}
            className="feedback-card glass-card"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="feedback-card__header">
              <h3 className="feedback-card__title">{dim.name}</h3>
              <span className="feedback-card__weight">
                权重: {dim.weight}
              </span>
            </div>
            <div className="feedback-card__rating">
              <StarRating
                value={scores[dim.id] || 0}
                max={10}
                onChange={(value) => handleScoreChange(dim.id, value)}
                size="lg"
              />
            </div>
            <div className="feedback-card__score">
              {scores[dim.id] || 0} 分
            </div>
          </div>
        ))}
      </div>

      <div className="feedback-form__actions">
        <button
          type="submit"
          className="submit-btn"
          disabled={submitting}
        >
          {submitting ? '提交中...' : '提交评分'}
        </button>
      </div>
    </form>
  );
};

export default FeedbackForm;
