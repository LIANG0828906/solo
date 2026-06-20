import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuizStore } from '../store';
import { quizApi } from '../api';
import type { Answer as AnswerType, Question } from '../types';

function QuizPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentQuizId = useQuizStore((state) => state.currentQuizId);
  const currentQuestionIndex = useQuizStore((state) => state.currentQuestionIndex);
  const userAnswers = useQuizStore((state) => state.userAnswers);
  const setCurrentQuiz = useQuizStore((state) => state.setCurrentQuiz);
  const setCurrentQuestionIndex = useQuizStore((state) => state.setCurrentQuestionIndex);
  const addAnswer = useQuizStore((state) => state.addAnswer);
  const setScoreResult = useQuizStore((state) => state.setScoreResult);
  const setQuestionStartTime = useQuizStore((state) => state.setQuestionStartTime);
  const questionStartTime = useQuizStore((state) => state.questionStartTime);

  const [quiz, setQuiz] = useState<{ id: string; title: string; questions: Question[] } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [fillAnswer, setFillAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [studentName, setStudentName] = useState('学生');
  const [showNameInput, setShowNameInput] = useState(true);
  const [scoreChange, setScoreChange] = useState<number | null>(null);
  const questionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    if (currentQuizId !== id) {
      setCurrentQuiz(id);
    }
    const loadQuiz = async () => {
      const data = await quizApi.getQuiz(id);
      setQuiz(data);
      setQuestionStartTime(Date.now());
    };
    loadQuiz();
  }, [id, currentQuizId, setCurrentQuiz, setQuestionStartTime]);

  const currentQuestion = quiz?.questions[currentQuestionIndex];
  const totalQuestions = quiz?.questions.length || 0;
  const currentScore = userAnswers.reduce((sum, a) => {
    if (!a.isCorrect) return sum;
    const q = quiz?.questions.find((q) => q.id === a.questionId);
    return sum + (q?.score || 0);
  }, 0);
  const totalPossibleScore = quiz?.questions.reduce((sum, q) => sum + q.score, 0) || 100;
  const accuracy = userAnswers.length > 0 ? Math.round((userAnswers.filter(a => a.isCorrect).length / userAnswers.length) * 100) : 0;

  const getProgressColor = () => {
    if (accuracy >= 80) return '#38a169';
    if (accuracy >= 50) return '#3182ce';
    return '#e53e3e';
  };

  const handleAnswer = async (answer: string) => {
    if (!currentQuestion || !quiz || feedback) return;

    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    const isCorrect =
      currentQuestion.answer.toLowerCase().trim() === answer.toLowerCase().trim();

    setFeedback(isCorrect ? 'correct' : 'wrong');

    const answerRecord: AnswerType = {
      questionId: currentQuestion.id,
      answer,
      isCorrect,
      timeSpent,
    };

    const scoreDelta = isCorrect ? currentQuestion.score : 0;
    setScoreChange(scoreDelta);

    addAnswer(answerRecord);

    setTimeout(() => {
      setScoreChange(null);
      setFeedback(null);
      setSelectedAnswer('');
      setFillAnswer('');

      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setQuestionStartTime(Date.now());
      } else {
        handleSubmit();
      }
    }, 800);
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    const allAnswers = [...userAnswers];
    const result = await quizApi.submitQuiz(quiz.id, studentName, allAnswers);
    setScoreResult(result);
    navigate(`/result/${quiz.id}`);
  };

  if (showNameInput) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '32px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            width: '100%',
            maxWidth: '400px',
          }}
        >
          <h2 style={{ color: '#1a365d', marginBottom: '20px', textAlign: 'center' }}>
            开始答题
          </h2>
          <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568' }}>
            请输入您的姓名
          </label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '16px',
              marginBottom: '20px',
              outline: 'none',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#3182ce')}
            onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
          />
          <button
            onClick={() => setShowNameInput(false)}
            disabled={!studentName.trim()}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#3182ce',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: studentName.trim() ? 'pointer' : 'not-allowed',
              opacity: studentName.trim() ? 1 : 0.5,
            }}
          >
            开始答题
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion || !quiz) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
        加载中...
      </div>
    );
  }

  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr',
        gap: '24px',
      }}
    >
      <div
        style={{
          display: 'none',
        }}
        className="desktop-sidebar"
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: '24px',
          }}
        >
          <h3 style={{ color: '#1a365d', marginBottom: '12px', fontSize: '16px' }}>
            题目列表
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '8px',
            }}
          >
            {quiz.questions.map((_, index) => {
              const answered = userAnswers.find(
                (a) => a.questionId === quiz.questions[index].id
              );
              return (
                <div
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor:
                      index === currentQuestionIndex
                        ? '#3182ce'
                        : answered
                        ? answered.isCorrect
                          ? '#38a169'
                          : '#e53e3e'
                        : '#edf2f7',
                    color:
                      index === currentQuestionIndex || answered
                        ? '#ffffff'
                        : '#4a5568',
                  }}
                >
                  {index + 1}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ color: '#1a365d', fontWeight: 600 }}>
              {quiz.title}
            </span>
            <span style={{ color: '#718096', marginLeft: '12px' }}>
              第 {currentQuestionIndex + 1} / {totalQuestions} 题
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#1a365d', fontWeight: 600, fontSize: '18px' }}>
              {currentScore}
              <span style={{ color: '#718096', fontSize: '14px', fontWeight: 400 }}>
                /{totalPossibleScore}
              </span>
            </span>
            {scoreChange !== null && (
              <span
                className="animate-fade-in"
                style={{
                  color: scoreChange > 0 ? '#38a169' : '#e53e3e',
                  fontWeight: 600,
                }}
              >
                {scoreChange > 0 ? `+${scoreChange}` : '0'}
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            height: '8px',
            backgroundColor: '#e2e8f0',
            borderRadius: '4px',
            marginBottom: '16px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercentage}%`,
              backgroundColor: getProgressColor(),
              transition: 'all 0.3s ease',
              borderRadius: '4px',
            }}
          />
        </div>

        <div
          ref={questionRef}
          className="animate-fade-in-content"
          key={currentQuestionIndex}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '32px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: feedback
              ? `2px solid ${feedback === 'correct' ? '#38a169' : '#e53e3e'}`
              : '2px solid transparent',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              backgroundColor: '#3182ce',
              color: '#ffffff',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            {currentQuestion.type === 'choice'
              ? '选择题'
              : currentQuestion.type === 'judge'
              ? '判断题'
              : '填空题'}
          </div>

          <h3
            style={{
              color: '#1a365d',
              fontSize: '20px',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}
          >
            {currentQuestion.content}
          </h3>

          {currentQuestion.type === 'choice' && currentQuestion.options && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentQuestion.options.map((option, index) => (
                <div
                  key={index}
                  onClick={() => !feedback && handleAnswer(option)}
                  style={{
                    padding: '14px 16px',
                    border:
                      selectedAnswer === option
                        ? '2px solid #3182ce'
                        : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: feedback ? 'default' : 'pointer',
                    backgroundColor:
                      selectedAnswer === option ? '#ebf8ff' : '#ffffff',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!feedback && selectedAnswer !== option) {
                      e.currentTarget.style.borderColor = '#3182ce';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!feedback && selectedAnswer !== option) {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }
                  }}
                >
                  <span style={{ color: '#4a5568' }}>
                    {String.fromCharCode(65 + index)}. {option}
                  </span>
                </div>
              ))}
            </div>
          )}

          {currentQuestion.type === 'judge' && (
            <div style={{ display: 'flex', gap: '12px' }}>
              {['true', 'false'].map((val) => (
                <div
                  key={val}
                  onClick={() => !feedback && handleAnswer(val)}
                  style={{
                    flex: 1,
                    padding: '16px',
                    textAlign: 'center',
                    border:
                      selectedAnswer === val
                        ? '2px solid #3182ce'
                        : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: feedback ? 'default' : 'pointer',
                    backgroundColor:
                      selectedAnswer === val ? '#ebf8ff' : '#ffffff',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!feedback && selectedAnswer !== val) {
                      e.currentTarget.style.borderColor = '#3182ce';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!feedback && selectedAnswer !== val) {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }
                  }}
                >
                  {val === 'true' ? '✓ 正确' : '✗ 错误'}
                </div>
              ))}
            </div>
          )}

          {currentQuestion.type === 'fill' && (
            <div>
              <input
                type="text"
                value={fillAnswer}
                onChange={(e) => setFillAnswer(e.target.value)}
                placeholder="请输入答案"
                disabled={!!feedback}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && fillAnswer.trim()) {
                    handleAnswer(fillAnswer.trim());
                  }
                }}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3182ce')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
              <button
                onClick={() => fillAnswer.trim() && handleAnswer(fillAnswer.trim())}
                disabled={!fillAnswer.trim() || !!feedback}
                style={{
                  marginTop: '12px',
                  padding: '12px 24px',
                  backgroundColor: '#3182ce',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: fillAnswer.trim() && !feedback ? 'pointer' : 'not-allowed',
                  opacity: fillAnswer.trim() && !feedback ? 1 : 0.5,
                }}
              >
                提交答案
              </button>
            </div>
          )}

          {feedback && (
            <div
              className={feedback === 'correct' ? 'animate-pulse-green' : 'animate-shake'}
              style={{
                marginTop: '20px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor:
                  feedback === 'correct' ? '#f0fff4' : '#fff5f5',
                color: feedback === 'correct' ? '#38a169' : '#e53e3e',
                fontWeight: 600,
              }}
            >
              {feedback === 'correct' ? '✓ 回答正确！' : `✗ 回答错误，正确答案：${currentQuestion.answer}`}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-sidebar { display: block !important; }
        }
        @media (max-width: 767px) {
          div[style*="grid-template-columns: 200px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default QuizPlayer;
