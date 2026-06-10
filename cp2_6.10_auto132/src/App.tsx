import React from 'react';
import { LampBody } from './components/LampBody';
import { ScreenPanel } from './components/ScreenPanel';
import { LightEffect } from './components/LightEffect';
import { ControlPanel } from './components/ControlPanel';
import { ExportPanel } from './components/ExportPanel';

const App: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: `
          radial-gradient(ellipse at center, rgba(139, 94, 60, 0.1) 0%, transparent 70%),
          linear-gradient(135deg, #f5e6cc 0%, #ebe0cc 50%, #e0d0b0 100%)
        `,
        padding: '20px',
        fontFamily: '"Microsoft YaHei", "PingFang SC", serif'
      }}
    >
      <header
        style={{
          textAlign: 'center',
          marginBottom: '24px',
          padding: '16px',
          background: 'linear-gradient(180deg, rgba(139, 94, 60, 0.2) 0%, transparent 100%)',
          borderBottom: '3px solid #8b5e3c',
          borderRadius: '8px 8px 0 0'
        }}
      >
        <h1
          style={{
            fontFamily: "'Ma Shan Zheng', cursive",
            fontSize: '42px',
            color: '#3e2723',
            margin: '0 0 8px 0',
            textShadow: '2px 2px 4px rgba(139, 94, 60, 0.3)',
            letterSpacing: '8px'
          }}
        >
          月华轩 · 走马灯画屏
        </h1>
        <p
          style={{
            color: '#5d4037',
            fontSize: '14px',
            margin: 0,
            fontStyle: 'italic'
          }}
        >
          明代苏州阊门内 · 灯铺匠作模拟 · 中秋灯会特制
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr 260px',
          gap: '20px',
          maxWidth: '1400px',
          margin: '0 auto',
          minHeight: '600px'
        }}
      >
        <div style={{ height: '700px' }}>
          <ScreenPanel />
        </div>

        <div
          style={{
            position: 'relative',
            background: 'linear-gradient(180deg, #2c1810 0%, #1a0f0a 50%, #0d0705 100%)',
            borderRadius: '12px',
            border: '4px solid #5d4037',
            overflow: 'hidden',
            boxShadow: `
              inset 0 0 100px rgba(0, 0, 0, 0.8),
              0 10px 40px rgba(0, 0, 0, 0.5)
            `
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 1
            }}
          >
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${(i * 37) % 100}%`,
                  top: `${(i * 23) % 100}%`,
                  width: '2px',
                  height: '2px',
                  background: 'rgba(255, 183, 77, 0.3)',
                  borderRadius: '50%'
                }}
              />
            ))}
          </div>

          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '20px',
              background: 'linear-gradient(180deg, #8b5e3c 0%, #5d4037 100%)',
              borderRadius: '0 0 40px 40px',
              border: '2px solid #4e342e',
              zIndex: 10
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: '35px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '4px',
              height: '30px',
              background: '#5d4037',
              zIndex: 9
            }}
          />

          <LightEffect />

          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              zIndex: 3
            }}
          >
            <LampBody />
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              width: '240px'
            }}
          >
            <ExportPanel />
          </div>
        </div>

        <div style={{ height: '700px' }}>
          <ControlPanel />
        </div>
      </div>

      <footer
        style={{
          textAlign: 'center',
          marginTop: '24px',
          padding: '16px',
          color: '#6d4c41',
          fontSize: '12px',
          borderTop: '2px solid #8b5e3c'
        }}
      >
        <div style={{ marginBottom: '4px' }}>
          🏮 月华轩灯铺 · 传承明代制灯工艺 · 每盏灯皆为匠心之作
        </div>
        <div style={{ fontStyle: 'italic', color: '#8d6e63' }}>
          「烘火燃灯明昼锦，兰膏麝月散香尘」—— 明代苏州灯会盛景
        </div>
      </footer>
    </div>
  );
};

export default App;
