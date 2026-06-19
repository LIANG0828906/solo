import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate, useParams } from 'react-router-dom';
import { Menu, X, ChevronDown, BookOpen, Sparkles, Feather } from 'lucide-react';
import clsx from 'clsx';
import Editor from './editor/Editor';
import InspirationBoard from './community/InspirationBoard';
import Portfolio from './community/Portfolio';
import Home from './pages/Home';
import { setupMockApi } from './utils/mockApi';
import { seedStore } from './utils/mockData';
import { useStore } from './store';
import { playClickSound } from './utils/audio';

function EditorPage() {
  const { poemId } = useParams<{ poemId?: string }>();
  const poems = useStore((s) => s.poems);
  const currentUser = useStore((s) => s.currentUser);
  const currentPoem = useStore((s) => s.currentPoem);
  const setCurrentPoem = useStore((s) => s.setCurrentPoem);
  const navigate = useNavigate();

  useEffect(() => {
    if (poemId) {
      const poem = poems.find((p) => p.id === poemId);
      if (poem) {
        if (!currentPoem || currentPoem.id !== poemId) {
          setCurrentPoem(poem);
        }
      }
    } else {
      if (!currentPoem) {
        if (poems.length > 0) {
          setCurrentPoem(poems[0]);
          navigate(`/editor/${poems[0].id}`, { replace: true });
        }
      } else {
        navigate(`/editor/${currentPoem.id}`, { replace: true });
      }
    }
  }, [poemId, poems, currentPoem, setCurrentPoem, currentUser.id, navigate]);

  return <Editor />;
}

function NavBar() {
  const currentUser = useStore((s) => s.currentUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const navLinks = [
    { to: '/portfolio', label: '作品集', icon: BookOpen },
    { to: '/editor', label: '编辑', icon: Feather },
    { to: '/inspiration', label: '灵感板', icon: Sparkles },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-bark-500 ink-brush-shadow border-b border-bark-600">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavLink
            to="/"
            onClick={() => { playClickSound(); }}
            className="flex items-center gap-2 font-wenkai text-rice-100 text-xl font-bold tracking-wider hover:text-rice-50 transition-colors"
          >
            <span className="text-2xl">詩</span>
            <span>诗韵坊</span>
          </NavLink>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => { playClickSound(); }}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-serif transition-all',
                    isActive
                      ? 'bg-bark-400 text-rice-50'
                      : 'text-rice-200 hover:bg-bark-400/60 hover:text-rice-50'
                  )
                }
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden md:block relative">
            <button
              onClick={() => { playClickSound(); setUserDropdownOpen((v) => !v); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bark-400/60 hover:bg-bark-400 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-rice-100 flex items-center justify-center text-bark-500 text-xs font-bold">
                {currentUser.name.charAt(0)}
              </div>
              <span className="text-rice-100 text-sm font-serif">{currentUser.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-rice-200" />
            </button>
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg bg-rice-50 border border-rice-300 shadow-xl animate-bubble-expand overflow-hidden">
                <div className="px-4 py-3 border-b border-rice-200">
                  <p className="text-sm font-medium text-ink-500">{currentUser.name}</p>
                  <p className="text-xs text-ink-200">{currentUser.email}</p>
                </div>
                <button
                  onClick={() => { playClickSound(); setUserDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-ink-400 hover:bg-rice-100 font-serif transition-colors"
                >
                  个人设置
                </button>
                <button
                  onClick={() => { playClickSound(); setUserDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-serif transition-colors"
                >
                  退出登录
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => { playClickSound(); setMenuOpen((v) => !v); }}
            className="md:hidden p-2 rounded-lg text-rice-100 hover:bg-bark-400 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && isMobile && (
          <div className="md:hidden pb-4 space-y-1 animate-fade-in-up">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => { playClickSound(); setMenuOpen(false); }}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-serif transition-colors',
                    isActive
                      ? 'bg-bark-400 text-rice-50'
                      : 'text-rice-200 hover:bg-bark-400/60 hover:text-rice-50'
                  )
                }
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </NavLink>
            ))}
            <div className="flex items-center gap-2 px-4 py-3 mt-2 rounded-lg bg-bark-400/40">
              <div className="w-8 h-8 rounded-full bg-rice-100 flex items-center justify-center text-bark-500 text-sm font-bold">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-rice-50">{currentUser.name}</p>
                <p className="text-xs text-rice-300">{currentUser.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  useEffect(() => {
    setupMockApi();
    seedStore(useStore);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-rice-200 flex flex-col">
        <NavBar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/portfolio/:collectionId" element={<Portfolio />} />
            <Route path="/editor" element={<EditorPage />} />
            <Route path="/editor/:poemId" element={<EditorPage />} />
            <Route path="/inspiration" element={<InspirationBoard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
