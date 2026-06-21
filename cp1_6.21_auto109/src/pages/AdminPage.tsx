import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { Question, QuestionType, CreateQuestionPayload } from '../types';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const AdminPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [type, setType] = useState<QuestionType>('choice');
  const [text, setText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [knowledgePoints, setKnowledgePoints] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchQuestions = async () => {
    try {
      const { data } = await axios.get<Question[]>('/api/questions');
      setQuestions(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (type === 'judge') {
      setCorrectAnswer('true');
    } else {
      setCorrectAnswer('A');
    }
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setMessage({ type: 'error', text: '请输入题目文本' });
      return;
    }
    const kp = knowledgePoints
      .split(/[,，、;；\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (kp.length === 0) {
      setMessage({ type: 'error', text: '请至少输入一个知识点标签' });
      return;
    }
    if (type === 'choice') {
      const validOpts = options.filter((o) => o.trim().length > 0);
      if (validOpts.length < 2) {
        setMessage({ type: 'error', text: '选择题至少需要2个有效选项' });
        return;
      }
    }

    const payload: CreateQuestionPayload = {
      type,
      text: text.trim(),
      options: type === 'choice' ? options.filter((o) => o.trim()) : undefined,
      correctAnswer,
      knowledgePoints: kp,
    };

    try {
      setLoading(true);
      await axios.post('/api/questions', payload);
      setMessage({ type: 'success', text: '题目添加成功！' });
      setText('');
      setOptions(['', '', '', '']);
      setCorrectAnswer(type === 'choice' ? 'A' : 'true');
      setKnowledgePoints('');
      await fetchQuestions();
    } catch (err) {
      setMessage({ type: 'error', text: '添加失败，请检查输入' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
        教师端 · 题目管理
      </h1>
      <p style={{ color: '#6B7280', marginBottom: 32 }}>添加、管理随堂测验题目，支持选择题与判断题</p>

      <div
        style={{
          background: '#F9FAFB',
          borderRadius: 12,
          padding: 28,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: 36,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 20 }}>
          添加新题目
        </h2>
        {message && (
          <div
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              marginBottom: 20,
              background: message.type === 'success' ? '#F0FDF4' : '#FEF2F2',
              color: message.type === 'success' ? '#15803D' : '#B91C1C',
              fontSize: 14,
            }}
          >
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 14, color: '#374151', marginBottom: 8, fontWeight: 500 }}>
              题目类型
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              {([
                { value: 'choice', label: '选择题' },
                { value: 'judge', label: '判断题' },
              ] as { value: QuestionType; label: string }[]).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 8,
                    border: type === value ? '2px solid #8B5CF6' : '2px solid #E5E7EB',
                    background: type === value ? '#EEF2FF' : '#fff',
                    color: type === value ? '#6366F1' : '#374151',
                    fontWeight: type === value ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 14, color: '#374151', marginBottom: 8, fontWeight: 500 }}>
              题目文本 *
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="请输入题目内容..."
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                fontSize: 14,
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {type === 'choice' && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 14, color: '#374151', marginBottom: 8, fontWeight: 500 }}>
                选项（至少2个）
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {options.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: correctAnswer === OPTION_LABELS[i] ? '#22C55E' : '#F3F4F6',
                        color: correctAnswer === OPTION_LABELS[i] ? '#fff' : '#6B7280',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                      onClick={() => setCorrectAnswer(OPTION_LABELS[i])}
                    >
                      {OPTION_LABELS[i]}
                    </span>
                    <input
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...options];
                        newOpts[i] = e.target.value;
                        setOptions(newOpts);
                      }}
                      placeholder={`选项 ${OPTION_LABELS[i]}`}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid #E5E7EB',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setCorrectAnswer(OPTION_LABELS[i])}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 6,
                        border: correctAnswer === OPTION_LABELS[i] ? '1px solid #22C55E' : '1px solid #E5E7EB',
                        background: correctAnswer === OPTION_LABELS[i] ? '#F0FDF4' : '#fff',
                        color: correctAnswer === OPTION_LABELS[i] ? '#15803D' : '#6B7280',
                        cursor: 'pointer',
                        fontSize: 13,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {correctAnswer === OPTION_LABELS[i] ? '✓ 正确' : '设为正确'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {type === 'judge' && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 14, color: '#374151', marginBottom: 8, fontWeight: 500 }}>
                正确答案
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                {(['true', 'false'] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCorrectAnswer(val)}
                    style={{
                      flex: 1,
                      padding: '12px 20px',
                      borderRadius: 8,
                      border: correctAnswer === val ? '2px solid #8B5CF6' : '2px solid #E5E7EB',
                      background: correctAnswer === val ? '#EEF2FF' : '#fff',
                      color: correctAnswer === val ? '#6366F1' : '#374151',
                      fontWeight: correctAnswer === val ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: 15,
                    }}
                  >
                    {val === 'true' ? '✓ 正确' : '✗ 错误'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, color: '#374151', marginBottom: 8, fontWeight: 500 }}>
              知识点标签 * （用逗号或空格分隔）
            </label>
            <input
              value={knowledgePoints}
              onChange={(e) => setKnowledgePoints(e.target.value)}
              placeholder="例如：React Hooks, 状态管理, TypeScript"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px 40px',
              borderRadius: 12,
              border: 'none',
              background: loading
                ? 'linear-gradient(135deg, #A5B4FC, #C4B5FD)'
                : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)';
            }}
          >
            {loading ? '添加中...' : '+ 添加题目'}
          </button>
        </form>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>
            题目列表
          </h2>
          <span style={{ fontSize: 14, color: '#6B7280' }}>
            共 {questions.length} 题
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {questions.map((q, idx) => (
            <div
              key={q.id}
              style={{
                background: '#F9FAFB',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </span>
                <span
                  style={{
                    padding: '2px 10px',
                    borderRadius: 4,
                    background: q.type === 'choice' ? '#EEF2FF' : '#FEF3C7',
                    color: q.type === 'choice' ? '#6366F1' : '#D97706',
                    fontSize: 12,
                    fontWeight: 600,
                    alignSelf: 'center',
                  }}
                >
                  {q.type === 'choice' ? '选择题' : '判断题'}
                </span>
                <span
                  style={{
                    padding: '2px 10px',
                    borderRadius: 4,
                    background: '#F0FDF4',
                    color: '#15803D',
                    fontSize: 12,
                    fontWeight: 600,
                    alignSelf: 'center',
                  }}
                >
                  答案：{q.correctAnswer}
                </span>
              </div>
              <p style={{ margin: '0 0 10px 40px', fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                {q.text}
              </p>
              {q.type === 'choice' && q.options && (
                <div style={{ margin: '0 0 10px 40px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {q.options.map((opt, i) => (
                    <div key={i} style={{ fontSize: 13, color: '#6B7280' }}>
                      {OPTION_LABELS[i]}. {opt}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginLeft: 40, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {q.knowledgePoints.map((kp, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '2px 10px',
                      borderRadius: 999,
                      background: '#F3E8FF',
                      color: '#7C3AED',
                      fontSize: 12,
                    }}
                  >
                    # {kp}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
