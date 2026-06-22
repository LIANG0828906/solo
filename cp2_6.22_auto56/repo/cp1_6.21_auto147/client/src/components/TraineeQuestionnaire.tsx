import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import type { Questionnaire, Trainee, Question } from '../types';

export default function TraineeQuestionnaire() {
  const { traineeId } = useParams<{ traineeId: string }>();
  const [trainee, setTrainee] = useState<Trainee | null>(null);
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    if (traineeId) {
      loadData(traineeId);
    }
  }, [traineeId]);

  const loadData = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const traineeResponse = await axios.get(`/api/trainee/${id}`);
      const traineeData = traineeResponse.data;
      setTrainee(traineeData);

      if (traineeData.status === 'submitted') {
        setSubmitted(true);
        setLoading(false);
        return;
      }

      await axios.patch(`/api/trainee/${id}/view`);

      const sampleQuestionnaire = createSampleQuestionnaire();
      setQuestionnaire(sampleQuestionnaire);

      const initialAnswers: Record<string, any> = {};
      sampleQuestionnaire.questions.forEach((q: Question) => {
        if (q.type === 'multiple') {
          initialAnswers[q.id] = [];
        } else if (q.type === 'single') {
          initialAnswers[q.id] = null;
        } else {
          initialAnswers[q.id] = '';
        }
      });
      setAnswers(initialAnswers);
    } catch (err: any) {
      setError(err.response?.data?.error || '加载失败，请检查链接是否正确');
    } finally {
      setLoading(false);
    }
  };

  const createSampleQuestionnaire = (): Questionnaire => {
    return {
      id: 'sample-1',
      title: '新员工入职培训问卷',
      inviteCode: 'ABC123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [
        {
          id: 'q1',
          type: 'single',
          title: '您所在的部门是？',
          order: 0,
          options: ['技术部', '市场部', '人资部', '财务部', '运营部', '产品部']
        },
        {
          id: 'q2',
          type: 'single',
          title: '您对公司的企业文化了解程度如何？',
          order: 1,
          options: ['非常了解', '比较了解', '一般', '不太了解', '完全不了解']
        },
        {
          id: 'q3',
          type: 'multiple',
          title: '您希望参加哪些类型的培训？（可多选）',
          order: 2,
          options: ['专业技能', '管理能力', '沟通技巧', '项目管理', '外语培训', '其他']
        },
        {
          id: 'q4',
          type: 'text',
          title: '请简要描述您对本次培训的期望和建议',
          order: 3,
          maxLength: 500
        }
      ]
    };
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleMultipleChange = (questionId: string, option: string, checked: boolean) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...current, option] };
      } else {
        return { ...prev, [questionId]: current.filter((o: string) => o !== option) };
      }
    });
  };

  const handleSubmit = async () => {
    if (!trainee || !questionnaire) return;

    const unanswered = questionnaire.questions.filter(q => {
      const answer = answers[q.id];
      if (q.type === 'text') return !answer || !answer.trim();
      if (q.type === 'multiple') return !answer || answer.length === 0;
      return answer === null || answer === undefined;
    });

    if (unanswered.length > 0) {
      if (!window.confirm(`还有 ${unanswered.length} 道题未作答，确定要提交吗？`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      await axios.patch(`/api/trainee/${trainee.id}/submit`, { answers });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestion = () => {
    if (questionnaire && currentQuestionIndex < questionnaire.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (loading) {
    return (
      <div style={pageContainerStyle}>
        <div className="loading-container" style={{ height: '100vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageContainerStyle}>
        <div style={errorPageStyle}>
          <span style={{ fontSize: '64px', marginBottom: '16px' }}>😕</span>
          <h2 style={{ fontSize: '20px', marginBottom: '8px', color: '#1E293B' }}>出错了</h2>
          <p style={{ color: '#64748B' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={pageContainerStyle}>
        <div style={successPageStyle}>
          <span style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</span>
          <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#1E293B' }}>提交成功！</h2>
          <p style={{ color: '#64748B', marginBottom: '24px' }}>
            感谢您完成问卷，您的反馈对我们很重要。
          </p>
          {trainee && (
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>
              提交时间：{new Date(trainee.submittedAt || Date.now()).toLocaleString('zh-CN')}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!questionnaire) return null;

  const currentQuestion = questionnaire.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questionnaire.questions.length) * 100;

  return (
    <div style={pageContainerStyle}>
      <div style={questionnaireCardStyle}>
        <div style={cardHeaderStyle}>
          <h1 style={cardTitleStyle}>{questionnaire.title}</h1>
          <div style={progressBarStyle}>
            <div style={{ ...progressFillStyle, width: `${progress}%` }} />
          </div>
          <span style={progressTextStyle}>
            {currentQuestionIndex + 1} / {questionnaire.questions.length}
          </span>
        </div>

        <div style={questionAreaStyle}>
          <div style={questionNumberStyle}>
            第 {currentQuestionIndex + 1} 题
            <span style={questionTypeStyle}>
              {currentQuestion.type === 'single' && ' (单选)'}
              {currentQuestion.type === 'multiple' && ' (多选)'}
              {currentQuestion.type === 'text' && ' (简答)'}
            </span>
          </div>
          <h2 style={questionTitleStyle}>{currentQuestion.title}</h2>

          {currentQuestion.type === 'single' && currentQuestion.options && (
            <div style={optionsListStyle}>
              {currentQuestion.options.map((option, index) => (
                <div
                  key={index}
                  style={{
                    ...optionItemStyle,
                    borderColor: answers[currentQuestion.id] === option ? '#3B82F6' : '#E2E8F0',
                    backgroundColor: answers[currentQuestion.id] === option ? '#EFF6FF' : '#FFFFFF'
                  }}
                  onClick={() => handleAnswerChange(currentQuestion.id, option)}
                >
                  <div
                    style={{
                      ...radioStyle,
                      borderColor: answers[currentQuestion.id] === option ? '#3B82F6' : '#CBD5E1',
                      backgroundColor: answers[currentQuestion.id] === option ? '#3B82F6' : 'transparent'
                    }}
                  >
                    {answers[currentQuestion.id] === option && (
                      <div style={radioDotStyle} />
                    )}
                  </div>
                  <span style={optionTextStyle}>{option}</span>
                </div>
              ))}
            </div>
          )}

          {currentQuestion.type === 'multiple' && currentQuestion.options && (
            <div style={optionsListStyle}>
              {currentQuestion.options.map((option, index) => {
                const isChecked = (answers[currentQuestion.id] || []).includes(option);
                return (
                  <div
                    key={index}
                    style={{
                      ...optionItemStyle,
                      borderColor: isChecked ? '#3B82F6' : '#E2E8F0',
                      backgroundColor: isChecked ? '#EFF6FF' : '#FFFFFF'
                    }}
                    onClick={() => handleMultipleChange(currentQuestion.id, option, !isChecked)}
                  >
                    <div
                      style={{
                        ...checkboxStyle,
                        borderColor: isChecked ? '#3B82F6' : '#CBD5E1',
                        backgroundColor: isChecked ? '#3B82F6' : 'transparent'
                      }}
                    >
                      {isChecked && <span style={checkMarkStyle}>✓</span>}
                    </div>
                    <span style={optionTextStyle}>{option}</span>
                  </div>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'text' && (
            <div>
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={e => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="请输入您的回答..."
                rows={6}
                maxLength={currentQuestion.maxLength || 500}
                style={textareaStyle}
              />
              <div style={charCountStyle}>
                {(answers[currentQuestion.id] || '').length} / {currentQuestion.maxLength || 500}
              </div>
            </div>
          )}
        </div>

        <div style={cardFooterStyle}>
          <button
            className="btn-secondary"
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            style={{ opacity: currentQuestionIndex === 0 ? 0.5 : 1 }}
          >
            上一题
          </button>

          {currentQuestionIndex === questionnaire.questions.length - 1 ? (
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? '提交中...' : '提交问卷'}
            </button>
          ) : (
            <button className="btn-primary" onClick={nextQuestion}>
              下一题
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const pageContainerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#F8FAFC',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px'
};

const questionnaireCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '600px',
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  overflow: 'hidden'
};

const cardHeaderStyle: React.CSSProperties = {
  padding: '24px',
  borderBottom: '1px solid #E2E8F0',
  position: 'relative'
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 600,
  color: '#1E293B',
  marginBottom: '16px'
};

const progressBarStyle: React.CSSProperties = {
  height: '6px',
  backgroundColor: '#E2E8F0',
  borderRadius: '3px',
  overflow: 'hidden'
};

const progressFillStyle: React.CSSProperties = {
  height: '100%',
  backgroundColor: '#3B82F6',
  borderRadius: '3px',
  transition: 'width 0.3s ease'
};

const progressTextStyle: React.CSSProperties = {
  position: 'absolute',
  right: '24px',
  top: '24px',
  fontSize: '13px',
  color: '#64748B',
  fontWeight: 500
};

const questionAreaStyle: React.CSSProperties = {
  padding: '24px',
  minHeight: '300px'
};

const questionNumberStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748B',
  marginBottom: '8px'
};

const questionTypeStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#94A3B8'
};

const questionTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 500,
  color: '#1E293B',
  marginBottom: '24px',
  lineHeight: '1.5'
};

const optionsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const optionItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '14px 16px',
  borderRadius: '10px',
  border: '2px solid',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};

const radioStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  border: '2px solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease'
};

const radioDotStyle: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: 'white'
};

const checkboxStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  borderRadius: '4px',
  border: '2px solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease'
};

const checkMarkStyle: React.CSSProperties = {
  color: 'white',
  fontSize: '12px',
  fontWeight: 'bold'
};

const optionTextStyle: React.CSSProperties = {
  fontSize: '15px',
  color: '#334155'
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  borderRadius: '10px',
  border: '1px solid #E2E8F0',
  fontSize: '15px',
  lineHeight: '1.6',
  resize: 'vertical',
  minHeight: '150px'
};

const charCountStyle: React.CSSProperties = {
  textAlign: 'right',
  fontSize: '12px',
  color: '#94A3B8',
  marginTop: '8px'
};

const cardFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '20px 24px',
  borderTop: '1px solid #E2E8F0',
  backgroundColor: '#FAFAFA'
};

const errorPageStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px'
};

const successPageStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '48px 32px',
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  maxWidth: '400px'
};
