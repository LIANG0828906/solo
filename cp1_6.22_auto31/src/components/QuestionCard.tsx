import { useState, useEffect, useRef } from 'react';
import type { Question } from '../types';

interface Props {
  question: Question;
  isStudent?: boolean;
  onSubmit?: (selectedIndex: number) => void;
  onBuzz?: () => void;
  submittedOption?: number | null;
  showCorrect?: boolean;
  answered?: boolean;
}

export default function QuestionCard({
  question,
  isStudent = false,
  onSubmit,
  onBuzz,
  submittedOption = null,
  showCorrect = false,
  answered = false,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(question.duration);
  const [buzzCountdown, setBuzzCountdown] = useState(3);
  const [showCountdown, setShowCountdown] = useState(question.type === 'buzz');
  const startedAt = useRef(question.createdAt);
  const circumference = 2 * Math.PI * 24;

  useEffect(() => {
    setRemaining(question.duration);
    setSelected(null);
    startedAt.current = question.createdAt;
    if (question.type === 'buzz') {
      setShowCountdown(true);
      setBuzzCountdown(3);
    }
  }, [question.id, question.duration, question.createdAt, question.type]);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      const left = Math.max(0, question.duration - elapsed);
      setRemaining(left);
    }, 100);
    return () => clearInterval(interval);
  }, [question.id, question.duration]);

  useEffect(() => {
    if (question.type === 'buzz' && showCountdown) {
      if (buzzCountdown <= 0) {
        setShowCountdown(false);
        return;
      }
      const t = setTimeout(() => setBuzzCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [question.type, showCountdown, buzzCountdown]);

  const progress = question.duration > 0 ? remaining / question.duration : 0;
  const strokeOffset = circumference * (1 - progress);

  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="question-card" key={question.id}>
      <div className="question-card-header">
        <span className={`question-type-tag ${question.type}`}>
          {question.type === 'single' ? '📝 单选题' : '⚡ 抢答题'}
        </span>
        <div className="timer-ring-container">
          <svg className="timer-ring" width="60" height="60">
            <circle className="timer-ring-bg" cx="30" cy="30" r="24" />
            <circle
              className="timer-ring-fg"
              cx="30"
              cy="30"
              r="24"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
            />
          </svg>
          <div className="timer-text">{remaining}s</div>
        </div>
      </div>

      <div className="question-title">{question.title}</div>

      {question.type === 'single' ? (
        <>
          <div className="options-list">
            {question.options.map((opt, idx) => {
              const isSelected = selected === idx || submittedOption === idx;
              const isCorrectAnswer = idx === question.correctIndex;
              const showAsCorrect = showCorrect && isCorrectAnswer;
              const classes = ['option-item'];
              if (isSelected) classes.push('selected');
              if (answered && submittedOption === idx) classes.push('submitted');
              if (showAsCorrect && submittedOption !== idx) classes.push('correct');
              if (answered) classes.push('disabled');
              if (!isStudent || question.status === 'ended') classes.push('disabled');
              return (
                <div
                  key={idx}
                  className={classes.join(' ')}
                  onClick={() => {
                    if (!isStudent || answered || question.status === 'ended') return;
                    setSelected(idx);
                  }}
                >
                  <div className="option-letter">{letters[idx]}</div>
                  <div className="option-text">
                    {opt}
                    {showAsCorrect && submittedOption !== idx && (
                      <span style={{ color: '#66bb6a', fontWeight: 700, marginLeft: 8 }}>✓ 正确答案</span>
                    )}
                    {answered && submittedOption === idx && isCorrectAnswer && (
                      <span style={{ color: '#66bb6a', fontWeight: 700, marginLeft: 8 }}>✓ 答对了</span>
                    )}
                    {answered && submittedOption === idx && !isCorrectAnswer && (
                      <span style={{ color: '#ef5350', fontWeight: 700, marginLeft: 8 }}>✗ 答错了</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {isStudent && !answered && question.status === 'active' && (
            <div className="submit-row">
              <button
                className="primary-btn"
                disabled={selected === null}
                onClick={() => selected !== null && onSubmit?.(selected)}
              >
                提交答案
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="buzz-section">
          {showCountdown && !question.buzzerId ? (
            <div className={`buzz-countdown ${buzzCountdown <= 1 ? 'warning' : ''}`}>{buzzCountdown}</div>
          ) : (
            <>
              {question.buzzerId ? (
                <div className="buzz-winner">
                  <div className="buzz-winner-avatar">🏆</div>
                  <div className="buzz-winner-name">{question.buzzerName} 抢到了！</div>
                </div>
              ) : (
                <>
                  <button
                    className={`buzz-btn ${answered ? 'winner' : ''}`}
                    disabled={answered || question.status === 'ended'}
                    onClick={onBuzz}
                  >
                    {answered ? '🎉 成功！' : '抢答'}
                  </button>
                  <div className="buzz-status">
                    {answered ? '您已抢答成功！' : '点击按钮抢先作答！'}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {answered && question.type === 'single' && (
        <div className="submit-feedback">
          <span className="checkmark">✓</span>
          <span>答案已提交</span>
        </div>
      )}
    </div>
  );
}
