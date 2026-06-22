import { useState } from 'react';
import Toolbar from '@/components/Toolbar';
import DraftPanel from '@/components/DraftPanel';
import VersionPanel from '@/components/VersionPanel';
import CodeEditor from '@/components/CodeEditor';

const App = () => {
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(240);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        background: '#252526',
        color: '#D4D4D4',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
      }}
    >
      <Toolbar />

      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <DraftPanel width={leftWidth} onResize={setLeftWidth} />

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            padding: '12px 0',
          }}
        >
          <CodeEditor />
        </div>

        <VersionPanel width={rightWidth} onResize={setRightWidth} />
      </div>
    </div>
  );
};

export default App;
