import { useState, useEffect } from 'react';
import type { Question } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  initialTitle: string;
  initialQuestions: Question[];
  onSave: (title: string, questions: Question[]) => Promise<void>;
  onCancel: () => void;
}

export default function QuestionnaireEditor({ initialTitle, initialQuestions, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialQuestions.length === 0) {
      addQuestion('single');
    }
  }, []);

  const addQuestion = (type: 'single' | 'multiple' | 'text') => {
    if (questions.length >= 20) {
      setError('最多只能添加20个问题');
      return;
    }

    const newQuestion: Question = {
      id: uuidv4(),
      type,
      title: '',
      order: questions.length
    };

    if (type !== 'text') {
      newQuestion.options = ['', ''];
    } else {
      newQuestion.maxLength = 500;
    }

    setQuestions([...questions, newQuestion]);
    setError('');
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  const deleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      setError('至少需要保留一个问题');
      return;
    }
    setQuestions(questions.filter(q => q.id !== id).map((q, i) => ({ ...q, order: i })));
    setError('');
  };

  const moveQuestion = (id: string, direction: 'up' | 'down') => {
    const index = questions.findIndex(q => q.id === id);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const newQuestions = [...questions];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[swapIndex]] = [newQuestions[swapIndex], newQuestions[index]];
    newQuestions.forEach((q, i) => q.order = i);
    setQuestions(newQuestions);
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !question.options) return;
    if (question.options.length >= 10) {
      setError('每个问题最多10个选项');
      return;
    }
    updateQuestion(questionId, { options: [...question.options, ''] });
  };

  const updateOption = (questionId: string, index: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !question.options) return;
    const newOptions = [...question.options];
    newOptions[index] = value;
    updateQuestion(questionId, { options: newOptions });
  };

  const deleteOption = (questionId: string, index: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !question.options || question.options.length <= 2) return;
    const newOptions = question.options.filter((_, i) => i !== index);
    updateQuestion(questionId, { options: newOptions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('请输入问卷标题');
      return;
    }

    if (title.length > 100) {
      setError('标题不能超过100字');
      return;
    }

    for (const q of questions) {
      if (!q.title.trim()) {
        setError('所有问题都需要填写标题');
        return;
      }
      if (q.type !== 'text' && q.options) {
        const validOptions = q.options.filter(o => o.trim());
        if (validOptions.length < 2) {
          setError('选择题至少需要2个有效选项');
          return;
        }
      }
    }

    const cleanedQuestions = questions.map(q => ({
      ...q,
      options: q.type !== 'text' ? q.options?.filter(o => o.trim()) : undefined
    }));

    setSaving(true);
    try {
      await onSave(title.trim(), cleanedQuestions);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'single': return '单选题';
      case 'multiple': return '多选题';
      case 'text': return '简答题';
      default: return '';
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      {error && <div style={errorStyle}>{error}</div>}

      <div style={fieldStyle}>
        <label style={labelStyle}>问卷标题</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="请输入问卷标题（最多100字）"
          maxLength={100}
          style={{ width: '100%' }}
        />
        <span style={charCountStyle}>{title.length}/100</span>
      </div>

      <div style={questionsSectionStyle}>
        <div style={sectionHeaderStyle}>
          <h3 style={sectionTitleStyle}>问题列表</h3>
          <span style={questionCountStyle}>{questions.length}/20</span>
        </div>

        <div style={questionListStyle}>
          {questions.map((question, index) => (
            <div key={question.id} style={questionCardStyle}>
              <div style={questionHeaderStyle}>
                <span style={questionNumberStyle}>Q{index + 1}</span>
                <span style={questionTypeBadgeStyle}>
                  {getQuestionTypeLabel(question.type)}
                </span>
                <div style={questionActionsStyle}>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => moveQuestion(question.id, 'up')}
                    disabled={index === 0}
                    style={{ opacity: index === 0 ? 0.3 : 1 }}
                    title="上移"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => moveQuestion(question.id, 'down')}
                    disabled={index === questions.length - 1}
                    style={{ opacity: index === questions.length - 1 ? 0.3 : 1 }}
                    title="下移"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => deleteQuestion(question.id)}
                    style={{ color: '#DC2626' }}
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={question.title}
                onChange={e => updateQuestion(question.id, { title: e.target.value })}
                placeholder="请输入问题标题"
                style={{ width: '100%', marginBottom: '12px' }}
              />

              {question.type !== 'text' && question.options && (
                <div style={optionsListStyle}>
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} style={optionItemStyle}>
                      <span style={optionIndexStyle}>{String.fromCharCode(65 + optIndex)}.</span>
                      <input
                        type="text"
                        value={option}
                        onChange={e => updateOption(question.id, optIndex, e.target.value)}
                        placeholder={`选项${String.fromCharCode(65 + optIndex)}`}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => deleteOption(question.id, optIndex)}
                        disabled={question.options!.length <= 2}
                        style={{ opacity: question.options!.length <= 2 ? 0.3 : 1, color: '#DC2626' }}
                        title="删除选项"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {question.options.length < 10 && (
                    <button
                      type="button"
                      onClick={() => addOption(question.id)}
                      style={addOptionBtnStyle}
                    >
                      + 添加选项
                    </button>
                  )}
                </div>
              )}

              {question.type === 'text' && (
                <div style={textSettingsStyle}>
                  <label style={{ fontSize: '13px', color: '#64748B' }}>最大字符数</label>
                  <input
                    type="number"
                    value={question.maxLength || 500}
                    onChange={e => updateQuestion(question.id, { maxLength: parseInt(e.target.value) || 100 })}
                    min={10}
                    max={5000}
                    style={{ width: '120px' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {questions.length < 20 && (
          <div style={addQuestionBtnsStyle}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => addQuestion('single')}
            >
              + 添加单选
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => addQuestion('multiple')}
            >
              + 添加多选
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => addQuestion('text')}
            >
              + 添加简答
            </button>
          </div>
        )}
      </div>

      <div style={footerStyle}>
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
          取消
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
}

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  maxHeight: '70vh',
  overflow: 'auto'
};

