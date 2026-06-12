import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import TimelineCard from './TimelineCard';
import type { TravelEntry } from './types';

const Timeline = () => {
  const [entries, setEntries] = useState<TravelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const location = useLocation();

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/entries');
      setEntries(res.data.sort((a: TravelEntry, b: TravelEntry) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ));
    } catch (err) {
      console.error('获取游记失败:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    const state = location.state as { newEntryId?: string } | null;
    if (state?.newEntryId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`card-${state.newEntryId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.state, entries]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fef9ef 0%, #faf3e6 100%)',
        padding: '40px 20px 100px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <header
          style={{
            textAlign: 'center',
            padding: '60px 20px 80px',
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: '#d4a96e',
              fontSize: '14px',
              letterSpacing: '3px',
              marginBottom: '16px',
            }}
          >
            ✦ TRAVEL JOURNAL ✦
          </div>
          <h1
            style={{
              fontFamily: "'Noto Serif SC', serif",
              color: '#8b6f47',
              fontSize: '48px',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            旅行时光轴
          </h1>
          <p
            style={{
              color: '#a08868',
              fontSize: '16px',
              fontFamily: "'Noto Serif SC', serif",
              marginBottom: '40px',
            }}
          >
            记录每一段旅程，珍藏每一刻回忆
          </p>
          <Link
            to="/add"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 40px',
              background: 'linear-gradient(135deg, #e8c38a 0%, #d4a96e 100%)',
              color: '#5a4a3a',
              border: 'none',
              borderRadius: '50px',
              fontSize: '16px',
              fontWeight: 600,
              fontFamily: "'Noto Serif SC', serif",
              cursor: 'pointer',
              textDecoration: 'none',
              boxShadow: '0 4px 15px rgba(212,169,110,0.3)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                '0 8px 25px rgba(212,169,110,0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.filter = 'brightness(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                '0 4px 15px rgba(212,169,110,0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.filter = 'brightness(1)';
            }}
          >
            <span style={{ fontSize: '20px' }}>+</span>
            添加新游记
          </Link>
        </header>

        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '100px 20px',
              color: '#a08868',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid #e0b88a',
                borderTop: '3px solid #d4a96e',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 20px',
              }}
            />
            正在加载时光轴...
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : entries.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              border: '2px dashed rgba(180,140,100,0.3)',
              borderRadius: '16px',
              background: 'rgba(254,249,239,0.5)',
            }}
          >
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>
              🧳
            </div>
            <h3
              style={{
                fontFamily: "'Noto Serif SC', serif",
                color: '#8b6f47',
                fontSize: '22px',
                marginBottom: '10px',
              }}
            >
              还没有游记哦
            </h3>
            <p
              style={{
                color: '#a08868',
                fontSize: '15px',
                marginBottom: '24px',
              }}
            >
              点击上方"添加新游记"按钮，开始记录你的第一段旅程吧！
            </p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '1.5px',
                height: '100%',
                background: '#e0b88a',
                top: 0,
              }}
            />
            {entries.map((entry, index) => (
              <TimelineCard
                key={entry.id}
                entry={entry}
                index={index}
                isNew={
                  (location.state as { newEntryId?: string } | null)
                    ?.newEntryId === entry.id
                }
              />
            ))}
            <div style={{ clear: 'both' }} />
          </div>
        )}
      </div>

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '40px',
            right: '40px',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(139,111,71,0.75)',
            color: '#fef9ef',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(139,111,71,0.3)',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.3s ease',
            zIndex: 999,
            animation: 'fadeInBtn 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(139,111,71,0.95)';
            e.currentTarget.style.transform = 'translateY(-3px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(139,111,71,0.75)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ↑
          <style>{`
            @keyframes fadeInBtn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </button>
      )}
    </div>
  );
};

export default Timeline;
