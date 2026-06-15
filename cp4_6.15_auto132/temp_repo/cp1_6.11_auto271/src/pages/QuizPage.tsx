import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const QuizPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data);
        setAnswers(new Array(data.questions.length).fill(-1));
      }
    } catch (error) {
      console.error('获取题目失败', error);
    } finally {
      setLoading(false);
    }
  };

  const goToNext = useCallback(() => {
    if (currentIndex < course.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(20);
    } else {
      submitQuiz();
    }
  }, [currentIndex, course]);

  useEffect(() => {
    if (loading || showResult || !course) return;

    if (timeLeft === 0) {
      setIsAnswered(true);
      const timer = setTimeout(() => {
        goToNext();
      }, 1000);
      return () => clearTimeout(timer);
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, showResult, course, goToNext]);

  const handleSelectAnswer = (answerIndex: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answerIndex;
    setAnswers(newAnswers);

    setTimeout(() => {
      goToNext();
    }, 1000);
  };

  const submitQuiz = async () => {
    try {
      const response = await fetch(`/api/courses/${id}/submit-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setShowResult(true);
      }
    } catch (error) {
      console.error('提交答案失败', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="bamboo-loading">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bamboo-slip"></div>
          ))}
        </div>
      </div>
    );
  }

  if (showResult && result) {
    return <QuizResult result={result} course={course} onRetry={() => {
      setShowResult(false);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setAnswers(new Array(course.questions.length).fill(-1));
      setTimeLeft(20);
      setIsAnswered(false);
    }} onBack={() => navigate(`/course/${id}`)} />;
  }

  const currentQuestion = course?.questions?.[currentIndex];
  const progress = ((currentIndex + 1) / (course?.questions?.length || 1)) * 100;
  const timePercentage = (timeLeft / 20) * 100;

  return (
    <div className="quiz-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← 返回
      </button>

      <div className="quiz-container">
        <div className="quiz-header">
          <h2>📜 {course?.name} - 课后答题</h2>
          <div className="quiz-progress-info">
            第 {currentIndex + 1} / {course?.questions?.length} 题
          </div>
        </div>

        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="timer-section">
          <div className={`timer-circle ${timeLeft <= 5 ? 'warning' : ''}`}>
            <span className="timer-number">{timeLeft}</span>
            <span className="timer-unit">秒</span>
          </div>
          <div className="timer-bar-container">
            <div 
              className={`timer-bar ${timeLeft <= 5 ? 'warning' : ''}`}
              style={{ width: `${timePercentage}%` }}
            />
          </div>
        </div>

        <div className="question-card">
          <h3 className="question-text">
            <span className="question-number">{currentIndex + 1}.</span>
            {currentQuestion?.question}
          </h3>

          <div className="options-list">
            {currentQuestion?.options.map((option: string, index: number) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.answer;
              const showCorrectness = isAnswered;
              
              let optionClass = 'option-item';
              if (showCorrectness) {
                if (isCorrect) optionClass += ' correct';
                else if (isSelected && !isCorrect) optionClass += ' wrong';
              } else if (isSelected) {
                optionClass += ' selected';
              }
              
              return (
                <button
                  key={index}
                  className={optionClass}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={isAnswered}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option.substring(3)}</span>
                  {showCorrectness && isCorrect && <span className="option-icon">✓</span>}
                  {showCorrectness && isSelected && !isCorrect && <span className="option-icon wrong">✗</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="quiz-footer">
          <div className="question-dots">
            {course?.questions?.map((_: any, index: number) => (
              <div 
                key={index} 
                className={`dot ${index === currentIndex ? 'active' : ''} ${answers[index] !== -1 ? 'answered' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .quiz-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 700px;
          margin: 0 auto;
        }
        
        .back-btn {
          align-self: flex-start;
          background: transparent;
          color: #4A2C1A;
          font-size: 16px;
          padding: 8px 16px;
          border: 1px solid #D4C9A8;
          border-radius: 8px;
        }
        
        .quiz-container {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          border: 2px solid #D4AF37;
        }
        
        .quiz-header {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .quiz-header h2 {
          font-size: 24px;
          color: #4A2C1A;
          margin-bottom: 8px;
        }
        
        .quiz-progress-info {
          color: #8B4513;
          font-size: 15px;
        }
        
        .progress-bar-container {
          height: 6px;
          background: #E8E0D0;
          border-radius: 3px;
          margin-bottom: 24px;
          overflow: hidden;
        }
        
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #D4AF37, #B8860B);
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        
        .timer-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .timer-circle {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6B8E23, #556B2F);
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(107, 142, 35, 0.4);
        }
        
        .timer-circle.warning {
          background: linear-gradient(135deg, #CC3333, #A02020);
          animation: pulse 0.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .timer-number {
          font-size: 24px;
          font-weight: bold;
          line-height: 1;
        }
        
        .timer-unit {
          font-size: 12px;
        }
        
        .timer-bar-container {
          width: 200px;
          height: 6px;
          background: #E8E0D0;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .timer-bar {
          height: 100%;
          background: #6B8E23;
          border-radius: 3px;
          transition: width 1s linear;
        }
        
        .timer-bar.warning {
          background: #CC3333;
        }
        
        .question-card {
          margin-bottom: 24px;
        }
        
        .question-text {
          font-size: 18px;
          color: #3C3C3C;
          line-height: 1.6;
          margin-bottom: 20px;
          padding: 16px;
          background: #F9F6EE;
          border-radius: 10px;
          border-left: 4px solid #D4AF37;
        }
        
        .question-number {
          color: #D4AF37;
          font-weight: bold;
          margin-right: 8px;
        }
        
        .options-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .option-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border: 2px solid #E8E0D0;
          border-radius: 10px;
          background: white;
          text-align: left;
          font-size: 16px;
          color: #3C3C3C;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .option-item:hover:not(:disabled) {
          border-color: #D4AF37;
          background: #FFFAF0;
          opacity: 1;
        }
        
        .option-item.selected {
          border-color: #D4AF37;
          background: #FFF8DC;
        }
        
        .option-item.correct {
          border-color: #6B8E23;
          background: #F0FFF0;
        }
        
        .option-item.wrong {
          border-color: #CC3333;
          background: #FFF0F0;
        }
        
        .option-item:disabled {
          cursor: default;
        }
        
        .option-letter {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #F5E6D3;
          color: #8B4513;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          flex-shrink: 0;
        }
        
        .option-item.correct .option-letter {
          background: #6B8E23;
          color: white;
        }
        
        .option-item.wrong .option-letter {
          background: #CC3333;
          color: white;
        }
        
        .option-text {
          flex: 1;
        }
        
        .option-icon {
          font-size: 20px;
          color: #6B8E23;
          font-weight: bold;
        }
        
        .option-icon.wrong {
          color: #CC3333;
        }
        
        .quiz-footer {
          padding-top: 16px;
          border-top: 1px solid #E8E0D0;
        }
        
        .question-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
        }
        
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #E8E0D0;
          transition: all 0.2s ease;
        }
        
        .dot.active {
          background: #D4AF37;
          transform: scale(1.3);
        }
        
        .dot.answered {
          background: #6B8E23;
        }
        
        @media (max-width: 600px) {
          .quiz-container {
            padding: 16px;
          }
          
          .quiz-header h2 {
            font-size: 20px;
          }
          
          .question-text {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

interface QuizResultProps {
  result: any;
  course: any;
  onRetry: () => void;
  onBack: () => void;
}

const QuizResult: React.FC<QuizResultProps> = ({ result, course, onRetry, onBack }) => {
  const scorePercentage = (result.score / (result.totalQuestions * 10)) * 100;
  
  const getScoreMessage = () => {
    if (scorePercentage >= 90) return { text: '出类拔萃！', emoji: '🏆' };
    if (scorePercentage >= 70) return { text: '学有所成！', emoji: '🌟' };
    if (scorePercentage >= 50) return { text: '继续努力！', emoji: '💪' };
    return { text: '勤能补拙！', emoji: '📚' };
  };
  
  const message = getScoreMessage();

  return (
    <div className="quiz-result-page">
      <div className="result-card">
        <div className="result-header">
          <span className="result-emoji">{message.emoji}</span>
          <h2>{message.text}</h2>
        </div>
        
        <div className="score-display-large">
          <div className="score-circle">
            <span className="score-number">{result.score}</span>
            <span className="score-unit">分</span>
          </div>
          <p className="score-detail">
            共 {result.totalQuestions} 题，答对 {result.score / 10} 题
          </p>
        </div>

        <div className="leaderboard-section">
          <h3>🏆 排行榜</h3>
          <div className="leaderboard-list">
            {result.leaderboard?.slice(0, 10).map((user: any, index: number) => (
              <div 
                key={user.id} 
                className={`leaderboard-item ${
                  index === 0 ? 'rank-gold' : 
                  index === 1 ? 'rank-silver' : 
                  index === 2 ? 'rank-bronze' : ''
                }`}
              >
                <span className="rank-badge">
                  {index === 0 ? '🥇' : 
                   index === 1 ? '🥈' : 
                   index === 2 ? '🥉' : 
                   `第${index + 1}名`}
                </span>
                <span className="leader-name">{user.name}</span>
                <span className="leader-score">{user.totalScore}分</span>
              </div>
            ))}
          </div>
        </div>

        <div className="result-actions">
          <button className="retry-btn" onClick={onRetry}>
            🔄 再次挑战
          </button>
          <button className="back-btn-primary" onClick={onBack}>
            📖 返回课程
          </button>
        </div>
      </div>

      <style>{`
        .quiz-result-page {
          max-width: 500px;
          margin: 0 auto;
        }
        
        .result-card {
          background: white;
          border-radius: 20px;
          padding: 32px 24px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          border: 3px solid #D4AF37;
          text-align: center;
        }
        
        .result-header {
          margin-bottom: 24px;
        }
        
        .result-emoji {
          font-size: 64px;
          display: block;
          margin-bottom: 12px;
        }
        
        .result-header h2 {
          font-size: 28px;
          color: #4A2C1A;
        }
        
        .score-display-large {
          margin-bottom: 28px;
        }
        
        .score-circle {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%);
          color: white;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 20px rgba(212, 175, 55, 0.5);
          margin-bottom: 12px;
        }
        
        .score-number {
          font-size: 48px;
          font-weight: bold;
          line-height: 1;
          font-family: 'LiSu', 'STLiti', '隶书', serif;
        }
        
        .score-unit {
          font-size: 16px;
        }
        
        .score-detail {
          color: #666;
          font-size: 15px;
        }
        
        .leaderboard-section {
          text-align: left;
          margin-bottom: 24px;
        }
        
        .leaderboard-section h3 {
          font-size: 18px;
          color: #4A2C1A;
          margin-bottom: 12px;
          text-align: center;
        }
        
        .leaderboard-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .leaderboard-item {
          display: flex;
          align-items: center;
          padding: 10px 14px;
          border-radius: 8px;
          background: #F9F6EE;
        }
        
        .leaderboard-item.rank-gold {
          background: linear-gradient(90deg, #FFD700 0%, #FFA500 100%);
          color: #4A2C1A;
        }
        
        .leaderboard-item.rank-silver {
          background: linear-gradient(90deg, #C0C0C0 0%, #A8A8A8 100%);
          color: #4A2C1A;
        }
        
        .leaderboard-item.rank-bronze {
          background: linear-gradient(90deg, #CD7F32 0%, #B87333 100%);
          color: #fff;
        }
        
        .rank-badge {
          font-size: 14px;
          font-weight: bold;
          min-width: 60px;
        }
        
        .leader-name {
          flex: 1;
          font-size: 15px;
        }
        
        .leader-score {
          font-weight: bold;
          font-size: 16px;
        }
        
        .result-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        
        .retry-btn {
          padding: 12px 28px;
          font-size: 16px;
          background: linear-gradient(135deg, #6B8E23 0%, #556B2F 100%);
          color: white;
          border-radius: 25px;
          box-shadow: 0 4px 12px rgba(107, 142, 35, 0.4);
        }
        
        .back-btn-primary {
          padding: 12px 28px;
          font-size: 16px;
          background: #F5E6D3;
          color: #8B4513;
          border-radius: 25px;
          border: 1px solid #D4C9A8;
        }
        
        @media (max-width: 500px) {
          .result-card {
            padding: 24px 16px;
          }
          
          .score-circle {
            width: 100px;
            height: 100px;
          }
          
          .score-number {
            font-size: 36px;
          }
          
          .result-actions {
            flex-direction: column;
          }
          
          .retry-btn, .back-btn-primary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default QuizPage;
