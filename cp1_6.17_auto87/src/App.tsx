import { useEffect, useRef, useState } from 'react';
import { Router, type RouteComponent, type RouteTable } from '@/modules/router';
import { snapshotManager } from '@/modules/snapshot';
import { useAppStore } from '@/store';
import { PageA } from '@/pages/PageA';
import { PageB } from '@/pages/PageB';

const routeTable: RouteTable = new Map<string, RouteComponent>([
  ['/#/pageA', () => <PageA />],
  ['/#/pageB', () => <PageB />],
]);

const pageNameMap: Record<string, string> = {
  '/#/pageA': '页面A',
  '/#/pageB': '页面B',
};

function NavButton({
  label,
  hash,
  currentHash,
  onClick,
}: {
  label: string;
  hash: string;
  currentHash: string;
  onClick: () => void;
}) {
  const isActive = currentHash === hash;
  return (
    <button
      onClick={onClick}
      style={{
        background: isActive ? '#F39C12' : '#F39C12',
        color: 'white',
        border: 'none',
        padding: '10px 22px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background-color 0.2s ease, transform 0.15s',
        filter: isActive ? 'brightness(1)' : 'brightness(1)',
        boxShadow: isActive ? 'inset 0 2px 4px rgba(0,0,0,0.15)' : 'none',
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLButtonElement).style.background = '#E67E22';
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLButtonElement).style.background = isActive ? '#F39C12' : '#F39C12';
      }}
      onMouseDown={(e) => {
        (e.target as HTMLButtonElement).style.transform = 'scale(0.96)';
      }}
      onMouseUp={(e) => {
        (e.target as HTMLButtonElement).style.transform = 'scale(1)';
      }}
    >
      {label}
    </button>
  );
}

function SettingsPanel({
  autoSaveEnabled,
  onToggleAutoSave,
  onClearSnapshots,
  autoSaveGray,
}: {
  autoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
  onClearSnapshots: () => void;
  autoSaveGray: boolean;
}) {
  return (
    <div
      style={{
      position: 'absolute',
      top: '60px',
      right: '16px',
      background: '#FFFFFF',
      boxShadow: '0 4px 16px #00000015',
      borderRadius: '8px',
      padding: '16px',
      minWidth: '200px',
      zIndex: 100,
      opacity: autoSaveGray && !autoSaveEnabled ? '0.7' : '1',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <span style={{ fontSize: '14px', color: '#2C3E50', fontWeight: 500 }}>
          启用自动保存
        </span>
        <label
          style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}
        >
          <input
            type="checkbox"
            checked={autoSaveEnabled}
            onChange={onToggleAutoSave}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span
            style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: autoSaveEnabled ? '#3498DB' : '#BDC3C7',
              transition: '0.3s',
              borderRadius: '24px',
            }}
          >
            <span
              style={{
                position: 'absolute',
                content: '',
                height: '18px',
                width: '18px',
                left: '3px',
                bottom: '3px',
                backgroundColor: 'white',
                transition: '0.3s',
                borderRadius: '50%',
                transform: autoSaveEnabled ? 'translateX(20px)' : 'translateX(0)',
              }}
            />
          </span>
        </label>
      </div>
      <button
        onClick={onClearSnapshots}
        style={{
          width: '100%',
          background: '#E74C3C',
          color: 'white',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.background = '#C0392B';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.background = '#E74C3C';
        }}
      >
        清除所有快照
      </button>
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        left: '24px',
        background: '#27AE60',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1000,
        animation: 'toastSlideIn 0.4s ease-out',
      }}
    >
      {message}
    </div>
  );
}

