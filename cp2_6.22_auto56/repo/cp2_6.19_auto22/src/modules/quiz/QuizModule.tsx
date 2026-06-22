import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QuizQuestion, WrongAnswer, QuizAttempt } from '../../types';
import { calculateResult, createReviewQuestions } from './QuizEngine';
import { useProgress } from '../../hooks/useProgress';
import { useAppStore } from '../../store/useAppStore';

interface QuizModuleProps {
  courseId: string;
  questions: QuizQuestion[];
  isReviewMode: boolean;
}

export const QuizModule: React.FC<QuizModuleProps> = ({
  courseId,
  questions,
  isReviewMode,
}) => {
  const { recordQuizAttempt } = useProgress();
  const {
    setView,
    setQuizQuestions,
    setWrongAnswers,
    setIsReviewMode,
    wrongAnswers: storedWrongAnswers,
    resetQuizState,
  } = useAppStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [timeLeft, setTimeLeft] = useState(isReviewMode ? 60 : 30);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    totalQuestions: number;
    wrongAnswers: WrongAnswer[];
  } | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const hasAnsweredRef = useRef(false);

  const currentQuestion = questions[currentIndex];
  const timeLimit = isReviewMode ? 60 : 30;

  const goToNextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setTimeLeft(timeLimit);
      hasAnsweredRef.current = false;
    } else {
      finishQuiz();
    }
  }, [currentIndex, questions.length, timeLimit]);

  const finishQuiz = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const quizResult = calculateResult(questions, answers);
    setResult(quizResult);
    setQuizCompleted(true);
    setTimeSpent(Date.now() - startTimeRef.current);

    if (!isReviewMode) {
      const attempt: QuizAttempt = {
        quizId: `quiz-${courseId}`,
        score: quizResult.score,
        totalQuestions: quizResult.totalQuestions,
        wrongAnswers: quizResult.wrongAnswers,
        completedAt: new Date().toISOString(),
        timeSpent: Date.now() - startTimeRef.current,
      };
      recordQuizAttempt(courseId, attempt);
    }

    setWrongAnswers(quizResult.wrongAnswers);
  }, [questions, answers, isReviewMode, courseId, recordQuizAttempt, setWrongAnswers]);

  useEffect(() => {
    if (quizCompleted || questions.length === 0) return;

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!hasAnsweredRef.current) {
            goToNextQuestion();
          }
          return timeLimit;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizCompleted, questions.length, timeLimit, goToNextQuestion]);

  useEffect(() => {
    if (currentQuestion && !hasAnsweredRef.current) {
      const existingAnswer = answers.get(currentQuestion.id);
      if (existingAnswer !== undefined) {
        setSelectedAnswer(existingAnswer);
      }
    }
  }, [currentIndex, currentQuestion, answers]);

  const handleAnswerSelect = (optionIndex: number) => {
    if (hasAnsweredRef.current) return;

    hasAnsweredRef.current = true;
    setSelectedAnswer(optionIndex);
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, optionIndex);
    setAnswers(newAnswers);

    setTimeout(() => {
      goToNextQuestion();
    }, 500);
  };

  const handleReviewWrongAnswers = () => {
    if (storedWrongAnswers.length === 0) return;

    const reviewQuestions = createReviewQuestions(storedWrongAnswers);
    setQuizQuestions(reviewQuestions);
    setIsReviewMode(true);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers(new Map());
    setTimeLeft(60);
    setQuizCompleted(false);
    setResult(null);
    startTimeRef.current = Date.now();
    hasAnsweredRef.current = false;
  };

  const handleBackToCourse = () => {
    resetQuizState();
    setView('courseDetail');
  };

  const handleBackToList = () => {
    resetQuizState();
    setView('courseList');
  };

  if (questions.length === 0) {
    return (
      <div className="quiz-container">
        <div className="error-message">没有可测验的题目</div>
        <button className="btn-secondary" onClick={handleBackToCourse}>
          返回课程
        </button>
      </div>
    );
  }

  if (quizCompleted && result) {
    return (
      <div className="quiz-result-container">
        <div className="result-card">
          <h2 className="result-title">
            {isReviewMode ? '错题练习完成！' : '测验完成！'}
          </h2>
          <div className="score-display">
            <span className="score-value">{result.score}</span>
            <span className="score-separator">/</span>
            <span className="score-total">{result.totalQuestions}</span>
          </div>
          <p className="time-spent">
            用时：{Math.round(timeSpent / 1000)} 秒
          </p>
          <p className="score-percentage">
            正确率：{Math.round((result.score / result.totalQuestions) * 100)}%
          </p>
        </div>

        {result.wrongAnswers.length > 0 && (
          <div className="wrong-answers-section">
            <h3 className="section-title">错题回顾</h3>
            <div className="wrong-answers-list">
              {result.wrongAnswers.map((wa, index) => (
                <WrongAnswerCard key={index} wrongAnswer={wa} />
              ))}
            </div>
            {!isReviewMode && (
              <button
                className="btn-review-wrong"
                onClick={handleReviewWrongAnswers}
              >
                重新练习错题
              </button>
            )}
          </div>
        )}

        <div className="result-actions">
          <button className="btn-secondary" onClick={handleBackToCourse}>
            返回课程
          </button>
          <button className="btn-primary" onClick={handleBackToList}>
            返回课程列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <header className="quiz-header">
        <button className="btn-back" onClick={handleBackToCourse}>
          ← 返回课程
        </button>
        <div className="quiz-progress">
          <span className="question-counter">
            {currentIndex + 1} / {questions.length}
          </span>
          <div
            className={`countdown-timer ${timeLeft < 5 ? 'warning' : ''}`}
          >
            {timeLeft.toFixed(1)}s
          </div>
        </div>
      </header>

      <div className="quiz-card">
        <div className="question-text">
          <span className="question-number">{currentIndex + 1}.</span>
          {currentQuestion.question}
        </div>
        <div className="options-list">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.correctIndex;
            const showResult = selectedAnswer !== null;

            return (
              <button
                key={index}
                className={`option-btn ${isSelected ? 'selected' : ''} ${
                  showResult
                    ? isCorrect
                      ? 'correct'
                      : isSelected
                      ? 'incorrect'
                      : ''
                    : ''
                }`}
                onClick={() => handleAnswerSelect(index)}
                disabled={selectedAnswer !== null}
              >
                <span className="option-label">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span className="option-text">{option}</span>
                {showResult && isCorrect && <span className="check-icon">✓</span>}
                {showResult && isSelected && !isCorrect && (
                  <span className="cross-icon">✗</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="quiz-footer">
        <div className="progress-indicator">
          {questions.map((_, idx) => (
            <span
              key={idx}
              className={`progress-dot ${
                idx < currentIndex
                  ? 'answered'
                  : idx === currentIndex
                  ? 'current'
                  : 'unanswered'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface WrongAnswerCardProps {
  wrongAnswer: WrongAnswer;
}

const WrongAnswerCard: React.FC<WrongAnswerCardProps> = ({ wrongAnswer }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="wrong-answer-card">
      <div
        className="card-header"
        onClick={() => setExpanded(!expanded)}
      >
        <h4 className="question-preview">{wrongAnswer.question}</h4>
        <span className={`expand-icon ${expanded ? 'expanded' : ''}`}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>
      <div className="card-body">
        <div className="answer-comparison">
          <div className="wrong-answer-display">
            <span className="label">你的答案：</span>
            <span className="wrong-text">
              {wrongAnswer.userAnswer >= 0
                ? `${String.fromCharCode(65 + wrongAnswer.userAnswer)}. ${
                    wrongAnswer.options[wrongAnswer.userAnswer]
                  }`
                : '未作答（超时）'}
            </span>
          </div>
          <div className="correct-answer-display">
            <span className="label">正确答案：</span>
            <span className="correct-text">
              {String.fromCharCode(65 + wrongAnswer.correctAnswer)}.{' '}
              {wrongAnswer.options[wrongAnswer.correctAnswer]}
            </span>
          </div>
        </div>
        <div
          className={`hint-section ${expanded ? 'expanded' : ''}`}
        >
          <div className="hint-content">
            <span className="hint-label">💡 知识点提示：</span>
            <p className="hint-text">{wrongAnswer.hint}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
