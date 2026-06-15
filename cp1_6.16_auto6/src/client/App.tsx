import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { Plus, Eye, BarChart3, Edit, Share2, Download, Calendar, ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';
import QuestionEditor from './QuestionEditor';
import ChartView from './ChartView';
import type { Survey, Question, SurveyResults, SubmissionCreateInput } from '../shared/types';

function SurveyList() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const res = await fetch('/api/surveys');
      const data = await res.json();
      if (data.success) {
        setSurveys(data.data);
      }
    } catch (error) {
      console.error('获取问卷列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSurvey = async (id: string) => {
    if (!confirm('确定要删除这个问卷吗？')) return;
    try {
      const res = await fetch(`/api/surveys/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSurveys(surveys.filter((s) => s.id !== id));
      }
    } catch (error) {
      console.error('删除问卷失败:', error);
    }
  };

  const publishSurvey = async (id: string) => {
    try {
      const res = await fetch(`/api/surveys/${id}/publish`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSurveys(surveys.map((s) => (s.id === id ? data.data : s)));
      }
    } catch (error) {
      console.error('发布问卷失败:', error);
    }
  };

  const copyShareLink = (id: string) => {
    const link = `${window.location.origin}/survey/${id}`;
    navigator.clipboard.writeText(link);
    alert('分享链接已复制到剪贴板！');
  };

  if (loading) {
    return <div className="p-8 text-center">加载中...</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#4A90D9' }}>
            问卷调查平台
          </h1>
          <Link to="/editor" className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            创建问卷
          </Link>
        </div>

        {surveys.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-500 mb-4">暂无问卷，点击上方按钮创建您的第一个问卷</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {surveys.map((survey) => (
              <div key={survey.id} className="card p-4 fade-in">
                <h3 className="font-semibold text-lg mb-2">{survey.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {survey.description || '暂无描述'}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      survey.published
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {survey.published ? '已发布' : '未发布'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {survey.questions.length} 道题
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link to={`/editor/${survey.id}`} className="btn btn-secondary text-sm flex-1 flex items-center justify-center gap-1">
                    <Edit size={14} />
                    编辑
                  </Link>
                  {survey.published && (
                    <>
                      <Link to={`/survey/${survey.id}`} className="btn btn-secondary text-sm flex-1 flex items-center justify-center gap-1">
                        <Eye size={14} />
                        预览
                      </Link>
                      <Link to={`/results/${survey.id}`} className="btn btn-secondary text-sm flex-1 flex items-center justify-center gap-1">
                        <BarChart3 size={14} />
                        结果
                      </Link>
                    </>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  {!survey.published && (
                    <button
                      onClick={() => publishSurvey(survey.id)}
                      className="btn btn-primary text-sm flex-1"
                    >
                      发布问卷
                    </button>
                  )}
                  {survey.published && (
                    <button
                      onClick={() => copyShareLink(survey.id)}
                      className="btn btn-secondary text-sm flex-1 flex items-center justify-center gap-1"
                    >
                      <Share2 size={14} />
                      复制链接
                    </button>
                  )}
                  <button
                    onClick={() => deleteSurvey(survey.id)}
                    className="btn btn-danger text-sm flex-1"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EditorPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadSurvey(id);
    }
  }, [id]);

  const loadSurvey = async (surveyId: string) => {
    try {
      const res = await fetch(`/api/surveys/${surveyId}`);
      const data = await res.json();
      if (data.success) {
        setTitle(data.data.title);
        setDescription(data.data.description);
        setQuestions(data.data.questions);
      }
    } catch (error) {
      console.error('加载问卷失败:', error);
    }
  };

  const saveSurvey = async (publish = false) => {
    if (!title.trim()) {
      alert('请输入问卷标题');
      return;
    }
    if (questions.length === 0) {
      alert('请至少添加一道题目');
      return;
    }

    setSaving(true);
    try {
      const surveyData = { title, description, questions };
      let res;

      if (id) {
        res = await fetch(`/api/surveys/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(surveyData),
        });
      } else {
        res = await fetch('/api/surveys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(surveyData),
        });
      }

      const data = await res.json();
      if (data.success) {
        if (publish) {
          await fetch(`/api/surveys/${data.data.id}/publish`, { method: 'POST' });
        }
        navigate('/');
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存问卷失败:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
            <ChevronLeft size={18} />
            返回列表
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => saveSurvey(false)}
              disabled={saving}
              className="btn btn-secondary"
            >
              {saving ? '保存中...' : '保存草稿'}
            </button>
            <button
              onClick={() => saveSurvey(true)}
              disabled={saving}
              className="btn btn-primary flex items-center gap-2"
            >
              <Check size={18} />
              {saving ? '发布中...' : '保存并发布'}
            </button>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入问卷标题"
            className="text-2xl font-bold mb-3 border-none focus:ring-0 p-0"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请输入问卷描述（可选）"
            rows={2}
            className="border-none focus:ring-0 p-0 resize-none"
          />
        </div>

        <div className="flex gap-6 editor-layout">
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-4">编辑题目</h2>
            <QuestionEditor questions={questions} onChange={setQuestions} />
          </div>
          <div className="w-96">
            <h2 className="text-lg font-semibold mb-4">实时预览</h2>
            <div className="card p-6 sticky top-6">
              <h3 className="font-semibold text-lg mb-2">{title || '问卷标题'}</h3>
              <p className="text-sm text-gray-500 mb-6">
                {description || '问卷描述'}
              </p>
              {questions.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  添加题目后这里会显示预览
                </p>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <div key={q.id} className="fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                      <p className="font-medium mb-2">
                        {index + 1}. {q.title || '题目标题'}
                        {q.required && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      {q.type === 'single' && q.options && (
                        <div className="space-y-1">
                          {q.options.map((opt, i) => (
                            <div key={i} className="option-item">
                              <input type="radio" disabled />
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {q.type === 'multiple' && q.options && (
                        <div className="space-y-1">
                          {q.options.map((opt, i) => (
                            <div key={i} className="option-item">
                              <input type="checkbox" disabled />
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {q.type === 'rating' && (
                        <div className="star-rating">
                          {Array.from({ length: q.maxRating || 5 }).map((_, i) => (
                            <span key={i} className="star">
                              ★
                            </span>
                          ))}
                        </div>
                      )}
                      {q.type === 'text' && (
                        <textarea
                          disabled
                          rows={3}
                          placeholder="请输入您的回答..."
                          className="bg-gray-50"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SurveyPage() {
  const { id } = useParams<{ id: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (id) {
      loadSurvey(id);
    }
  }, [id]);

  const loadSurvey = async (surveyId: string) => {
    try {
      const res = await fetch(`/api/surveys/${surveyId}`);
      const data = await res.json();
      if (data.success) {
        setSurvey(data.data);
      } else {
        alert(data.error || '加载问卷失败');
      }
    } catch (error) {
      console.error('加载问卷失败:', error);
      alert('加载问卷失败');
    }
  };

  if (!survey) {
    return <div className="p-8 text-center">加载中...</div>;
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-8 text-center max-w-md fade-in">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold mb-2">提交成功！</h2>
          <p className="text-gray-500">感谢您的参与，您的回答已记录。</p>
        </div>
      </div>
    );
  }

  const currentQuestion = survey.questions[currentIndex];

  const validateAndProceed = () => {
    const newErrors: string[] = [];

    if (currentQuestion.required) {
      const answer = answers[currentQuestion.id];
      if (
        answer === undefined ||
        answer === null ||
        (typeof answer === 'string' && answer.trim() === '') ||
        (Array.isArray(answer) && answer.length === 0)
      ) {
        newErrors.push(`"${currentQuestion.title}" 为必填项`);
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);

    if (currentIndex < survey.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      submitSurvey();
    }
  };

  const submitSurvey = async () => {
    setSubmitting(true);
    try {
      const submissionData: SubmissionCreateInput = {
        surveyId: survey.id,
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value,
        })),
      };

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        alert(data.error || '提交失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSingleChoice = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  const handleMultipleChoice = (value: string) => {
    const current = (answers[currentQuestion.id] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setAnswers({ ...answers, [currentQuestion.id]: updated });
  };

  const handleRating = (value: number) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  const handleText = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-2">{survey.title}</h1>
        <p className="text-gray-500 mb-6">{survey.description}</p>

        <div className="step-bar">
          {survey.questions.map((_, index) => (
            <React.Fragment key={index}>
              <div
                className={`step-dot ${
                  index < currentIndex
                    ? 'completed'
                    : index === currentIndex
                    ? 'active'
                    : ''
                }`}
              >
                {index < currentIndex ? '✓' : index + 1}
              </div>
              {index < survey.questions.length - 1 && (
                <div className={`step-line ${index < currentIndex ? 'completed' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            {errors.map((err, i) => (
              <div key={i} className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                {err}
              </div>
            ))}
          </div>
        )}

        <div key={currentQuestion.id} className="fade-in">
          <p className="font-semibold text-lg mb-4">
            {currentIndex + 1}. {currentQuestion.title}
            {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
          </p>

          {currentQuestion.type === 'single' && currentQuestion.options && (
            <div className="space-y-2">
              {currentQuestion.options.map((opt, i) => (
                <div
                  key={i}
                  onClick={() => handleSingleChoice(opt)}
                  className={`option-item ${
                    answers[currentQuestion.id] === opt ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    checked={answers[currentQuestion.id] === opt}
                    onChange={() => handleSingleChoice(opt)}
                  />
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          )}

          {currentQuestion.type === 'multiple' && currentQuestion.options && (
            <div className="space-y-2">
              {currentQuestion.options.map((opt, i) => {
                const current = (answers[currentQuestion.id] as string[]) || [];
                return (
                  <div
                    key={i}
                    onClick={() => handleMultipleChoice(opt)}
                    className={`option-item ${
                      current.includes(opt) ? 'selected' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={current.includes(opt)}
                      onChange={() => handleMultipleChoice(opt)}
                    />
                    <span>{opt}</span>
                  </div>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'rating' && (
            <div className="star-rating">
              {Array.from({ length: currentQuestion.maxRating || 5 }).map((_, i) => (
                <span
                  key={i}
                  onClick={() => handleRating(i + 1)}
                  className={`star ${
                    (answers[currentQuestion.id] as number) >= i + 1 ? 'active' : ''
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          )}

          {currentQuestion.type === 'text' && (
            <textarea
              value={(answers[currentQuestion.id] as string) || ''}
              onChange={(e) => handleText(e.target.value)}
              placeholder="请输入您的回答..."
              rows={4}
            />
          )}
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={() => setCurrentIndex(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="btn btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
            上一题
          </button>
          <button
            onClick={validateAndProceed}
            disabled={submitting}
            className="btn btn-primary flex items-center gap-2"
          >
            {submitting ? (
              '提交中...'
            ) : currentIndex === survey.questions.length - 1 ? (
              <>
                <Check size={18} />
                提交
              </>
            ) : (
              <>
                下一题
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadResults(id);
    }
  }, [id, startTime, endTime]);

  const loadResults = async (surveyId: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startTime) params.append('startTime', String(new Date(startTime).getTime()));
      if (endTime) params.append('endTime', String(new Date(endTime).getTime()));

      const res = await fetch(`/api/surveys/${surveyId}/results?${params}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
      }
    } catch (error) {
      console.error('加载结果失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (startTime) params.append('startTime', String(new Date(startTime).getTime()));
      if (endTime) params.append('endTime', String(new Date(endTime).getTime()));

      const res = await fetch(`/api/surveys/${id}/export?${params}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey_${id}_${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">加载中...</div>;
  }

  if (!results) {
    return <div className="p-8 text-center">未找到数据</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
            <ChevronLeft size={18} />
            返回列表
          </Link>
          <div className="flex gap-2">
            <Link to={`/survey/${id}`} className="btn btn-secondary flex items-center gap-2">
              <Eye size={18} />
              查看问卷
            </Link>
            <button onClick={exportCsv} className="btn btn-primary flex items-center gap-2">
              <Download size={18} />
              导出CSV
            </button>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">{results.surveyTitle}</h1>
          <p className="text-gray-500">共收到 {results.totalSubmissions} 份答卷</p>
        </div>

        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar size={20} />
            时间筛选
          </h2>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">开始时间：</label>
              <input
                type="date"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">结束时间：</label>
              <input
                type="date"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-40"
              />
            </div>
            <button
              onClick={() => {
                setStartTime('');
                setEndTime('');
              }}
              className="btn btn-secondary text-sm"
            >
              重置筛选
            </button>
          </div>
        </div>

        <ChartView questionStats={results.questionStats} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SurveyList />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
        <Route path="/survey/:id" element={<SurveyPage />} />
        <Route path="/results/:id" element={<ResultsPage />} />
      </Routes>
    </Router>
  );
}
