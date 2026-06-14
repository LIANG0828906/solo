import { useState, useEffect } from 'react';
import BookList from './components/BookList';
import BorrowModal from './components/BorrowModal';

const App = () => {
  const [activeView, setActiveView] = useState<'books' | 'add'>('books');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('小说');
  const [coverUrl, setCoverUrl] = useState('');
  const [borrowModalBookId, setBorrowModalBookId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const categories = ['小说', '非虚构', '科技', '艺术', '儿童'];

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isbn, title, author, category, coverUrl }),
      });
      if (response.ok) {
        showToast('图书添加成功！');
        setIsbn('');
        setTitle('');
        setAuthor('');
        setCategory('小说');
        setCoverUrl('');
        setActiveView('books');
        setRefreshTrigger(prev => prev + 1);
      } else {
        showToast('添加失败，请检查输入');
      }
    } catch {
      showToast('网络错误，请稍后重试');
    }
  };

  const navItems = [
    { key: 'books', label: '图书列表', icon: '📚' },
    { key: 'add', label: '添加图书', icon: '➕' },
  ];

  const sidebarVisible = !isMobile || mobileMenuOpen;

  return (
    <div style={styles.app}>
      {isMobile && mobileMenuOpen && (
        <div style={styles.mobileOverlay} onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside style={{
        ...styles.sidebar,
        ...(isMobile ? styles.sidebarMobile : {}),
        ...(isMobile && mobileMenuOpen ? styles.sidebarMobileOpen : {}),
        ...(isMobile && !mobileMenuOpen ? styles.sidebarMobileClosed : {}),
      }}>
        <div style={styles.logo}>📖 图书管理</div>
        <nav style={styles.nav}>
          {navItems.map(item => (
            <button
              key={item.key}
              style={{
                ...styles.navItem,
                ...(activeView === item.key ? styles.navItemActive : {}),
              }}
              onClick={() => {
                setActiveView(item.key as 'books' | 'add');
                setMobileMenuOpen(false);
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main style={{
        ...styles.main,
        ...(isMobile ? styles.mainMobile : {}),
      }}>
        <header style={styles.header}>
          {isMobile && (
            <button
              style={styles.hamburger}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
          )}
          <h1 style={styles.headerTitle}>
            {activeView === 'books' ? '图书列表' : '添加新图书'}
          </h1>
        </header>

        <div style={styles.content}>
          {activeView === 'books' && (
            <BookList
              refreshTrigger={refreshTrigger}
              onBorrowClick={(bookId) => setBorrowModalBookId(bookId)}
              onReturnSuccess={() => {
                showToast('归还成功！');
                setRefreshTrigger(prev => prev + 1);
              }}
              showToast={showToast}
            />
          )}

          {activeView === 'add' && (
            <div style={styles.card}>
              <form onSubmit={handleAddBook} style={styles.form}>
                <div style={styles.formRow}>
                  <label style={styles.label}>ISBN *</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    required
                    placeholder="请输入ISBN"
                  />
                </div>
                <div style={styles.formRow}>
                  <label style={styles.label}>书名 *</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="请输入书名"
                  />
                </div>
                <div style={styles.formRow}>
                  <label style={styles.label}>作者 *</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    required
                    placeholder="请输入作者"
                  />
                </div>
                <div style={styles.formRow}>
                  <label style={styles.label}>分类 *</label>
                  <select
                    style={styles.input}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formRow}>
                  <label style={styles.label}>封面URL</label>
                  <input
                    type="url"
                    style={styles.input}
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="请输入封面图片URL（可选）"
                  />
                </div>
                <button type="submit" style={styles.submitButton}>
                  添加图书
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {borrowModalBookId && (
        <BorrowModal
          bookId={borrowModalBookId}
          onClose={() => setBorrowModalBookId(null)}
          onSuccess={() => {
            showToast('借阅登记成功！');
            setBorrowModalBookId(null);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}

      {toast.visible && (
        <div className="toast-notification" style={styles.toast}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  app: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  sidebar: {
    width: 240,
    background: '#1e293b',
    color: '#ffffff',
    padding: '20px 0',
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    transition: 'transform 0.3s ease-out',
  },
  sidebarMobile: {
    transform: 'translateX(-100%)',
  },
  sidebarMobileOpen: {
    transform: 'translateX(0)',
  },
  sidebarMobileClosed: {
    transform: 'translateX(-100%)',
  },
  mobileOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 99,
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    padding: '0 20px 30px',
    borderBottom: '1px solid #334155',
  },
  nav: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 20px',
    background: 'transparent',
    border: 'none',
    color: '#cbd5e1',
    fontSize: 15,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease-out',
  },
  navItemActive: {
    background: '#ffffff',
    color: '#000000',
    fontWeight: 500,
  },
  navIcon: {
    fontSize: 18,
  },
  main: {
    flex: 1,
    marginLeft: 240,
    background: '#f1f5f9',
    minHeight: '100vh',
  },
  mainMobile: {
    marginLeft: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '20px 28px',
    background: '#ffffff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  hamburger: {
    fontSize: 24,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    color: '#0f172a',
  },
  headerTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 600,
    color: '#0f172a',
  },
  content: {
    padding: 28,
  },
  card: {
    background: '#ffffff',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    padding: 28,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    maxWidth: 480,
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    color: '#334155',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s ease-out',
  },
  submitButton: {
    padding: '12px 24px',
    background: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  toast: {
    position: 'fixed',
    top: 24,
    right: 24,
    width: 280,
    background: '#22c55e',
    color: '#ffffff',
    padding: '14px 18px',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 200,
    fontSize: 14,
    animation: 'slideInRight 0.4s ease-out',
  },
};

export default App;
