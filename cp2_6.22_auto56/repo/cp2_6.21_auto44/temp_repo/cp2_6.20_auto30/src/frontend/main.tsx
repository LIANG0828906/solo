import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useGameStore, Industry, INDUSTRY_STARTS, getResourceName, ResourceType } from './store';
import GameMap from './GameMap';
import ResourcePanel from './ResourcePanel';
import Market from './Market';

function LoginPage() {
  const [name, setName] = useState('');
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || isLoading) return;
    setIsLoading(true);
    try {
      await setPlayerName(name.trim());
      navigate('/select-industry');
    } catch (e) {
      console.error('Login failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={loginContainer}>
      <div style={loginCard}>
        <div style={{
          fontSize: 48,
          textAlign: 'center',
          marginBottom: 8,
          animation: 'float 3s ease-in-out infinite',
        }}>🏰</div>
        <h1 style={{
          textAlign: 'center',
          background: 'linear-gradient(135deg, #ffd700, #e94560)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: 32,
          marginBottom: 8,
        }}>
          商业帝国模拟
        </h1>
        <p style={{ color: '#888', textAlign: 'center', marginBottom: 32, fontSize: 14 }}>
          多人在线经营策略竞赛
        </p>

        <input
          type="text"
          placeholder="输入你的昵称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          style={{
            width: '100%',
            padding: '14px 18px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(233, 69, 96, 0.3)',
            borderRadius: 10,
            color: '#fff',
            fontSize: 15,
            outline: 'none',
            marginBottom: 16,
            boxSizing: 'border-box',
          }}
        />

        <button
          onClick={handleSubmit}
          disabled={!name.trim() || isLoading}
          style={{
            width: '100%',
            padding: '14px',
            background: (name.trim() && !isLoading)
              ? 'linear-gradient(135deg, #e94560, #c73650)'
              : '#333',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
            cursor: (name.trim() && !isLoading) ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
          onMouseDown={(e) => name.trim() && !isLoading && ((e.target as HTMLButtonElement).style.transform = 'scale(0.97)')}
          onMouseUp={(e) => ((e.target as HTMLButtonElement).style.transform = 'scale(1)')}
        >
          {isLoading ? '连接中...' : '进入游戏 →'}
        </button>

        <div style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ color: '#666', fontSize: 12, textAlign: 'center', marginBottom: 10 }}>
            🎮 游戏玩法
          </div>
          <div style={{ color: '#555', fontSize: 11, lineHeight: 1.8, textAlign: 'center' }}>
            选择行业 → 购买地块 → 建造建筑 → 生产交易 → 积累财富
          </div>
        </div>
      </div>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

