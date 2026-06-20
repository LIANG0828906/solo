import { useGameStore } from '../store/gameStore';

const TopBar = () => {
  const { currentNode, toggleSidebar, sidebarOpen } = useGameStore();

  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="animate-cursor-blink font-mono text-sm"
          style={{ color: 'var(--text-accent)' }}
        >
          █
        </span>
        <span className="font-mono text-sm" style={{ color: 'var(--text-accent)' }}>
          root@adventure:~$
        </span>
        <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
          ./start_story.sh
        </span>
        {currentNode && (
          <span
            className="font-mono text-xs ml-4 px-2 py-0.5 rounded"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            NODE: {currentNode.id}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span
          className="font-mono text-xs px-2 py-0.5 rounded"
          style={{
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-success)',
            border: '1px solid var(--border-color)',
          }}
        >
          ● ONLINE
        </span>
        <button
          onClick={toggleSidebar}
          className="btn-press md:hidden font-mono text-xs px-3 py-1 rounded"
          style={{
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        >
          {sidebarOpen ? '◀ 隐藏' : '▶ 属性'}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
