import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import axios from 'axios';
import QuestionRenderer from './components/QuestionRenderer';
import { QuestionnaireModel, Answers, AnswerValue, SkipLogic } from './types';

const App: React.FC = () => {
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireModel | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [activeQuestionId, setActiveQuestionId] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);

  const questionNumberMap = useMemo(() => {
    if (!questionnaire) return {};
    const map: Record<string, number> = {};
    questionnaire.questions.forEach((q, idx) => {
      map[q.id] = idx + 1;
    });
    return map;
  }, [questionnaire]);

  const evaluateCondition = useCallback((logic: SkipLogic, answers: Answers): boolean => {
    const { condition } = logic;
    const answerValue = answers[condition.questionId];

    if (answerValue === null || answerValue === undefined) {
      return false;
    }

    switch (condition.operator) {
      case 'equals':
        if (Array.isArray(answerValue)) {
          return answerValue.includes(String(condition.value));
        }
        return answerValue === condition.value;
      case 'not_equals':
        if (Array.isArray(answerValue)) {
          return !answerValue.includes(String(condition.value));
        }
        return answerValue !== condition.value;
      case 'contains':
        if (Array.isArray(answerValue)) {
          if (Array.isArray(condition.value)) {
            return condition.value.every(v => answerValue.includes(v));
          }
          return answerValue.includes(String(condition.value));
        }
        return String(answerValue).includes(String(condition.value));
      case 'greater_than':
        return Number(answerValue) > Number(condition.value);
      case 'less_than':
        return Number(answerValue) < Number(condition.value);
      default:
        return false;
    }
  }, []);

  const shouldSkipQuestion = useCallback((questionId: string, questions: any[], answers: Answers): boolean => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !question.skipLogic || question.skipLogic.length === 0) {
      return false;
    }

    for (const logic of question.skipLogic) {
      if (evaluateCondition(logic, answers)) {
        return logic.skip;
      }
    }
    return false;
  }, [evaluateCondition]);

  const getVisibleQuestions = useCallback((): string[] => {
    if (!questionnaire) return [];
    const visible: string[] = [];
    let skipUntilId: string | null = null;

    questionnaire.questions.forEach((question, index) => {
      if (skipUntilId) {
        if (question.id === skipUntilId) {
          skipUntilId = null;
        } else {
          return;
        }
      }

      const shouldSkip = shouldSkipQuestion(question.id, questionnaire.questions, answers);

      if (shouldSkip) {
        const skipLogic = question.skipLogic?.find(logic => evaluateCondition(logic, answers));
        if (skipLogic?.skipToQuestionId) {
          skipUntilId = skipLogic.skipToQuestionId;
        }
        return;
      }

      visible.push(question.id);
    });

    return visible;
  }, [questionnaire, answers, shouldSkipQuestion, evaluateCondition]);

  const visibleQuestionIds = useMemo(() => getVisibleQuestions(), [getVisibleQuestions]);

  const firstVisibleId = useMemo(() => {
    return visibleQuestionIds[0] || '';
  }, [visibleQuestionIds]);

  useEffect(() => {
    if (firstVisibleId && !activeQuestionId) {
      setActiveQuestionId(firstVisibleId);
    }
  }, [firstVisibleId, activeQuestionId]);

  const progress = useMemo(() => {
    if (!questionnaire || questionnaire.questions.length === 0) return 0;
    const answeredCount = Object.keys(answers).filter(id => {
      const ans = answers[id];
      if (Array.isArray(ans)) return ans.length > 0;
      return ans !== null && ans !== undefined && ans !== '';
    }).length;
    return Math.round((answeredCount / questionnaire.questions.length) * 100);
  }, [questionnaire, answers]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('请上传JSON格式的文件');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    startTimeRef.current = performance.now();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const data = response.data;
      if (data.success) {
        setQuestionnaire(data.data);
        setAnswers({});
        setActiveQuestionId('');
        setSuccess(data.message);

        const loadTime = performance.now() - startTimeRef.current;
        console.log(`问卷加载时间: ${loadTime.toFixed(2)}ms`);

        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || '上传失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '上传失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  }, [isDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileUpload]);

  const handleAnswerChange = useCallback((questionId: string, value: AnswerValue) => {
    const startTime = performance.now();

    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));

    setActiveQuestionId(questionId);

    const responseTime = performance.now() - startTime;
    if (responseTime > 100) {
      console.warn(`答案更新响应时间: ${responseTime.toFixed(2)}ms，超过100ms阈值`);
    }
  }, []);

  const handleExport = useCallback(async () => {
    if (!questionnaire) return;

    try {
      const response = await axios.post('/api/export', {
        answers,
        title: questionnaire.title
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const disposition = response.headers['content-disposition'];
      let filename = 'questionnaire_answers.json';
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess('答案导出成功！');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '导出失败');
    }
  }, [questionnaire, answers]);

  const handleQuestionClick = useCallback((questionId: string) => {
    const startTime = performance.now();
    setActiveQuestionId(questionId);
    setIsMobileMenuOpen(false);

    const responseTime = performance.now() - startTime;
    if (responseTime > 100) {
      console.warn(`问题切换响应时间: ${responseTime.toFixed(2)}ms，超过100ms阈值`);
    }
  }, []);

  const isQuestionAnswered = useCallback((questionId: string): boolean => {
    const ans = answers[questionId];
    if (Array.isArray(ans)) return ans.length > 0;
    return ans !== null && ans !== undefined && ans !== '';
  }, [answers]);

  const renderUploadZone = () => (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '12px', color: '#2C3E50' }}>
          JSON问卷可视化系统
        </h1>
        <p style={{ fontSize: '16px', color: '#7F8C8D' }}>
          上传JSON格式的问卷数据，自动生成可交互的问卷页面
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div
        className={`upload-zone ${isDragOver ? 'dragover' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        <div className="upload-icon">📄</div>
        <div className="upload-text">
          {isLoading ? '正在解析...' : '点击或拖拽JSON文件到此处'}
        </div>
        <div className="upload-hint">
          支持 .json 格式，符合预定义schema的问卷数据
        </div>
      </div>

      <div style={{ marginTop: '40px', background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '16px', color: '#2C3E50' }}>示例JSON格式</h3>
        <pre style={{ background: '#F5E6CC', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '13px', lineHeight: 1.6 }}>
{`{
  "title": "用户满意度调查问卷",
  "description": "请您抽出几分钟时间填写这份问卷",
  "questions": [
    {
      "id": "q1",
      "type": "single",
      "title": "您的性别是？",
      "options": [
        { "value": "male", "label": "男" },
        { "value": "female", "label": "女" }
      ],
      "required": true
    },
    {
      "id": "q2",
      "type": "rating",
      "title": "请对我们的服务打分",
      "required": true
    },
    {
      "id": "q3",
      "type": "multiple",
      "title": "您喜欢哪些功能？",
      "options": [
        { "value": "feature1", "label": "功能一" },
        { "value": "feature2", "label": "功能二" }
      ],
      "skipLogic": [
        {
          "condition": {
            "questionId": "q1",
            "operator": "equals",
            "value": "female"
          },
          "skip": false
        }
      ]
    },
    {
      "id": "q4",
      "type": "text",
      "title": "您有什么建议？",
      "required": false
    }
  ]
}`}
        </pre>
      </div>
    </div>
  );

  const renderSidebar = () => {
    if (!questionnaire) return null;

    return (
      <>
        <div
          className={`backdrop ${isMobileMenuOpen ? 'visible' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''} ${isFullscreen ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-title">{questionnaire.title}</div>
          </div>
          <div>
            {questionnaire.questions.map(q => {
              const isVisible = visibleQuestionIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  className={`question-nav-item ${activeQuestionId === q.id ? 'active' : ''} ${isQuestionAnswered(q.id) ? 'answered' : ''}`}
                  onClick={() => handleQuestionClick(q.id)}
                  style={{ opacity: isVisible ? 1 : 0.4 }}
                >
                  <div className="question-nav-title">
                    {questionNumberMap[q.id]}. {q.title.length > 25 ? q.title.substring(0, 25) + '...' : q.title}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </>
    );
  };

  const renderQuestionnaire = () => {
    if (!questionnaire) return null;

    const content = (
      <>
        <div className="header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!isFullscreen && (
              <button
                className="hamburger-btn"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                ☰
              </button>
            )}
            <h1 className="questionnaire-title">{questionnaire.title}</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setQuestionnaire(null);
                setAnswers({});
                setActiveQuestionId('');
              }}
            >
              重新上传
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? '退出全屏' : '全屏预览'}
            </button>
          </div>
        </div>

        {questionnaire.description && (
          <p style={{ marginBottom: '20px', color: '#7F8C8D', fontSize: '15px' }}>
            {questionnaire.description}
          </p>
        )}

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div style={{ marginBottom: '16px', textAlign: 'right', color: '#7F8C8D', fontSize: '14px' }}>
          完成进度: {progress}%
        </div>

        {questionnaire.questions.map(q => (
          <QuestionRenderer
            key={q.id}
            question={q}
            questionNumber={questionNumberMap[q.id]}
            answer={answers[q.id] ?? null}
            onAnswerChange={handleAnswerChange}
            isVisible={visibleQuestionIds.includes(q.id)}
            isActive={activeQuestionId === q.id}
          />
        ))}
      </>
    );

    if (isFullscreen) {
      return (
        <div className="fullscreen-mode">
          <div className="fullscreen-content">
            {content}
          </div>
          <div className="export-bar">
            <button className="btn btn-export" onClick={handleExport}>
              ⬇ 导出答案 (JSON)
            </button>
          </div>
        </div>
      );
    }

    return content;
  };

  return (
    <div>
      {renderSidebar()}
      <main className={`main-content ${isFullscreen ? 'fullscreen' : ''}`}>
        {questionnaire ? renderQuestionnaire() : renderUploadZone()}
      </main>
    </div>
  );
};

export default App;
