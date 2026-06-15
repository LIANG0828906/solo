import { useState, useEffect } from 'react';
import type { PageType, Venue, TourDate } from './types';
import CalendarView from './CalendarView';
import VenueCard from './VenueCard';
import RouteMap from './RouteMap';
import PosterGenerator from './PosterGenerator';

const navItems: { key: PageType; label: string; icon: JSX.Element }[] = [
  {
    key: 'calendar',
    label: '巡演日期',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    )
  },
  {
    key: 'venues',
    label: '场地管理',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M5 21V7l8-4v18" />
        <path d="M19 21V11l-6-4" />
      </svg>
    )
  },
  {
    key: 'route',
    label: '路线规划',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5.5" cy="17.5" r="2.5" />
        <circle cx="18.5" cy="5.5" r="2.5" />
        <path d="M13.5 6.5H18V11" />
        <path d="M10.5 17.5H6V13" />
        <path d="M18 6.5l-7 7-5 5" />
      </svg>
    )
  },
  {
    key: 'poster',
    label: '海报生成',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    )
  }
];

export default function App() {
  const [activePage, setActivePage] = useState<PageType>('calendar');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [tourDates, setTourDates] = useState<TourDate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [venuesRes, datesRes] = await Promise.all([
          fetch('/api/venues'),
          fetch('/api/tour-dates')
        ]);
        const [venuesData, datesData] = await Promise.all([
          venuesRes.json(),
          datesRes.json()
        ]);
        setVenues(venuesData);
        setTourDates(datesData);
      } catch (e) {
        console.error('Failed to load data:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a2e',
        color: '#ffbf66',
        fontSize: 20,
        fontWeight: 600
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 40, height: 40,
            border: '3px solid #2d2d44',
            borderTopColor: '#ffbf66',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            willChange: 'transform',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }} />
          <span>加载中...</span>
          <style>{`
            @keyframes spin {
              to { transform: translateZ(0) rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  const activeIndex = navItems.findIndex(item => item.key === activePage);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <aside style={{
        width: 200,
        minWidth: 200,
        height: '100%',
        background: 'linear-gradient(180deg, #0f0f23 0%, #16213e 50%, #1a1a40 100%)',
        position: 'relative',
        boxShadow: '2px 0 20px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '28px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #ffbf66, #ff9a3c)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              boxShadow: '0 4px 12px rgba(255,191,102,0.3)'
            }}>
              🎸
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: 0.5 }}>
                Tour Manager
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
                独立乐队巡演系统
              </div>
            </div>
          </div>
        </div>

        <nav style={{
          padding: '16px 0',
          flex: 1,
          position: 'relative'
        }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: activeIndex * 68 + 16,
              width: 3,
              height: 52,
              background: 'linear-gradient(180deg, #ffbf66, #ff9a3c)',
              borderRadius: '0 3px 3px 0',
              transition: 'top 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 0 10px rgba(255,191,102,0.6)',
              willChange: 'top, transform',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
          />
          {navItems.map((item) => {
            const isActive = activePage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActivePage(item.key)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 20px 16px 28px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: isActive ? '#ffbf66' : 'rgba(255,255,255,0.55)',
                  transition: 'color 0.25s ease, padding-left 0.25s ease',
                  position: 'relative',
                  outline: 'none',
                  willChange: 'transform, color',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)';
                    (e.currentTarget as HTMLElement).style.paddingLeft = '34px';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)';
                    (e.currentTarget as HTMLElement).style.paddingLeft = '28px';
                  }
                }}
              >
                <div style={{
                  width: 40, height: 40,
                  borderRadius: '50%',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(255,191,102,0.2), rgba(255,154,60,0.15))'
                    : 'rgba(255,255,255,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ width: 22, height: 22 }}>{item.icon}</div>
                </div>
                <span style={{
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: 0.5
                }}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{
          padding: 16,
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 10,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 10
          }}>
            <div style={{
              width: 34, height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13
            }}>
              乐
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>乐队成员</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                member@band.com
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main style={{
        flex: 1,
        height: '100%',
        background: '#1a1a2e',
        overflow: 'auto'
      }}>
        <div style={{
          animation: 'fadeIn 0.3s ease both',
          willChange: 'opacity, transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}>
          {activePage === 'calendar' && (
            <CalendarView venues={venues} tourDates={tourDates} setTourDates={setTourDates} />
          )}
          {activePage === 'venues' && (
            <VenueCard venues={venues} setVenues={setVenues} />
          )}
          {activePage === 'route' && (
            <RouteMap venues={venues} tourDates={tourDates} />
          )}
          {activePage === 'poster' && (
            <PosterGenerator tourDates={tourDates} venues={venues} />
          )}
        </div>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateZ(0) translateY(6px); }
            to { opacity: 1; transform: translateZ(0) translateY(0); }
          }
          *, *::before, *::after {
            box-sizing: border-box;
          }
          .sidebar-indicator, .nav-btn, .page-container {
            will-change: transform;
            backface-visibility: hidden;
          }
        `}</style>
      </main>
    </div>
  );
}
