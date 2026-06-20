import { useEffect, useState, useCallback } from 'react';
import Card from './Card';
import { useAppStore } from '../editor/ThemeManager';
import type { Poem } from '../../types';

const Wall = () => {
  const poems = useAppStore((state) => state.poems);
  const setPoems = useAppStore((state) => state.setPoems);
  const likePoem = useAppStore((state) => state.likePoem);
  const setView = useAppStore((state) => state.setView);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const styleId = 'wall-sway-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes gentle-sway {
          0%, 100% { transform: rotate(var(--base-rotation, 0deg)); }
          50% { transform: rotate(calc(var(--base-rotation, 0deg) + 0.5deg)); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const fetchPoems = async () => {
      try {
        const response = await fetch('/api/poems');
        const data: Poem[] = await response.json();
        setPoems(data);
      } catch (error) {
        console.error('获取诗笺失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPoems();
  }, [setPoems]);

  const handleLike = useCallback(
    (id: string) => {
      likePoem(id);
    },
    [likePoem]
  );

  if (loading) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 60px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFF8F0',
          fontSize: '16px',
          color: '#999',
        }}
      >
        风铃轻摇中...
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        minHeight: 'calc(100vh - 60px)',
        backgroundColor: '#FFF8F0',
        padding: '40px 20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            padding: '0 10px',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 300,
                letterSpacing: '3px',
                color: '#5D4037',
              }}
            >
              🎐 公共风铃墙
            </h2>
            <p
              style={{
                margin: '8px 0 0 0',
                fontSize: '14px',
                color: '#999',
                fontWeight: 300,
              }}
            >
              共 {poems.length} 首诗笺在风中轻摇
            </p>
          </div>
          <button
            onClick={() => setView('editor')}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #D4A574, #F5DEB3)',
              color: '#FFFFFF',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 2px 12px #D4A57440',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px #D4A57460';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 12px #D4A57440';
            }}
          >
            ✍️ 写一首
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            gap: '0px',
            padding: '10px 0',
          }}
        >
          {poems.length === 0 ? (
            <div
              style={{
                width: '100%',
                textAlign: 'center',
                padding: '80px 20px',
                color: '#999',
                fontSize: '16px',
              }}
            >
              还没有人投递诗笺，来做第一个吧 ✨
            </div>
          ) : (
            poems.map((poem, index) => (
              <Card key={poem.id} poem={poem} index={index} onLike={handleLike} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Wall;
