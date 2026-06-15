import { useState, useEffect, useCallback } from 'react';
import type { QuizQuestion, QuizResult, CountryInfo } from '@/types';
import { fetchRandomQuestion, checkAnswer, getStreakBonus } from './QuizEngine';
import './QuizPanel.css';

interface QuizPanelProps {
  isOpen: boolean;
  country: CountryInfo | null;
  currentScore: number;
  currentStreak: number;
  onClose: () => void;
  onAnswer: (result: QuizResult) => void;
}

const QuizPanel = ({
  isOpen,
  country,
  currentScore,
  currentStreak,
  onClose,
  onAnswer,
}: QuizPanelProps) => {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showStars, setShowStars] = useState(false);
  const [shakeIndex, setShakeIndex] = useState<number | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen && country) {
      const q = fetchRandomQuestion(country.name);
      setQuestion(q);
      setSelectedIndex(null);
      setResult(null);
      setShowStars(false);
      setShakeIndex(null);
    }
  }, [isOpen, country]);

  const handleSelectAnswer = useCallback(
    (index: number) => {
      if (!question || result !== null) return;

      setSelectedIndex(index);
      const quizResult = checkAnswer(question, index, currentStreak);
      setResult(quizResult);
      onAnswer(quizResult);

      if (quizResult.isCorrect) {
        setShowStars(true);
        setTimeout(() => setShowStars(false), 1500);
      } else {
        setShakeIndex(index);
        setTimeout(() => setShakeIndex(null), 400);
      }
    },
    [question, result, currentStreak, onAnswer]
  );

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  }, [onClose]);

  const handleNext = useCallback(() => {
    if (country) {
      const q = fetchRandomQuestion(country.name);
      setQuestion(q);
      setSelectedIndex(null);
      setResult(null);
      setShowStars(false);
      setShakeIndex(null);
    }
  }, [country]);

  const getOptionClass = (index: number): string => {
    if (result === null) {
      return 'quiz-option';
    }
    if (index === question?.correctIndex) {
      return 'quiz-option correct';
    }
    if (index === selectedIndex && !result.isCorrect) {
      return `quiz-option incorrect ${shakeIndex === index ? 'shake' : ''}`;
    }
    return 'quiz-option disabled';
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      culture: '文化',
      history: '历史',
      geography: '地理',
    };
    return labels[category] || category;
  };

  if (!isOpen && !isClosing) return null;

  const streakBonus = getStreakBonus(currentStreak + 1);

  return (
    <div className={`quiz-overlay ${isClosing ? 'fade-out' : 'fade-in'}`}>
      <div className="quiz-backdrop" onClick={handleClose} />

      <div className={`quiz-panel ${isClosing ? 'slide-down' : 'bounce-in'}`}>
        {showStars && (
          <div className="star-particles">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="star-particle"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  animationDelay: `${Math.random() * 300}ms`,
                  animationDuration: `${800 + Math.random() * 600}ms`,
                }}
              >
                ★
              </div>
            ))}
          </div>
        )}

        <div className="quiz-header">
          <div className="quiz-country">
            <span className="country-name">{country?.name || '未知国家'}</span>
            {question && (
              <span className={`quiz-category category-${question.category}`}>
                {getCategoryLabel(question.category)}
              </span>
            )}
          </div>
          <button className="close-button" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="quiz-score-bar">
          <div className="score-item">
            <span className="score-label">得分</span>
            <span className="score-value">{currentScore}</span>
          </div>
          <div className="score-item">
            <span className="score-label">连击</span>
            <span className={`score-value streak ${currentStreak > 0 ? 'active' : ''}`}>
              {currentStreak > 0 ? `${currentStreak}连击` : '—'}
            </span>
          </div>
          <div className="score-item">
            <span className="score-label">加成</span>
            <span className="score-value bonus">
              {streakBonus > 0 ? `+${streakBonus}` : '—'}
            </span>
          </div>
        </div>

        {question && (
          <>
            <div className="quiz-question">
              <span className="question-text">{question.question}</span>
            </div>

            <div className="quiz-options">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  className={getOptionClass(index)}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={result !== null}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option}</span>
                  {result?.isCorrect && index === question.correctIndex && (
                    <span className="result-icon correct-icon">✓</span>
                  )}
                  {!result?.isCorrect && index === selectedIndex && (
                    <span className="result-icon incorrect-icon">✗</span>
                  )}
                </button>
              ))}
            </div>

            {result && (
              <div className={`quiz-explanation ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="explanation-header">
                  <span className="explanation-title">
                    {result.isCorrect ? '🎉 回答正确！' : '😢 回答错误'}
                  </span>
                  {result.isCorrect && (
                    <span className="score-gained">+{result.scoreGained}分</span>
                  )}
                </div>
                <p className="explanation-text">{result.explanation}</p>
                <p className="explanation-answer">
                  <strong>正确答案：</strong>{result.correctAnswer}
                </p>
              </div>
            )}

            {result && (
              <div className="quiz-actions">
                <button className="action-button secondary" onClick={handleClose}>
                  返回地图
                </button>
                <button className="action-button primary" onClick={handleNext}>
                  下一题
                </button>
              </div>
            )}
          </>
        )}

        {!question && (
          <div className="quiz-empty">
            <p>暂无关于这个国家的题目</p>
            <button className="action-button primary" onClick={handleClose}>
              返回地图
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPanel;