export function App() {
  const {
    currentHash,
    currentComponent,
    autoSaveEnabled,
    showSettings,
    toastMessage,
    mobileMenuOpen,
    setCurrentRoute,
    setAutoSaveEnabled,
    setShowSettings,
    showToast,
    hideToast,
    setMobileMenuOpen,
  } = useAppStore();

  const routerRef = useRef<Router | null>(null);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const router = new Router(routeTable);
    routerRef.current = router;

    const unsubscribe = router.subscribe((hash, component, isRestored) => {
      if (pageContainerRef.current) {
        router.setContainer(pageContainerRef.current);
        if (isRestored && autoSaveEnabled) {
          setTimeout(() => {
            if (pageContainerRef.current) {
              snapshotManager.restoreState(hash, pageContainerRef.current);
            }
            const name = pageNameMap[hash] || hash;
            showToast(`已从快照恢复 ${name} 的状态`);
            setTimeout(() => hideToast(), 3000);
          }, 50);
        }
      }
      setCurrentRoute(hash, component, isRestored);
      setAnimationKey((k) => k + 1);
    });

    router.start();

    return () => {
      unsubscribe();
      router.stop();
    };
  }, [autoSaveEnabled, setCurrentRoute, showToast, hideToast]);

  useEffect(() => {
    snapshotManager.setAutoSaveEnabled(autoSaveEnabled);
  }, [autoSaveEnabled]);

  const handleNavigate = async (hash: string) => {
    if (routerRef.current) {
      await routerRef.current.navigate(hash);
    }
    setMobileMenuOpen(false);
  };

  const handleToggleAutoSave = () => {
    setAutoSaveEnabled(!autoSaveEnabled);
  };

  const handleClearSnapshots = () => {
    setShowConfirmDialog(true);
    setShowSettings(false);
  };

  const confirmClearSnapshots = () => {
    snapshotManager.clearAllSnapshots();
    setShowConfirmDialog(false);
    window.location.reload();
  };

  const cancelClearSnapshots = () => {
    setShowConfirmDialog(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes pageSlideIn {
          from {
            opacity: 0;
            transform: translateX(60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .hamburger-btn {
            display: flex !important;
          }
          .mobile-menu {
            display: flex !important;
          }
        }
      `}</style>

      <header
        style={{
          height: '60px',
          background: '#34495E',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div
          className="desktop-nav"
          style={{
            display: 'flex',
            gap: '12px',
          }}
        >
          <NavButton label="页面A" hash="/#/pageA" currentHash={currentHash} onClick={() => handleNavigate('/#/pageA')} />
          <NavButton label="页面B" hash="/#/pageB" currentHash={currentHash} onClick={() => handleNavigate('/#/pageB')} />
        </div>

        <button
          className="hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
          }}
        >
          ☰
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '22px',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = 'none';
            }}
          >
            ⚙
          </button>
          {showSettings && (
            <SettingsPanel
              autoSaveEnabled={autoSaveEnabled}
              onToggleAutoSave={handleToggleAutoSave}
              onClearSnapshots={handleClearSnapshots}
              autoSaveGray={true}
            />
          )}
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className="mobile-menu"
          style={{
            display: 'none',
            flexDirection: 'column',
            gap: '8px',
            background: '#34495E',
            padding: '12px 24px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          }}
        >
          <NavButton label="页面A" hash="/#/pageA" currentHash={currentHash} onClick={() => handleNavigate('/#/pageA')} />
          <NavButton label="页面B" hash="/#/pageB" currentHash={currentHash} onClick={() => handleNavigate('/#/pageB')} />
        </div>
      )}

      <main
        style={{
          padding: '24px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div
          key={animationKey}
          ref={pageContainerRef}
          style={{
            animation: 'pageSlideIn 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          {currentComponent ? currentComponent() : <PageA />}
        </div>
      </main>

      {toastMessage && <Toast message={toastMessage} />}

      {showConfirmDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              minWidth: '320px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ color: '#2C3E50', fontSize: '18px', margin: '0 0 12px 0' }}>
              确认清除
            </h3>
            <p style={{ color: '#34495E', fontSize: '14px', margin: '0 0 20px 0', lineHeight: 1.6 }}>
              确定要清除所有快照吗？此操作不可撤销，所有已保存的页面状态将全部丢失。
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={cancelClearSnapshots}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid #BDC3C7',
                  background: 'white',
                  color: '#34495E',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.background = '#F8F9FA';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.background = 'white';
                }}
              >
                取消
              </button>
              <button
                onClick={confirmClearSnapshots}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#E74C3C',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.background = '#C0392B';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.background = '#E74C3C';
                }}
              >
                确认清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
