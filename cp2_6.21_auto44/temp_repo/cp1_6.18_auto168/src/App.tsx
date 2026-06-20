import React from 'react';
import { useGradientStore } from './stores/gradientStore';
import { GradientEditor } from './components/GradientEditor';
import { CardList } from './components/CardList';
import { Sidebar } from './components/Sidebar';

const App: React.FC = () => {
  const sidebarOpen = useGradientStore((s) => s.sidebarOpen);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#1A1A2E',
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          display: 'flex',
          marginLeft: sidebarOpen ? 240 : 0,
          transition: 'margin-left 0.3s ease',
          height: '100vh',
        }}
      >
        <div
          style={{
            width: '60%',
            height: '100%',
            overflowY: 'auto',
            padding: 32,
            paddingRight: 24,
          }}
        >
          <GradientEditor />
        </div>

        <div
          style={{
            width: 2,
            background: '#3E3E5E',
            flexShrink: 0,
          }}
        />

        <div
          style={{
            width: '40%',
            height: '100%',
            overflowY: 'auto',
            padding: 32,
            paddingLeft: 24,
            background: 'rgba(45,45,68,0.4)',
            backdropFilter: 'blur(8px)',
            borderRadius: 16,
          }}
        >
          <CardList />
        </div>
      </div>
    </div>
  );
};

export default App;
