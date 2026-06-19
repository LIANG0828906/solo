import { useState } from 'react';
import type { Question } from '@/utils/api';
import { QUESTION_TYPE_LABELS } from '@/utils/api';
import { useQuizStore } from '@/hooks/useQuizStore';
import { useRipple } from '@/hooks/useRipple';
import { Eye, EyeOff, BookmarkPlus, Check } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  index: number;
}

export default function QuestionCard({ question, index }: QuestionCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [saved, setSaved] = useState(false);
  const addToQuizBank = useQuizStore((s) => s.addToQuizBank);

  const eyeRipple = useRipple(`eye-btn-${question.id}`);
  const saveRipple = useRipple(`save-btn-${question.id}`);

  const handleSave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (saved) return;
    saveRipple.onClick(e);
    addToQuizBank({
      id: crypto.randomUUID(),
      question,
      added_at: new Date().toISOString(),
    });
    setSaved(true);
  };

  const handleToggleAnswer = (e: React.MouseEvent<HTMLButtonElement>) => {
    eyeRipple.onClick(e);
    setShowAnswer(!showAnswer);
  };

  const typeLabel = QUESTION_TYPE_LABELS[question.type] || question.type;
  const difficultyDots = Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={`diff-dot ${i < question.difficulty ? 'diff-active' : ''}`} />
  ));

  return (
    <div className="question-card">
      <div className="card-header">
        <div className="card-badges">
          <span className="badge badge-type">{typeLabel}</span>
          <span className="badge badge-diff">
            难度 {difficultyDots}
          </span>
          {question.knowledge_tag && (
            <span className="badge badge-tag">{question.knowledge_tag}</span>
          )}
        </div>
        <span className="card-index">#{index + 1}</span>
      </div>

      <p className="card-stem">{question.stem}</p>

      {question.options && question.options.length > 0 && (
        <div className="card-options">
          {question.options.map((opt, i) => (
            <div key={i} className="option-item">
              <span className="option-letter">{String.fromCharCode(65 + i)}</span>
              <span className="option-text">{opt}</span>
            </div>
          ))}
        </div>
      )}

      {showAnswer && (
        <div className="card-answer">
          <div className="answer-label">
            正确答案：
            <span className="answer-text">
              {Array.isArray(question.answer) ? question.answer.join(', ') : question.answer}
            </span>
          </div>
          <p className="answer-explanation">{question.explanation}</p>
        </div>
      )}

      <div className="card-actions">
        <button
          className="action-btn ripple-container"
          onClick={handleToggleAnswer}
        >
          {showAnswer ? <EyeOff size={16} /> : <Eye size={16} />}
          {showAnswer ? '收起答案' : '查看答案'}
          {eyeRipple.rippleElements}
        </button>
        <button
          className={`action-btn ripple-container ${saved ? 'action-saved' : ''}`}
          onClick={handleSave}
          disabled={saved}
        >
          {saved ? <Check size={16} /> : <BookmarkPlus size={16} />}
          {saved ? '已收藏' : '收藏到题库'}
          {saveRipple.rippleElements}
        </button>
      </div>
    </div>
  );
}
