import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { ClassroomState } from '../types';

export default function StudentPanel() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [showDotAnimation, setShowDotAnimation] = useState(false);
  const [quizEnded, setQuizEnded] = useState(false);
  const timerRef = useRef<number | null>(null);
  const questionStartTime = useRef<number>(Date.now());
  const hasAnsweredRef = useRef(false);

  const { data: classroomState, error } = useWebSocket<ClassroomState>(
    code ? `/api/classrooms/${code}` : '',
    3000,
    isJoined
  );

  useEffect(() => {
    const savedId = localStorage.getItem(`student_${code}`);
    const savedName = localStorage.getItem(`student_name_${code}`);
    if (savedId && savedName) {
      setStudentId(savedId);
      setStudentName(savedName);
      setIsJoined(true);
    }
  }, [code]);

  useEffect(() => {
    if (classroomState?.currentQuiz) {
      if (classroomState.currentQuiz.status === 'ended') {
        setQuizEnded(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }
  }, [classroomState?.currentQuiz]);

  const joinClassroom = async () => {
    if (!studentName.trim() || !code) return;

    try {
      const response = await fetch(`/api/classrooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName: studentName.trim() }),
      });

      if (!response.ok) {
        throw new Error('加入失败');
      }

      const student = await response.json();
      setStudentId(student.id);
      localStorage.setItem(`student_${code}`, student.id);
      localStorage.setItem(`student_name_${code}`, studentName.trim());
      setIsJoined(true);
    } catch (err) {
      console.error('加入课堂失败:', err);
    }
  };

  useEffect(() => {
    if (
      !isJoined ||
      !classroomState?.currentQuiz ||
      classroomState.currentQuiz.status !== 'active' ||
      quizEnded
    ) {
      return;
    }

    const quiz = classroomState.currentQuiz;
    if (currentQuestionIndex >= quiz.questions.length) {
      return;
    }

    setTimeLeft(60);
    setSelectedAnswer(null);
    hasAnsweredRef.current = false;
    questionStartTime.current = Date.now();

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!hasAnsweredRef.current) {
            submitAnswerAutomatically();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [classroomState?.currentQuiz?.id, currentQuestionIndex, isJoined, quizEnded]);

  const submitAnswerAutomatically = () => {
    if (hasAnsweredRef.current) return;
    hasAnsweredRef.current = true;

    if (selectedAnswer !== null && code && studentId && classroomState?.currentQuiz) {
      const timeSpent = (Date.now() - questionStartTime.current) / 1000;
      fetch(`/api/classrooms/${code}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          questionIndex: currentQuestionIndex,
          answer: selectedAnswer,
          timeSpent: Math.min(timeSpent, 60),
        }),
      });
    }
  };

  const submitAnswer = async () => {
    if (selectedAnswer === null || !code || !studentId || !classroomState?.currentQuiz) return;
    if (hasAnsweredRef.current) return;

    hasAnsweredRef.current = true;
    const timeSpent = (Date.now() - questionStartTime.current) / 1000;

    try {
      await fetch(`/api/classrooms/${code}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          questionIndex: currentQuestionIndex,
          answer: selectedAnswer,
          timeSpent: Math.min(timeSpent, 60),
        }),
      });

      const newAnswered = new Set(answeredQuestions);
      newAnswered.add(currentQuestionIndex);
      setAnsweredQuestions(newAnswered);

      setShowDotAnimation(true);
      setTimeout(() => setShowDotAnimation(false), 600);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setTimeout(() => {
        if (classroomState.currentQuiz && currentQuestionIndex < classroomState.currentQuiz.questions.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
        } else {
          setQuizEnded(true);
        }
      }, 500);
    } catch (err) {
      console.error('提交答案失败:', err);
      hasAnsweredRef.current = false;
    }
  };

  if (!isJoined) {
    if (error) {
      return (
        <div style={styles.joinPage}>
          <div style={styles.joinCard}>
            <h1 style={styles.joinErrorTitle}>课堂不存在</h1>
            <p style={styles.joinErrorDesc}>请检查课堂码是否正确</p>
            <button style={styles.backButton} onClick={() => navigate('/')} className="btn-hover">
              返回首页
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.joinPage}>
        <div style={styles.joinCard}>
          <h1 style={styles.joinTitle}>加入课堂</h1>
          <p style={styles.joinSubtitle}>课堂码: {code}</p>

          <div style={styles.formGroup}>
            <label style={styles.label}>你的名字</label>
            <input
              style={styles.input}
              type="text"
              placeholder="请输入你的姓名"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && joinClassroom()}
            />
          </div>

          <button
            style={{
              ...styles.joinButton,
              opacity: studentName.trim() ? 1 : 0.6,
            }}
            onClick={joinClassroom}
            disabled={!studentName.trim()}
            className="btn-hover"
          >
            加入课堂
          </button>
        </div>
      </div>
    );
  }

  if (quizEnded || (classroomState?.currentQuiz && classroomState.currentQuiz.status === 'ended')) {
    return (
      <div style={styles.endPage}>
        <div style={styles.endCard}>
          <div style={styles.endIcon}>🎉</div>
          <h1 style={styles.endTitle}>测验已完成</h1>
          <p style={styles.endDesc}>你已完成所有题目，等待老师公布结果</p>
          <div style={styles.endStats}>
            <div style={styles.endStatItem}>
              <span style={styles.endStatValue}>{answeredQuestions.size}</span>
              <span style={styles.endStatLabel}>已答题数</span>
            </div>
            <div style={styles.endStatItem}>
              <span style={styles.endStatValue}>
                {classroomState?.currentQuiz?.questions.length || 0}
              </span>
              <span style={styles.endStatLabel}>总题数</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!classroomState?.currentQuiz) {
    return (
      <div style={styles.waitingPage}>
        <div style={styles.floatingName} className="floating-name">{studentName}</div>

        <div style={styles.waitingContent}>
          <div
            style={{
              ...styles.waitingText,
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            等待中...
          </div>
          <p style={styles.waitingDesc}>老师即将开始随堂测验</p>
        </div>

        <div style={styles.classInfo}>
          <span style={styles.classLabel}>课堂: {classroomState?.className || code}</span>
          <span style={styles.classCode}>课堂码: {code}</span>
        </div>
      </div>
    );
  }

  const quiz = classroomState.currentQuiz;
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const progress = (answeredQuestions.size / totalQuestions) * 100;

  return (
    <div style={styles.quizPage}>
      <div style={styles.quizHeader}>
        <div style={styles.studentInfo}>{studentName}</div>
        <div style={styles.progressBarContainer}>
          <div style={styles.progressLabel}>
            已答 {answeredQuestions.size}/{totalQuestions} 题
          </div>
          <div style={styles.progressBarBg}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${progress}%`,
              }}
            >
              {showDotAnimation && (
                <div style={styles.progressDot} />
              )}
            </div>
          </div>
        </div>
        <div
          style={{
            ...styles.timer,
            color: timeLeft <= 10 ? '#dc2626' : '#334155',
            animation: timeLeft <= 10 ? 'blink 1s ease-in-out infinite' : 'none',
          }}
        >
          {timeLeft}s
        </div>
      </div>

      <div style={styles.quizContent}>
        <div style={styles.questionCard}>
          <div style={styles.questionNumber}>
            第 {currentQuestionIndex + 1} 题 / 共 {totalQuestions} 题
          </div>
          <div style={styles.questionType}>
            {currentQuestion.type === 'single' ? '单选题' : '判断题'}
          </div>
          <h2 style={styles.questionText}>{currentQuestion.content}</h2>

          <div style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                style={{
                  ...styles.optionCard,
                  borderColor: selectedAnswer === index ? '#1A365D' : '#e2e8f0',
                  backgroundColor: selectedAnswer === index ? '#eff6ff' : 'white',
                }}
                onClick={() => setSelectedAnswer(index)}
                className="option-hover"
              >
                <div
                  style={{
                    ...styles.optionCircle,
                    backgroundColor: selectedAnswer === index ? '#1A365D' : 'white',
                    borderColor: selectedAnswer === index ? '#1A365D' : '#cbd5e1',
                    color: selectedAnswer === index ? 'white' : '#64748b',
                  }}
                >
                  {String.fromCharCode(65 + index)}
                </div>
                <span style={styles.optionText}>{option}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.quizFooter}>
        <button
          style={{
            ...styles.submitButton,
            opacity: selectedAnswer !== null ? 1 : 0.5,
          }}
          onClick={submitAnswer}
          disabled={selectedAnswer === null || hasAnsweredRef.current}
          className="btn-hover"
        >
          提交答案
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  joinPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1A365D 0%, #2c5282 100%)',
    padding: '20px',
  },
  joinCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    animation: 'scaleIn 0.3s ease-out',
    textAlign: 'center',
  },
  joinTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1A365D',
    marginBottom: '8px',
  },
  joinSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '32px',
  },
  joinErrorTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: '8px',
  },
  joinErrorDesc: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '24px',
  },
  formGroup: {
    marginBottom: '24px',
    textAlign: 'left',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#334155',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '15px',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  joinButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#1A365D',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '10px',
    transition: 'transform 0.2s, opacity 0.2s',
  },
  backButton: {
    padding: '10px 24px',
    backgroundColor: '#f1f5f9',
    color: '#334155',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
  },
  waitingPage: {
    minHeight: '100vh',
    backgroundColor: '#EBF8FF',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '40px 20px',
    position: 'relative',
    overflow: 'hidden',
  },
  floatingName: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1A365D',
    animation: 'float 3s ease-in-out infinite',
    marginTop: '60px',
  },
  waitingContent: {
    textAlign: 'center',
  },
  waitingText: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#1A365D',
    marginBottom: '16px',
  },
  waitingDesc: {
    fontSize: '16px',
    color: '#64748b',
  },
  classInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  classLabel: {
    fontSize: '14px',
    color: '#475569',
    fontWeight: '500',
  },
  classCode: {
    fontSize: '16px',
    color: '#1A365D',
    fontWeight: '600',
    backgroundColor: 'white',
    padding: '8px 16px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  quizPage: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    display: 'flex',
    flexDirection: 'column',
  },
  quizHeader: {
    backgroundColor: 'white',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  studentInfo: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#334155',
    backgroundColor: '#f1f5f9',
    padding: '6px 12px',
    borderRadius: '8px',
  },
  progressBarContainer: {
    flex: 1,
  },
  progressLabel: {
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '6px',
  },
  progressBarBg: {
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #22c55e, #16a34a)',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
    position: 'relative',
  },
  progressDot: {
    position: 'absolute',
    right: '-6px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '16px',
    height: '16px',
    backgroundColor: '#22c55e',
    borderRadius: '50%',
    animation: 'dotBlink 0.6s ease-out',
  },
  timer: {
    fontSize: '24px',
    fontWeight: 'bold',
    minWidth: '60px',
    textAlign: 'center',
  },
  quizContent: {
    flex: 1,
    padding: '24px 20px',
    overflowY: 'auto',
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    animation: 'fadeIn 0.3s ease',
  },
  questionNumber: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '8px',
  },
  questionType: {
    display: 'inline-block',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    marginBottom: '16px',
  },
  questionText: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '24px',
    lineHeight: '1.5',
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  optionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px',
    border: '2px solid',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: 'white',
  },
  optionCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  optionText: {
    fontSize: '16px',
    color: '#334155',
  },
  quizFooter: {
    backgroundColor: 'white',
    padding: '20px',
    boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#1A365D',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '12px',
    transition: 'transform 0.2s, opacity 0.2s',
  },
  endPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f7fa',
    padding: '20px',
  },
  endCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '360px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    animation: 'scaleIn 0.3s ease-out',
  },
  endIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  endTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '8px',
  },
  endDesc: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '32px',
  },
  endStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '40px',
  },
  endStatItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  endStatValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1A365D',
  },
  endStatLabel: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '4px',
  },
};
