import React from 'react';
import GearCanvas from './GearCanvas';
import GearPanel from './GearPanel';

const App: React.FC = () => {
  const renderRivets = (count: number, isHorizontal: boolean) => {
    const rivets = [];
    for (let i = 0; i < count; i++) {
      const position = isHorizontal
        ? { left: `${(i / (count - 1)) * 100}%`, top: '50%', transform: 'translate(-50%, -50%)' }
        : { top: `${(i / (count - 1)) * 100}%`, left: '50%', transform: 'translate(-50%, -50%)' };

      rivets.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            ...position,
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #DAA520 0%, #B8860B 50%, #8B6914 100%)',
            boxShadow: 'inset -2px -2px 4px rgba(0, 0, 0, 0.4), 2px 2px 4px rgba(0, 0, 0, 0.3)',
            border: '1px solid #6B4226',
          }}
        />
      );
    }
    return rivets;
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#1C1109',
        overflow: 'hidden',
        fontFamily: 'serif',
      }}
    >
      <div
        style={{
          height: '60px',
          background: 'linear-gradient(180deg, #3D2817 0%, #2A1810 50%, #1C1109 100%)',
          borderBottom: '4px solid #8B5A2B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(218, 165, 32, 0.1)',
        }}
      >
        {renderRivets(10, true)}
        <h1
          style={{
            margin: 0,
            color: '#DAA520',
            fontSize: '28px',
            letterSpacing: '8px',
            textShadow: '3px 3px 6px rgba(0, 0, 0, 0.8), 0 0 20px rgba(218, 165, 32, 0.3)',
            fontWeight: 'bold',
            zIndex: 1,
          }}
        >
          ⚙ 蒸汽朋克齿轮拼接 ⚙
        </h1>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          position: 'relative',
          background: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(139, 90, 43, 0.03) 10px,
              rgba(139, 90, 43, 0.03) 20px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 10px,
              rgba(139, 90, 43, 0.02) 10px,
              rgba(139, 90, 43, 0.02) 20px
            )
          `,
        }}
      >
        <GearPanel />
        <div style={{ flex: 1, position: 'relative' }}>
          <GearCanvas />
        </div>
      </div>

      <div
        style={{
          height: '40px',
          background: 'linear-gradient(0deg, #3D2817 0%, #2A1810 50%, #1C1109 100%)',
          borderTop: '4px solid #8B5A2B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.6), inset 0 -2px 4px rgba(218, 165, 32, 0.1)',
        }}
      >
        {renderRivets(8, true)}
        <div
          style={{
            color: '#C9A96E',
            fontSize: '14px',
            letterSpacing: '3px',
            textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
            zIndex: 1,
          }}
        >
          拖拽齿轮到画布 | 右键删除齿轮 | 点击启动运行
        </div>
      </div>
    </div>
  );
};

export default App;