const fieldStyle: React.CSSProperties = {
  position: 'relative'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '14px',
  fontWeight: 500,
  color: '#334155'
};

const charCountStyle: React.CSSProperties = {
  position: 'absolute',
  right: '12px',
  bottom: '8px',
  fontSize: '12px',
  color: '#94A3B8'
};

const errorStyle: React.CSSProperties = {
  backgroundColor: '#FEE2E2',
  color: '#DC2626',
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '13px'
};

const questionsSectionStyle: React.CSSProperties = {
  flex: 1
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px'
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  color: '#334155'
};

const questionCountStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748B'
};

const questionListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  marginBottom: '16px'
};

const questionCardStyle: React.CSSProperties = {
  backgroundColor: '#F8FAFC',
  borderRadius: '10px',
  padding: '16px',
  border: '1px solid #E2E8F0'
};

const questionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '12px'
};

const questionNumberStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '6px',
  backgroundColor: '#3B82F6',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '13px',
  fontWeight: 600
};

const questionTypeBadgeStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '6px',
  backgroundColor: '#E0F2FE',
  color: '#0284C7',
  fontSize: '12px',
  fontWeight: 500
};

const questionActionsStyle: React.CSSProperties = {
  marginLeft: 'auto',
  display: 'flex',
  gap: '4px'
};

const optionsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const optionItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const optionIndexStyle: React.CSSProperties = {
  width: '24px',
  fontSize: '13px',
  color: '#64748B',
  fontWeight: 500
};

const addOptionBtnStyle: React.CSSProperties = {
  padding: '8px 12px',
  backgroundColor: 'transparent',
  border: '1px dashed #CBD5E1',
  borderRadius: '8px',
  color: '#64748B',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};

const textSettingsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
};

const addQuestionBtnsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap'
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  paddingTop: '16px',
  borderTop: '1px solid #E2E8F0'
};
