import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Mic, BarChart3, Menu, X, Radio } from 'lucide-react';
import EditorPage from '@/pages/EditorPage';
import AnalyzePage from '@/pages/AnalyzePage';
import { useScriptStore } from '@/store/scriptStore';

const App = () => {
  const location = useLocation();
  const isInitialized = useScriptStore(s => s.isInitialized);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isInitialized) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-primary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48,
            border: '3px solid var(--color-accent)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }} />
          <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
            Loading Studio...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const isEditorActive = location.pathname === '/' || location.pathname === '/editor' || isDesktop;
  const isAnalyzeActive = location.pathname === '/analyze' || isDesktop;

  const NavTabs = () => (
    <nav style={{
      display: 'flex',
      gap: 4,
      padding: 4,
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
    }}>
      {!isDesktop && (
        <>
          <Link
            to="/editor"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 'var(--radius-sm)',
              textDecoration: 'none', fontSize: 14, fontWeight: 500,
              color: isEditorActive ? '#fff' : 'var(--color-text-secondary)',
              background: isEditorActive ? 'var(--color-accent)' : 'transparent',
              transition: 'var(--transition-base)',
            }}
          >
            <Mic size={16} />
            <span>脚本编辑器</span>
          </Link>
          <Link
            to="/analyze"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 'var(--radius-sm)',
              textDecoration: 'none', fontSize: 14, fontWeight: 500,
              color: isAnalyzeActive ? '#fff' : 'var(--color-text-secondary)',
              background: isAnalyzeActive ? 'var(--color-accent)' : 'transparent',
              transition: 'var(--transition-base)',
            }}
          >
            <BarChart3 size={16} />
            <span>录音分析</span>
          </Link>
        </>
      )}
      {isDesktop && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 18px',
          color: 'var(--color-text-muted)', fontSize: 13,
          fontFamily: 'var(--font-mono)',
        }}>
          <span style={{ opacity: 0.7 }}>双屏模式</span>
        </div>
      )}
    </nav>
  );

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'blur(20px)',
        background: 'rgba(26, 26, 46, 0.85)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{
          maxWidth: 1800, margin: '0 auto',
          padding: '16px 24px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 24,
        }}>
          <Link to="/" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            textDecoration: 'none', color: '#fff',
          }}>
            <div style={{
              width: 40, height: 40,
              background: 'linear-gradient(135deg, var(--color-accent) 0%, #9B87F5 100%)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-glow-accent)',
            }}>
              <Radio size={20} />
            </div>
            <div>
              <div style={{
                fontSize: 18, fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-0.02em',
              }}>
                Podcast<span style={{ color: 'var(--color-accent)' }}>Studio</span>
              </div>
              <div style={{
                fontSize: 11, color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)',
                marginTop: 2,
              }}>
                SCRIPT · TIMELINE · ANALYZE
              </div>
            </div>
          </Link>

          {!isDesktop && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                padding: 10, borderRadius: 'var(--radius-sm)',
                background: 'transparent', border: '1px solid var(--color-border)',
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          {isDesktop && <NavTabs />}
        </div>

        {!isDesktop && mobileMenuOpen && (
          <div style={{
            padding: '0 24px 16px',
            borderTop: '1px solid var(--color-border-light)',
            paddingTop: 16,
          }}>
            <NavTabs />
          </div>
        )}
      </header>

      <main style={{
        flex: 1,
        maxWidth: 1800,
        width: '100%',
        margin: '0 auto',
        padding: isDesktop ? '24px' : '16px',
      }}>
        {isDesktop ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '6fr 4fr',
            gap: 24,
            height: 'calc(100vh - 120px)',
          }}>
            <section style={{
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(233,69,96,0.05)',
              }}>
                <Mic size={18} style={{ color: 'var(--color-accent)' }} />
                <span style={{ fontWeight: 600, fontSize: 15 }}>脚本编辑器</span>
                <div style={{
                  marginLeft: 'auto',
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                  padding: '4px 10px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 999,
                }}>
                  LEFT PANEL · 60%
                </div>
              </div>
              <EditorPage embedded />
            </section>

            <section style={{
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(155,135,245,0.05)',
              }}>
                <BarChart3 size={18} style={{ color: '#9B87F5' }} />
                <span style={{ fontWeight: 600, fontSize: 15 }}>录音分析</span>
                <div style={{
                  marginLeft: 'auto',
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                  padding: '4px 10px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 999,
                }}>
                  RIGHT PANEL · 40%
                </div>
              </div>
              <AnalyzePage embedded />
            </section>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Navigate to="/editor" replace />} />
            <Route path="/editor" element={<EditorPage />} />
            <Route path="/analyze" element={<AnalyzePage />} />
            <Route path="*" element={<Navigate to="/editor" replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
};

export default App;
