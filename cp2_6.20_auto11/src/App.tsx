import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import GenerateModule from '@/generateModule';
import QuizModule from '@/quizModule';
import { useQuizStore } from '@/hooks/useQuizStore';
import { useRipple } from '@/hooks/useRipple';
import { Sparkles, BookMarked, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function App() {
  const loadFromStorage = useQuizStore((s) => s.loadFromStorage);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const genRipple = useRipple('nav-generate');
  const quizRipple = useRipple('nav-quiz');
  const menuRipple = useRipple('mobile-menu');

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <Router>
      <div className="app-layout">
        <header className="app-header">
          <div className="header-left">
            <div className="logo">
              <Sparkles size={24} />
              <span className="logo-text">智能练习题生成器</span>
            </div>
          </div>
          <nav className="header-nav">
            <NavLink
              to="/"
              className={({ isActive }) => `nav-link ripple-container ${isActive ? 'nav-active' : ''}`}
              onClick={(e) => {
                genRipple.onClick(e);
                setMobileMenuOpen(false);
              }}
            >
              <Sparkles size={16} />
              生成题目
              {genRipple.rippleElements}
            </NavLink>
            <NavLink
              to="/quiz"
              className={({ isActive }) => `nav-link ripple-container ${isActive ? 'nav-active' : ''}`}
              onClick={(e) => {
                quizRipple.onClick(e);
                setMobileMenuOpen(false);
              }}
            >
              <BookMarked size={16} />
              题库
              {quizRipple.rippleElements}
            </NavLink>
          </nav>
          <button
            className="mobile-menu-btn ripple-container"
            onClick={(e) => {
              menuRipple.onClick(e);
              setMobileMenuOpen(!mobileMenuOpen);
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            {menuRipple.rippleElements}
          </button>
        </header>

        {mobileMenuOpen && (
          <div className="mobile-nav">
            <NavLink to="/" className="mobile-nav-link ripple-container" onClick={(e) => { genRipple.onClick(e); setMobileMenuOpen(false); }}>
              <Sparkles size={16} />
              生成题目
              {genRipple.rippleElements}
            </NavLink>
            <NavLink to="/quiz" className="mobile-nav-link ripple-container" onClick={(e) => { quizRipple.onClick(e); setMobileMenuOpen(false); }}>
              <BookMarked size={16} />
              题库
              {quizRipple.rippleElements}
            </NavLink>
          </div>
        )}

        <main className="app-main">
          <Routes>
            <Route path="/" element={<GenerateModule />} />
            <Route path="/quiz" element={<QuizModule />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
