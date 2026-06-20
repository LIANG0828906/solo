import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import QuizList from './components/QuizList';
import QuizPlayer from './components/QuizPlayer';
import ResultDashboard from './components/ResultDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import { useQuizStore } from './store';
import { quizApi } from './api';

function App() {
  const location = useLocation();
  const setQuizzes = useQuizStore((state) => state.setQuizzes);

  useEffect(() => {
    const loadQuizzes = async () => {
      const quizzes = await quizApi.getQuizzes();
      setQuizzes(quizzes);
    };
    loadQuizzes();
  }, [setQuizzes]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f0f4f8',
      }}
    >
      <nav
        style={{
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1 style={{ color: '#1a365d', fontSize: '22px', fontWeight: 700 }}>
          在线答题系统
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            to="/"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: isActive('/') ? '#ffffff' : '#3182ce',
              backgroundColor: isActive('/') ? '#3182ce' : 'transparent',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            学生端
          </Link>
          <Link
            to="/teacher"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: isActive('/teacher') ? '#ffffff' : '#3182ce',
              backgroundColor: isActive('/teacher') ? '#3182ce' : 'transparent',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            教师端
          </Link>
        </div>
      </nav>

      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px',
        }}
      >
        <Routes>
          <Route path="/" element={<QuizList />} />
          <Route path="/quiz/:id" element={<QuizPlayer />} />
          <Route path="/result/:id" element={<ResultDashboard />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
