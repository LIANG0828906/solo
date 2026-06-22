import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import QuizPage from './pages/QuizPage';

const NavBar: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';
  const isQuiz = location.pathname === '/quiz';

  return (
    <nav
      style={{
        background: '#fff',
        borderBottom: '1px solid #F3F4F6',
        padding: '14px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Q
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>
              智能测验平台
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>Quiz & Smart Analysis</div>
          </div>
        </Link>

        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            to="/quiz"
            style={{
              padding: '9px 20px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isQuiz ? 600 : 500,
              background: isQuiz ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'transparent',
              color: isQuiz ? '#fff' : '#374151',
              transition: 'all 0.2s',
            }}
          >
            🎓 学生端
          </Link>
          <Link
            to="/admin"
            style={{
              padding: '9px 20px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isAdmin ? 600 : 500,
              background: isAdmin ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'transparent',
              color: isAdmin ? '#fff' : '#374151',
              transition: 'all 0.2s',
            }}
          >
            👨‍🏫 教师端
          </Link>
        </div>
      </div>
    </nav>
  );
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div
          style={{
            display: 'inline-block',
            padding: '6px 18px',
            borderRadius: 999,
            background: '#EEF2FF',
            color: '#6366F1',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          ✨ 智能随堂测验 & 错题解析
        </div>
        <h1
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: '#111827',
            margin: '0 0 16px 0',
            lineHeight: 1.2,
            letterSpacing: '-0.5px',
          }}
        >
          让每一次练习<br />都成为<span style={{ color: '#8B5CF6' }}>高效进步</span>的阶梯
        </h1>
        <p style={{ fontSize: 17, color: '#6B7280', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
          教师快速创建题目，学生随机抽题测验，系统自动批改，生成个性化错题解析与知识点雷达图，助力精准复习。
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: 56,
        }}
      >
        <div
          onClick={() => navigate('/quiz')}
          style={{
            flex: 1,
            minWidth: 280,
            maxWidth: 420,
            background: '#F9FAFB',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            transition: 'all 0.3s',
            border: '2px solid transparent',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
            (e.currentTarget as HTMLDivElement).style.borderColor = '#8B5CF6';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 28px rgba(99,102,241,0.15)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              marginBottom: 20,
            }}
          >
            🎓
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>
            开始随堂测验
          </h3>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
            随机抽取5道精选题目（选择 + 判断），答题后即时获取批改结果与错题解析。
          </p>
          <div style={{ marginTop: 20, color: '#8B5CF6', fontSize: 14, fontWeight: 600 }}>
            进入学生端 →
          </div>
        </div>

        <div
          onClick={() => navigate('/admin')}
          style={{
            flex: 1,
            minWidth: 280,
            maxWidth: 420,
            background: '#F9FAFB',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            transition: 'all 0.3s',
            border: '2px solid transparent',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
            (e.currentTarget as HTMLDivElement).style.borderColor = '#8B5CF6';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 28px rgba(99,102,241,0.15)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              marginBottom: 20,
            }}
          >
            👨‍🏫
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>
            教师管理后台
          </h3>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
            灵活创建选择题与判断题，自定义知识点标签，轻松管理题库。
          </p>
          <div style={{ marginTop: 20, color: '#8B5CF6', fontSize: 14, fontWeight: 600 }}>
            进入教师端 →
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 20,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {[
          { icon: '⚡', title: '即时批改', desc: '提交后毫秒级响应，<800ms出结果' },
          { icon: '🎯', title: '错题解析', desc: '针对性知识点讲解，举一反三' },
          { icon: '📊', title: '雷达图', desc: '直观呈现薄弱知识点分布' },
          { icon: '📱', title: '移动适配', desc: '单列布局，手机也能流畅作答' },
        ].map((f) => (
          <div
            key={f.title}
            style={{
              minWidth: 180,
              textAlign: 'center',
              padding: '20px 16px',
              borderRadius: 12,
              background: '#fff',
              border: '1px solid #F3F4F6',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{f.title}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/quiz" element={<QuizPage onBackHome={() => (window.location.hash = '') || (window.location.href = '/')} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
