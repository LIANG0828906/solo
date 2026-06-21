import React from 'react';
import './index.css';
import CharacterForm from './components/CharacterForm';
import CharacterCard from './components/CharacterCard';

const appStyles: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#f5e6c8',
  color: '#3e2723',
  fontFamily: '"Cinzel", serif',
};

const headerStyles: React.CSSProperties = {
  textAlign: 'center',
  padding: '24px 16px',
  borderBottom: '3px solid #3e2723',
  background: 'linear-gradient(180deg, #d4b896 0%, #f5e6c8 100%)',
};

const titleStyles: React.CSSProperties = {
  fontFamily: '"Cinzel", serif',
  fontWeight: 900,
  fontSize: '2.5rem',
  margin: 0,
  color: '#3e2723',
  letterSpacing: '2px',
};

const contentStyles: React.CSSProperties = {
  display: 'flex',
  gap: '32px',
  padding: '32px',
  maxWidth: '1400px',
  margin: '0 auto',
};

const leftPanelStyles: React.CSSProperties = {
  flex: '1 1 45%',
  minWidth: 0,
};

const rightPanelStyles: React.CSSProperties = {
  flex: '1 1 55%',
  minWidth: 0,
  position: 'sticky',
  top: '32px',
  alignSelf: 'flex-start',
};

const App: React.FC = () => {
  return (
    <div style={appStyles}>
      <header style={headerStyles}>
        <h1 style={titleStyles}>D&D 角色卡生成器</h1>
      </header>
      <div style={contentStyles}>
        <div style={leftPanelStyles}>
          <CharacterForm />
        </div>
        <div style={rightPanelStyles}>
          <CharacterCard />
        </div>
      </div>
    </div>
  );
};

export default App;
