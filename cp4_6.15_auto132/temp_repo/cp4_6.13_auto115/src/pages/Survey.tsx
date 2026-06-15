import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSurvey, submitResponse } from '../api';

export default function Survey() {
  const { id } = useParams();
  const [survey, setSurvey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [expired, setExpired] = useState(false);
  const [notStarted, setNotStarted] = useState(false);

  useEffect(() => {
    loadSurvey();
  }, [id]);

  async function loadSurvey() {
    try {
      const data = await getSurvey(id!);
      setSurvey(data);
      const now = new Date();
      if (data.start_time && new Date(data.start_time) > now) {
        setNotStarted(true);
      }
      if (data.end_time && new Date(data.end_time) < now) {
        setExpired(true);
      }
      const initial: Record<string, any> = {};
      for (const q of data.questions) {
        initial[q.id] = q.type === 'multiple' ? [] : '';
      }
      setAnswers(initial);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSingleChange(questionId: string, value: string) {
    setAnswers({ ...answers, [questionId]: value });
  }

  function handleMultipleChange(questionId: string, option: string, checked: boolean) {
    const current = answers[questionId] || [];
    const next = checked ? [...current, option] : current.filter((v: string) => v !== option);
    setAnswers({ ...answers, [questionId]: next });
  }

  function handleTextChange(questionId: string, value: string) {
    setAnswers({ ...answers, [questionId]: value });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const payload = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer: typeof answer === 'string' ? answer : JSON.stringify(answer)
      }));
      await submitResponse(id!, payload);
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>加载中...</div>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center', padding: 48, maxWidth: 480 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😢</div>
          <h2 style={{ color: 'var(--primary)', marginBottom: 8 }}>问卷不存在</h2>
          <p style={{ color: 'var(--text-light)' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card fade-in" style={{ textAlign: 'center', padding: 64, maxWidth: 480 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ color: 'var(--primary)', marginBottom: 8 }}>感谢您的参与！</h2>
          <p style={{ color: 'var(--text-light)' }}>您的回答已成功提交</p>
        </div>
      </div>
    );
  }

  if (expired || notStarted) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center', padding: 64, maxWidth: 480 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⏰</div>
          <h2 style={{ color: 'var(--primary)', marginBottom: 8 }}>
            {notStarted ? '问卷尚未开始' : '问卷已截止'}
          </h2>
          <p style={{ color: 'var(--text-light)' }}>
            {notStarted && survey?.start_time && (
              <>开始时间：{new Date(survey.start_time).toLocaleString('zh-CN')}</>
            )}
            {expired && survey?.end_time && (
              <>结束时间：{new Date(survey.end_time).toLocaleString('zh-CN')}</>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '24px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="card fade-in" style={{ marginBottom: 20 }}>
          <h1 style={{ color: 'var(--primary)', fontSize: 24, marginBottom: 8 }}>{survey.title}</h1>
          {survey.description && (
            <p style={{ color: 'var(--text-light)', lineHeight: 1.6 }}>{survey.description}</p>
          )}
        </div>

        {survey.questions.map((q: any, idx: number) => (
          <div key={q.id} className="card fade-in" style={{ marginBottom: 16, animationDelay: `${idx * 50}ms` }}>
            <div style={{ marginBottom: 16 }}>
              <span style={{ color: 'var(--accent)', fontWeight: 600, marginRight: 8 }}>Q{idx + 1}.</span>
              <span style={{ fontWeight: 500, color: 'var(--text)' }}>{q.title}</span>
              {q.required === 1 && <span style={{ color: '#f44336', marginLeft: 4 }}>*</span>}
            </div>

            {q.type === 'single' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {q.options?.map((opt: string, i: number) => (
                  <label
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: answers[q.id] === opt ? 'rgba(0, 188, 212, 0.1)' : 'transparent',
                      border: answers[q.id] === opt ? '1px solid var(--accent)' : '1px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={(e) => handleSingleChange(q.id, e.target.value)}
                      style={{ accentColor: 'var(--accent)', width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 14 }}>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'multiple' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {q.options?.map((opt: string, i: number) => (
                  <label
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: (answers[q.id] || []).includes(opt) ? 'rgba(0, 188, 212, 0.1)' : 'transparent',
                      border: (answers[q.id] || []).includes(opt) ? '1px solid var(--accent)' : '1px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={(answers[q.id] || []).includes(opt)}
                      onChange={(e) => handleMultipleChange(q.id, opt, e.target.checked)}
                      style={{ accentColor: 'var(--accent)', width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 14 }}>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'text' && (
              <textarea
                placeholder="请输入您的回答..."
                value={answers[q.id] || ''}
                onChange={(e) => handleTextChange(q.id, e.target.value)}
                rows={4}
              />
            )}
          </div>
        ))}

        {error && (
          <div className="card fade-in" style={{ marginBottom: 16, border: '1px solid rgba(244, 67, 54, 0.3)', background: 'rgba(244, 67, 54, 0.05)' }}>
            <p style={{ color: 'var(--error)' }}>{error}</p>
          </div>
        )}

        <button className="btn btn-large" onClick={handleSubmit} disabled={submitting} style={{ width: '100%' }}>
          {submitting ? '提交中...' : '提交问卷'}
        </button>
      </div>
    </div>
  );
}
