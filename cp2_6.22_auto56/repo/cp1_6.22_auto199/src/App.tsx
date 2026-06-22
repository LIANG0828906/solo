import { useState, useEffect } from 'react';
import ContentEditor from './pages/ContentEditor';
import Dashboard from './pages/Dashboard';
import type { Post } from './types';

type Page = 'editor' | 'dashboard';

const App = () => {
  const [currentPage, setCurrentPage] = useState<Page>('editor');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as Page;
    if (hash === 'editor' || hash === 'dashboard') {
      setCurrentPage(hash);
    }
  }, []);

  useEffect(() => {
    window.location.hash = currentPage;
  }, [currentPage]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
    if (page === 'dashboard') {
      fetchPosts();
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>加载中...</p>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>✏️</span>
          <span style={styles.logoText}>内容分发平台</span>
        </div>
        <div style={styles.navLinks}>
          <button
            style={{
              ...styles.navButton,
              ...(currentPage === 'editor' ? styles.navButtonActive : {}),
            }}
            onClick={() => navigateTo('editor')}
          >
            内容管理
          </button>
          <button
            style={{
              ...styles.navButton,
              ...(currentPage === 'dashboard' ? styles.navButtonActive : {}),
            }}
            onClick={() => navigateTo('dashboard')}
          >
            数据分析
          </button>
        </div>
      </nav>

      <main style={styles.main}>
        {currentPage === 'editor' ? (
          <ContentEditor
            posts={posts}
            onPostsUpdate={setPosts}
            onNavigate={() => navigateTo('dashboard')}
          />
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #E5E7EB',
    borderTopColor: '#3B82F6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: '14px',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 32px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #E5E7EB',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    fontSize: '24px',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1F2937',
  },
  navLinks: {
    display: 'flex',
    gap: '8px',
  },
  navButton: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#6B7280',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  navButtonActive: {
    backgroundColor: '#3B82F6',
    color: '#ffffff',
  },
  main: {
    flex: 1,
    overflow: 'hidden',
  },
};

export default App;
