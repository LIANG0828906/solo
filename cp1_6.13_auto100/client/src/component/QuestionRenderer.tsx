import React, { useState, useEffect } from 'react';
import { Question, AnswerValue } from '../types';

interface QuestionRendererProps {
  question: Question;
  questionNumber: number;
  answer: AnswerValue;
  onAnswerChange: (questionId: string, value: AnswerValue) => void;
  isVisible: boolean;
  isActive: boolean;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  questionNumber,
  answer,
  onAnswerChange,
  isVisible,
  isActive
}) => {
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [textValue, setTextValue] = useState<string>('');

  useEffect(() => {
    if (question.type === 'text' && answer !== null && answer !== undefined) {
      setTextValue(String(answer));
    }
  }, [question.type, answer]);

  const handleSingleSelect = (value: string) => {
    onAnswerChange(question.id, value);
  };

  const handleMultipleSelect = (value: string) => {
    const currentAnswers = (answer as string[]) || [];
    const newAnswers = currentAnswers.includes(value)
      ? currentAnswers.filter(v => v !== value)
      : [...currentAnswers, value];
    onAnswerChange(question.id, newAnswers);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTextValue(value);
    onAnswerChange(question.id, value || null);
  };

  const handleRatingClick = (rating: number) => {
    onAnswerChange(question.id, rating);
  };

  const getTypeBadge = () => {
    const badges: Record<string, { text: string; className: string }> = {
      single: { text: '单选', className: 'badge-single' },
      multiple: { text: '多选', className: 'badge-multiple' },
      text: { text: '文本', className: 'badge-text' },
      rating: { text: '评分', className: 'badge-rating' }
    };
    return badges[question.type] || null;
  };

  const badge = getTypeBadge();

  const renderSingleChoice = () => (
    <div className="options-container">
      {question.options?.map(option => (
        <div
          key={option.value}
          className={`option-item ${answer === option.value ? 'selected' : ''}`}
          onClick={() => handleSingleSelect(option.value)}
        >
          <div className="option-radio" />
          <span className="option-label">{option.label}</span>
        </div>
      ))}
    </div>
  );

  const renderMultipleChoice = () => {
    const selectedAnswers = (answer as string[]) || [];
    return (
      <div className="options-container">
        {question.options?.map(option => (
          <div
            key={option.value}
            className={`option-item ${selectedAnswers.includes(option.value) ? 'selected' : ''}`}
            onClick={() => handleMultipleSelect(option.value)}
          >
            <div className="option-checkbox" />
            <span className="option-label">{option.label}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderTextInput = () => (
    <div className="text-input-container">
      <input
        type="text"
        className="text-input"
        value={textValue}
        onChange={handleTextChange}
        placeholder="请输入您的答案..."
      />
      <div className="text-input-underline" />
    </div>
  );

  const renderRating = () => {
    const currentRating = (answer as number) || 0;
    return (
      <div className="rating-container">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${star <= (hoverRating || currentRating) ? 'filled' : ''} ${hoverRating >= star && star <= hoverRating ? 'hover' : ''}`}
            onClick={() => handleRatingClick(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'single':
        return renderSingleChoice();
      case 'multiple':
        return renderMultipleChoice();
      case 'text':
        return renderTextInput();
      case 'rating':
        return renderRating();
      default:
        return null;
    }
  };

  return (
    <div
      className={`question-card ${isActive ? 'highlight' : ''} ${isVisible ? 'expand' : 'collapse'}`}
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
    >
      {badge && (
        <span className={`question-type-badge ${badge.className}`}>
          {badge.text}
        </span>
      )}
      <div className="question-header">
        <div className="question-number">{questionNumber}</div>
        <div>
          <div className="question-title">
            {question.title}
            {question.required && <span className="required-mark">*</span>}
          </div>
          {question.description && (
            <div className="question-description">{question.description}</div>
          )}
        </div>
      </div>
      {renderQuestionContent()}
    </div>
  );
};

export default QuestionRenderer;
