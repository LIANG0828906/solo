import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Template } from '../types';
import FeedbackForm from '../components/FeedbackForm';
import { dataService } from '../DataService';
import '../styles/FeedbackPage.css';

const FeedbackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadTemplate();
  }, [id]);

  const loadTemplate = async () => {
    try {
      const data = await dataService.getTemplate(id!);
      setTemplate(data);
    } catch (err) {
      setError('模板不存在或加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    navigate(`/template/${id}/result`);
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleViewResult = () => {
    navigate(`/template/${id}/result`);
  };

  if (loading) {
    return (
      <div className="feedback-page">
        <div className="loading-state">加载中...</div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="feedback-page">
        <div className="error-state">
          <p>{error || '模板不存在'}</p>
          <button className="back-btn" onClick={handleBack}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const hasSubmitted = dataService.hasSubmitted(template.id);

  return (
    <div className="feedback-page">
      <div className="feedback-page__header">
        <button className="back-btn" onClick={handleBack}>
          ← 返回首页
        </button>
        {hasSubmitted && (
          <button className="view-result-btn" onClick={handleViewResult}>
            查看结果 →
          </button>
        )}
      </div>

      <div className="feedback-page__content">
        <FeedbackForm template={template} onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default FeedbackPage;
