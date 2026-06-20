import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
} from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import QuestionEditor from './components/QuestionEditor';
import api from './api';

const Statistics = lazy(() => import('./components/Statistics'));

const fadeInStyle: React.CSSProperties = {
  animation: 'fadeIn 300ms ease-out',
};

function SurveyFiller() {
  const { id } = useParams<{ id: string }>();
  const [survey, setSurvey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.getSurvey(id).then((s) => {
      setSurvey(s);
      setLoading(false);
    }).catch(() => {
      setError('问卷未找到');
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = useCallback(async () => {
    if (!survey) return;
    setSubmitting(true);
    try {
      await api.submitResponse(survey.id, { answers });
      setSubmitted(true);
    } catch {
      setError('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  }, [survey, answers]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (error) return <div className="container"><div className="card"><p className="error-text">{error}</p></div></div>;
  if (!survey) return null;

  if (submitted) {
    return (
      <div className="container" style={fadeInStyle}>
        <div className="card success-card">
          <div className="success-icon">✓</div>
          <h2>感谢参与！</h2>
          <p>您的回答已成功提交。</p>
        </div>
      </div>
    );
  }

  const handleChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  return (
    <div className="container" style={fadeInStyle}>
      <div className="card survey-fill-card">
        <h1 className="survey-title">{survey.title}</h1>
        <p className="survey-desc">{survey.description}</p>
        <div className="questions-list">
          {survey.questions.map((q: any, idx: number) => (
            <div key={q.id} className="question-fill-item">
              <label className="question-fill-label">
                <span className="question-number">{idx + 1}.</span>
                {q.title}
                {q.required && <span className="required-mark">*</span>}
              </label>
              {q.type === 'radio' && (
                <div className="options-group">
                  {q.options.map((opt: string, oi: number) => (
                    <label key={oi} className="option-label">
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => handleChange(q.id, opt)}
                      />
                      <span className="option-text">{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.type === 'checkbox' && (
                <div className="options-group">
                  {q.options.map((opt: string, oi: number) => (
                    <label key={oi} className="option-label">
                      <input
                        type="checkbox"
                        value={opt}
                        checked={Array.isArray(answers[q.id]) && answers[q.id].includes(opt)}
                        onChange={(e) => {
                          const current: string[] = answers[q.id] || [];
                          if (e.target.checked) {
                            handleChange(q.id, [...current, opt]);
                          } else {
                            handleChange(q.id, current.filter((v: string) => v !== opt));
                          }
                        }}
                      />
                      <span className="option-text">{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.type === 'rating' && (
                <div className="rating-group">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`rating-btn ${answers[q.id] >= star ? 'active' : ''}`}
                      onClick={() => handleChange(q.id, star)}
                      type="button"
                    >
                      {star}
                    </button>
                  ))}
                </div>
              )}
              {q.type === 'text' && (
                <textarea
                  className="text-input"
                  placeholder="请输入您的回答..."
                  value={answers[q.id] || ''}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  rows={3}
                />
              )}
            </div>
          ))}
        </div>
        <button
          className="btn btn-primary submit-btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <span className="spinner-sm" /> : '提交回答'}
        </button>
      </div>
    </div>
  );
}

function SurveyCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [published, setPublished] = useState(false);
  const [surveyId, setSurveyId] = useState('');
  const [publishing, setPublishing] = useState(false);

  const addQuestion = useCallback((type: string) => {
    const newQ: any = {
      id: uuidv4(),
      type,
      title: '',
      required: false,
    };
    if (type === 'radio' || type === 'checkbox') {
      newQ.options = ['选项1', '选项2'];
    }
    setQuestions((prev) => [...prev, newQ]);
  }, []);

  const updateQuestion = useCallback((id: string, updates: any) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  }, []);

  const removeQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const moveQuestion = useCallback((fromIndex: number, toIndex: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const handlePublish = useCallback(async () => {
    if (!title.trim()) return;
    setPublishing(true);
    try {
      const result = await api.createSurvey({
        title,
        description,
        questions: questions.map((q) => ({
          id: q.id,
          type: q.type,
          title: q.title,
          required: q.required,
          options: q.options,
        })),
      });
      setSurveyId(result.id);
      setPublished(true);
    } catch {
      alert('发布失败，请重试');
    } finally {
      setPublishing(false);
    }
  }, [title, description, questions]);

  if (published && surveyId) {
    const surveyUrl = `${window.location.origin}/survey/${surveyId}`;
    return (
      <div className="container" style={fadeInStyle}>
        <div className="card publish-success-card">
          <h2>🎉 问卷已发布！</h2>
          <div className="share-section">
            <label>分享链接：</label>
            <div className="share-link-row">
              <input
                type="text"
                readOnly
                value={surveyUrl}
                className="share-link-input"
              />
              <button
                className="btn btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(surveyUrl);
                }}
              >
                复制
              </button>
            </div>
          </div>
          <div className="qr-section">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(surveyUrl)}`}
              alt="QR Code"
              className="qr-image"
            />
          </div>
          <div className="action-row">
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/survey/${surveyId}/results`)}
            >
              查看统计结果
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QuestionEditor
      title={title}
      description={description}
      questions={questions}
      onTitleChange={setTitle}
      onDescriptionChange={setDescription}
      onAddQuestion={addQuestion}
      onUpdateQuestion={updateQuestion}
      onRemoveQuestion={removeQuestion}
      onMoveQuestion={moveQuestion}
      onPublish={handlePublish}
      publishing={publishing}
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <div className="header-inner">
            <h1 className="logo" onClick={() => window.location.href = '/'}>
              <span className="logo-icon">📊</span>
              问卷调研平台
            </h1>
          </div>
        </header>
        <main className="app-main">
          <Suspense fallback={<div className="loading-spinner"><div className="spinner" /></div>}>
            <Routes>
              <Route path="/" element={<SurveyCreate />} />
              <Route path="/survey/:id" element={<SurveyFiller />} />
              <Route path="/survey/:id/results" element={<Statistics />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
