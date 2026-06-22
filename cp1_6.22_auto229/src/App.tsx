import React, { useState, useEffect, useRef } from 'react';
import { TimelineEditor } from './timeline/TimelineEditor';
import { SampleLibrary } from './samples/SampleLibrary';
import { CollabManager } from './collab/CollabManager';
import { useProjectStore } from './store/useProjectStore';
import type { Sample } from './types';

function App() {
  const [collabManager, setCollabManager] = useState<CollabManager | null>(null);
  const currentUserId = useProjectStore((state) => state.currentUserId);
  const addCollaborator = useProjectStore((state) => state.addCollaborator);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const manager = new CollabManager(currentUserId);
    setCollabManager(manager);

    const connectToCollab = async () => {
      const connected = await manager.connect('project-default');
      if (connected) {
        const currentUser = manager.getCurrentUser();
        addCollaborator(currentUser);
      }
    };

    connectToCollab();

    const cleanup = manager.subscribe((message) => {
      if (message.type === 'user-joined') {
        console.log('[Collab] User joined:', message.user.name);
      } else if (message.type === 'user-left') {
        console.log('[Collab] User left:', message.userId);
      }
    });

    return () => {
      cleanup();
      manager.disconnect();
    };
  }, [currentUserId, addCollaborator]);

  const handleSampleDragStart = (sample: Sample) => {
    console.log('Dragging sample:', sample.name);
  };

  const appStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    backgroundColor: 'var(--color-bg-primary)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    backgroundColor: 'var(--color-bg-secondary)',
    borderBottom: '1px solid var(--color-border)',
  };

  const logoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '16px',
    fontWeight: 600,
  };

  const logoIconStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-white)',
    fontWeight: 700,
  };

  const contentStyle: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  };

  return (
    <div style={appStyle}>
      <header style={headerStyle}>
        <div style={logoStyle}>
          <div style={logoIconStyle}>A</div>
          <span>Audio Collab Studio</span>
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: collabManager ? 'var(--color-success)' : 'var(--color-text-muted)',
              animation: collabManager ? 'pulse 2s ease-in-out infinite' : 'none',
            }}
          />
          {collabManager ? '协作已连接' : '本地模式'}
        </div>
      </header>

      <div style={contentStyle}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TimelineEditor collabManager={collabManager} />
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <SampleLibrary onSampleDragStart={handleSampleDragStart} />
        </div>
      </div>

      <style>{`
        .sample-card:hover {
          transform: scale(1.05);
          border-color: var(--color-accent);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
        }
        
        .sample-card:active {
          cursor: grabbing;
        }
      `}</style>
    </div>
  );
}

export default App;
