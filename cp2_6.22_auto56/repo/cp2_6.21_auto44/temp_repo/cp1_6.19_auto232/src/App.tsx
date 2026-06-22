import { useEffect } from 'react';
import Toolbar from './Toolbar';
import BubbleMap from './BubbleMap';
import ReportPanel from './ReportPanel';
import { useAppStore } from './store';

export default function App() {
  const selectedBubbleId = useAppStore((s) => s.selectedBubbleId);
  const selectedConnectionId = useAppStore((s) => s.selectedConnectionId);
  const removeBubble = useAppStore((s) => s.removeBubble);
  const removeConnection = useAppStore((s) => s.removeConnection);
  const bubbles = useAppStore((s) => s.bubbles);
  const addBubble = useAppStore((s) => s.addBubble);
  const updateBubble = useAppStore((s) => s.updateBubble);
  const addConnection = useAppStore((s) => s.addConnection);

  useEffect(() => {
    if (bubbles.length === 0) {
      addBubble(300, 250);
      addBubble(600, 250);
      addBubble(450, 500);

      const ids = useAppStore.getState().bubbles.map((b) => b.id);

      if (ids.length >= 3) {
        updateBubble(ids[0], { name: '入口', color: '#4A90D9', diameter: 100, opacity: 0.65 });
        updateBubble(ids[1], { name: '广场', color: '#50C878', diameter: 130, opacity: 0.7 });
        updateBubble(ids[2], { name: '绿地', color: '#FF6B6B', diameter: 110, opacity: 0.6 });

        addConnection(ids[0], ids[1]);
        addConnection(ids[1], ids[2]);
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        if (selectedBubbleId) {
          removeBubble(selectedBubbleId);
        } else if (selectedConnectionId) {
          removeConnection(selectedConnectionId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBubbleId, selectedConnectionId, removeBubble, removeConnection]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Toolbar />
      <BubbleMap />
      <ReportPanel />
    </div>
  );
}
