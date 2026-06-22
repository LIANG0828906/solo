import { Routes, Route, Navigate } from 'react-router-dom';
import PlayPage from './pages/PlayPage';

const HomePage = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#1a1a2e',
        padding: '48px 24px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#eaeaea',
              marginBottom: '12px',
            }}
          >
            Adventure Forge
          </h1>
          <p style={{ color: '#a0a0b0', fontSize: '18px', margin: 0 }}>
            互动故事创作与体验平台
          </p>
        </header>

        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>📖</div>
          <h2 style={{ color: '#eaeaea', fontSize: '24px', marginBottom: '12px' }}>
            欢迎来到互动叙事世界
          </h2>
          <p style={{ color: '#a0a0b0', fontSize: '16px', marginBottom: '32px' }}>
            请使用编辑器创建你的第一个故事，或体验已发布的作品
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <a
              href="/editor"
              style={{
                padding: '14px 32px',
                backgroundColor: '#e94560',
                color: '#eaeaea',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c73e54')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#e94560')}
            >
              ✏️ 创建故事
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditorPage = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#1a1a2e',
        padding: '48px 24px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#eaeaea',
              marginBottom: '8px',
            }}
          >
            故事编辑器
          </h1>
          <p style={{ color: '#a0a0b0', fontSize: '16px', margin: 0 }}>
            使用可视化流程图方式创建你的互动故事
          </p>
        </header>

        <div
          style={{
            backgroundColor: 'rgba(22, 33, 62, 0.5)',
            borderRadius: '8px',
            border: '1px solid rgba(233, 69, 96, 0.2)',
            padding: '80px 20px',
            minHeight: '500px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '72px', marginBottom: '16px' }}>✧</div>
            <h2 style={{ color: '#eaeaea', fontSize: '22px', marginBottom: '8px' }}>
              编辑器画布
            </h2>
            <p style={{ color: '#a0a0b0', fontSize: '14px', margin: 0 }}>
              在此区域创建和连接场景节点
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/editor/:storyId?" element={<EditorPage />} />
      <Route path="/play/:storyId" element={<PlayPage />} />
      <Route path="/s/:shortId" element={<PlayPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
