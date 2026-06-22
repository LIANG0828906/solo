import React from 'react';
import { useColorStore } from './store/colorStore';
import Mixer from './components/Mixer';
import ControlPanel from './components/ControlPanel';
import ColorPicker from './components/ColorPicker';
import './styles/global.css';

const App: React.FC = () => {
  const fading = useColorStore((s) => s.fading);
  const mode = useColorStore((s) => s.mode);

  const bgStyle =
    mode === 'additive'
      ? {
          background:
            'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #1b1038 100%)',
        }
      : {
          background:
            'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #102838 100%)',
        };

  return (
    <div className="app" style={bgStyle}>
      <div className="app-container">
        <div
          style={{
            textAlign: 'center',
            marginBottom: 4,
          }}
        >
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 1,
              background:
                mode === 'additive'
                  ? 'linear-gradient(135deg, #ff4d5a 0%, #4dff88 50%, #4d79ff 100%)'
                  : 'linear-gradient(135deg, #00e5ff 0%, #ff4dd2 50%, #ffe14d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 6,
            }}
          >
            光谱色光混合模拟器
          </h1>
          <p
            style={{
              fontSize: 13,
              color: '#9898b0',
            }}
          >
            直观理解加色混合(RGB)与减色混合(CMY)原理 · 点击画布任意区域取色
          </p>
        </div>

        <ControlPanel />

        <div className={`main-layout ${fading ? 'fading' : ''}`}>
          <section className="mixer-section">
            <Mixer />
          </section>
        </div>

        <div
          style={{
            fontSize: 11,
            color: '#5a5a78',
            textAlign: 'center',
            marginTop: 8,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Spectral Mixer · RGB Additive + CMY Subtractive
        </div>
      </div>

      <ColorPicker />
    </div>
  );
};

export default App;
