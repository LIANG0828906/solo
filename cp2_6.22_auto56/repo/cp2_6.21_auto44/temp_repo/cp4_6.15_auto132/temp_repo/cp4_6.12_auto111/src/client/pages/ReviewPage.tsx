import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { CodeEditor } from '../components/CodeEditor';
import { LoadingSpinner } from '../components/Common';
import { Assignment } from '../../types';

export const ReviewPage: React.FC = () => {
  const {
    assignments,
    fetchAssignments,
    currentSubmission,
    fetchNextReview,
    submitReview,
    loading,
    error,
    setError,
  } = useAppStore();

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleSelectAssignment = async (a: Assignment) => {
    setSelectedAssignment(a);
    setScore(0);
    setComment('');
    setSubmitted(false);
    await fetchNextReview(a.id);
  };

  const handleSubmitReview = async () => {
    if (!selectedAssignment || !currentSubmission) return;
    if (score < 1 || score > 5) {
      setError('请选择1-5分的评分');
      return;
    }
    if (comment.length > 200) {
      setError('评论不能超过200字符');
      return;
    }
    const result = await submitReview(selectedAssignment.id, currentSubmission.id, score, comment);
    if (result) {
      setSubmitted(true);
      setTimeout(async () => {
        setScore(0);
        setComment('');
        setSubmitted(false);
        await fetchNextReview(selectedAssignment!.id);
      }, 1500);
    }
  };

  const handleNext = async () => {
    if (!selectedAssignment) return;
    setScore(0);
    setComment('');
    setSubmitted(false);
    await fetchNextReview(selectedAssignment.id);
  };

  const renderStars = () => {
    return (
      <div style={{ display: 'flex', gap: '6px' }}>
        {[1, 2, 3, 4, 5].map((s) => {
          const filled = (hoverScore || score) >= s;
          return (
            <span
              key={s}
              onClick={() => setScore(s)}
              onMouseEnter={() => setHoverScore(s)}
              onMouseLeave={() => setHoverScore(0)}
              style={{
                fontSize: '32px',
                cursor: 'pointer',
                color: filled ? '#ffc107' : '#e0e0e0',
                textShadow: filled ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                transition: 'color 0.15s',
                lineHeight: 1,
              }}
            >
              ★
            </span>
          );
        })}
      </div>
    );
  };

  if (!selectedAssignment) {
    return (
      <div>
        <h2 className="page-title">选择作业进行互评</h2>
        {loading && assignments.length === 0 ? (
          <LoadingSpinner />
        ) : assignments.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#9e9e9e', padding: '40px' }}>
            暂无作业
          </div>
        ) : (
          assignments.map((a) => (
            <div
              key={a.id}
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => handleSelectAssignment(a)}
            >
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#37474f', marginBottom: '6px' }}>
                {a.title}
              </h4>
              <p style={{ fontSize: '13px', color: '#607d8b' }}>
                {a.description?.slice(0, 100) || '暂无描述'}
              </p>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button
          className="btn-secondary"
          onClick={() => {
            setSelectedAssignment(null);
          }}
          style={{ marginBottom: '12px' }}
        >
          ← 返回作业列表
        </button>
        <h2 className="page-title" style={{ marginBottom: '4px' }}>同行互评</h2>
        <div style={{ color: '#607d8b', fontSize: '14px' }}>{selectedAssignment.title}</div>
      </div>

      {error && (
        <div className="card" style={{ background: '#ffebee', color: '#c62828', marginBottom: '16px' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '12px', background: 'none', border: 'none', color: '#c62828', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : !currentSubmission ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h4 style={{ fontSize: '18px', color: '#37474f', marginBottom: '8px' }}>暂无待评价的代码</h4>
          <p style={{ color: '#757575', fontSize: '14px' }}>所有提交都已被评价，稍后再来看看吧！</p>
        </div>
      ) : submitted ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', color: '#4caf50' }}>✓</div>
          <h4 style={{ fontSize: '18px', color: '#37474f', marginBottom: '8px' }}>评价已提交！</h4>
          <p style={{ color: '#757575', fontSize: '14px' }}>正在加载下一个待评价代码...</p>
        </div>
      ) : (
        <>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#455a64' }}>
                📖 待评价代码
              </h4>
              <div style={{ fontSize: '12px', color: '#9e9e9e' }}>
                测试通过: {currentSubmission.passedCount}/{currentSubmission.totalCount}
              </div>
            </div>
            <CodeEditor code={currentSubmission.code} onChange={() => {}} readOnly minLines={12} />
          </div>

          <div className="card" style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#455a64', marginBottom: '16px' }}>
              ✍️ 您的评价
            </h4>

            <div style={{ marginBottom: '20px' }}>
              <label className="form-label">评分（1-5星）</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {renderStars()}
                {score > 0 && (
                  <span style={{ fontSize: '14px', color: '#ff9800', fontWeight: 600 }}>
                    {score} 分
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="form-label">
                文字评论
                <span style={{
                  marginLeft: '8px',
                  color: comment.length > 200 ? '#ff9800' : '#9e9e9e',
                  fontWeight: 400,
                }}>
                  ({comment.length}/200)
                </span>
              </label>
              <textarea
                className="form-textarea"
                placeholder="请输入您对这段代码的评价和建议（可选）..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={300}
                style={{
                  borderColor: comment.length > 200 ? '#ff9800' : undefined,
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-primary" onClick={handleSubmitReview} disabled={loading || score < 1}>
                {loading ? '提交中...' : '✓ 提交评价'}
              </button>
              <button className="btn-secondary" onClick={handleNext}>
                跳过 →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
