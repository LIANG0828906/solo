import { useState, useEffect, useRef } from 'react';
import { Question, StudentAnswer } from '../shared/types';
import './StudentView.css';

interface StudentAnswerRecord {
  questionId: string;
  questionTitle: string;
  options: string[];
  selectedIndex: number;
  selectedOption: string;
  correctIndex: number;
  correctOption: string;
  isCorrect: boolean;
  submittedAt: number;
}

interface StudentViewProps {
  studentName: string;
  setStudentName: (name: string) => void;
  currentQuestion: Question | null;
  timeRemaining: number;
  isQuestionActive: boolean;
  onSubmitAnswer: (answer: StudentAnswer) => void;
  onBack: () => void;
}

const STORAGE_KEY = 'student_answer_history';

function StudentView({
  studentName,
  setStudentName,
  currentQuestion,
  timeRemaining,
  isQuestionActive,
  onSubmitAnswer,
  onBack,
}: StudentViewProps) {
  const [nameInput, setNameInput] = useState(studentName || '');
  const [hasEntered, setHasEntered] = useState(!!studentName);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [answerHistory, setAnswerHistory] = useState<StudentAnswerRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const submittedQuestionIdRef = useRef<string | null>(null);

  const [studentId] = useState(() => {
    const saved = localStorage.getItem('student_id');
    if (saved) return saved;
    const newId = 'student_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('student_id', newId);
    return newId;
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setAnswerHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse answer history');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answerHistory));
  }, [answerHistory]);

  useEffect(() => {
    if (currentQuestion && isQuestionActive) {
      setSelectedAnswer(null);
      setHasSubmitted(false);
      submittedQuestionIdRef.current = null;
    }
  }, [currentQuestion, isQuestionActive]);

  const handleEnter = () => {
    if (nameInput.trim()) {
      setStudentName(nameInput.trim());
      setHasEntered(true);
    }
  };

  const handleSelectOption = (index: number) => {
    if (!isQuestionActive || hasSubmitted) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (!currentQuestion || selectedAnswer === null || hasSubmitted || !isQuestionActive) return;
    if (submittedQuestionIdRef.current === currentQuestion.id) return;

    submittedQuestionIdRef.current = currentQuestion.id;
    setHasSubmitted(true);

    const answer: StudentAnswer = {
      questionId: currentQuestion.id,
      studentId,
      studentName: studentName,
      selectedIndex: selectedAnswer,
      submittedAt: Date.now(),
    };

    onSubmitAnswer(answer);

    const record: StudentAnswerRecord = {
      questionId: currentQuestion.id,
      questionTitle: currentQuestion.title,
      options: [...currentQuestion.options],
      selectedIndex: selectedAnswer,
      selectedOption: currentQuestion.options[selectedAnswer],
      correctIndex: currentQuestion.correctIndex,
      correctOption: currentQuestion.options[currentQuestion.correctIndex],
      isCorrect: selectedAnswer === currentQuestion.correctIndex,
      submittedAt: Date.now(),
    };

    setAnswerHistory((prev) => [record, ...prev]);
  };

  const progress = currentQuestion
    ? ((currentQuestion.duration - timeRemaining) / currentQuestion.duration) * 100
    : 0;

  const isUrgent = timeRemaining <= 5 && isQuestionActive;

  if (!hasEntered) {
    return (
      <div className="student-login">
        <div className="login-card">
          <h1 className="login-title">👨‍🎓 学生端</h1>
          <p className="login-subtitle">请输入您的姓名进入课堂</p>
          <div className="login-input-group">
            <input
              type="text"
              className="login-input"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="请输入姓名"
              onKeyPress={(e) => e.key === 'Enter' && handleEnter()}
            />
            <button
              className="login-btn"
              onClick={handleEnter}
              disabled={!nameInput.trim()}
            >
              进入课堂
            </button>
          </div>
          <button className="back-link" onClick={onBack}>
            ← 返回选择身份
          </button>
        </div>
      </div>
    );
  }

  if (showHistory) {
    return (
      <div className="student-app">
        <header className="student-header">
          <button className="back-btn" onClick={() => setShowHistory(false)}>
            ← 返回
          </button>
          <h1 className="student-title">答题历史</h1>
          <button className="back-btn invisible">占位</button>
        </header>
        <div className="history-container">
          {answerHistory.length === 0 ? (
            <div className="empty-history">
              <div className="empty-icon">📝</div>
              <p>暂无答题记录</p>
            </div>
          ) : (
            <div className="history-list">
              {answerHistory.map((record, idx) => (
                <div key={idx} className="history-card">
                  <div className="history-card-header">
                    <span className={`result-badge ${record.isCorrect ? 'correct' : 'wrong'}`}>
                      {record.isCorrect ? '✓ 正确 +10分' : '✗ 错误'}
                    </span>
                    <span className="history-time">
                      {new Date(record.submittedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="history-question">{record.questionTitle}</p>
                  <div className="history-answer">
                    <span className="answer-label">你的答案：</span>
                    <span className={`answer-text ${record.isCorrect ? 'correct' : 'wrong'}`}>
                      {String.fromCharCode(65 + record.selectedIndex)}. {record.selectedOption}
                    </span>
                  </div>
                  <div className="history-correct">
                    <span className="answer-label">正确答案：</span>
                    <span className="answer-text correct">
                      {String.fromCharCode(65 + record.correctIndex)}. {record.correctOption}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="student-app">
      <header className="student-header">
        <button className="back-btn" onClick={onBack}>
          ← 退出
        </button>
        <h1 className="student-title">课堂抢答</h1>
        <button className="history-btn" onClick={() => setShowHistory(true)}>
          历史记录
        </button>
      </header>

      <main className="student-main">
        {!currentQuestion && !isQuestionActive ? (
          <div className="waiting-state">
            <div className="waiting-icon">⏳</div>
            <h2 className="waiting-title">等待老师发布题目...</h2>
            <p className="waiting-subtitle">
              {studentName}，请做好准备，题目发布后快速抢答！
            </p>
            <div className="student-info">
              <span className="student-name-tag">👤 {studentName}</span>
            </div>
          </div>
        ) : (
          <div className={`question-container ${isQuestionActive ? 'active' : 'ended'}`}>
            <div className="timer-section">
              <div className={`circular-timer ${isUrgent ? 'urgent' : ''}`}>
                <svg viewBox="0 0 100 100">
                  <circle
                    className="timer-bg-circle"
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="8"
                  />
                  <circle
                    className={`timer-progress-circle ${isUrgent ? 'urgent-ring' : ''}`}
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={isUrgent ? '#ef4444' : '#4facfe'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (progress / 100)}`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <span className={`timer-number ${isUrgent ? 'urgent-text' : ''}`}>
                  {timeRemaining}
                </span>
              </div>
            </div>

            <div className="question-card">
              <span className="question-badge">
                {isQuestionActive ? '正在作答' : '答题结束'}
              </span>
              <h2 className="question-title">{currentQuestion?.title}</h2>
            </div>

            <div className="options-grid">
              {currentQuestion?.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const showResult = !isQuestionActive;
                const isCorrectOption = index === currentQuestion.correctIndex;

                return (
                  <button
                    key={index}
                    className={`option-btn 
                      ${isSelected ? 'selected' : ''} 
                      ${hasSubmitted ? 'submitted' : ''}
                      ${showResult && isCorrectOption ? 'correct-option' : ''}
                      ${showResult && isSelected && !isCorrectOption ? 'wrong-option' : ''}
                    `}
                    onClick={() => handleSelectOption(index)}
                    disabled={hasSubmitted || !isQuestionActive}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="option-text">{option}</span>
                    {hasSubmitted && isSelected && (
                      <span className="submitted-badge">已提交</span>
                    )}
                  </button>
                );
              })}
            </div>

            {isQuestionActive && !hasSubmitted && (
              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
              >
                提交答案
              </button>
            )}

            {hasSubmitted && isQuestionActive && (
              <div className="submitted-state">
                <span className="check-icon">✓</span>
                <p>答案已提交，等待结果...</p>
              </div>
            )}

            {!isQuestionActive && currentQuestion && (
              <div className="result-state">
                <div className={`result-card ${
                  selectedAnswer === currentQuestion.correctIndex ? 'correct' : 'wrong'
                }`}>
                  <span className="result-icon">
                    {selectedAnswer === currentQuestion.correctIndex ? '🎉' : '😔'}
                  </span>
                  <h3>
                    {selectedAnswer === currentQuestion.correctIndex
                      ? '回答正确！+10分'
                      : '回答错误'}
                  </h3>
                  <p>
                    正确答案是：{String.fromCharCode(65 + currentQuestion.correctIndex)}.{' '}
                    {currentQuestion.options[currentQuestion.correctIndex]}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default StudentView;
