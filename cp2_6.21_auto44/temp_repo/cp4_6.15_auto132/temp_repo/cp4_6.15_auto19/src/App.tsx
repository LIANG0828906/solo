import React, { useState, useEffect } from 'react';
import TripTracker from './TripTracker';
import StatsDashboard from './StatsDashboard';
import { TripRecord, Achievement } from './Types';
import {
  loadTrips,
  calculateAchievements,
  calculateTotalSaved,
  animateNumber,
} from './utils';

type Page = 'tracker' | 'dashboard';

const AnimatedNumber: React.FC<{ value: number; suffix?: string; decimals?: number }> = ({
  value,
  suffix = '',
  decimals = 0,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const cancel = animateNumber(0, value, 800, (v) => {
      setDisplayValue(v);
    });
    return cancel;
  }, [value]);

  return <span>{displayValue.toFixed(decimals)}{suffix}</span>;
};

const App: React.FC = () => {
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const savedTrips = loadTrips();
    setTrips(savedTrips);
  }, []);

  useEffect(() => {
    setAchievements(calculateAchievements(trips));
  }, [trips]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalSaved = calculateTotalSaved(trips);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const isMobile = windowWidth < 768;

  const handleTripsChange = (newTrips: TripRecord[]) => {
    setTrips(newTrips);
  };

  return (
    <div style={styles.app}>
      <nav style={styles.navbar}>
        <div style={styles.navbarInner}>
          <div style={styles.navbarLeft}>
            <div style={styles.logo}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"
                  fill="#fff"
                />
              </svg>
              <span style={styles.logoText}>低碳足迹</span>
            </div>
          </div>

          {!isMobile && (
            <div style={styles.navbarCenter}>
              <button
                style={{
                  ...styles.navButton,
                  ...(currentPage === 'dashboard' ? styles.navButtonActive : {}),
                }}
                onClick={() => setCurrentPage('dashboard')}
              >
                📊 数据看板
              </button>
              <button
                style={{
                  ...styles.navButton,
                  ...(currentPage === 'tracker' ? styles.navButtonActive : {}),
                }}
                onClick={() => setCurrentPage('tracker')}
              >
                ✏️ 记录出行
              </button>
            </div>
          )}

          <div style={styles.navbarRight}>
            <div style={styles.navStat}>
              <span style={styles.navStatIcon}>🌿</span>
              <div style={styles.navStatInfo}>
                <span style={styles.navStatLabel}>累计减碳</span>
                <span style={styles.navStatValue}>
                  <AnimatedNumber value={totalSaved / 1000} decimals={1} suffix=" kg" />
                </span>
              </div>
            </div>
            <div style={{ ...styles.navStat, marginLeft: 16 }}>
              <span style={styles.navStatIcon}>🏆</span>
              <div style={styles.navStatInfo}>
                <span style={styles.navStatLabel}>成就徽章</span>
                <span style={styles.navStatValue}>
                  {unlockedCount}/{achievements.length}
                </span>
              </div>
            </div>

            {isMobile && (
              <button
                style={styles.hamburgerButton}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <div style={{
                  ...styles.hamburgerLine,
                  transform: mobileMenuOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none',
                }} />
                <div style={{
                  ...styles.hamburgerLine,
                  opacity: mobileMenuOpen ? 0 : 1,
                }} />
                <div style={{
                  ...styles.hamburgerLine,
                  transform: mobileMenuOpen ? 'rotate(-45deg) translate(7px, -7px)' : 'none',
                }} />
              </button>
            )}
          </div>
        </div>

        {isMobile && (
          <div
            style={{
              ...styles.mobileMenu,
              maxHeight: mobileMenuOpen ? '200px' : '0px',
              opacity: mobileMenuOpen ? 1 : 0,
              pointerEvents: mobileMenuOpen ? 'auto' : 'none',
            }}
          >
            <button
              style={{
                ...styles.mobileNavButton,
                ...(currentPage === 'dashboard' ? styles.mobileNavButtonActive : {}),
              }}
              onClick={() => {
                setCurrentPage('dashboard');
                setMobileMenuOpen(false);
              }}
            >
              📊 数据看板
            </button>
            <button
              style={{
                ...styles.mobileNavButton,
                ...(currentPage === 'tracker' ? styles.mobileNavButtonActive : {}),
              }}
              onClick={() => {
                setCurrentPage('tracker');
                setMobileMenuOpen(false);
              }}
            >
              ✏️ 记录出行
            </button>
          </div>
        )}
      </nav>

      <main style={styles.main}>
        <div style={styles.content}>
          <div
            style={{
              ...styles.pageWrapper,
              animation: 'fadeIn 0.4s ease',
            }}
            key={currentPage}
          >
            {currentPage === 'tracker' ? (
              <TripTracker trips={trips} onTripsChange={handleTripsChange} />
            ) : (
              <StatsDashboard trips={trips} achievements={achievements} />
            )}
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .hide-on-mobile {
            display: none !important;
          }
        }
        @media (hover: hover) {
          button:hover {
            filter: brightness(1.05);
          }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-cream)',
  },
  navbar: {
    backgroundColor: 'var(--primary-green)',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    transition: 'var(--transition)',
  },
  navbarInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    transition: 'var(--transition)',
  },
  navbarLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
  },
  navbarCenter: {
    display: 'flex',
    gap: 8,
    transition: 'var(--transition)',
  },
  navButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: 'rgba(255, 255, 255, 0.8)',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'var(--transition)',
    fontFamily: 'inherit',
  },
  navButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#fff',
  },
  navbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    transition: 'var(--transition)',
  },
  navStat: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    transition: 'var(--transition)',
  },
  navStatIcon: {
    fontSize: 18,
  },
  navStatInfo: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.2,
  },
  navStatLabel: {
    fontSize: 10,
    opacity: 0.8,
  },
  navStatValue: {
    fontSize: 13,
    fontWeight: 600,
  },
  hamburgerButton: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    backgroundColor: 'transparent',
    border: 'none',
    padding: 8,
    cursor: 'pointer',
    marginLeft: 12,
  },
  hamburgerLine: {
    width: 22,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 2,
    transition: 'var(--transition)',
  },
  mobileMenu: {
    overflow: 'hidden',
    transition: 'max-height 0.3s ease, opacity 0.3s ease',
    backgroundColor: 'var(--primary-green-dark)',
  },
  mobileNavButton: {
    display: 'block',
    width: '100%',
    padding: '14px 24px',
    backgroundColor: 'transparent',
    color: 'rgba(255, 255, 255, 0.8)',
    border: 'none',
    textAlign: 'left',
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'var(--transition)',
    fontFamily: 'inherit',
  },
  mobileNavButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#fff',
  },
  main: {
    flex: 1,
    transition: 'var(--transition)',
  },
  content: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '24px',
    transition: 'var(--transition)',
  },
  pageWrapper: {
    transition: 'var(--transition)',
  },
};

export default App;
