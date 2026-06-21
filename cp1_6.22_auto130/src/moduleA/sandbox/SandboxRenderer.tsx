import React, { useCallback, useState, useEffect } from 'react';
import { useSandboxStore } from '../store/sandboxStore';
import { ComponentWrapper } from '../components/ComponentWrapper';
import { useUndoRedo } from '../hooks/useUndoRedo';

export const SandboxRenderer: React.FC = React.memo(() => {
  const { components, selectComponent, draggingComponentId } = useSandboxStore();
  const [isRestoring, setIsRestoring] = useState(false);
  useUndoRedo();

  useEffect(() => {
    const handleRestoreStart = () => setIsRestoring(true);
    const handleRestoreEnd = () => {
      setTimeout(() => setIsRestoring(false), 150);
    };

    window.addEventListener('undo-restore-start', handleRestoreStart);
    window.addEventListener('undo-restore-end', handleRestoreEnd);
    window.addEventListener('redo-restore-start', handleRestoreStart);
    window.addEventListener('redo-restore-end', handleRestoreEnd);

    return () => {
      window.removeEventListener('undo-restore-start', handleRestoreStart);
      window.removeEventListener('undo-restore-end', handleRestoreEnd);
      window.removeEventListener('redo-restore-start', handleRestoreStart);
      window.removeEventListener('redo-restore-end', handleRestoreEnd);
    };
  }, []);

  const handleCanvasClick = useCallback(() => {
    if (!draggingComponentId) {
      selectComponent(null);
    }
  }, [selectComponent, draggingComponentId]);

  return (
    <div
      className={`custom-scrollbar ${isRestoring ? 'fade-in' : ''}`}
      style={{
        width: 'var(--sandbox-width)',
        height: '100%',
        backgroundColor: 'var(--bg-sandbox)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '24px',
        overflowY: 'auto',
        marginRight: '16px',
      }}
      onClick={handleCanvasClick}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {components.map((component, index) => (
          <ComponentWrapper
            key={component.id}
            component={component}
            index={index}
          />
        ))}
      </div>
    </div>
  );
});

SandboxRenderer.displayName = 'SandboxRenderer';
