import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { BookPanel } from './components/BookPanel';
import { BookDetail } from './components/BookDetail';
import { StatsDashboard } from './components/Charts/StatsDashboard';
import { CalendarHeatmap } from './components/Charts/CalendarHeatmap';
import { Toast } from './components/Toast';
import { useReadingStore } from './stores/readingStore';

function App() {
  const { isPanelCollapsed, books } = useReadingStore();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [prevBooksCount, setPrevBooksCount] = useState(books.length);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (books.length > prevBooksCount) {
      showToast('书籍添加成功');
    }
    setPrevBooksCount(books.length);
  }, [books.length, prevBooksCount]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleAddSession = () => {
    showToast('阅读记录已添加');
  };

  return (
    <div className="min-h-screen bg-primary text-white">
      {isMobile && (
        <div className="bg-primary-dark p-4 flex items-center justify-between border-b border-primary-card">
          <div className="flex items-center gap-2">
            <BookOpen className="text-accent" size={24} />
            <h1 className="text-lg font-bold">阅读洞察仪</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-accent rounded-lg text-white"
          >
            <span className="text-sm">书架</span>
          </button>
        </div>
      )}

      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute top-0 left-0 bottom-0 w-[250px] bg-primary-dark animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <BookPanel />
          </div>
        </div>
      )}

      <div className="flex h-screen p-4 gap-4">
        {!isMobile && <BookPanel />}

        <div className="flex-1 flex flex-col gap-4 overflow-hidden min-w-0">
          {!isMobile && (
            <div className="bg-primary-card rounded-lg p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <BookOpen className="text-accent" size={20} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">阅读洞察仪</h1>
                  <p className="text-text-secondary text-xs">追踪你的阅读习惯，发现更好的自己</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <p className="text-accent font-bold text-lg">{books.length}</p>
                  <p className="text-text-secondary text-xs">在读书籍</p>
                </div>
                <div className="w-px h-10 bg-primary-dark" />
                <div className="text-right">
                  <p className="text-accent-teal font-bold text-lg">
                    {books.reduce((sum, b) => sum + b.sessions.length, 0)}
                  </p>
                  <p className="text-text-secondary text-xs">阅读会话</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <BookDetail onAddSession={handleAddSession} />

            <StatsDashboard />

            <CalendarHeatmap />
          </div>
        </div>
      </div>

      <Toast
        message={toastMessage}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </div>
  );
}

export default App;