function IndustrySelectPage() {
  const navigate = useNavigate();
  const player = useGameStore((s) => s.getCurrentPlayer());
  const selectIndustry = useGameStore((s) => s.selectIndustry);
  const [selected, setSelected] = useState<Industry | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!player) navigate('/');
  }, [player, navigate]);

  const industries: { id: Industry; name: string; icon: string; desc: string; color: string }[] = [
    { id: 'farm', name: '农场主', icon: '🌾', desc: '专注食物生产，成本低廉', color: '#32cd32' },
    { id: 'factory', name: '工厂主', icon: '🏭', desc: '加工能力强，铁矿资源多', color: '#00d4ff' },
    { id: 'tech', name: '科技公司', icon: '🔬', desc: '资金雄厚，产品价值高', color: '#e94560' },
  ];

  const handleConfirm = async () => {
    if (!selected || isLoading) return;
    setIsLoading(true);
    try {
      await selectIndustry(selected);
      navigate('/game');
    } finally {
      setIsLoading(false);
    }
  };

  if (!player) return null;

  return (
    <div style={loginContainer}>
      <div style={{ ...loginCard, maxWidth: 700 }}>
        <h1 style={{
          textAlign: 'center',
          color: '#ffd700',
          fontSize: 26,
          marginBottom: 6,
        }}>
          选择你的行业
        </h1>
        <p style={{ color: '#888', textAlign: 'center', marginBottom: 28, fontSize: 13 }}>
          欢迎, <span style={{ color: '#e94560' }}>{player.name}</span>！选择一个行业开始你的商业帝国
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
          {industries.map((ind) => (
            <div
              key={ind.id}
              onClick={() => setSelected(ind.id)}
              style={{
                padding: 20,
                background: selected === ind.id
                  ? `linear-gradient(135deg, ${ind.color}33, ${ind.color}11)`
                  : 'rgba(255,255,255,0.03)',
                borderRadius: 14,
                border: `2px solid ${selected === ind.id ? ind.color : 'rgba(255,255,255,0.08)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                if (selected !== ind.id) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = `${ind.color}66`;
                }
              }}
              onMouseLeave={(e) => {
                if (selected !== ind.id) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                }
              }}
            >
              <div style={{
                fontSize: 48,
                marginBottom: 10,
                filter: `drop-shadow(0 0 10px ${ind.color})`,
              }}>{ind.icon}</div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 6 }}>
                {ind.name}
              </div>
              <div style={{ color: '#888', fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
                {ind.desc}
              </div>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                padding: 10,
              }}>
                <div style={{ color: '#666', fontSize: 10, marginBottom: 6 }}>初始资源</div>
                {Object.entries(INDUSTRY_STARTS[ind.id]).map(([r, v]) => (
                  <div key={r} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    padding: '2px 0',
                    color: '#aaa',
                  }}>
                    <span>{getResourceName(r as ResourceType)}</span>
                    <span style={{ color: '#ffd700', fontWeight: 'bold' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selected || isLoading}
          style={{
            width: '100%',
            padding: '14px',
            background: (selected && !isLoading)
              ? 'linear-gradient(135deg, #ffd700, #ff9500)'
              : '#333',
            border: 'none',
            borderRadius: 10,
            color: (selected && !isLoading) ? '#1a1a2e' : '#666',
            fontSize: 16,
            fontWeight: 'bold',
            cursor: (selected && !isLoading) ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
          onMouseDown={(e) => selected && !isLoading && ((e.target as HTMLButtonElement).style.transform = 'scale(0.97)')}
          onMouseUp={(e) => ((e.target as HTMLButtonElement).style.transform = 'scale(1)')}
        >
          {isLoading ? '初始化中...' : '开始游戏 🎮'}
        </button>
      </div>
    </div>
  );
}

function GamePage() {
  const navigate = useNavigate();
  const player = useGameStore((s) => s.getCurrentPlayer());
  const fetchInitialState = useGameStore((s) => s.fetchInitialState);
  const startGameLoop = useGameStore((s) => s.startGameLoop);
  const stopGameLoop = useGameStore((s) => s.stopGameLoop);
  const disconnectSocket = useGameStore((s) => s.disconnectSocket);
  const isConnected = useGameStore((s) => s.isConnected);
  const isPaused = useGameStore((s) => s.isPaused);
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);

  useEffect(() => {
    if (!player) navigate('/');
  }, [player, navigate]);

  useEffect(() => {
    fetchInitialState();

    return () => {
      stopGameLoop();
      disconnectSocket();
    };
  }, [fetchInitialState, stopGameLoop, disconnectSocket, currentPlayerId]);

  if (!player) return null;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'grid',
      gridTemplateColumns: '1fr 340px',
      gap: 12,
      padding: 12,
      boxSizing: 'border-box',
      background: '#0f0f1a',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 0,
      }}>
        <div style={{
          padding: '10px 20px',
          background: 'linear-gradient(135deg, rgba(233, 69, 96, 0.2), rgba(255, 215, 0, 0.1))',
          borderRadius: 10,
          border: '1px solid rgba(233, 69, 96, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ color: '#ffd700', fontSize: 18, fontWeight: 'bold' }}>
            🏰 商业帝国模拟
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(233, 69, 96, 0.3)',
              borderRadius: 6,
              color: '#e94560',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 'bold',
            }}
          >
            退出
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <GameMap />
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 0,
      }}>
        <div style={{ flex: '0 0 auto', maxHeight: '50%', minHeight: 280 }}>
          <ResourcePanel />
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Market />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/select-industry" element={<IndustrySelectPage />} />
        <Route path="/game" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

const loginContainer: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(ellipse at center, #1a1a3e 0%, #0f0f1a 70%, #0a0a12 100%)',
  padding: 20,
  boxSizing: 'border-box',
};

const loginCard: React.CSSProperties = {
  width: '100%',
  maxWidth: 400,
  background: 'linear-gradient(180deg, #1e1e3a 0%, #16162a 100%)',
  borderRadius: 16,
  padding: 36,
  border: '1px solid rgba(233, 69, 96, 0.2)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(233, 69, 96, 0.1)',
};
