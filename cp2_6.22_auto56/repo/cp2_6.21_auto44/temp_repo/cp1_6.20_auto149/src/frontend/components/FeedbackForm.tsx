import React, { useState } from 'react';

interface FeedbackFormProps {
  onSubmitted: () => void;
}

const MAX_CHARS = 300;

export default function FeedbackForm({ onSubmitted }: FeedbackFormProps) {
  const [good, setGood] = useState('');
  const [bad, setBad] = useState('');
  const [improve, setImprove] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const handleChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) {
      setter(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!good.trim() || !bad.trim() || !improve.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ good, bad, improve }),
      });
      if (res.ok) {
        setGood('');
        setBad('');
        setImprove('');
        setSuccess(true);
        onSubmitted();
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const renderCharCount = (text: string) => (
    <span className={`char-count ${text.length > MAX_CHARS * 0.9 ? 'near-limit' : ''}`}>
      {text.length}/{MAX_CHARS}
    </span>
  );

  const formContent = (
    <form className="feedback-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>👍 做得好的</label>
        <textarea
          value={good}
          onChange={handleChange(setGood)}
          placeholder="分享本迭代中团队做得好的方面..."
          rows={3}
        />
        {renderCharCount(good)}
      </div>
      <div className="form-group">
        <label>👎 做得差的</label>
        <textarea
          value={bad}
          onChange={handleChange(setBad)}
          placeholder="指出需要改进的问题和不足..."
          rows={3}
        />
        {renderCharCount(bad)}
      </div>
      <div className="form-group">
        <label>🔄 待改进的</label>
        <textarea
          value={improve}
          onChange={handleChange(setImprove)}
          placeholder="提出具体的改进建议和行动方案..."
          rows={3}
        />
        {renderCharCount(improve)}
      </div>
      {success ? (
        <div className="submit-success">
          <svg
            className="success-check"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          提交成功
        </div>
      ) : (
        <button
          type="submit"
          className="submit-btn"
          disabled={
            submitting ||
            !good.trim() ||
            !bad.trim() ||
            !improve.trim()
          }
        >
          {submitting && <span className="spinner" />}
          {submitting ? '提交中...' : '匿名提交反馈'}
        </button>
      )}
    </form>
  );

  return (
    <>
      <div className="form-toggle-header" onClick={() => setMobileExpanded(!mobileExpanded)}>
        <span className="card-title" style={{ margin: 0, border: 'none', padding: 0 }}>
          匿名反馈
        </span>
        <span className={`form-toggle-arrow ${mobileExpanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </div>

      <div className="form-card-wrapper">
        <div className={`form-toggle-content ${mobileExpanded ? 'expanded' : 'collapsed'}`}
          style={window.innerWidth > 1024 ? { maxHeight: 'none', opacity: 1 } : undefined}
        >
          <div className="card">
            <div className="card-title" style={{ display: window.innerWidth <= 1024 ? 'none' : undefined }}>
              匿名反馈
            </div>
            {formContent}
          </div>
        </div>
      </div>
    </>
  );
}
