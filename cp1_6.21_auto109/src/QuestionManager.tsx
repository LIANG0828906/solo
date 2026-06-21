import React, { useState } from 'react';
import type { Question, Answer } from './types';

interface QuestionManagerProps {
  questions: Question[];
  onSubmit: (answers: Answer[]) => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const QuestionManager: React.FC<QuestionManagerProps> = ({ questions, onSubmit }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  const handleSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    const answerList: Answer[] = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] || '',
    }));
    onSubmit(answerList);
  };

  return (
    <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
            fontSize: 14,
            color: '#6B7280',
          }}
        >
          <span>答题进度</span>
          <span>{answeredCount} / {questions.length}</span>
        </div>
        <div style={{ width: '100%', height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #4F46E5, #7C3AED)',
              borderRadius: 4,
              transition: 'width 0.4s ease-in-out',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {questions.map((q, idx) => (
          <div
            key={q.id}
            style={{
              background: '#F9FAFB',
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: `2px solid transparent`,
              borderImage: answers[q.id]
                ? 'linear-gradient(135deg, #22C55E, #16A34A) 1'
                : 'linear-gradient(135deg, #6366F1, #8B5CF6) 1',
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: '#fff',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: 4,
                    background: q.type === 'choice' ? '#EEF2FF' : '#FEF3C7',
                    color: q.type === 'choice' ? '#6366F1' : '#D97706',
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  {q.type === 'choice' ? '选择题' : '判断题'}
                </div>
                <p style={{ margin: 0, fontSize: 16, color: '#111827', lineHeight: 1.6 }}>{q.text}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 44 }}>
              {q.type === 'choice' && q.options ? (
                q.options.map((opt, i) => {
                  const label = OPTION_LABELS[i];
                  const selected = answers[q.id] === label;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(q.id, label)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        borderRadius: 8,
                        border: selected ? '2px solid #22C55E' : '2px solid #E5E7EB',
                        background: selected ? '#F0FDF4' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 14,
                        color: selected ? '#15803D' : '#374151',
                        fontWeight: selected ? 600 : 400,
                        transition: 'all 0.2s',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: selected ? '#22C55E' : '#F3F4F6',
                          color: selected ? '#fff' : '#6B7280',
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {label}
                      </span>
                      <span style={{ flex: 1 }}>{opt}</span>
                    </button>
                  );
                })
              ) : (
                <div style={{ display: 'flex', gap: 12 }}>
                  {[
                    { value: 'true', label: '✓ 正确' },
                    { value: 'false', label: '✗ 错误' },
                  ].map(({ value, label }) => {
                    const selected = answers[q.id] === value;
                    return (
                      <button
                        key={value}
                        onClick={() => handleSelect(q.id, value)}
                        style={{
                          flex: 1,
                          padding: '14px 20px',
                          borderRadius: 8,
                          border: selected
                            ? value === 'true'
                              ? '2px solid #22C55E'
                              : '2px solid #EF4444'
                            : '2px solid #E5E7EB',
                          background: selected
                            ? value === 'true'
                              ? '#F0FDF4'
                              : '#FEF2F2'
                            : '#fff',
                          cursor: 'pointer',
                          fontSize: 15,
                          color: selected
                            ? value === 'true'
                              ? '#15803D'
                              : '#B91C1C'
                            : '#374151',
                          fontWeight: selected ? 600 : 400,
                          transition: 'all 0.2s',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={handleSubmit}
          disabled={answeredCount < questions.length}
          style={{
            padding: '14px 48px',
            borderRadius: 12,
            border: 'none',
            background:
              answeredCount < questions.length
                ? 'linear-gradient(135deg, #A5B4FC, #C4B5FD)'
                : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            cursor: answeredCount < questions.length ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (answeredCount >= questions.length) {
              (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.2)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)';
          }}
        >
          {answeredCount < questions.length
            ? `还剩 ${questions.length - answeredCount} 题未作答`
            : '提交答案'}
        </button>
      </div>
    </div>
  );
};

export default QuestionManager;
