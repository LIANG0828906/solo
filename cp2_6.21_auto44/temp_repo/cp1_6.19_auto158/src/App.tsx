import React from 'react';
import { AppProvider } from './store';
import StarField from './stars/StarField';
import StarMap from './constellation/StarMap';

const App: React.FC = () => {
  return (
    <AppProvider>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0B0C10 0%, #1F2833 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 300,
          letterSpacing: '6px',
          color: '#E8E0D4',
          marginBottom: '20px',
          textShadow: '0 0 20px rgba(232,224,212,0.3)',
        }}>
          星座连线与星盘生成
        </h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <StarField />
          <StarMap />
        </div>
      </div>
    </AppProvider>
  );
};

export default App;
