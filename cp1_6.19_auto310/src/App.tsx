import { useState } from 'react';
import CardEditor from './CardEditor';
import ReviewMode from './ReviewMode';

type Tab = 'editor' | 'review';

export default function App() {
  const [tab, setTab] = useState<Tab>('editor');

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 28px',
    border: 'none',
    borderRadius: '8px',
    background: active ? 'var(--accent)' : 'var(--card)',
    color: active ? '#1E1E24' : 'var(--text)',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 600,
    transition: 'all 0.3s',
  });

  return (
    <div style={{ minHeight: '100vh', padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ color: 'var(--accent)', fontSize: '28px', fontWeight: 700, letterSpacing: '2px' }}>
          闪记卡片
        </h1>
        <p style={{ color: '#777', fontSize: '13px', marginTop: '4px' }}>像抽卡一样复习知识</p>
      </header>

      <nav style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => setTab('editor')} style={tabBtnStyle(tab === 'editor')}>
          卡片编辑
        </button>
        <button onClick={() => setTab('review')} style={tabBtnStyle(tab === 'review')}>
          复习模式
        </button>
      </nav>

      <div key={tab} className="tab-content">
        {tab === 'editor' ? <CardEditor /> : <ReviewMode />}
      </div>
    </div>
  );
}
