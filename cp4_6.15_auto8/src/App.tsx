import { useState, useEffect, useCallback, useRef } from 'react';
import { Role, Question, StudentAnswer, HistoryItem } from './shared/types';
import { eventBus, EVENTS } from './shared/EventBus';
import QuestionPanel from './teacher/QuestionPanel';
import LiveBoard from './teacher/LiveBoard';
import StudentView from './student/StudentView';
import './App.css';

const STORAGE_KEYS = {
  HISTORY: 'quiz_history',
  STUDENT_NAME: 'student_name',
  SCORES: 'student_scores',
};

function App() {
  const [role, setRole] = useState<Role>(null);
  const [studentName, setStudentName] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [scores, setScores] = useState<Record<string, { name: string; score: number }>>({});

  const endTimeRef = useRef<number>(0);
  const countdownRafRef = useRef<number>(0);
  const statsIntervalRef = useRef<number>(0);

  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history');
      }
    }
    const savedName = localStorage.getItem(STORAGE_KEYS.STUDENT_NAME);
    if (savedName) {
      setStudentName(savedName);
    }
    const savedScores = localStorage.getItem(STORAGE_KEYS.SCORES);
    if (savedScores) {
      try {
        setScores(JSON.parse(savedScores));
      } catch (e) {
        console.error('Failed to parse scores');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    if (studentName) {
      localStorage.setItem(STORAGE_KEYS.STUDENT_NAME, studentName);
    }
  }, [studentName]);

  const endQuestion = useCallback(() => {
    if (!currentQuestion) return;

    cancelAnimationFrame(countdownRafRef.current);
    clearInterval(statsIntervalRef.current);

    const optionCounts = currentQuestion.options.map((_, idx) =>
      answers.filter((a) => a.selectedIndex === idx).length
    );

    const sortedAnswers = [...answers].sort((a, b) => a.submittedAt - b.submittedAt);
    const allCorrectAnswers = sortedAnswers.filter(
      (a) => a.selectedIndex === currentQuestion.correctIndex
    );
    const topStudents = allCorrectAnswers.slice(0, 5).map((a, idx) => ({
      studentId: a.studentId,
      studentName: a.studentName,
      score: 10,
      rank: idx + 1,
    }));

    const newScores = { ...scores };
    allCorrectAnswers.forEach((entry) => {
      if (!newScores[entry.studentId]) {
        newScores[entry.studentId] = { name: entry.studentName, score: 0 };
      }
      newScores[entry.studentId].score += 10;
    });
    setScores(newScores);

    const historyItem: HistoryItem = {
      question: currentQuestion,
      answers,
      stats: {
        questionId: currentQuestion.id,
        optionCounts,
        totalAnswers: answers.length,
      },
      topStudents,
      endedAt: Date.now(),
    };

    setHistory((prev) => [historyItem, ...prev]);
    setIsQuestionActive(false);
    setTimeRemaining(0);
    eventBus.emit(EVENTS.QUESTION_ENDED, historyItem);
  }, [currentQuestion, answers, scores]);

  useEffect(() => {
    if (!isQuestionActive || !currentQuestion) return;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      const msRemaining = Math.max(0, endTimeRef.current - now);

      setTimeRemaining(remaining);
      eventBus.emit(EVENTS.TICK, msRemaining);

      if (msRemaining <= 0) {
        endQuestion();
        return;
      }

      countdownRafRef.current = requestAnimationFrame(tick);
    };

    countdownRafRef.current = requestAnimationFrame(tick);

    statsIntervalRef.current = window.setInterval(() => {
      if (currentQuestion) {
        const optionCounts = currentQuestion.options.map((_, idx) =>
          answers.filter((a) => a.selectedIndex === idx).length
        );
        eventBus.emit(EVENTS.STATS_UPDATED, {
          questionId: currentQuestion.id,
          optionCounts,
          totalAnswers: answers.length,
        });
      }
    }, 1000);

    return () => {
      cancelAnimationFrame(countdownRafRef.current);
      clearInterval(statsIntervalRef.current);
    };
  }, [isQuestionActive, currentQuestion, answers, endQuestion]);

  const handlePublishQuestion = useCallback((question: Question) => {
    setCurrentQuestion(question);
    setAnswers([]);
    endTimeRef.current = Date.now() + question.duration * 1000;
    setTimeRemaining(question.duration);
    setIsQuestionActive(true);
    eventBus.emit(EVENTS.QUESTION_PUBLISHED, question);
  }, []);

  const handleSubmitAnswer = useCallback((answer: StudentAnswer) => {
    setAnswers((prev) => {
      const exists = prev.some(
        (a) => a.studentId === answer.studentId && a.questionId === answer.questionId
      );
      if (exists) return prev;
      return [...prev, answer];
    });
    eventBus.emit(EVENTS.ANSWER_SUBMITTED, answer);
  }, []);

  const handleSelectRole = (selectedRole: Role) => {
    setRole(selectedRole);
  };

  const handleBack = () => {
    setRole(null);
    setShowHistory(false);
  };

  if (!role) {
    return (
      <div className="role-selector">
        <div className="role-card">
          <h1 className="role-title">课堂实时抢答系统</h1>
          <p className="role-subtitle">请选择您的身份</p>
          <div className="role-buttons">
            <button className="role-btn teacher-btn" onClick={() => handleSelectRole('teacher')}>
              <span className="role-icon">👨‍🏫</span>
              <span className="role-label">教师</span>
            </button>
            <button className="role-btn student-btn" onClick={() => handleSelectRole('student')}>
              <span className="role-icon">👨‍🎓</span>
              <span className="role-label">学生</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'teacher') {
    return (
      <div className="teacher-app">
        <header className="app-header">
          <button className="back-btn" onClick={handleBack}>
            ← 返回
          </button>
          <h1 className="app-title">教师控制台</h1>
          <button
            className="history-btn"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? '返回直播' : '历史记录'}
          </button>
        </header>
        {showHistory ? (
          <div className="history-panel">
            <h2>历史题目</h2>
            {history.length === 0 ? (
              <p className="empty-history">暂无历史记录</p>
            ) : (
              <div className="history-list">
                {history.map((item, idx) => (
                  <div key={idx} className="history-item-card">
                    <h3>{item.question.title}</h3>
                    <div className="history-options">
                      {item.question.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`history-option ${
                            i === item.question.correctIndex ? 'correct' : ''
                          }`}
                        >
                          <span className="option-label">{String.fromCharCode(65 + i)}.</span>
                          <span className="option-text">{opt}</span>
                          <span className="option-count">{item.stats.optionCounts[i]}人</span>
                        </div>
                      ))}
                    </div>
                    <div className="history-top">
                      <h4>最快答对前5名</h4>
                      {item.topStudents.length > 0 ? (
                        <ol>
                          {item.topStudents.map((s) => (
                            <li key={s.studentId}>
                              {s.rank}. {s.studentName}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="no-winners">暂无答对者</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="teacher-container">
            <QuestionPanel
              onPublish={handlePublishQuestion}
              isActive={isQuestionActive}
              timeRemaining={timeRemaining}
              duration={currentQuestion?.duration || 0}
            />
            <LiveBoard
              currentQuestion={currentQuestion}
              timeRemaining={timeRemaining}
              isActive={isQuestionActive}
              answers={answers}
              scores={scores}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <StudentView
      studentName={studentName}
      setStudentName={setStudentName}
      currentQuestion={currentQuestion}
      timeRemaining={timeRemaining}
      isQuestionActive={isQuestionActive}
      onSubmitAnswer={handleSubmitAnswer}
      onBack={handleBack}
    />
  );
}

export default App;
