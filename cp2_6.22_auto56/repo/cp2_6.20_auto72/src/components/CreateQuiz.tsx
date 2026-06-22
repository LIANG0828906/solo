import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { quizApi } from '../api';
import type { QuestionCreate, QuestionType } from '../types';

function CreateQuiz() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<QuestionCreate[]>([
    { type: 'choice', content: '', options: ['', '', '', ''], answer: '', score: 10 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addQuestion = (type: QuestionType) => {
    const newQuestion: QuestionCreate =
      type === 'choice'
        ? { type, content: '', options: ['', '', '', ''], answer: '', score: 10 }
        : { type, content: '', answer: '', score: 10 };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    (updated[index] as any)[field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    if (updated[qIndex].options) {
      updated[qIndex].options![oIndex] = value;
      setQuestions(updated);
    }
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].options) {
      updated[qIndex].options!.push('');
      setQuestions(updated);
    }
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].options && updated[qIndex].options!.length > 4) {
      updated[qIndex].options!.splice(oIndex, 1);
      setQuestions(updated);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!title.trim()) {
      setError('请输入测验标题');
      return;
    }

    if (questions.length < 10) {
      setError(`至少需要10道题，当前只有 ${questions.length} 道`);
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim()) {
        setError(`第 ${i + 1} 题的题干不能为空`);
        return;
      }
      if (!q.answer.trim()) {
        setError(`第 ${i + 1} 题的答案不能为空`);
        return;
      }
      if (q.type === 'choice') {
        const emptyOptions = q.options?.filter((o) => !o.trim()).length || 0;
        if (emptyOptions > 0 || (q.options?.length || 0) < 4) {
          setError(`第 ${i + 1} 题至少需要4个非空选项`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      await quizApi.createQuiz({ title, questions });
      navigate('/teacher');
    } catch (e: any) {
      setError(e.message || '创建失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <h2 style={{ color: '#1a365d', fontSize: '24px', fontWeight: 700 }}>
          创建新测验
        </h2>
        <Link
          to="/teacher"
          style={{
            padding: '8px 16px',
            border: '1px solid #3182ce',
            color: '#3182ce',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          ← 返回列表
        </Link>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#fff5f5',
            border: '1px solid #e53e3e',
            color: '#e53e3e',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontWeight: 500 }}>
          测验标题
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="请输入测验标题"
          style={{
            width: '100%',
            padding: '12px 14px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '16px',
            outline: 'none',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#3182ce')}
          onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ color: '#718096', lineHeight: '36px' }}>添加题目：</span>
        <button
          onClick={() => addQuestion('choice')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3182ce',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          + 选择题
        </button>
        <button
          onClick={() => addQuestion('judge')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#38a169',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          + 判断题
        </button>
        <button
          onClick={() => addQuestion('fill')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ed8936',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          + 填空题
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {questions.map((q, qIndex) => (
          <div
            key={qIndex}
            className="animate-fade-in"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              borderLeft: `4px solid ${
                q.type === 'choice' ? '#3182ce' : q.type === 'judge' ? '#38a169' : '#ed8936'
              }`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor:
                    q.type === 'choice' ? '#3182ce' : q.type === 'judge' ? '#38a169' : '#ed8936',
                }}
              >
                第{qIndex + 1}题 -{' '}
                {q.type === 'choice' ? '选择题' : q.type === 'judge' ? '判断题' : '填空题'}
              </span>
              {questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(qIndex)}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: 'transparent',
                    border: '1px solid #e53e3e',
                    color: '#e53e3e',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  删除
                </button>
              )}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label
                style={{ display: 'block', marginBottom: '6px', color: '#4a5568', fontSize: '14px' }}
              >
                题干
              </label>
              <input
                type="text"
                value={q.content}
                onChange={(e) => updateQuestion(qIndex, 'content', e.target.value)}
                placeholder="请输入题目内容"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3182ce')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>

            {q.type === 'choice' && q.options && (
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{ display: 'block', marginBottom: '6px', color: '#4a5568', fontSize: '14px' }}
                >
                  选项（至少4个）
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} style={{ display: 'flex', gap: '8px' }}>
                      <span
                        style={{
                          width: '28px',
                          height: '38px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#edf2f7',
                          borderRadius: '6px',
                          fontWeight: 600,
                          color: '#4a5568',
                          fontSize: '14px',
                        }}
                      >
                        {String.fromCharCode(65 + oIndex)}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        placeholder={`选项 ${String.fromCharCode(65 + oIndex)}`}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#3182ce')}
                        onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                      />
                      {q.options && q.options.length > 4 && (
                        <button
                          onClick={() => removeOption(qIndex, oIndex)}
                          style={{
                            padding: '0 12px',
                            backgroundColor: 'transparent',
                            border: '1px solid #e53e3e',
                            color: '#e53e3e',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addOption(qIndex)}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    backgroundColor: 'transparent',
                    border: '1px dashed #3182ce',
                    color: '#3182ce',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  + 添加选项
                </button>
              </div>
            )}

            {q.type === 'judge' && (
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{ display: 'block', marginBottom: '6px', color: '#4a5568', fontSize: '14px' }}
                >
                  正确答案
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['true', 'false'].map((val) => (
                    <div
                      key={val}
                      onClick={() => updateQuestion(qIndex, 'answer', val)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        textAlign: 'center',
                        border:
                          q.answer === val
                            ? '2px solid #3182ce'
                            : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: q.answer === val ? '#ebf8ff' : '#ffffff',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                    >
                      {val === 'true' ? '✓ 正确' : '✗ 错误'}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {q.type === 'fill' && (
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{ display: 'block', marginBottom: '6px', color: '#4a5568', fontSize: '14px' }}
                >
                  正确答案
                </label>
                <input
                  type="text"
                  value={q.answer}
                  onChange={(e) => updateQuestion(qIndex, 'answer', e.target.value)}
                  placeholder="请输入正确答案"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#3182ce')}
                  onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                />
              </div>
            )}

            {q.type === 'choice' && (
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{ display: 'block', marginBottom: '6px', color: '#4a5568', fontSize: '14px' }}
                >
                  正确答案（填写选项内容）
                </label>
                <input
                  type="text"
                  value={q.answer}
                  onChange={(e) => updateQuestion(qIndex, 'answer', e.target.value)}
                  placeholder="请输入正确选项的内容"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#3182ce')}
                  onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                />
              </div>
            )}

            <div>
              <label
                style={{ display: 'block', marginBottom: '6px', color: '#4a5568', fontSize: '14px' }}
              >
                分值
              </label>
              <input
                type="number"
                value={q.score}
                onChange={(e) => updateQuestion(qIndex, 'score', parseInt(e.target.value) || 10)}
                min="1"
                max="100"
                style={{
                  width: '100px',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: '#f0f4f8',
          padding: '16px 0',
          marginTop: '24px',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '100%',
          }}
        >
          <span style={{ color: '#718096', fontSize: '14px' }}>
            已添加 <strong style={{ color: '#1a365d' }}>{questions.length}</strong> 道题
            {questions.length < 10 && (
              <span style={{ color: '#e53e3e', marginLeft: '8px' }}>
                (还需 {10 - questions.length} 道)
              </span>
            )}
          </span>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || questions.length < 10}
            style={{
              padding: '12px 32px',
              backgroundColor: questions.length >= 10 ? '#38a169' : '#a0aec0',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isSubmitting || questions.length < 10 ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? '创建中...' : '创建测验'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateQuiz;
