import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useQuizStore } from '../store';

function QuizList() {
  const navigate = useNavigate();
  const quizzes = useQuizStore((state) => state.quizzes);
  const setCurrentQuiz = useQuizStore((state) => state.setCurrentQuiz);

  const handleQuizClick = (quizId: string) => {
    setCurrentQuiz(quizId);
    navigate(`/quiz/${quizId}`);
  };

  return (
    <div>
      <h2
        style={{
          color: '#1a365d',
          fontSize: '24px',
          fontWeight: 700,
          marginBottom: '24px',
        }}
      >
        可用测验
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {quizzes.map((quiz, index) => (
          <div
            key={quiz.id}
            className="animate-fade-in-up"
            style={{
              animationDelay: `${index * 0.1}s`,
              opacity: 0,
              backgroundColor: '#f5f7fa',
              borderRadius: '8px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow =
                '0 8px 24px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow =
                '0 4px 12px rgba(0,0,0,0.08)';
            }}
            onClick={() => handleQuizClick(quiz.id)}
          >
            <h3
              style={{
                color: '#1a365d',
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '12px',
              }}
            >
              {quiz.title}
            </h3>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: '#718096',
                fontSize: '14px',
              }}
            >
              <span>题目数量：{quiz.questions.length} 道</span>
              <span>{dayjs(quiz.createdAt).format('YYYY-MM-DD')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuizList;
