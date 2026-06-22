import { useState } from 'react';
import ReagentPanel from '@/ReagentPanel';
import Lab from '@/lab';
import RecipeManager from '@/RecipeManager';
import HistoryPanel from '@/history';
import { FlaskConical, BookOpen, History } from 'lucide-react';

type RightTab = 'recipes' | 'history';

export default function Home() {
  const [rightTab, setRightTab] = useState<RightTab>('recipes');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#e8eef5',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          background: '#1b2b4c',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #3a6ea5 0%, #5b8fc9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FlaskConical size={22} color="#fff" />
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: 0.5,
          }}
        >
          虚拟化学实验室
        </h1>
        <span
          style={{
            marginLeft: 8,
            fontSize: 12,
            color: 'rgba(255,255,255,0.6)',
            padding: '2px 8px',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 4,
          }}
        >
          v1.0
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
          安全 · 直观 · 可分享的虚拟实验平台
        </div>
      </header>

      <main
        style={{
          flex: 1,
          padding: 24,
          gap: 24,
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 260px) 1fr minmax(300px, 420px)',
          maxHeight: 'calc(100vh - 72px)',
          minHeight: 0,
        }}
        className="lab-grid"
      >
        <aside
          style={{
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ReagentPanel />
        </aside>

        <section
          style={{
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Lab />
        </section>

        <aside
          style={{
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 4,
              marginBottom: 12,
              background: '#fff',
              padding: 4,
              borderRadius: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <button
              onClick={() => setRightTab('recipes')}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: 6,
                background: rightTab === 'recipes' ? '#3a6ea5' : 'transparent',
                color: rightTab === 'recipes' ? '#fff' : '#555',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <BookOpen size={15} />
              配方库
            </button>
            <button
              onClick={() => setRightTab('history')}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: 6,
                background: rightTab === 'history' ? '#3a6ea5' : 'transparent',
                color: rightTab === 'history' ? '#fff' : '#555',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <History size={15} />
              实验记录
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {rightTab === 'recipes' ? <RecipeManager /> : <HistoryPanel />}
          </div>
        </aside>
      </main>

      <style>{`
        @media (max-width: 1200px) {
          .lab-grid {
            grid-template-columns: minmax(220px, 260px) 1fr !important;
          }
          .lab-grid > aside:last-child {
            grid-column: 1 / -1;
            max-height: 400px;
          }
        }
        @media (max-width: 768px) {
          .lab-grid {
            grid-template-columns: 1fr !important;
          }
          .lab-grid > aside:first-child {
            max-height: 280px;
          }
        }
      `}</style>
    </div>
  );
}
