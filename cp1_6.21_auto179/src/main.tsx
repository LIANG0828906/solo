import React from 'react';
import ReactDOM from 'react-dom/client';
import { ResourceProvider, useResourceContext } from './context/ResourceContext';
import ResourceManager from './modules/ResourceManager';
import KnowledgeBase from './modules/KnowledgeBase';

function AppLayout() {
  const { importProgress, currentResourceId } = useResourceContext();

  return (
    <div className="app-root" style={{
      width: '100vw', height: '100vh',
      background: '#0F172A',
      display: 'flex',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <style>{globalCss}</style>

      {importProgress.total > 0 && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          height: '8px', background: '#334155', zIndex: 1000,
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%', width: `${importProgress.percentage}%`,
            background: 'linear-gradient(90deg, #3B82F6, #6366F1)',
            borderRadius: '4px', transition: 'width 0.3s ease',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
              animation: 'progress-stripes 1s linear infinite'
            }} />
          </div>
        </div>
      )}

      <aside style={{
        width: '360px', flexShrink: 0,
        padding: importProgress.total > 0 ? '28px 16px 16px' : '16px',
        background: 'transparent',
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
        borderRight: '1px solid #1E293B'
      }}>
        <ResourceManager />
      </aside>

      <main style={{
        flex: 1,
        overflowY: 'auto',
        minWidth: 0,
        paddingTop: importProgress.total > 0 ? '8px' : 0
      }}>
        <KnowledgeBase />
      </main>

      <style>{`
        @keyframes progress-stripes {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
      `}</style>
    </div>
  );
}

const globalCss = `
@keyframes card-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes tag-remove {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0.8); width: 0; margin: 0; padding: 0; border-width: 0; }
}
@keyframes skeleton-loading {
  0%   { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}
@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.5); }
  70%  { box-shadow: 0 0 0 8px rgba(59,130,246,0); }
  100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
}
@keyframes shake {
  0%,100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
@keyframes toast-in {
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.card-enter {
  animation: card-fade-in 0.4s ease-out both;
}
.tag-leaving {
  animation: tag-remove 0.2s ease-in forwards;
}
.skeleton {
  background: linear-gradient(90deg, #1E293B 0px, #334155 40px, #1E293B 80px);
  background-size: 600px 100%;
  animation: skeleton-loading 1.4s ease infinite;
}
.pulse-focus {
  animation: pulse-ring 1.6s infinite;
}
.shake-error {
  animation: shake 0.3s ease;
}
button {
  transition: transform 0.08s ease, box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}
button:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: none !important;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed !important;
}
@media (max-width: 1200px) {
  .filter-tree-desktop { display: none !important; }
}
`;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ResourceProvider>
      <AppLayout />
    </ResourceProvider>
  </React.StrictMode>
);
