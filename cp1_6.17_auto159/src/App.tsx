import React from 'react';
import { LetterEditor } from './components/LetterEditor';
import { EnvelopeGrid } from './components/EnvelopeGrid';
import { AnimationOverlay } from './components/AnimationOverlay';

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">街角信局</h1>
        <p className="app-subtitle">写下想说的话，寄给想念的人</p>
      </header>

      <main className="app-main">
        <LetterEditor />
        <EnvelopeGrid />
      </main>

      <footer className="app-footer">
        <p>© 2024 街角信局 · 用心书写每一封信</p>
      </footer>

      <AnimationOverlay />

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body, #root {
          height: 100%;
        }

        body {
          font-family: 'Inter', sans-serif;
          background: #F5E6D3;
          color: #4A3B32;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .app-header {
          text-align: center;
          padding: 48px 24px 24px;
        }

        .app-title {
          font-family: 'Playfair Display', serif;
          font-size: 42px;
          font-weight: 700;
          color: #4A3B32;
          margin-bottom: 8px;
          letter-spacing: 0.05em;
        }

        .app-subtitle {
          font-size: 16px;
          color: #A09080;
          font-weight: 400;
        }

        .app-main {
          flex: 1;
        }

        .app-footer {
          text-align: center;
          padding: 32px 24px;
          color: #A09080;
          font-size: 13px;
        }

        @media (max-width: 768px) {
          .app-header {
            padding: 32px 16px 16px;
          }

          .app-title {
            font-size: 32px;
          }

          .app-subtitle {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
