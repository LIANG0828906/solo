import React, { useState, useEffect } from 'react';
import OkrBoard from './components/OkrBoard';
import PersonalView from './components/PersonalView';

type ViewType = 'board' | 'personal';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('board');
  const [currentMember, setCurrentMember] = useState<string>('');
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [memberRes, currentRes] = await Promise.all([
          fetch('/api/members'),
          fetch('/api/current-member'),
        ]);
        const m = await memberRes.json();
        const c = await currentRes.json();
        setMembers(m);
        setCurrentMember(c.name);
      } catch (e) {
        console.error('Failed to fetch init data', e);
      }
    };
    fetchInit();
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(108, 99, 255, 0.08)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 18,
            fontWeight: 700,
            color: '#2D2B55',
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6C63FF, #F50057)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 16,
            }}>
              ◎
            </div>
            OKR Board
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setView('board')}
              style={{
                position: 'relative',
                padding: '10px 20px',
                border: 'none',
                background: 'transparent',
                color: view === 'board' ? '#6C63FF' : '#6B6891',
                fontSize: 14,
                fontWeight: view === 'board' ? 600 : 500,
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
              }}
            >
              团队看板
              <span
                style={{
                  position: 'absolute',
                  bottom: 2,
                  left: '15%',
                  right: '15%',
                  height: 3,
                  borderRadius: 2,
                  background: '#6C63FF',
                  transform: view === 'board' ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'center',
                  transition: 'transform 0.3s ease-in-out',
                }}
              />
            </button>
            <button
              onClick={() => setView('personal')}
              style={{
                position: 'relative',
                padding: '10px 20px',
                border: 'none',
                background: 'transparent',
                color: view === 'personal' ? '#6C63FF' : '#6B6891',
                fontSize: 14,
                fontWeight: view === 'personal' ? 600 : 500,
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
              }}
            >
              个人视图
              <span
                style={{
                  position: 'absolute',
                  bottom: 2,
                  left: '15%',
                  right: '15%',
                  height: 3,
                  borderRadius: 2,
                  background: '#6C63FF',
                  transform: view === 'personal' ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'center',
                  transition: 'transform 0.3s ease-in-out',
                }}
              />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {members.length > 0 && (
            <select
              value={currentMember}
              onChange={(e) => setCurrentMember(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #E8E6FF',
                background: '#fff',
                color: '#2D2B55',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
                transition: 'border-color 0.3s ease-in-out',
              }}
            >
              {members.map(m => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
          )}

          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6C63FF, #A89FFF)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 600,
          }}>
            {currentMember ? currentMember.charAt(0) : '?'}
          </div>
        </div>
      </nav>

      <main style={{
        opacity: 0,
        animation: 'fadeInUp 0.4s ease-out forwards',
      }}>
        {view === 'board' ? (
          <OkrBoard currentMember={currentMember} />
        ) : (
          <PersonalView currentMember={currentMember} />
        )}
      </main>
    </div>
  );
};

export default App;
